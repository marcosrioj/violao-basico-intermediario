import assert from 'node:assert/strict';
import test from 'node:test';
import {
  closestTunerString,
  DEFAULT_TUNER_SETTINGS,
  parseTunerSettings,
  tunerNote,
  tunerNoteLabel,
  TUNINGS,
} from '../src/components/music/tuner-settings';

test('missing, malformed and non-object stored preferences recover the usable default', () => {
  for (const raw of ['', '{', 'null', 'false', '440', '"standard"', '[]', '{}']) {
    assert.deepEqual(parseTunerSettings(raw), DEFAULT_TUNER_SETTINGS, raw);
  }
});

test('invalid preference fields do not discard valid independent settings', () => {
  const result = parseTunerSettings(
    JSON.stringify({
      tuning: 'removed-preset',
      concertA: 442.5,
      capo: 2.5,
      tolerance: 1,
      mode: 'chromatic',
    }),
  );
  assert.deepEqual(result, {
    tuning: 'standard',
    concertA: 442.5,
    capo: 0,
    tolerance: 1,
    mode: 'chromatic',
    sensitivity: 'balanced',
  });
});

test('capture preferences migrate existing settings and reject unknown profiles', () => {
  assert.equal(parseTunerSettings('{"concertA":442}').sensitivity, 'balanced');
  for (const sensitivity of ['balanced', 'soft', 'noisy'] as const) {
    assert.equal(parseTunerSettings(JSON.stringify({ sensitivity })).sensitivity, sensitivity);
  }
  for (const sensitivity of ['boost', 1, null, true]) {
    assert.equal(parseTunerSettings(JSON.stringify({ sensitivity })).sensitivity, 'balanced');
  }
});

test('calibration and capo accept their inclusive limits but reject strings and out-of-range values', () => {
  for (const concertA of [400, 432, 440.1, 480]) {
    for (const capo of [0, 7]) {
      const settings = { ...DEFAULT_TUNER_SETTINGS, concertA, capo };
      assert.deepEqual(parseTunerSettings(JSON.stringify(settings)), settings);
    }
  }
  for (const concertA of [399.9, 480.1, null, '442', {}, true]) {
    assert.equal(parseTunerSettings(JSON.stringify({ concertA })).concertA, 440);
  }
  for (const capo of [-1, 8, 0.5, null, '2', {}, true]) {
    assert.equal(parseTunerSettings(JSON.stringify({ capo })).capo, 0);
  }
});

test('down-tuned and seven-string presets retain their relationship to the standard instrument', () => {
  const standard = TUNINGS.find((tuning) => tuning.id === 'standard')!.notes;
  assert.deepEqual(standard.map(tunerNoteLabel), ['E2', 'A2', 'D3', 'G3', 'B3', 'E4']);
  for (const [id, semitones] of [
    ['half-down', -1],
    ['whole-down', -2],
  ] as const) {
    assert.deepEqual(
      TUNINGS.find((tuning) => tuning.id === id)!.notes,
      standard.map((midi) => midi + semitones),
    );
  }
  for (const [id, bass] of [
    ['seven-c', 'C2'],
    ['seven-b', 'B1'],
  ] as const) {
    const tuning = TUNINGS.find((item) => item.id === id)!;
    assert.equal(tunerNoteLabel(tuning.notes[0]), bass);
    assert.deepEqual(tuning.notes.slice(1), standard);
    assert.equal(parseTunerSettings(JSON.stringify({ tuning: id })).tuning, id);
  }
});

test('matching respects the actual register and never folds an octave onto a string', () => {
  const standard = TUNINGS[0].notes;
  assert.equal(closestTunerString(40, standard), 0);
  assert.equal(closestTunerString(64, standard), 5);
  assert.equal(closestTunerString(28, standard), null);
  assert.equal(closestTunerString(76, standard), null);
  assert.equal(closestTunerString(52, [40, 64]), null);
  assert.notEqual(closestTunerString(52, standard), 0);
  assert.deepEqual(tunerNote(40), { letter: 'E', name: 'Mi', octave: 2 });
  assert.deepEqual(tunerNote(64), { letter: 'E', name: 'Mi', octave: 4 });
});

test('automatic string matching rejects distant or invalid measurements', () => {
  assert.equal(closestTunerString(37.5, [40]), 0);
  assert.equal(closestTunerString(42.5, [40]), 0);
  assert.equal(closestTunerString(37.49, [40]), null);
  assert.equal(closestTunerString(42.51, [40]), null);
  assert.equal(closestTunerString(40, []), null);
  for (const midi of [NaN, Infinity, -Infinity]) {
    assert.equal(closestTunerString(midi, TUNINGS[0].notes), null);
  }
});
