import test from 'node:test';
import assert from 'node:assert/strict';
import {
  fretboardQuestions,
  pitchName,
  positionMidi,
} from '../src/components/music/fretboard-recall-model';
test('recall positions agree with standard tuning and chromatic semitones', () => {
  assert.deepEqual(
    [1, 2, 3, 4, 5, 6].map((s) => positionMidi(s, 0)),
    [64, 59, 55, 50, 45, 40],
  );
  for (const question of fretboardQuestions) {
    assert.equal(pitchName(positionMidi(question.string, question.fret)), question.note);
    assert.ok(question.fret <= 5);
  }
  assert.equal(pitchName(positionMidi(2, 1)), 'C');
  assert.equal(pitchName(positionMidi(1, 1)), 'F');
  for (const s of [1, 2, 3, 4, 5, 6]) assert.equal(positionMidi(s, 12) - positionMidi(s, 0), 12);
  for (const [s, f] of [
    [0, 0],
    [7, 0],
    [1, -1],
    [1, 13],
    [1, 0.5],
  ])
    assert.throws(() => positionMidi(s, f), RangeError);
});
