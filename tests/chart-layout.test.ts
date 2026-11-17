import assert from 'node:assert/strict';
import test from 'node:test';
import { songs } from '../src/content/course';
import type { ChartBar, SongVersion } from '../src/content/types';
import {
  buildChartGroups,
  buildChartRows,
  describeChartBar,
} from '../src/components/music/chart-layout';

const bar = (beats = 4): ChartBar => ({ events: [{ chord: 'D', beats }] });
const fixture = (meter = '4/4', pulses = 4): SongVersion => ({
  key: 'D',
  meter,
  beats_per_bar: pulses,
  beat_unit: 'quarter',
  adaptations: '',
  sections: [
    { id: 'A', title: 'Verso', bars: [bar(pulses), bar(pulses)] },
    { id: 'R', title: 'Refrão', bars: [bar(pulses)] },
  ],
  order: [
    { section: 'A', repeat: 1 },
    { section: 'R', repeat: 2 },
    { section: 'A', repeat: 1 },
    { section: 'R', repeat: 1 },
  ],
});

test('all course arrangements retain section order, repeat count, bar identity and duration', () => {
  for (const song of Object.values(songs))
    for (const chart of Object.values(song.versions)) {
      const groups = buildChartGroups(chart);
      const expected = chart.order.flatMap((part) =>
        Array.from(
          { length: part.repeat },
          () => chart.sections.find((section) => section.id === part.section)!.bars,
        ).flat(),
      );
      const actual = groups.flatMap((group) => group.bars);
      assert.equal(actual.length, expected.length, song.title);
      assert.equal(
        new Set(groups.map((group) => group.key)).size,
        groups.length,
        'every section occurrence has a distinct key',
      );
      actual.forEach((display, index) => {
        assert.equal(display.bar, expected[index], 'grouping preserves the source bar reference');
        assert.equal(display.playbackIndex, index, 'audio and visual indexes stay aligned');
        const description = describeChartBar(display.bar, chart);
        assert.deepEqual(
          description.events.map(({ chord, beats }) => ({ chord, beats })),
          display.bar.events,
        );
        assert.equal(
          description.events.reduce((total, event) => total + event.span, 0),
          description.ticks.length,
          'chord spans fill the actual meter exactly',
        );
      });
      assert.equal(
        actual.reduce(
          (total, display) =>
            total + display.bar.events.reduce((sum, event) => sum + event.beats, 0),
          0,
        ),
        expected.reduce(
          (total, item) => total + item.events.reduce((sum, event) => sum + event.beats, 0),
          0,
        ),
      );
      for (const group of groups) {
        const rows = buildChartRows(group.bars, chart);
        assert.deepEqual(rows.flat(), group.bars, 'line breaks cannot drop or duplicate bars');
        assert.ok(rows.every((row) => row.length >= 1 && row.length <= 4));
      }
    }
});

test('passages count adjacent and later repeats; selecting a section restarts playback indexes', () => {
  const chart = fixture();
  const groups = buildChartGroups(chart);
  assert.deepEqual(
    groups.map((group) => [group.sectionId, group.passage, group.passages]),
    [
      ['A', 1, 2],
      ['R', 1, 3],
      ['R', 2, 3],
      ['A', 2, 2],
      ['R', 3, 3],
    ],
  );
  assert.deepEqual(
    groups[3].bars.map((item) => [item.barIndex, item.playbackIndex]),
    [
      [0, 4],
      [1, 5],
    ],
  );
  const selected = buildChartGroups(chart, 'A');
  assert.equal(selected.length, 1);
  assert.equal(selected[0].passages, 1);
  assert.deepEqual(
    selected[0].bars.map((item) => [item.barIndex, item.playbackIndex]),
    [
      [0, 0],
      [1, 1],
    ],
  );
  assert.deepEqual(buildChartGroups(chart, 'missing'), []);
});

test('rows preserve a 2/4 change and the return to 4/4 instead of mixing their counts', () => {
  const chart = fixture();
  const source = [
    bar(),
    bar(),
    { ...bar(2), meter: '2/4', beats_per_bar: 2 },
    ...Array.from({ length: 5 }, () => bar()),
  ];
  const displays = source.map((bar, index) => ({ bar, barIndex: index, playbackIndex: index }));
  assert.deepEqual(
    buildChartRows(displays, chart).map((row) => row.map((item) => item.barIndex)),
    [[0, 1], [2], [3, 4, 5, 6], [7]],
  );
  assert.equal(describeChartBar(source[2], chart).ticks.length, 2);
  assert.deepEqual(buildChartRows([], chart), []);
  assert.throws(() => buildChartRows(displays, chart, 0), RangeError);
});

test('meter counting and fractional chord durations occupy the correct visual subdivisions', () => {
  const simple = fixture();
  assert.deepEqual(
    describeChartBar(bar(), simple).ticks.map((tick) => tick.label),
    ['1', '2', '3', '4'],
  );
  assert.deepEqual(
    describeChartBar(bar(3), fixture('3/4', 3)).ticks.map((tick) => tick.label),
    ['1', '2', '3'],
  );
  assert.deepEqual(
    describeChartBar(bar(2), fixture('2/4', 2)).ticks.map((tick) => tick.label),
    ['1', '2'],
  );
  const compound = describeChartBar(
    {
      events: [
        { chord: 'D', beats: 1 },
        { chord: 'G', beats: 1 },
      ],
    },
    fixture('6/8', 2),
  );
  assert.deepEqual(
    compound.ticks.map((tick) => tick.label),
    ['1', 'la', 'li', '2', 'la', 'li'],
  );
  assert.deepEqual(
    compound.ticks.map((tick) => tick.strong),
    [true, false, false, true, false, false],
  );
  assert.deepEqual(
    compound.events.map(({ start, span }) => ({ start, span })),
    [
      { start: 1, span: 3 },
      { start: 4, span: 3 },
    ],
  );
  const syncopated = describeChartBar(
    {
      events: [
        { chord: 'D', beats: 1.5 },
        { chord: 'G', beats: 2.5 },
      ],
    },
    simple,
  );
  assert.deepEqual(
    syncopated.ticks.map((tick) => tick.label),
    ['1', 'e', '2', 'e', '3', 'e', '4', 'e'],
  );
  assert.deepEqual(
    syncopated.events.map(({ start, span }) => ({ start, span })),
    [
      { start: 1, span: 3 },
      { start: 4, span: 5 },
    ],
  );
  assert.deepEqual(
    syncopated.events.map((event) => event.beats),
    [1.5, 2.5],
  );
});

test('tablature column timing uses a readable pulse grid without rounding its notes', () => {
  const chart = songs.santo_espirito.versions.base;
  const bar = {
    tablature: [
      'e|--0----1--|',
      'B|---------|',
      'G|---------|',
      'D|---------|',
      'A|---------|',
      'E|---------|',
    ],
    events: [
      { chord: 'Pausa', notes: [], beats: 8 / 9 },
      { chord: 'Tablatura', notes: [64], beats: 20 / 9 },
      { chord: 'Tablatura', notes: [65], beats: 8 / 9 },
    ],
  };
  const before = structuredClone(bar);
  assert.equal(describeChartBar(bar, chart).ticks.length, 4);
  assert.deepEqual(bar, before);
});
