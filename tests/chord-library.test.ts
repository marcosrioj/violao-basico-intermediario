import assert from 'node:assert/strict';
import test from 'node:test';
import { chords } from '../src/content/chords';
import { chordFamilies, chordRoot, matchesChord, rootNames } from '../src/content/chord-library';

test('laboratory groups cover every course fingering exactly once', () => {
  const names = chordFamilies.flatMap((group) => [...group.names]);
  assert.equal(new Set(names).size, names.length);
  assert.deepEqual([...names].sort(), Object.keys(chords).sort());
  for (const name of names) assert.ok(rootNames[chordRoot(name)], name);
});

test('root filter distinguishes sharps and slash bass; search accepts accents and positions', () => {
  assert.equal(matchesChord('D/F#', 'D', ''), true);
  assert.equal(matchesChord('D/F#', 'F#', ''), false);
  assert.equal(matchesChord('C#7', 'C', ''), false);
  assert.equal(matchesChord('C#7', 'C#', ''), true);
  assert.equal(matchesChord('Dsus4', '', ' re '), true);
  assert.equal(matchesChord('Bm reduzido', '', 'reduzido'), true);
  assert.equal(matchesChord('F completo', 'F', 'completo'), true);
  assert.equal(matchesChord('Em', 'D', 'Mi'), false);
  assert.equal(matchesChord('G', '', 'inexistente'), false);
});
