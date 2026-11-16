import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

test('the historical importer requires external sources and never restores legacy material files on failure', (t) => {
  const root = mkdtempSync(path.join(tmpdir(), 'violao-import-sources-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  mkdirSync(path.join(root, 'scripts'));
  mkdirSync(path.join(root, 'src/content'), { recursive: true });
  copyFileSync('scripts/import-course.py', path.join(root, 'scripts/import-course.py'));
  const existing = path.join(root, 'src/content/course-data.json');
  writeFileSync(existing, '{"preserve":"existing course"}\n');
  const before = readFileSync(existing);
  const run = (...args: string[]) =>
    spawnSync('python3', ['scripts/import-course.py', ...args], { cwd: root, encoding: 'utf8' });

  const noSource = run();
  assert.equal(noSource.status, 2);
  assert.match(noSource.stderr, /source_directory/);
  const missingSource = run('missing');
  assert.equal(missingSource.status, 2);
  assert.match(missingSource.stderr, /Arquivos originais ausentes/);

  const sources = path.join(root, 'external-sources');
  mkdirSync(sources);
  for (const name of [
    'Guia_Interativo_Aluno_Violao_v5.html',
    'Curso_Aluno_Violao_Gospel_v5.pdf',
    'Manual_Professor_Violao_Gospel_v5.pdf',
  ])
    writeFileSync(path.join(sources, name), 'invalid original');
  const invalidSource = run(sources);
  assert.notEqual(invalidSource.status, 0);
  assert.match(invalidSource.stderr, /No source JSON found/);
  assert.deepEqual(readFileSync(existing), before);
  assert.equal(existsSync(path.join(root, 'materials')), false);
  assert.equal(existsSync(path.join(root, 'src/content/provenance.json')), false);
});
