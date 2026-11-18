import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LessonView } from '../src/components/course/lesson-view';
import { RichText } from '../src/components/course/rich-text';
import { lessons } from '../src/content/course';
import { techniqueStudies } from '../src/content/curriculum';
import { TechniqueStudyContent } from '../src/components/course/learning-content';

Object.assign(globalThis, { React });

function tunerLinks(html: string) {
  return [...html.matchAll(/<a\b([^>]*href="\/laboratorio#afinador"[^>]*)>([\s\S]*?)<\/a>/g)];
}

test('each of the 39 lesson pages links its existing tuning action exactly once', () => {
  assert.equal(lessons.length, 39);
  for (const lesson of lessons) {
    const html = renderToStaticMarkup(React.createElement(LessonView, { lesson }));
    const links = tunerLinks(html);
    assert.equal(
      links.length,
      1,
      `${lesson.id}: one contextual tuner link, including embedded studies`,
    );
    assert.equal(links[0][2], 'afine', `${lesson.id}: preserve the visible action`);
    assert.match(links[0][1], /aria-label="afine com o afinador do laboratório"/);
    assert.match(links[0][1], /title="Afinar o violão no laboratório · Abre em nova aba"/);
    assert.match(links[0][1], /target="_blank"/);
    assert.match(links[0][1], /rel="noopener noreferrer"/);
    assert.match(links[0][1], /aria-description="Abre em nova aba"/);
    assert.ok(
      html.replace(/<[^>]*>/g, '').includes(lesson.practice[0]),
      `${lesson.id}: routine wording remains intact`,
    );
  }
});

test('the public demonstration preserves the same single tuning action', () => {
  const html = renderToStaticMarkup(
    React.createElement(LessonView, { lesson: lessons[0], demo: true }),
  );
  assert.equal(tunerLinks(html).length, 1);
});

test('only the standalone tuning study adds a contextual tuner action', () => {
  for (const study of techniqueStudies) {
    const html = renderToStaticMarkup(
      React.createElement(TechniqueStudyContent, {
        study,
        sources: [],
        standalone: true,
      }),
    );
    assert.equal(tunerLinks(html).length, study.id === 't1-e2' ? 1 : 0, study.id);
  }
});

test('tuning words in theory, musical steps, archive text and later routine steps do not acquire links', () => {
  const text = 'Afine com cuidado. A afinação temperada não resume toda tradição musical.';
  for (const field of ['text', 'steps-0', 'studentText', 'practice-1', 'teacher-0']) {
    const html = renderToStaticMarkup(
      React.createElement(RichText, { text, lesson: lessons[0], field }),
    );
    assert.equal(tunerLinks(html).length, 0, field);
  }
  for (const props of [
    { field: 'practice-0' },
    { field: 'practice-0', lesson: lessons[0], theoryId: 'R8' },
  ]) {
    const html = renderToStaticMarkup(React.createElement(RichText, { text, ...props }));
    assert.equal(tunerLinks(html).length, 0, 'requires a lesson routine, never a theory reading');
  }
});

test('the contextual tuning action preserves existing theory links and links only the first action', () => {
  const html = renderToStaticMarkup(
    React.createElement(RichText, {
      text: '2 min: Afine, confira a Teoria R1 e afine novamente se necessário.',
      lesson: lessons[0],
      field: 'practice-0',
    }),
  );
  assert.equal(tunerLinks(html).length, 1);
  assert.equal(tunerLinks(html)[0][2], 'Afine');
  assert.match(html, /href="\/teoria\/R1"/);
  assert.match(html, /e afine novamente se necessário\./);
});
