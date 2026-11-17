import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { lessons, getChart } from '../src/content/course';
import { chords } from '../src/content/chords';
import { techniqueStudies, getLessonTechniqueEntries } from '../src/content/curriculum';
import { getLessonVisualSteps } from '../src/content/lesson-visuals';
import { getTechniqueVisuals } from '../src/content/technique-visuals';
import { PracticeVisual } from '../src/components/course/practice-visual';
import type { PracticeVisual as Visual } from '../src/components/course/practice-visual-types';
import { buildLessonPresentation } from '../src/lib/lesson-presentation';

Object.assign(globalThis, { React });

function validate(visual: Visual, context: string) {
  assert.ok(visual.title.length && visual.caption.length, context);
  const diagram = visual.diagram;
  if (diagram.kind === 'chords') {
    for (const name of diagram.names) assert.ok(chords[name], `${context}: unknown shape ${name}`);
  }
  if (diagram.kind === 'fretboard') {
    const open = [4, 11, 7, 2, 9, 4]; // First through sixth string, pitch classes.
    const pitch: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    for (const point of diagram.points) {
      assert.ok(point.string >= 1 && point.string <= 6 && point.fret >= 0);
      const note = /^([A-G])([#b]?)$/.exec(point.note)!;
      assert.ok(note, `${context}: invalid note ${point.note}`);
      const expected =
        (pitch[note[1]] + (note[2] === '#' ? 1 : note[2] === 'b' ? -1 : 0) + 12) % 12;
      assert.equal(
        (open[point.string - 1] + point.fret) % 12,
        expected,
        `${context}: wrong fret for ${point.note}`,
      );
    }
  }
  if (diagram.kind === 'rhythm') {
    for (const group of diagram.groups) {
      assert.ok(group.cells.length > 0, context);
      for (const cell of group.cells) assert.ok(cell.count && cell.action, context);
    }
  }
  if (diagram.kind === 'bars') {
    for (const bar of diagram.bars) {
      assert.equal(
        bar.events.reduce((sum, event) => sum + event.beats, 0),
        bar.pulses,
        `${context}: bar duration`,
      );
      assert.equal(
        bar.events.reduce((sum, event) => sum + event.span, 0),
        bar.ticks.length,
        `${context}: diagram duration`,
      );
    }
  }
  const html = renderToStaticMarkup(React.createElement(PracticeVisual, { visual }));
  assert.ok(html.includes('<figure') && html.includes('<figcaption>'), context);
  assert.ok(!/NaN|undefined/.test(html), context);
}

test('every instruction of all 39 lessons has a valid illustration tied to its authorized arrangement', () => {
  let count = 0;
  for (const lesson of lessons) {
    const steps = getLessonVisualSteps(lesson, getChart(lesson));
    assert.deepEqual(
      steps.map((step) => step.instruction),
      lesson.steps,
    );
    for (const step of steps) {
      validate(step.visual, lesson.id);
      if (step.visual.diagram.kind === 'chords') {
        for (const name of step.visual.diagram.names)
          assert.ok(
            lesson.chords.includes(name) ||
              (lesson.id === 'm9-a1' && name === 'F') ||
              (lesson.id === 'm10-a1' && name === 'Em'),
            `${lesson.id}: unassigned chord ${name}`,
          ); // These instructions explicitly compare an earlier shape with the new one.
      }
      count++;
    }
  }
  assert.equal(count, 117);
});

test('all 27 technique studies have renderable examples with correct notes on the fingerboard', () => {
  for (const study of techniqueStudies) {
    const visuals = getTechniqueVisuals(study.id);
    assert.ok(visuals.length > 0, study.id);
    visuals.forEach((visual) => validate(visual, study.id));
  }
});

test('6/8 finger order and 4/4 chord changes retain their distinct grouping', () => {
  const six = lessons.find((l) => l.id === 'm3-a2')!;
  const diagram = getLessonVisualSteps(six, getChart(six))[0].visual.diagram;
  assert.ok(diagram.kind === 'rhythm');
  assert.deepEqual(
    diagram.groups.map((g) => g.cells.map((cell) => cell.count)),
    [
      ['1', 'la', 'li'],
      ['2', 'la', 'li'],
    ],
  );
  assert.deepEqual(
    diagram.groups.map((g) => g.cells.map((cell) => cell.action)),
    [
      ['p', 'i', 'm'],
      ['a', 'm', 'i'],
    ],
  );
  const four = lessons.find((l) => l.id === 'm9-a2')!;
  const other = getLessonVisualSteps(four, getChart(four))[0].visual.diagram;
  assert.ok(other.kind === 'rhythm');
  assert.deepEqual(
    other.groups.map((g) => g.cells.map((cell) => cell.count)),
    [
      ['1', 'e', '2', 'e'],
      ['3', 'e', '4', 'e'],
    ],
  );
  assert.deepEqual(
    other.groups.map((g) => g.cells.map((cell) => cell.action)),
    [
      ['p', 'i', 'm', 'a'],
      ['p', 'i', 'm', 'a'],
    ],
  );
});

test('illustrations preserve short measures and changes on beats 1, 2 and 4', () => {
  const lesson = lessons.find((l) => l.id === 'm13-a1')!;
  const first = getLessonVisualSteps(lesson, getChart(lesson))[0].visual.diagram;
  assert.ok(first.kind === 'bars');
  assert.deepEqual(
    first.bars.map((bar) => bar.meter),
    ['4/4', '2/4', '4/4', '4/4'],
  );
  assert.deepEqual(
    first.bars.map((bar) => bar.pulses),
    [4, 2, 4, 4],
  );
  const sync = lessons.find((l) => l.id === 'm7-a3')!;
  const beats = getLessonVisualSteps(sync, getChart(sync))[0].visual.diagram;
  assert.ok(beats.kind === 'bars');
  assert.deepEqual(
    beats.bars[0].events.map((e) => [e.chord, e.start, e.span]),
    [
      ['Bm', 1, 1],
      ['G', 2, 2],
      ['A', 4, 1],
    ],
  );
});

test('teacher presents the same illustrations one at a time and retains exact instructions', () => {
  for (const lesson of lessons) {
    const steps = getLessonVisualSteps(lesson, getChart(lesson));
    const entries = getLessonTechniqueEntries(lesson.id).map((entry) => ({
      ...entry,
      visuals: getTechniqueVisuals(entry.study.id),
    }));
    const deck = buildLessonPresentation(lesson, undefined, entries, steps);
    const illustrated = deck.filter(
      (slide) => slide.id === 'steps' || slide.id.startsWith('steps-'),
    );
    assert.equal(illustrated.length, lesson.steps.length);
    illustrated.forEach((slide, i) => {
      assert.deepEqual(
        slide.blocks.find((block) => block.kind === 'visual')?.visual,
        steps[i].visual,
      );
      assert.equal(slide.blocks.find((block) => block.kind === 'text')?.text, lesson.steps[i]);
    });
    assert.equal(new Set(deck.map((slide) => slide.id)).size, deck.length);
    for (const entry of entries) {
      assert.equal(
        deck.filter((slide) => slide.id.startsWith(`technique-visual-${entry.study.id}-`)).length,
        entry.visuals.length,
      );
    }
  }
});
