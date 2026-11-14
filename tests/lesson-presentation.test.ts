import assert from 'node:assert/strict';
import test from 'node:test';
import { lessons } from '../src/content/course';
import {
  buildLessonPresentation,
  presentationIndex,
  visibleSlideBlocks,
} from '../src/lib/lesson-presentation';

test('all 39 presentation decks preserve the lesson material without exposing teacher plans', () => {
  for (const lesson of lessons) {
    const deck = buildLessonPresentation(lesson);
    assert.deepEqual(
      deck.map((slide) => slide.id),
      ['goal', 'review', 'explain', 'steps', 'question', 'practice', 'checks'],
    );
    assert.equal(deck[0].title, lesson.title);
    const blocks = deck.flatMap((slide) => slide.blocks);
    for (const field of ['goal', 'review', 'focus', 'explain', 'question'] as const) {
      const block = blocks.find((item) => item.id === field);
      if (!lesson[field].trim()) {
        assert.equal(block, undefined);
        continue;
      }
      assert.ok(block?.kind === 'text');
      assert.equal(block.text, lesson[field], `${lesson.id}: ${field} text must be preserved`);
    }
    for (const field of ['steps', 'practice', 'checks'] as const) {
      const block = blocks.find((item) => item.id === field);
      assert.ok(block?.kind === 'list');
      assert.deepEqual(block.items, lesson[field]);
      assert.notEqual(block.items, lesson[field], 'deck must not mutate the source array');
    }
    assert.equal('teacherText' in deck[0], false);
  }
});

test('answer appears only after explicit reveal and hiding it preserves the question', () => {
  for (const lesson of lessons) {
    const question = buildLessonPresentation(lesson).find((slide) => slide.id === 'question')!;
    assert.equal(
      visibleSlideBlocks(question).some((block) => block.id === 'answer'),
      false,
    );
    const revealed = visibleSlideBlocks(question, true);
    const answer = revealed.find((block) => block.id === 'answer');
    assert.ok(answer?.kind === 'text');
    assert.equal(answer.text, lesson.answer);
    assert.deepEqual(visibleSlideBlocks(question, false), question.blocks);
    assert.equal(question.blocks.length, 1, 'reveal must not mutate the original blocks');
  }
});

test('presentation navigation stays inside the available steps', () => {
  assert.equal(presentationIndex(0, 'previous', 7), 0);
  assert.equal(presentationIndex(6, 'next', 7), 6);
  assert.equal(presentationIndex(2, 'previous', 7), 1);
  assert.equal(presentationIndex(2, 'next', 7), 3);
  assert.equal(presentationIndex(2, 'first', 7), 0);
  assert.equal(presentationIndex(2, 'last', 7), 6);
  assert.equal(presentationIndex(0, 4, 7), 4);
  assert.equal(presentationIndex(0, 99, 7), 6);
  assert.equal(presentationIndex(0, -5, 7), 0);
  assert.equal(presentationIndex(0, 'next', 0), 0);
});
