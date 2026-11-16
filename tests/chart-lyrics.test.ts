import assert from 'node:assert/strict';
import test from 'node:test';
import { getChart, lessons, songs } from '../src/content/course';
import type { SongVersion } from '../src/content/types';
import { buildChartGroups } from '../src/components/music/chart-layout';
import {
  chartLyricsKey,
  projectLyricCues,
  totalChartBeats,
  validateLyricCues,
  type LyricCue,
} from '../src/components/music/chart-lyrics';

function fixture(): SongVersion {
  return {
    key: 'D',
    meter: '4/4',
    beats_per_bar: 4,
    beat_unit: 'quarter',
    adaptations: 'Exemplo autoral para teste.',
    sections: [
      { id: 'A', title: 'Primeiro trecho', bars: [{ events: [{ chord: 'D', beats: 4 }] }] },
      { id: 'B', title: 'Segundo trecho', bars: [{ events: [{ chord: 'G', beats: 4 }] }] },
    ],
    order: [
      { section: 'A', repeat: 1 },
      { section: 'B', repeat: 1 },
      { section: 'A', repeat: 1 },
    ],
  };
}

test('all 19 arrangements project every written occurrence without losing bars or pulses', () => {
  let count = 0;
  for (const [songId, song] of Object.entries(songs)) {
    for (const [version, chart] of Object.entries(song.versions)) {
      count++;
      const groups = buildChartGroups(chart);
      const bars = groups.flatMap((group) => group.bars.map(({ bar }) => bar));
      const total = totalChartBeats(bars);
      for (const lesson of lessons.filter(
        (lesson) => lesson.song === songId && lesson.version === version,
      )) {
        assert.equal(total, lesson.total_beats, lesson.id);
        assert.equal(bars.length, lesson.total_bars, lesson.id);
        assert.equal(getChart(lesson), chart);
      }
      let start = 0;
      const cues = bars.map((bar, index) => {
        const startBeat = start;
        start += totalChartBeats([bar]);
        return { text: `Exercício ${index + 1}`, startBeat, endBeat: start };
      });
      const projected = projectLyricCues(chart, groups, validateLyricCues(cues, total));
      assert.equal(projected.length, bars.length, `${songId}/${version}`);
      projected.forEach((cue, index) => {
        assert.deepEqual(cue, { ...cues[index], id: index, startBar: index, endBar: index });
      });
    }
  }
  assert.equal(count, 19);
});

test('different lyrics for repeated harmony stay attached to their own occurrence', () => {
  const chart = fixture();
  const cues = validateLyricCues(
    [
      { text: 'Primeira passagem', startBeat: 0, endBeat: 3 },
      { text: 'Trecho intermediário', startBeat: 4, endBeat: 8 },
      { text: 'Segunda passagem', startBeat: 8, endBeat: 11 },
    ],
    12,
  );
  const all = projectLyricCues(chart, buildChartGroups(chart), cues);
  assert.deepEqual(
    all.map((cue) => [cue.text, cue.startBar]),
    [
      ['Primeira passagem', 0],
      ['Trecho intermediário', 1],
      ['Segunda passagem', 2],
    ],
  );
  assert.deepEqual(projectLyricCues(chart, buildChartGroups(chart, 'A'), cues), [
    { ...cues[0], id: 0, startBar: 0, endBar: 0 },
  ]);
  assert.deepEqual(projectLyricCues(chart, [buildChartGroups(chart)[2]], cues), [
    { ...cues[2], id: 2, startBeat: 0, endBeat: 3, startBar: 2, endBar: 2 },
  ]);
});

test('a phrase crossing section boundaries is preserved in full and clipped for selection', () => {
  const chart = fixture();
  const cues: LyricCue[] = [{ text: 'Frase de teste contínua', startBeat: 3, endBeat: 9 }];
  assert.deepEqual(projectLyricCues(chart, buildChartGroups(chart), cues), [
    { ...cues[0], id: 0, startBar: 0, endBar: 2 },
  ]);
  assert.deepEqual(projectLyricCues(chart, buildChartGroups(chart, 'B'), cues), [
    { ...cues[0], id: 0, startBeat: 0, endBeat: 4, startBar: 0, endBar: 0 },
  ]);
  assert.deepEqual(projectLyricCues(chart, buildChartGroups(chart, 'A'), cues), [
    { ...cues[0], id: 0, startBeat: 3, endBeat: 4, startBar: 0, endBar: 0 },
  ]);
});

test('visual syllable ownership follows its onset across sections and clamps only a clipped selection', () => {
  const chart = fixture();
  const cues: LyricCue[] = [
    {
      text: 'Santo',
      startBeat: 3.5,
      endBeat: 4.75,
      syllables: [
        { from: 0, to: 3, startBeat: 3.5, endBeat: 4.5, timing: 'manual' },
        { from: 3, to: 5, startBeat: 4.5, endBeat: 4.75, timing: 'manual' },
      ],
    },
  ];
  const original = structuredClone(cues);
  const [full] = projectLyricCues(chart, buildChartGroups(chart), cues);
  assert.deepEqual(full.syllableBars, [0, 1]);
  assert.deepEqual(full.syllables, cues[0].syllables, 'ownership does not change vocal times');
  const [clipped] = projectLyricCues(chart, buildChartGroups(chart, 'B'), cues);
  assert.deepEqual(clipped.syllableBars, [0, 0]);
  assert.deepEqual(
    clipped.syllables!.map(({ startBeat, endBeat }) => [startBeat, endBeat]),
    [
      [-0.5, 0.5],
      [0.5, 0.75],
    ],
    'a clipped sustained syllable keeps its original duration and fractional progress',
  );
  assert.deepEqual(cues, original);
});

test('syllable ownership uses actual local meter durations and repeated playback indexes', () => {
  const chart: SongVersion = {
    ...fixture(),
    sections: [
      {
        id: 'A',
        title: 'Verso',
        bars: [
          { events: [{ chord: 'D', beats: 4 }] },
          { meter: '2/4', beats_per_bar: 2, events: [{ chord: 'G', beats: 2 }] },
          { events: [{ chord: 'A', beats: 4 }] },
        ],
      },
    ],
    order: [{ section: 'A', repeat: 2 }],
  };
  const cues: LyricCue[] = [0, 10].map((offset) => ({
    text: 'Santo amor',
    startBeat: offset + 3.5,
    endBeat: offset + 7,
    syllables: [
      { from: 0, to: 3, startBeat: offset + 3.5, endBeat: offset + 4.25, timing: 'manual' },
      { from: 3, to: 6, startBeat: offset + 4.25, endBeat: offset + 5.75, timing: 'manual' },
      { from: 6, to: 8, startBeat: offset + 6, endBeat: offset + 6.5, timing: 'manual' },
      { from: 8, to: 10, startBeat: offset + 6.5, endBeat: offset + 7, timing: 'manual' },
    ],
  }));
  const original = structuredClone({ chart, cues });
  const groups = buildChartGroups(chart);
  const full = projectLyricCues(chart, groups, cues);
  assert.deepEqual(
    full.map(({ syllableBars }) => syllableBars),
    [
      [0, 1, 2, 2],
      [3, 4, 5, 5],
    ],
  );
  const [secondPass] = projectLyricCues(chart, [groups[1]], cues);
  assert.deepEqual(secondPass.syllableBars, [3, 4, 5, 5]);
  assert.deepEqual(secondPass.syllables, cues[0].syllables);
  assert.deepEqual({ chart, cues }, original);
});

test('rests stay empty and touching boundaries do not activate the next or preceding bar', () => {
  const chart = fixture();
  const cues = validateLyricCues(
    [
      { text: 'Entrada após pausa', startBeat: 1, endBeat: 2 },
      { text: 'Final exato', startBeat: 3, endBeat: 4 },
      { text: 'Nova entrada', startBeat: 4, endBeat: 6 },
    ],
    12,
  );
  const full = projectLyricCues(chart, buildChartGroups(chart), cues);
  assert.deepEqual(
    full.map(({ startBeat, endBeat, startBar, endBar }) => [startBeat, endBeat, startBar, endBar]),
    [
      [1, 2, 0, 0],
      [3, 4, 0, 0],
      [4, 6, 1, 1],
    ],
  );
  assert.deepEqual(projectLyricCues(chart, buildChartGroups(chart, 'B'), cues), [
    { ...cues[2], id: 2, startBeat: 0, endBeat: 2, startBar: 0, endBar: 0 },
  ]);
  assert.deepEqual(projectLyricCues(chart, [], cues), []);
  assert.deepEqual(projectLyricCues(chart, buildChartGroups(chart), []), []);
});

test('compound pulses, fractional entrances and local 2/4 bars retain exact beat offsets', () => {
  const chart: SongVersion = {
    ...fixture(),
    meter: '6/8',
    beat_unit: 'dotted-quarter',
    beats_per_bar: 2,
    sections: [
      {
        id: 'A',
        title: 'Compassos mistos',
        bars: [
          { events: [{ chord: 'D', beats: 2 }] },
          {
            meter: '2/4',
            beats_per_bar: 2,
            events: [
              { chord: 'G', beats: 0.5 },
              { chord: 'D', beats: 1.5 },
            ],
          },
          { events: [{ chord: 'D', beats: 2 }] },
        ],
      },
    ],
    order: [{ section: 'A', repeat: 2 }],
  };
  const cues = validateLyricCues(
    [
      { text: 'Teste composto', startBeat: 1 / 3, endBeat: 2 },
      { text: 'Teste simples', startBeat: 2.5, endBeat: 4 },
      { text: 'Segunda volta', startBeat: 6 + 1 / 3, endBeat: 8 },
    ],
    12,
  );
  const all = projectLyricCues(chart, buildChartGroups(chart), cues);
  assert.equal(totalChartBeats(chart.sections[0].bars), 6);
  assert.deepEqual(
    all.map((cue) => [cue.startBeat, cue.endBeat, cue.startBar, cue.endBar]),
    [
      [1 / 3, 2, 0, 0],
      [2.5, 4, 1, 1],
      [6 + 1 / 3, 8, 3, 3],
    ],
  );
});

test('import validation rejects missing, invalid, overlapping and out-of-order intervals', () => {
  const valid = { text: 'Texto de teste', startBeat: 0, endBeat: 4 };
  for (const input of [
    null,
    {},
    'texto',
    [null],
    [[]],
    [{}],
    [{ ...valid, text: '' }],
    [{ ...valid, text: ' \n ' }],
    [{ ...valid, text: 1 }],
    [{ ...valid, startBeat: '0' }],
    [{ ...valid, endBeat: undefined }],
    [{ ...valid, startBeat: NaN }],
    [{ ...valid, endBeat: Infinity }],
    [{ ...valid, startBeat: -1 }],
    [{ ...valid, endBeat: 0 }],
    [{ ...valid, startBeat: 5 }],
    [{ ...valid, endBeat: 12.01 }],
    [{ ...valid, startBeat: 12, endBeat: 13 }],
    [valid, { ...valid, startBeat: 3, endBeat: 5 }],
    [{ ...valid, startBeat: 4, endBeat: 8 }, valid],
  ])
    assert.throws(() => validateLyricCues(input, 12));
  for (const total of [-1, NaN, Infinity])
    assert.throws(() => validateLyricCues([], total), /duração/);
  assert.deepEqual(validateLyricCues([], 0), []);
  assert.deepEqual(
    validateLyricCues([{ ...valid, text: '  Texto de teste  ', endBeat: 12 + 1e-9 }], 12),
    [{ ...valid, endBeat: 12 }],
  );
  assert.throws(
    () => validateLyricCues([valid, { ...valid, startBeat: 2 }], 12),
    /Frase 2.*sobrepor/,
  );
  assert.throws(
    () => validateLyricCues([{ ...valid, text: 'a'.repeat(6001) }], 12),
    /6.000 caracteres/,
  );
  assert.throws(
    () =>
      validateLyricCues(
        Array.from({ length: 1001 }, (_, index) => ({
          text: 'Frase de teste',
          startBeat: index,
          endBeat: index + 1,
        })),
        2000,
      ),
    /1.000 frases/,
  );
});

test('storage identity survives tempo/editorial changes but changes with the musical arrangement', () => {
  const chart = fixture();
  const key = chartLyricsKey(chart, 'teste');
  assert.equal(key, chartLyricsKey(structuredClone(chart), 'teste'));
  assert.equal(
    key,
    chartLyricsKey({ ...chart, practice_bpm: 40, adaptations: 'Texto revisado.' }, 'teste'),
  );
  assert.notEqual(key, chartLyricsKey(chart, 'outra-musica'));
  const edits: ((value: SongVersion) => void)[] = [
    (value) => {
      value.order[0].repeat = 2;
    },
    (value) => {
      value.order.reverse();
      value.order[0].section = 'B';
    },
    (value) => {
      value.sections[0].bars[0].events[0].beats = 3;
    },
    (value) => {
      value.sections[0].bars[0].events[0].chord = 'G';
    },
    (value) => {
      value.sections[0].bars[0].meter = '2/4';
    },
    (value) => {
      value.key = 'G';
    },
  ];
  for (const edit of edits) {
    const changed = structuredClone(chart);
    edit(changed);
    assert.notEqual(key, chartLyricsKey(changed, 'teste'));
  }
});

test('retimed vocal windows preserve their original score cell for reproducible legacy matching', () => {
  const cue = {
    text: 'Entrada antes do acorde',
    startBeat: 3,
    endBeat: 7.5,
    scoreWindow: { startBeat: 4, endBeat: 8 },
  };
  assert.deepEqual(validateLyricCues([cue], 12), [cue]);
  for (const scoreWindow of [
    null,
    [],
    { startBeat: -1, endBeat: 8 },
    { startBeat: 4, endBeat: 4 },
    { startBeat: 4, endBeat: 13 },
    { startBeat: NaN, endBeat: 8 },
    { startBeat: 4, endBeat: Infinity },
  ])
    assert.throws(() => validateLyricCues([{ ...cue, scoreWindow }], 12), /origem/);
});
