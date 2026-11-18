import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import cues from '../src/content/teacher-cues.json';
import { lessons, getChart } from '../src/content/course';
import { getLessonVisualSteps } from '../src/content/lesson-visuals';
import { getTeacherDemoVisual } from '../src/content/teacher-visuals';
import { TeacherMeeting } from '../src/components/course/teacher-meeting';
import { buildEssentialPresentation, visibleSlideBlocks } from '../src/lib/lesson-presentation';

Object.assign(globalThis, { React });

test('every lesson has one concise, complete 60-minute working plan', () => {
  assert.deepEqual(
    cues.lessons.map((cue) => cue.lessonId),
    lessons.map((lesson) => lesson.id),
  );
  for (const cue of cues.lessons) {
    assert.equal(cue.sequence.length, 5, cue.lessonId);
    assert.equal(
      cue.sequence.reduce((sum, stage) => sum + stage.minutes, 0),
      60,
      cue.lessonId,
    );
    assert.ok(cue.sequence.every((stage) => stage.action.trim() && stage.minutes > 0));
    assert.ok([cue.watchFor, cue.adjust, cue.extend, cue.followUp].every((text) => text.trim()));
    const text = [
      ...cue.sequence.map((stage) => stage.action),
      cue.watchFor,
      cue.adjust,
      cue.extend,
      cue.followUp,
    ].join(' ');
    assert.ok(text.split(/\s+/).length <= 220, `${cue.lessonId}: working plan must stay concise`);
  }
  assert.deepEqual(
    cues.lessons.at(-1)!.sequence.map((stage) => stage.minutes),
    [5, 24, 8, 8, 15],
  );
});

test('the working plan keeps actions, observation and help visible and diagrams tied to the actual lesson', () => {
  for (const lesson of lessons) {
    const cue = cues.lessons.find((item) => item.lessonId === lesson.id)!;
    const visual = getTeacherDemoVisual(lesson, getChart(lesson));
    const html = renderToStaticMarkup(
      React.createElement(TeacherMeeting, { cue, goal: lesson.goal, visual }),
    );
    const visible = html.replace(/<details\b[^>]*>[\s\S]*?<\/details>/g, '');
    const escaped = (text: string) =>
      renderToStaticMarkup(React.createElement('p', null, text)).slice(3, -4);
    for (const text of [
      lesson.goal,
      cue.watchFor,
      cue.adjust,
      cue.followUp,
      ...cue.sequence.map((stage) => stage.action),
    ]) {
      assert.ok(visible.includes(escaped(text)), `${lesson.id}: essential instruction hidden`);
    }
    assert.match(visible, /60 min/);
    assert.match(visible, /Se houver dor/);
    if (lesson.id !== 'm13-a3') assert.ok(visual && html.includes(escaped(visual.title)));
    else
      assert.doesNotMatch(
        html,
        /Ver apoio para demonstrar/,
        'evaluation must not introduce a new demonstration',
      );
  }
});

test('all 39 essential presentations show every practice visual once and keep answers concealed', () => {
  for (const lesson of lessons) {
    const steps = getLessonVisualSteps(lesson, getChart(lesson));
    const deck = buildEssentialPresentation(lesson, steps);
    assert.equal(deck.length, 6, lesson.id);
    const blocks = deck.flatMap((slide) => visibleSlideBlocks(slide));
    assert.deepEqual(
      blocks.filter((block) => block.kind === 'visual').map((block) => block.visual),
      steps.map((step) => step.visual),
    );
    for (const step of steps)
      assert.ok(blocks.some((block) => block.kind === 'text' && block.text === step.instruction));
    const question = deck.find((slide) => slide.id === 'question')!;
    assert.equal(
      visibleSlideBlocks(question).some((block) => block.id === 'answer'),
      false,
    );
    assert.ok(
      visibleSlideBlocks(question, true).some(
        (block) => block.kind === 'text' && block.text === lesson.answer,
      ),
    );
    assert.ok(
      blocks.some(
        (block) =>
          block.kind === 'list' && JSON.stringify(block.items) === JSON.stringify(lesson.checks),
      ),
    );
  }
});

test('M12-A1 demonstrates the actual 1.5 + 1.5 + 1 pattern, rather than the different J section', () => {
  const lesson = lessons.find((item) => item.id === 'm12-a1')!;
  const diagram = getTeacherDemoVisual(lesson, getChart(lesson))!.diagram;
  assert.equal(diagram.kind, 'bars');
  if (diagram.kind !== 'bars') return;
  assert.equal(diagram.bars[0].label, 'I1');
  assert.equal(diagram.bars[0].pulses, 4);
  assert.deepEqual(
    diagram.bars[0].events.map(({ chord, beats }) => [chord, beats]),
    [
      ['G', 1.5],
      ['D', 1.5],
      ['A', 1],
    ],
  );
});
