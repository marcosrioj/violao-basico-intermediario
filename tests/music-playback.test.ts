import assert from 'node:assert/strict';
import test from 'node:test';
import { scheduleChartBar } from '../src/components/music/chart-timing';
test('chart uses absolute targets and fractional pulses', () => {
  const first = scheduleChartBar({ events: [{ chord: 'G', beats: 1.5 }, { chord: 'D', beats: 1.5 }, { chord: 'A', beats: 1 }] }, 10, 60);
  assert.deepEqual(first.events.map(e => e.at), [10, 11.5, 13]);
  assert.deepEqual(first.events.map(e => e.duration), [1.5, 1.5, 1]);
  assert.equal(scheduleChartBar({ events: [{ chord: 'A', beats: 4 }] }, first.endAt, 60).endAt, 18);
});
test('two dotted-quarter pulses and a short 2/4 bar keep their durations', () => {
  const compound = scheduleChartBar({ events: [{ chord: 'G', beats: 2 }] }, 0, 60);
  assert.equal(compound.endAt, 2);
  assert.equal(scheduleChartBar({ events: [{ chord: 'G', beats: 2 }], beats_per_bar: 2, meter: '2/4' }, compound.endAt, 60).endAt, 4);
});
test('four pulses at 42 BPM are not truncated to two seconds', () => {
  const event = scheduleChartBar({ events: [{ chord: 'D', beats: 4 }] }, 0, 42).events[0];
  assert.ok(Math.abs(event.duration - 5.714285714285714) < 1e-9);
});
