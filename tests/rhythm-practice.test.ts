import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzePulseTaps,
  RHYTHM_TAP_COUNT,
} from '../src/components/music/rhythm-practice-analysis';
const taps = (interval: number, offset = 0) =>
  Array.from({ length: RHYTHM_TAP_COUNT }, (_, i) => offset + interval * i);

test('pulse recall ignores reaction time and measures steady target intervals', () => {
  assert.deepEqual(analyzePulseTaps(taps(1000, 10000), 60), analyzePulseTaps(taps(1000), 60));
  const result = analyzePulseTaps(taps(1000), 60)!;
  assert.equal(result.averageBpm, 60);
  assert.equal(result.tempo, 'near');
  assert.equal(result.regular, true);
  assert.equal(result.interrupted, false);
});
test('regular tapping and matching the model tempo are independent', () => {
  const fast = analyzePulseTaps(taps(600), 60)!;
  assert.equal(fast.tempo, 'faster');
  assert.equal(fast.regular, true);
  const slow = analyzePulseTaps(taps(1200), 60)!;
  assert.equal(slow.tempo, 'slower');
  assert.equal(slow.regular, true);
  assert.equal(analyzePulseTaps(taps(750), 80)!.tempo, 'near');
});
test('irregular intervals do not pass as regular just because average speed matches', () => {
  const times = [0, 700, 2000, 2700, 4000, 4700, 6000, 7000];
  const result = analyzePulseTaps(times, 60)!;
  assert.equal(result.averageBpm, 60);
  assert.equal(result.tempo, 'near');
  assert.equal(result.regular, false);
});
test('long pauses and double taps request a new attempt without hiding outliers', () => {
  const pause = analyzePulseTaps([0, 1000, 2000, 3000, 9000, 10000, 11000, 12000], 60)!;
  assert.equal(pause.interrupted, true);
  assert.equal(pause.intervals[3], 6000);
  assert.equal(
    analyzePulseTaps([0, 100, 1000, 2000, 3000, 4000, 5000, 6000], 60)!.interrupted,
    true,
  );
});
test('incomplete, invalid and non-monotonic tapping cannot produce feedback', () => {
  for (const invalid of [
    [],
    [0, 1000],
    taps(1000).slice(1),
    [...taps(1000), 8000],
    taps(0),
    [0, 1000, 2000, 3000, 2999, 5000, 6000, 7000],
    taps(NaN),
    taps(Infinity),
  ]) {
    assert.equal(analyzePulseTaps(invalid, 60), null);
  }
  for (const bpm of [0, -60, NaN, Infinity]) assert.equal(analyzePulseTaps(taps(1000), bpm), null);
});
