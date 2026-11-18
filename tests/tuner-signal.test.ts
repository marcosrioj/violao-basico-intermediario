import assert from 'node:assert/strict';
import test from 'node:test';
import {
  effectiveSignalFloor,
  estimateNoiseFloor,
  measureSignal,
  signalDb,
  signalLevel,
  trackPitch,
  tunerFftSize,
  TUNER_SENSITIVITY_PROFILES,
} from '../src/components/music/tuner-signal';

const balanced = TUNER_SENSITIVITY_PROFILES.balanced;

test('quiet input metering preserves weak signals and ignores DC offset', () => {
  const samples = Float32Array.from(
    { length: 4800 },
    (_, index) => 0.02 + 0.0002 * Math.sin((2 * Math.PI * 100 * index) / 48000),
  );
  const measured = measureSignal(samples);
  assert.ok(Math.abs(measured.rms - 0.0002 / Math.SQRT2) < 0.00000001);
  assert.equal(measured.clipped, false);
  assert.ok(signalLevel(measured.rms) > 0.1, 'quiet strings remain visible on the meter');
  assert.ok(Math.abs(signalDb(0.001) + 60) < 0.0001);
  assert.equal(signalLevel(0), 0);
  assert.equal(signalLevel(1), 1);
  assert.equal(signalLevel(Number.NaN), 0);
});

test('raw overload is detected even when DC removal would produce silence', () => {
  assert.deepEqual(measureSignal(new Float32Array(8192).fill(1)), { rms: 0, clipped: true });
  assert.deepEqual(measureSignal(new Float32Array()), { rms: 0, clipped: false });
  assert.equal(measureSignal(new Float32Array([0, Number.NaN])).clipped, true);
  const shortTransient = new Float32Array(8192);
  shortTransient[0] = 1;
  assert.equal(measureSignal(shortTransient).clipped, false);
  shortTransient.fill(1, 0, 50);
  assert.equal(measureSignal(shortTransient).clipped, true);
});

test('soft capture lowers the gate while requiring stronger and longer pitch agreement', () => {
  const soft = TUNER_SENSITIVITY_PROFILES.soft;
  const noisy = TUNER_SENSITIVITY_PROFILES.noisy;
  assert.ok(soft.minRms < balanced.minRms);
  assert.ok(soft.minClarity > balanced.minClarity);
  assert.ok(soft.frames > balanced.frames);
  assert.ok(noisy.minRms > balanced.minRms);
  assert.ok(noisy.minClarity >= soft.minClarity);
  assert.equal(effectiveSignalFloor(soft, null), soft.minRms);
  assert.equal(effectiveSignalFloor(balanced, 0.00001), balanced.minRms);
  assert.equal(effectiveSignalFloor(soft, 0.002), 0.004);
});

test('noise calibration accepts a steady background including hum', () => {
  const frames = Array.from({ length: 28 }, (_, index) => ({
    rms: 0.002 * (1 + 0.05 * Math.sin(index)),
    clipped: false,
  }));
  const floor = estimateNoiseFloor(frames);
  assert.ok(floor !== null && floor >= 0.002 && floor < 0.0021);
  const hum = Float32Array.from(
    { length: 4800 },
    (_, index) => 0.002 * Math.sin((2 * Math.PI * 60 * index) / 48000),
  );
  assert.ok(estimateNoiseFloor(Array.from({ length: 28 }, () => measureSignal(hum))) !== null);
  assert.equal(
    estimateNoiseFloor(Array.from({ length: 28 }, () => ({ rms: 0, clipped: false }))),
    0.000001,
  );
});

test('noise calibration rejects clipped, short, changing or interrupted measurements', () => {
  const steady = Array.from({ length: 28 }, () => ({ rms: 0.002, clipped: false }));
  assert.equal(estimateNoiseFloor(steady.slice(0, 11)), null);
  assert.equal(estimateNoiseFloor([...steady, { rms: 0.003, clipped: true }]), null);
  assert.equal(estimateNoiseFloor([...steady, { rms: Number.NaN, clipped: false }]), null);
  assert.equal(estimateNoiseFloor([...steady, { rms: 0.1, clipped: false }]), null);
  assert.equal(
    estimateNoiseFloor(
      steady.map((frame, index) => ({ ...frame, rms: index < 14 ? 0.001 : 0.02 })),
    ),
    null,
  );
});

test('pitch smoothing requires several agreeing frames and recovers a musical median', () => {
  const history: number[] = [];
  assert.equal(trackPitch(history, 110 * 2 ** (-2 / 1200), balanced), null);
  assert.equal(trackPitch(history, 110 * 2 ** (2 / 1200), balanced), null);
  const settled = trackPitch(history, 110, balanced);
  assert.ok(settled !== null && Math.abs(settled - 110) < 0.000001);
  const quietHistory: number[] = [];
  for (let index = 0; index < 4; index++) {
    assert.equal(trackPitch(quietHistory, 82.4069, TUNER_SENSITIVITY_PROFILES.soft), null);
  }
  assert.ok(trackPitch(quietHistory, 82.4069, TUNER_SENSITIVITY_PROFILES.soft));
});

test('silence and octave disagreement immediately invalidate the old pitch', () => {
  const history: number[] = [];
  for (let index = 0; index < 3; index++) trackPitch(history, 110, balanced);
  assert.equal(trackPitch(history, null, balanced), null);
  assert.equal(history.length, 0);
  for (let index = 0; index < 3; index++) trackPitch(history, 110, balanced);
  assert.equal(trackPitch(history, 220, balanced), null);
  assert.equal(history.length, 1);
  assert.equal(trackPitch(history, 220, balanced), null);
  assert.ok(Math.abs(trackPitch(history, 220, balanced)! - 220) < 0.000001);
  assert.equal(trackPitch(history, Number.NaN, balanced), null);
});

test('a shorter smoothing window discards all excess frames immediately', () => {
  const history: number[] = [];
  for (const cents of [-20, -10, 0, 10, 20]) {
    trackPitch(history, 110 * 2 ** (cents / 1200), TUNER_SENSITIVITY_PROFILES.soft);
  }
  assert.equal(history.length, 5);
  const settled = trackPitch(history, 110 * 2 ** (30 / 1200), balanced);
  assert.equal(history.length, 3);
  assert.ok(settled !== null);
  assert.ok(Math.abs(1200 * Math.log2(settled / 110) - 20) < 0.000001);
});

test('inconsistent nearby estimates stay unstable until the window agrees again', () => {
  const history: number[] = [];
  trackPitch(history, 110, balanced);
  trackPitch(history, 110 * 2 ** (30 / 1200), balanced);
  assert.equal(trackPitch(history, 110 * 2 ** (-30 / 1200), balanced), null);
  assert.equal(trackPitch(history, 110, balanced), null);
  assert.ok(trackPitch(history, 110, balanced));
});

test('analysis windows retain more than three periods at 45 Hz through 192 kHz', () => {
  for (const sampleRate of [44100, 48000, 96000, 176400, 192000]) {
    const size = tunerFftSize(sampleRate);
    assert.ok(size / sampleRate > 3 / 45, `window at ${sampleRate} Hz`);
    assert.ok(size <= 16384, 'avoid unnecessary buffering');
  }
});
