import assert from 'node:assert/strict';
import test from 'node:test';
import { frequency, playTone, soundChord } from '../src/components/music/audio';

type Ramp = { kind: 'set' | 'linear' | 'exponential' | 'target'; value: number; at: number };
interface Voice {
  frequency: { value: number };
  startAt?: number;
  stops: number[];
  ramps: Ramp[];
}
const voices: Voice[] = [];
const clock = { now: 5 };

class FakeAudioContext {
  get currentTime() {
    return clock.now;
  }
  destination = {};
  resume() {
    return Promise.resolve();
  }
  createOscillator() {
    const voice: Voice = { frequency: { value: 0 }, stops: [], ramps: [] };
    voices.push(voice);
    return {
      frequency: voice.frequency,
      type: 'triangle',
      connect() {},
      disconnect() {},
      start(at: number) {
        voice.startAt = at;
      },
      stop(at: number) {
        voice.stops.push(at);
      },
    };
  }
  createGain() {
    const voice = voices.at(-1)!;
    return {
      gain: {
        setValueAtTime(value: number, at: number) {
          voice.ramps.push({ kind: 'set', value, at });
        },
        linearRampToValueAtTime(value: number, at: number) {
          voice.ramps.push({ kind: 'linear', value, at });
        },
        exponentialRampToValueAtTime(value: number, at: number) {
          voice.ramps.push({ kind: 'exponential', value, at });
        },
        setTargetAtTime(value: number, at: number) {
          voice.ramps.push({ kind: 'target', value, at });
        },
        cancelScheduledValues() {},
      },
      connect() {},
      disconnect() {},
    };
  }
}

function close(actual: number | undefined, expected: number) {
  assert.ok(
    actual !== undefined && Math.abs(actual - expected) < 1e-9,
    `${actual} !== ${expected}`,
  );
}

test('strum, envelope and cancellation respect the exact scheduled chord boundary', (t) => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');
  Object.defineProperty(globalThis, 'AudioContext', {
    configurable: true,
    value: FakeAudioContext,
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, 'AudioContext', original);
    else Reflect.deleteProperty(globalThis, 'AudioContext');
  });
  const first = voices.length;
  const stop = soundChord([null, null, 0, 2, 3, 2], 2, 10);
  const chord = voices.slice(first);
  assert.equal(chord.length, 4);
  close(chord[0].startAt, 10);
  assert.equal(chord[0].frequency.value, frequency(50));
  chord.forEach((voice, index) => {
    close(voice.startAt, 10 + index * 0.022);
    close(voice.stops[0], 12);
    assert.deepEqual(voice.ramps.at(-1), { kind: 'linear', value: 0, at: 12 });
    assert.ok(voice.ramps.every((ramp, i) => i === 0 || ramp.at >= voice.ramps[i - 1].at));
  });
  stop();
  assert.ok(chord.every((voice) => voice.stops.length === 2));

  const beforeShort = voices.length;
  soundChord([0, 2, 2, 1, 0, 0], 0.003, 20);
  const short = voices.slice(beforeShort);
  assert.equal(short.length, 6, 'a resume near the boundary retains every sounding string');
  short.forEach((voice) => {
    assert.ok(voice.startAt! >= 20 && voice.startAt! < 20.003);
    close(voice.stops[0], 20.003);
    assert.ok(voice.ramps.every((ramp, i) => i === 0 || ramp.at >= voice.ramps[i - 1].at));
  });

  const beforeInvalid = voices.length;
  for (const duration of [0, -1, NaN, Infinity]) {
    soundChord([0, 2, 2, 1, 0, 0], duration)();
    playTone(440, duration)();
  }
  assert.equal(voices.length, beforeInvalid);
});
