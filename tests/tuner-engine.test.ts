import assert from 'node:assert/strict';
import test from 'node:test';
import {
  centsBetween,
  detectPitch,
  frequencyForMidi,
  nearestMidi,
} from '../src/components/music/tuner-engine';

function signal(
  frequency: number,
  sampleRate = 48000,
  options: { harmonics?: number[]; offset?: number; noise?: number; decay?: number } = {},
) {
  const { harmonics = [0.4], offset = 0, noise = 0, decay = 0 } = options;
  let seed = 1001;
  return Float32Array.from({ length: 8192 }, (_, i) => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    let value = 0;
    for (let h = 0; h < harmonics.length; h++) {
      value += harmonics[h] * Math.sin((2 * Math.PI * frequency * (h + 1) * i) / sampleRate + h);
    }
    return value * Math.exp((-decay * i) / sampleRate) + offset + noise * (seed / 2 ** 31 - 1);
  });
}

test('open strings and dropped tunings resolve at the actual device sample rate', () => {
  for (const sampleRate of [44100, 48000, 96000]) {
    for (const midi of [36, 38, 40, 45, 50, 55, 59, 64]) {
      const expected = frequencyForMidi(midi);
      const result = detectPitch(signal(expected, sampleRate), sampleRate);
      assert.ok(result, `${expected} Hz at ${sampleRate}`);
      assert.ok(
        Math.abs(centsBetween(result.frequency, expected)) < 1,
        `${midi}: ${result.frequency}`,
      );
      assert.ok(result.clarity > 0.98);
    }
  }
});

test('signed cent readings preserve small sharp and flat differences', () => {
  for (const cents of [-38, -7, -2, 2, 7, 38]) {
    for (const midi of [40, 59, 64]) {
      const target = frequencyForMidi(midi, 442);
      const actual = target * 2 ** (cents / 1200);
      const result = detectPitch(signal(actual), 48000);
      assert.ok(result);
      const measured = centsBetween(result.frequency, target);
      assert.ok(Math.abs(measured - cents) < 1, `${midi}, ${cents}: ${measured}`);
      assert.equal(Math.sign(measured), Math.sign(cents));
    }
  }
});

test('a flat seventh string remains measurable at the lowest concert-pitch setting', () => {
  const target = frequencyForMidi(35, 400);
  for (const sampleRate of [44100, 48000, 96000]) {
    for (const cents of [-200, -100, -36, 0, 36]) {
      const frequency = target * 2 ** (cents / 1200);
      const frame = signal(frequency, sampleRate, {
        harmonics: [0.13, 0.5, 0.08, 0.04],
        noise: 0.015,
        decay: 2,
      });
      const result = detectPitch(frame, sampleRate);
      assert.ok(result, `B1 at A400, ${cents} cents, ${sampleRate} Hz`);
      assert.ok(Math.abs(centsBetween(result.frequency, target) - cents) < 2);
    }
  }
});

test('8192-sample frames cover the extended low range without accepting unpitched noise', () => {
  for (const sampleRate of [44100, 48000, 96000]) {
    for (const frequency of [45.5, 49, 50, 54.9]) {
      const result = detectPitch(signal(frequency, sampleRate), sampleRate);
      assert.ok(result, `${frequency} Hz at ${sampleRate}`);
      assert.ok(Math.abs(centsBetween(result.frequency, frequency)) < 1);
    }
    const noise = signal(49, sampleRate, { harmonics: [], noise: 0.4 });
    const buriedNote = signal(49, sampleRate, { harmonics: [0.003], noise: 0.05 });
    assert.equal(detectPitch(noise, sampleRate), null);
    assert.equal(detectPitch(buriedNote, sampleRate), null);
  }
});

test('guitar-like decays and a stronger second partial retain the fundamental', () => {
  for (const sampleRate of [44100, 48000, 96000]) {
    for (const midi of [38, 40, 45, 50, 55, 59, 64]) {
      const expected = frequencyForMidi(midi);
      const frame = signal(expected, sampleRate, {
        harmonics: [0.13, 0.5, 0.08, 0.04, 0.015],
        decay: 2,
        noise: 0.015,
        offset: 0.1,
      });
      const result = detectPitch(frame, sampleRate);
      assert.ok(result, `harmonics ${midi} at ${sampleRate}`);
      assert.ok(
        Math.abs(centsBetween(result.frequency, expected)) < 2,
        `${midi}: ${result.frequency}`,
      );
    }
  }
});

test('upper fretted notes are not replaced by a subharmonic', () => {
  for (const frequency of [440, 659.255, 880, 1108.73, 1318.51, 1390]) {
    for (const sampleRate of [44100, 48000, 96000]) {
      const result = detectPitch(signal(frequency, sampleRate), sampleRate);
      assert.ok(result, `${frequency} Hz`);
      assert.ok(
        Math.abs(centsBetween(result.frequency, frequency)) < 3,
        `${frequency}: ${result.frequency}`,
      );
    }
  }
});

test('fractional periods in upper notes keep a loud second harmonic in the correct octave', () => {
  for (const midi of [82, 85, 86, 88]) {
    for (const sampleRate of [44100, 48000, 96000]) {
      const frequency = frequencyForMidi(midi) * 2 ** (13 / 1200);
      const frame = signal(frequency, sampleRate, { harmonics: [0.12, 0.65, 0.07] });
      const result = detectPitch(frame, sampleRate);
      assert.ok(result);
      assert.ok(Math.abs(centsBetween(result.frequency, frequency)) < 1);
    }
  }
});

test('silence, constant DC, quiet signals and unpitched noise produce no note', () => {
  const frames = [
    new Float32Array(8192),
    new Float32Array(8192).fill(0.5),
    signal(110, 48000, { harmonics: [0.0001] }),
    signal(110, 48000, { harmonics: [], noise: 0.4 }),
  ];
  for (const frame of frames) assert.equal(detectPitch(frame, 48000), null);
});

test('out-of-range tones do not masquerade as an in-range harmonic', () => {
  for (const frequency of [20, 30, 40, 1600, 2200, 3000]) {
    assert.equal(detectPitch(signal(frequency), 48000), null, `${frequency} Hz`);
  }
});

test('rejects invalid frames without mutating the audio samples', () => {
  for (const sampleRate of [NaN, Infinity, 0, -48000, 1000]) {
    assert.equal(detectPitch(signal(110), sampleRate), null);
  }
  for (const frame of [
    new Float32Array(0),
    new Float32Array(64),
    new Float32Array(8192).fill(NaN),
  ]) {
    assert.equal(detectPitch(frame, 48000), null);
  }
  const frame = signal(110, 48000, { offset: 0.2 });
  const copy = frame.slice();
  assert.ok(detectPitch(frame, 48000));
  assert.deepEqual(frame, copy);
});

test('concert pitch and octave calculations use equal temperament', () => {
  assert.equal(frequencyForMidi(69), 440);
  assert.equal(frequencyForMidi(69, 442), 442);
  assert.equal(frequencyForMidi(57), 220);
  assert.equal(nearestMidi(442, 442), 69);
  assert.equal(nearestMidi(frequencyForMidi(40)), 40);
  assert.equal(centsBetween(440, 220), 1200);
  assert.equal(centsBetween(220, 440), -1200);
});
