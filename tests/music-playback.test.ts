import assert from 'node:assert/strict';
import test from 'node:test';
import { scheduleChartBar, scheduleChartMetronome } from '../src/components/music/chart-timing';
import type { ChartBar, SongVersion } from '../src/content/types';
import { songs } from '../src/content/course';
test('chart uses absolute targets and fractional pulses', () => {
  const first = scheduleChartBar(
    {
      events: [
        { chord: 'G', beats: 1.5 },
        { chord: 'D', beats: 1.5 },
        { chord: 'A', beats: 1 },
      ],
    },
    10,
    60,
  );
  assert.deepEqual(
    first.events.map((e) => e.at),
    [10, 11.5, 13],
  );
  assert.deepEqual(
    first.events.map((e) => e.duration),
    [1.5, 1.5, 1],
  );
  assert.equal(scheduleChartBar({ events: [{ chord: 'A', beats: 4 }] }, first.endAt, 60).endAt, 18);
});
test('two dotted-quarter pulses and a short 2/4 bar keep their durations', () => {
  const compound = scheduleChartBar({ events: [{ chord: 'G', beats: 2 }] }, 0, 60);
  assert.equal(compound.endAt, 2);
  assert.equal(
    scheduleChartBar(
      { events: [{ chord: 'G', beats: 2 }], beats_per_bar: 2, meter: '2/4' },
      compound.endAt,
      60,
    ).endAt,
    4,
  );
});
test('four pulses at 42 BPM are not truncated to two seconds', () => {
  const event = scheduleChartBar({ events: [{ chord: 'D', beats: 4 }] }, 0, 42).events[0];
  assert.ok(Math.abs(event.duration - 5.714285714285714) < 1e-9);
});

const simpleChart: SongVersion = {
  key: 'D',
  meter: '4/4',
  beats_per_bar: 4,
  beat_unit: 'quarter',
  sections: [],
  order: [],
  adaptations: '',
};

test('metronome accents the first 4/4 pulse and shares absolute bar boundaries', () => {
  const bar: ChartBar = { events: [{ chord: 'D', beats: 4 }] };
  const scheduled = scheduleChartMetronome(bar, simpleChart, 10, 60);
  assert.deepEqual(
    scheduled.ticks.map((tick) => tick.at),
    [10, 11, 12, 13],
  );
  assert.deepEqual(
    scheduled.ticks.map((tick) => tick.tickIndex),
    [0, 1, 2, 3],
  );
  assert.deepEqual(
    scheduled.ticks.map((tick) => tick.frequency),
    [1200, 800, 800, 800],
  );
  assert.deepEqual(
    scheduled.ticks.map((tick) => tick.volume),
    [0.12, 0.08, 0.08, 0.08],
  );
  assert.equal(scheduled.endAt, scheduleChartBar(bar, 10, 60).endAt);
  assert.equal(scheduled.endAt, 14);
});

test('6/8 clicks six subdivisions across two dotted-quarter pulses', () => {
  const chart = { ...simpleChart, meter: '6/8', beats_per_bar: 2 };
  const bar = { events: [{ chord: 'G', beats: 2 }] };
  const scheduled = scheduleChartMetronome(bar, chart, 5, 60);
  assert.equal(scheduled.ticks.length, 6);
  scheduled.ticks.forEach((tick, index) => {
    assert.ok(Math.abs(tick.at - (5 + index / 3)) < 1e-9);
    assert.equal(tick.tickIndex, index);
  });
  assert.deepEqual(
    scheduled.ticks.map((tick) => tick.frequency),
    [1200, 550, 550, 800, 550, 550],
  );
  assert.deepEqual(
    scheduled.ticks.map((tick) => tick.volume),
    [0.12, 0.035, 0.035, 0.08, 0.035, 0.035],
  );
  assert.equal(scheduled.endAt, 7);
});

test('local 2/4 and 3/4 changes replace the chart pulse count without extra clicks', () => {
  const compound = { ...simpleChart, meter: '6/8', beats_per_bar: 2 };
  const shortBar: ChartBar = {
    events: [{ chord: 'G', beats: 2 }],
    meter: '2/4',
    beats_per_bar: 2,
  };
  const short = scheduleChartMetronome(shortBar, compound, 2, 120);
  assert.deepEqual(
    short.ticks.map((tick) => tick.at),
    [2, 2.5],
  );
  assert.equal(short.endAt, 3);
  const triple = scheduleChartMetronome(
    { events: [{ chord: 'G', beats: 3 }], meter: '3/4' },
    simpleChart,
    short.endAt,
    120,
  );
  assert.deepEqual(
    triple.ticks.map((tick) => tick.at),
    [3, 3.5, 4],
  );
  assert.equal(triple.endAt, 4.5);
});

test('fractional chord changes align with the same subdivided counting ticks', () => {
  const bar = {
    events: [
      { chord: 'G', beats: 1.5 },
      { chord: 'D', beats: 2.5 },
    ],
  };
  const chords = scheduleChartBar(bar, 10, 60);
  const metronome = scheduleChartMetronome(bar, simpleChart, 10, 60);
  assert.deepEqual(
    metronome.ticks.map((tick) => tick.at),
    [10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5],
  );
  assert.equal(metronome.ticks[3].at, chords.events[1].at);
  assert.deepEqual(
    metronome.ticks.map((tick) => tick.frequency),
    [1200, 550, 800, 550, 800, 550, 800, 550],
  );
  assert.equal(metronome.endAt, chords.endAt);
});

test('all arrangements keep click and chord boundaries aligned across two complete loops', () => {
  for (const song of Object.values(songs)) {
    for (const chart of Object.values(song.versions)) {
      const bars = chart.order.flatMap((part) =>
        Array.from(
          { length: part.repeat },
          () => chart.sections.find((section) => section.id === part.section)!.bars,
        ).flat(),
      );
      let nextBarAt = 3.25;
      const bpm = 73;
      let elapsedBeats = 0;
      for (let loop = 0; loop < 2; loop++) {
        for (const bar of bars) {
          const chord = scheduleChartBar(bar, nextBarAt, bpm);
          const metronome = scheduleChartMetronome(bar, chart, nextBarAt, bpm);
          assert.equal(metronome.ticks[0].at, nextBarAt);
          assert.equal(metronome.endAt, chord.endAt);
          assert.ok(metronome.ticks.every((tick) => tick.at >= nextBarAt && tick.at < chord.endAt));
          nextBarAt = chord.endAt;
          elapsedBeats += bar.events.reduce((sum, event) => sum + event.beats, 0);
        }
      }
      assert.ok(Math.abs(nextBarAt - (3.25 + (elapsedBeats * 60) / bpm)) < 1e-8);
    }
  }
});

test('metronome rejects invalid tempos before scheduling clicks', () => {
  const bar = { events: [{ chord: 'G', beats: 4 }] };
  for (const bpm of [0, -1, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
    assert.throws(() => scheduleChartMetronome(bar, simpleChart, 0, bpm), {
      name: 'RangeError',
      message: 'Andamento inválido.',
    });
  }
});
