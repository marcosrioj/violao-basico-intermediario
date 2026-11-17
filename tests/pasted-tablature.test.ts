import assert from 'node:assert/strict';
import test from 'node:test';
import {
  parsePastedTablature,
  PastedTablatureError,
} from '../src/components/music/pasted-tablature';

const intro = [
  'E|--------------------------1------3------0-|',
  'B|-0-1-------1-0-1------0-1----1------0------|',
  'G|-------0-----------0----------3-------0--|',
  'D|-----2-----------2-----------------------|',
  'A|-3---3-------3---3--------1------2------3-|',
  'E|-----------------------------------------|',
];
function parse(lines: string[], beats = 4, harmony?: string) {
  const parsed = parsePastedTablature(lines, 0, beats, harmony);
  assert.ok(parsed);
  return parsed;
}
function allNotes(lines: string[]) {
  return parse(lines).bars.flatMap((bar) => bar.events.flatMap((event) => event.notes!));
}

test('the supplied intro style loads six lines and all written pitches without inventing chord voices', () => {
  const result = parse(intro, 4, '    C                    A#9       G      C');
  assert.equal(result.consumedLines, 6);
  assert.equal(result.bars.length, 4);
  assert.deepEqual(
    result.bars.map((bar) => bar.events[0].chord),
    ['C', 'A#9', 'G', 'C'],
  );
  for (const bar of result.bars) {
    assert.equal(bar.tablature!.length, 6);
    assert.equal(
      bar.events.reduce((sum, event) => sum + event.beats, 0),
      4,
    );
    assert.ok(bar.events.every((event) => event.beats > 0 && Array.isArray(event.notes)));
  }
  assert.ok(result.bars.flatMap((bar) => bar.events).some((event) => event.notes!.includes(65)));
  // The bass 3 is C3, independent of the harmony label A#9 at a later position.
  assert.ok(result.bars[0].events.some((event) => event.notes!.includes(48)));
});

test('multi-digit frets are a single pitch and horizontal columns preserve simultaneous strings', () => {
  const result = parse([
    'e|--10--12--|',
    'B|--10------|',
    'G|----------|',
    'D|----------|',
    'A|----------|',
    'E|----------|',
  ]);
  assert.deepEqual(
    result.bars[0].events.map((event) => event.notes),
    [[], [74, 69], [76]],
  );
  result.bars[0].events.forEach((event, index) => {
    assert.ok(Math.abs(event.beats - [0.8, 1.6, 1.6][index]) < 1e-9);
  });
});

test('explicit measures, unlabeled strings and compound pulses retain source rows and silence', () => {
  const rows = [
    '|0---|----|',
    '|----|----|',
    '|----|----|',
    '|----|----|',
    '|----|----|',
    '|----|----|',
  ];
  const result = parse(rows, 2);
  assert.equal(result.bars.length, 2);
  assert.deepEqual(result.bars[0].events, [{ chord: 'Tablatura', notes: [64], beats: 2 }]);
  assert.deepEqual(result.bars[1].events, [{ chord: 'Pausa', notes: [], beats: 2 }]);
  assert.equal(result.bars[0].tablature![0], 'e|0---|');
});

test('hammers, pulls and slides retain written targets while bends do not create picked target notes', () => {
  const top = 'e|0h2p0/5\\3-7b9r7~--x--<12>--|';
  const width = top.length - 3;
  const rows = [top, ...['B', 'G', 'D', 'A', 'E'].map((label) => `${label}|${'-'.repeat(width)}|`)];
  const result = parse(rows);
  assert.deepEqual(allNotes(rows), [64, 66, 64, 69, 67, 71, 76]);
  assert.ok(result.warnings.some((warning) => warning.message.includes('não simula')));
  assert.ok(result.bars[0].tablature![0].includes('7b9r7~'));
  assert.ok(result.bars[0].events.some((event) => event.notes!.length === 0));
});

test('blank separators between string lines are consumed and malformed blocks have actionable line numbers', () => {
  const withBlank = [intro[0], '', ...intro.slice(1), '[Verso]'];
  assert.equal(parse(withBlank).consumedLines, 7);
  assert.throws(
    () => parse(intro.slice(0, 5)),
    (error: unknown) => {
      assert.ok(error instanceof PastedTablatureError);
      assert.equal(error.line, 1);
      assert.match(error.message, /seis linhas/);
      return true;
    },
  );
  assert.throws(() => parse(['D|0---|', ...intro.slice(1)]), /afinação padrão/);
  assert.throws(
    () => parse(['e|25--|', ...['B', 'G', 'D', 'A', 'E'].map((name) => `${name}|----|`)]),
    /0 a 24/,
  );
});

test('ordinary chord lines and lyrics are not mistaken for tablature', () => {
  for (const value of [
    '| C | G7 |',
    'C G Am F',
    '| C7 | Am |',
    '| Am7 | G7 |',
    'C|Am7|',
    'E|B7|',
    'C|B7|',
    'E|G|A',
    'Minha voz',
  ])
    assert.equal(parsePastedTablature([value], 0, 4), null, value);
});

test('mismatched bar count and excessive attacks fail before playback', () => {
  assert.throws(
    () => parse(['e|0---|0---|', ...['B', 'G', 'D', 'A', 'E'].map((name) => `${name}|----|`)]),
    /barras de compasso/,
  );
  const long = '0-'.repeat(257);
  assert.throws(
    () =>
      parse([
        `e|${long}|`,
        ...['B', 'G', 'D', 'A', 'E'].map((name) => `${name}|${'-'.repeat(long.length)}|`),
      ]),
    /256 ataques/,
  );
});

test('a chord boundary inside a two-digit fret never splits the printed number', () => {
  const result = parse(
    ['e|--12----|', 'B|--------|', 'G|--------|', 'D|--------|', 'A|--------|', 'E|--------|'],
    4,
    '  C  G',
  );
  assert.equal(result.bars.length, 2);
  assert.equal(result.bars[1].tablature![0], 'e|12----|');
  assert.equal(result.bars[1].events[0].chord, 'G');
  assert.deepEqual(result.bars[1].events[0].notes, [76]);
});

test('compact heading harmony retains every chord instead of losing the first one before the string prefix', () => {
  const result = parse(
    [
      'e|0----12---|',
      'B|----------|',
      'G|----------|',
      'D|----------|',
      'A|----------|',
      'E|----------|',
    ],
    4,
    'C G',
  );
  assert.equal(result.bars.length, 2);
  assert.deepEqual(
    result.bars.map((bar) => bar.events[0].chord),
    ['C', 'G'],
  );
  assert.deepEqual(
    result.bars.map((bar) => bar.events[0].notes),
    [[64], [76]],
  );
  assert.ok(result.warnings.some((warning) => warning.message.includes('acordes compactos')));
});
