import assert from 'node:assert/strict';
import test from 'node:test';
import { scaleNotes } from '../src/components/music/scales';
test('fretboard keeps diatonic spelling rather than chromatic enharmonic labels', () => {
  assert.deepEqual(scaleNotes(5, 'major').map(n => n.name), ['F', 'G', 'A', 'B♭', 'C', 'D', 'E']);
  assert.deepEqual(scaleNotes(0, 'minor').map(n => n.name), ['C', 'D', 'E♭', 'F', 'G', 'A♭', 'B♭']);
  assert.deepEqual(scaleNotes(6, 'major').map(n => n.name), ['F♯', 'G♯', 'A♯', 'B', 'C♯', 'D♯', 'E♯']);
  assert.deepEqual(scaleNotes(5, 'major').map(n => n.pitch), [5, 7, 9, 10, 0, 2, 4]);
});
test('major pentatonic preserves degrees 1, 2, 3, 5, 6', () => {
  assert.deepEqual(scaleNotes(0, 'pentatonic').map(n => n.degree), [1, 2, 3, 5, 6]);
  assert.deepEqual(scaleNotes(0, 'pentatonic').map(n => n.name), ['C', 'D', 'E', 'G', 'A']);
});
