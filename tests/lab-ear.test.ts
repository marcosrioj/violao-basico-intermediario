import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createEarSession,
  earChoices,
  summarizeEarSession,
  type EarLevel,
} from '../src/components/music/lab-ear';

test('six-question ear sessions balance intervals while varying all starting notes', () => {
  for (const level of ['foundations', 'thirds'] as EarLevel[]) {
    for (const random of [() => 0, () => 0.5, () => 0.99999999]) {
      const questions = createEarSession(level, random);
      assert.equal(questions.length, 6);
      assert.equal(new Set(questions.map((question) => question.root)).size, 6);
      for (const interval of earChoices[level])
        assert.equal(
          questions.filter((question) => question.semitones === interval).length,
          6 / earChoices[level].length,
        );
      assert.ok(
        questions.every(
          (question) => question.root >= 48 && question.root + question.semitones <= 72,
        ),
      );
    }
  }
});

test('summary only scores answered questions and retains the exact mistakes for comparison', () => {
  const questions = createEarSession('foundations', () => 0.5);
  assert.deepEqual(summarizeEarSession(questions, []), { answered: 0, correct: 0, mistakes: [] });
  const answers = questions.map((question, i) => (i % 2 ? question.semitones : -1));
  const summary = summarizeEarSession(questions, answers);
  assert.equal(summary.correct, 3);
  assert.deepEqual(
    summary.mistakes,
    questions.filter((_, i) => i % 2 === 0),
  );
  const original = structuredClone(summary);
  summarizeEarSession(
    summary.mistakes,
    summary.mistakes.map((question) => question.semitones),
  );
  assert.deepEqual(summary, original, 'review cannot mutate the initial-session score');
  assert.equal(summarizeEarSession(questions, [...answers, 12]).answered, 6);
});
