import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Shell } from '../src/components/shell';

Object.assign(globalThis, { React });

function links(html: string, label: string) {
  return [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)]
    .filter((match) => match[2].includes(label))
    .map((match) => match[1]);
}

test('anonymous visitors can open the laboratory in both navigation menus while course links remain gated', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      Shell,
      { active: '/laboratorio' } as React.ComponentProps<typeof Shell>,
      'Public tools',
    ),
  );
  const laboratory = links(html, 'Laboratório musical');
  assert.equal(laboratory.length, 2, 'desktop and mobile links are both rendered');
  for (const attributes of laboratory) {
    assert.match(attributes, /href="\/laboratorio"/);
    assert.match(attributes, /aria-current="page"/);
    assert.doesNotMatch(attributes, /locked|aria-describedby/);
  }
  for (const label of ['Trilha de aprendizado', 'Nosso repertório', 'Biblioteca']) {
    const restricted = links(html, label);
    assert.equal(restricted.length, 2);
    for (const attributes of restricted) {
      assert.match(attributes, /href="\/painel"/);
      assert.match(attributes, /locked/);
    }
  }
  assert.equal(links(html, 'Área do professor').length, 0);
});

test('course members retain course navigation and teachers retain their workspace', () => {
  for (const props of [{ courseAccess: true }, { teacher: true }]) {
    const html = renderToStaticMarkup(
      React.createElement(Shell, props as React.ComponentProps<typeof Shell>, 'Tools'),
    );
    for (const attributes of links(html, 'Laboratório musical')) {
      assert.match(attributes, /href="\/laboratorio"/);
      assert.doesNotMatch(attributes, /locked/);
    }
    for (const attributes of links(html, 'Trilha de aprendizado')) {
      assert.match(attributes, /href="\/curso"/);
      assert.doesNotMatch(attributes, /locked/);
    }
    assert.equal(links(html, 'Área do professor').length, 'teacher' in props ? 2 : 0);
  }
});
