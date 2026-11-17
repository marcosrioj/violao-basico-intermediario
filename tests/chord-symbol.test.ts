import assert from 'node:assert/strict';
import test from 'node:test';
import { parseChordSymbol, transposeChordSymbol } from '../src/components/music/chord-symbol';

function intervals(symbol: string) {
  const parsed = parseChordSymbol(symbol);
  assert.ok(parsed, symbol);
  return parsed.intervals;
}

test('common chord qualities preserve thirds, sevenths, extensions and suspensions', () => {
  const examples: Record<string, number[]> = {
    C: [0, 4, 7],
    Am: [0, 3, 7],
    Dmin: [0, 3, 7],
    'F#7': [0, 4, 7, 10],
    Bbmaj7: [0, 4, 7, 11],
    B7M: [0, 4, 7, 11],
    CmM7: [0, 3, 7, 11],
    C9: [0, 4, 7, 10, 14],
    Dm11: [0, 3, 7, 10, 14, 17],
    GM13: [0, 4, 7, 11, 14, 17, 21],
    Bdim: [0, 3, 6],
    'F#dim7': [0, 3, 6, 9],
    Bø: [0, 3, 6, 10],
    'Bm7(b5)': [0, 3, 6, 10],
    'C+': [0, 4, 8],
    Eaug7: [0, 4, 8, 10],
    Dsus2: [0, 2, 7],
    Asus4: [0, 5, 7],
    G7sus4: [0, 5, 7, 10],
    C5: [0, 7],
    'C6/9': [0, 4, 7, 9, 14],
    Cadd9: [0, 4, 7, 14],
    'C(9)': [0, 4, 7, 14],
    'Cm7(9)': [0, 3, 7, 10, 14],
    'C7(b9,#11)': [0, 4, 7, 10, 13, 18],
    'C7#5': [0, 4, 8, 10],
    Cmaj7no5: [0, 4, 11],
    'A7(9,13)': [0, 4, 7, 10, 14, 21],
    G4: [0, 5, 7],
    D2: [0, 2, 7],
    'C#4': [0, 5, 7],
    'G4(6)': [0, 5, 7, 9],
    'E7(4/9)': [0, 5, 7, 10, 14],
    'D2/F#': [0, 2, 7],
    'E7(4/9)/B': [0, 5, 7, 10, 14],
    Dadd2: [0, 2, 4, 7],
    Gadd4: [0, 4, 5, 7],
    'C7/9': [0, 4, 7, 10, 14],
    'Cm7/9': [0, 3, 7, 10, 14],
    'C7(9/11)': [0, 4, 7, 10, 14, 17],
    'C7(b9/b13)': [0, 4, 7, 10, 13, 20],
    'C7(9/11+)': [0, 4, 7, 10, 14, 18],
    'C7/13-': [0, 4, 7, 10, 20],
    'C7/4/9': [0, 5, 7, 10, 14],
    'C7M(13)': [0, 4, 7, 11, 21],
    'Caug(b5)': [0, 4, 6],
    'Cdim(#5)': [0, 3, 8],
    'C7(b5,#5)': [0, 4, 6, 8, 10],
    'C7+': [0, 4, 7, 11],
    'Cm7+': [0, 3, 7, 11],
    'C7+(9)': [0, 4, 7, 11, 14],
    'Cm7+/9': [0, 3, 7, 11, 14],
    Fº: [0, 3, 6],
    Fº7: [0, 3, 6, 9],
    'C5+': [0, 4, 8],
    'C+7': [0, 4, 8, 10],
    'C7(5+)': [0, 4, 8, 10],
  };
  for (const [symbol, expected] of Object.entries(examples))
    assert.deepEqual(intervals(symbol), expected, symbol);
});

test('enharmonics and slash bass retain the root harmony with the named bass below every voice', () => {
  for (const [symbol, root, bass] of [
    ['Dbmaj7/Ab', 1, 8],
    ['C#m7/G#', 1, 8],
    ['B#', 0, 0],
    ['Cb/Fb', 11, 4],
    ['F♯7/A♯', 6, 10],
  ] as const) {
    const parsed = parseChordSymbol(symbol)!;
    assert.equal(parsed.root, root);
    assert.equal(parsed.bass, bass);
    assert.equal(parsed.midiNotes[0] % 12, bass);
    assert.ok(parsed.midiNotes.slice(1).every((note) => note > parsed.midiNotes[0]));
  }
  assert.deepEqual(parseChordSymbol('C/E')!.midiNotes, [40, 48, 52, 55]);
  assert.equal(parseChordSymbol(' F♯7/A♯ ')!.symbol, 'F#7/A#');
});

test('every chromatic root, enharmonic spelling and double accidental resolves exactly', () => {
  const spellings = [
    'C/B#',
    'C#/Db',
    'D',
    'D#/Eb',
    'E/Fb',
    'F/E#',
    'F#/Gb',
    'G',
    'G#/Ab',
    'A',
    'A#/Bb',
    'B/Cb',
  ];
  for (const [pc, names] of spellings.entries()) {
    for (const name of names.split('/')) {
      const parsed = parseChordSymbol(name)!;
      assert.equal(parsed.root, pc, name);
      assert.deepEqual(parsed.intervals, [0, 4, 7]);
    }
  }
  for (const [name, pc] of [
    ['C##', 2],
    ['Dbb', 0],
    ['Ex', 6],
    ['F𝄪', 7],
    ['B𝄫', 9],
    ['E#', 5],
    ['Fb', 4],
  ] as const) {
    const parsed = parseChordSymbol(name)!;
    assert.equal(parsed.root, pc, name);
  }
  assert.deepEqual(parseChordSymbol('C##m7/Gbb')!.intervals, [0, 3, 7, 10]);
  assert.equal(parseChordSymbol('C##m7/Gbb')!.bass, 5);
  for (const [spelling, canonical] of [
    ['Dó', 'C'],
    ['Réb7', 'Db7'],
    ['Mim7', 'Em7'],
    ['Fá#', 'F#'],
    ['Sol7M', 'G7M'],
    ['Lá', 'A'],
    ['Sib', 'Bb'],
    ['Dó#m/Sol#', 'C#m/G#'],
  ]) {
    assert.deepEqual(parseChordSymbol(spelling), parseChordSymbol(canonical), spelling);
  }
});

test('transposition preserves quality, extensions and slash bass while resolving the sounding key', () => {
  for (const [source, semitones, expected] of [
    ['C', 1, 'C#'],
    ['Bb', 2, 'C'],
    ['Am', 2, 'Bm'],
    ['Dó#m/Sol#', -1, 'Cm/G'],
    ['Eb7(9/11)/Bb', 2, 'F7(9/11)/C'],
    ['B#maj7', 1, 'C#maj7'],
    ['Dbb', 1, 'Db'],
  ] as const) {
    assert.equal(transposeChordSymbol(source, semitones), expected);
    const before = parseChordSymbol(source)!;
    const after = parseChordSymbol(expected)!;
    assert.deepEqual(after.intervals, before.intervals);
    assert.equal(after.root, (before.root + semitones + 12) % 12);
    assert.equal(after.bass, (before.bass + semitones + 12) % 12);
  }
  assert.equal(transposeChordSymbol('Bb', 0), 'Bb');
  assert.equal(transposeChordSymbol('C7alt', 2), null);
  assert.equal(transposeChordSymbol('C', 1.5), null);
});

test('unknown and ambiguous notation is rejected rather than losing notes or sounding a major chord', () => {
  for (const symbol of [
    '',
    'H7',
    'Cbanana',
    'Amigo',
    'C7alt',
    'C/foo',
    'C/E/G',
    'Cm5',
    'CM6',
    'C()',
    'C(9',
    'C9)',
    'C(9,,11)',
    'C(9//11)',
    'C###',
    'Db#',
    'C/Gbbb',
    'Csus2sus4',
    'Cmadd9add9',
    'C 7',
    'N.C.',
    '<script>',
  ]) {
    assert.equal(parseChordSymbol(symbol), null, symbol);
  }
});

test('custom synthesis schedules every parsed note together and its cancellation stops every voice', async (t) => {
  const original = globalThis.AudioContext;
  const starts: number[] = [],
    stops: number[] = [],
    frequencies: number[] = [];
  class FakeContext {
    currentTime = 10;
    destination = {};
    resume() {
      return Promise.resolve();
    }
    createOscillator() {
      const frequency = {
        set value(value: number) {
          frequencies.push(value);
        },
      };
      return {
        type: '',
        frequency,
        connect() {},
        disconnect() {},
        start(at: number) {
          starts.push(at);
        },
        stop(at: number) {
          stops.push(at);
        },
        onended: null,
      };
    }
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
          cancelScheduledValues() {},
          setTargetAtTime() {},
        },
        connect() {},
        disconnect() {},
      };
    }
  }
  globalThis.AudioContext = FakeContext as unknown as typeof AudioContext;
  t.after(() => {
    globalThis.AudioContext = original;
  });
  const { soundChordSymbol, soundPitches } =
    await import('../src/components/music/custom-chord-audio');
  soundChordSymbol('unrecognized');
  soundChordSymbol('C', 0);
  assert.equal(starts.length, 0);
  const cancel = soundChordSymbol('C/E', 2, 12);
  assert.deepEqual(starts, [12, 12, 12, 12]);
  assert.deepEqual(stops, [14, 14, 14, 14]);
  assert.deepEqual(
    frequencies,
    [40, 48, 52, 55].map((note) => 440 * 2 ** ((note - 69) / 12)),
  );
  cancel();
  assert.deepEqual(stops.slice(4), [10.03, 10.03, 10.03, 10.03]);
  const capod = soundChordSymbol('C/E', 2, 12, 3);
  assert.deepEqual(
    frequencies.slice(4),
    [43, 51, 55, 58].map((note) => 440 * 2 ** ((note - 69) / 12)),
  );
  capod();
  const tab = soundPitches([40, 64], 1, 13, 2);
  assert.deepEqual(
    frequencies.slice(8),
    [42, 66].map((note) => 440 * 2 ** ((note - 69) / 12)),
    'tablature adds no harmony or bass',
  );
  tab();
  const before = frequencies.length;
  soundPitches([], 1);
  soundPitches([NaN], 1);
  soundPitches([127], 1, 12, 1);
  soundPitches([-1], 1);
  soundPitches([60.5], 1);
  soundPitches([60], 1, Infinity);
  soundPitches([60], 1, 12, 0.5);
  soundPitches(Array(17).fill(60), 1);
  soundChordSymbol('C', 1, 12, NaN);
  assert.equal(frequencies.length, before, 'invalid pitch groups are rejected as a whole');
});
