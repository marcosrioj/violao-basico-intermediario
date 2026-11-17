import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PathnameContext } from 'next/dist/shared/lib/hooks-client-context.shared-runtime';
import { opensNewTab } from '../src/lib/link-navigation';
import PageLink from '../src/components/ui/page-link';
import { Shell } from '../src/components/shell';
import { AuthFrame } from '../src/components/auth/frame';
import { LessonView } from '../src/components/course/lesson-view';
import { lessons } from '../src/content/course';

Object.assign(globalThis, { React });

test('internal navigation keeps the current tab even when changing pages or using deep links', () => {
  for (const href of [
    '/teoria/R1',
    '/aulas/m1-a2#tocar',
    '../m1-a2',
    '/curso?modulo=2',
    '/painel#minha-conta',
    'https://curso.example/professor',
  ]) {
    assert.equal(opensNewTab(href, '/aulas/m1-a1', 'https://curso.example'), false, href);
    assert.equal(
      opensNewTab(href, '/aulas/m1-a1', 'https://curso.example', 'reference'),
      true,
      href,
    );
  }
});

test('external resources always open a protected separate tab', () => {
  for (const href of ['https://example.org/aulas/m1-a1', '//example.org/aulas/m1-a1']) {
    assert.equal(opensNewTab(href, '/aulas/m1-a1', 'https://curso.example'), true);
  }
});

test('same-page anchors and filters retain their tab, including full paths and absolute URLs', () => {
  for (const href of [
    '#tocar',
    '?etapa=2#tocar',
    '/aulas/m1-a1#tocar',
    '/aulas/m1-a1/?etapa=2',
    './m1-a1#tocar',
    'https://curso.example/aulas/m1-a1#tocar',
  ]) {
    assert.equal(opensNewTab(href, '/aulas/m1-a1', 'https://curso.example'), false, href);
    assert.equal(
      opensNewTab(href, '/aulas/m1-a1', 'https://curso.example', 'reference'),
      false,
      href,
    );
  }
  for (const href of [
    '',
    '#',
    'mailto:professor@example.org',
    'tel:+5511999999999',
    'blob:https://curso.example/audio',
  ]) {
    assert.equal(opensNewTab(href, '/'), false, href);
  }
});

test('rendered links apply the tab policy and announce it without replacing their label or hints', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      PathnameContext.Provider,
      { value: '/aulas/m1-a1' },
      React.createElement(
        PageLink,
        {
          href: '/teoria/R1',
          purpose: 'reference',
          rel: 'help',
          title: 'Referência de teoria',
          'aria-label': 'Ler teoria',
          'aria-describedby': 'course-access-hint',
        },
        'Teoria',
      ),
    ),
  );
  assert.match(html, /target="_blank"/);
  assert.match(html, /rel="help noopener noreferrer"/);
  assert.match(html, /title="Referência de teoria · Abre em nova aba"/);
  assert.match(html, /aria-description="Abre em nova aba"/);
  assert.match(html, /aria-label="Ler teoria"/);
  assert.match(html, /aria-describedby="course-access-hint"/);

  for (const props of [
    { href: '#tocar' },
    { href: '/aulas/m1-a1#tocar' },
    { href: '/teoria/R1' },
    { href: '/api/materials/aluno', download: '', purpose: 'reference' as const },
  ]) {
    const sameTab = renderToStaticMarkup(
      React.createElement(
        PathnameContext.Provider,
        { value: '/aulas/m1-a1' },
        React.createElement(PageLink, props, 'Ação'),
      ),
    );
    assert.doesNotMatch(sameTab, /target=|Abre em nova aba/);
  }
});

test('desktop and mobile menus keep all internal navigation in the current tab', () => {
  const html = renderToStaticMarkup(
    React.createElement(
      PathnameContext.Provider,
      { value: '/painel' },
      React.createElement(
        Shell,
        { courseAccess: true, active: '/painel' } as React.ComponentProps<typeof Shell>,
        'Meu espaço',
      ),
    ),
  );
  const links = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/g)];
  for (const [, attributes] of links) {
    if (!attributes.includes('https://github.com/')) {
      assert.doesNotMatch(attributes, /target=/);
    } else {
      assert.match(attributes, /target="_blank"/);
      assert.match(attributes, /noopener noreferrer/);
    }
  }
  assert.equal(links.filter(([, attributes]) => /href="\/curso"/.test(attributes)).length, 2);
});

function renderAt(pathname: string, child: React.ReactNode) {
  return renderToStaticMarkup(
    React.createElement(PathnameContext.Provider, { value: pathname }, child),
  );
}

function assertTab(html: string, href: string, newTab: boolean) {
  const matches = [...html.matchAll(/<a\b([^>]*)>/g)]
    .map((match) => match[1])
    .filter((attributes) => attributes.includes(`href="${href}"`));
  assert.ok(matches.length, `Missing link to ${href}`);
  for (const attributes of matches) {
    assert.equal(attributes.includes('target="_blank"'), newTab, href);
  }
}

test('lesson previous, next and back links navigate while inline theory and support preserve the lesson', () => {
  const lesson = lessons[3];
  const html = renderAt(`/aulas/${lesson.id}`, React.createElement(LessonView, { lesson }));
  for (const href of ['/curso', '/aulas/m1-a3', '/aulas/m2-a2']) {
    // The lesson navigation is separate from any references to these same lessons in the text.
    const navigation = html.match(/<div class="lesson-nav">([\s\S]*?)<\/div>/)?.[1] || '';
    assertTab(href === '/curso' ? html : navigation, href, false);
  }
  assertTab(html, '/api/materials/aluno', true);
  const theoryLinks = [...html.matchAll(/<a\b([^>]*href="\/teoria\/[^>]+)>/g)];
  assert.ok(theoryLinks.length);
  for (const [, attributes] of theoryLinks) assert.match(attributes, /target="_blank"/);
  const labLinks = [...html.matchAll(/<a\b([^>]*href="\/laboratorio"[^>]*)>/g)].map(
    (match) => match[1],
  );
  assert.ok(
    labLinks.some((attributes) => attributes.includes('target="_blank"')),
    'supporting lab opens separately',
  );
  assert.ok(
    labLinks.some((attributes) => !attributes.includes('target="_blank"')),
    'lab menu link stays in place',
  );
});

test('privacy preserves a partially filled auth form while back to home remains navigation', () => {
  const html = renderAt('/entrar', AuthFrame({ children: 'Formulário' }));
  assertTab(html, '/privacidade', true);
  assertTab(html, '/', false);
});

