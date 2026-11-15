import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { chords } from '../src/content/chords';
import source from '../src/content/course-data.json';

test('client chord data preserves all source fingerings without lesson text', () => {
  assert.deepEqual(chords, source.chords);
  assert.equal('lessons' in chords, false);
});

test('client module dependency graph cannot bundle course texts or teacher plans', () => {
  const root = path.resolve('src');
  const files = readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((name) => /\.[cm]?tsx?$/.test(name))
    .map((name) => path.join(root, name));
  const cache = new Map<string, ts.SourceFile>();
  const read = (file: string) => {
    if (!cache.has(file))
      cache.set(
        file,
        ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true),
      );
    return cache.get(file)!;
  };
  const clients = files.filter((file) =>
    read(file).statements.some(
      (node) =>
        ts.isExpressionStatement(node) &&
        ts.isStringLiteral(node.expression) &&
        node.expression.text === 'use client',
    ),
  );
  assert.ok(clients.length > 0);
  const config = ts.readConfigFile('tsconfig.json', ts.sys.readFile);
  const options = ts.parseJsonConfigFileContent(config.config, ts.sys, process.cwd()).options;
  const forbidden = new Set([
    'course-data.json',
    'student-guides.json',
    'teacher-data.json',
    'technique-data.json',
    'lesson-enrichment.json',
    'teacher-enrichment.json',
  ]);
  const visited = new Set<string>();
  function visit(file: string, chain: string[]) {
    assert.ok(
      !forbidden.has(path.basename(file)),
      `Editorial data reached a client: ${[...chain, file].map((p) => path.relative(root, p)).join(' → ')}`,
    );
    if (!file.startsWith(root + path.sep) || visited.has(file) || file.endsWith('.json')) return;
    visited.add(file);
    for (const node of read(file).statements) {
      if (!ts.isImportDeclaration(node) && !ts.isExportDeclaration(node)) continue;
      if (ts.isImportDeclaration(node) && node.importClause?.isTypeOnly) continue;
      if (ts.isExportDeclaration(node) && node.isTypeOnly) continue;
      if (!node.moduleSpecifier || !ts.isStringLiteral(node.moduleSpecifier)) continue;
      const resolved = ts.resolveModuleName(
        node.moduleSpecifier.text,
        file,
        options,
        ts.sys,
      ).resolvedModule;
      if (resolved) visit(resolved.resolvedFileName, [...chain, file]);
    }
  }
  clients.forEach((file) => visit(file, []));
});
