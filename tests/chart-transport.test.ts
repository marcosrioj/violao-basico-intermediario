import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChartBar, SongVersion } from '../src/content/types';
import { songs } from '../src/content/course';
import {
  ChartTransport,
  idlePosition,
  type PlaybackPosition,
} from '../src/components/music/chart-transport';

const bar = (chord: string, beats = 4): ChartBar => ({ events: [{ chord, beats }] });

function chart(bars: ChartBar[], meter = '4/4', pulses = 4): SongVersion {
  return {
    key: 'D',
    meter,
    beats_per_bar: pulses,
    beat_unit: meter === '6/8' ? 'dotted-quarter' : 'quarter',
    adaptations: '',
    sections: [{ id: 'A', title: 'Trecho', bars }],
    order: [{ section: 'A', repeat: 1 }],
  };
}

interface RecordedVoice {
  kind: 'chord' | 'click';
  name?: string;
  duration?: number;
  frequency?: number;
  volume?: number;
  at: number;
  stops: number;
}

function fixture(
  bars: ChartBar[],
  options: { meter?: string; pulses?: number; bpm?: number } = {},
) {
  let now = 0;
  const voices: RecordedVoice[] = [];
  const positions: PlaybackPosition[] = [];
  const record = (voice: Omit<RecordedVoice, 'stops'>) => {
    const entry = { ...voice, stops: 0 };
    voices.push(entry);
    return () => entry.stops++;
  };
  const transport = new ChartTransport(
    bars,
    chart(bars, options.meter, options.pulses),
    options.bpm ?? 60,
    {
      now: () => now,
      chord: (name, duration, at) => record({ kind: 'chord', name, duration, at }),
      click: (frequency, volume, at) => record({ kind: 'click', frequency, volume, at }),
    },
    (position) => positions.push(position),
  );
  return {
    transport,
    wholeRange: bars.length ? { startBar: 0, endBar: bars.length } : null,
    voices,
    positions,
    chords: () => voices.filter((voice) => voice.kind === 'chord'),
    clicks: () => voices.filter((voice) => voice.kind === 'click'),
    position: () => positions.at(-1) ?? idlePosition,
    time(value: number) {
      now = value;
    },
    step(value: number) {
      now = value;
      transport.tick();
    },
  };
}

function close(actual: number | undefined, expected: number) {
  assert.equal(typeof actual, 'number');
  assert.ok(Math.abs(actual! - expected) < 1e-8, `${actual} should equal ${expected}`);
}

test('one clock schedules harmony once and does not move the visual cursor into look-ahead', () => {
  const f = fixture([bar('D'), bar('G')]);
  f.transport.play();
  close(f.chords()[0].at, 0.04);
  close(f.chords()[0].duration, 4);
  f.transport.tick();
  f.transport.play();
  assert.equal(f.chords().length, 1);
  assert.equal(f.positions.length, 1, 'unchanged positions are not published repeatedly');

  f.step(3.99);
  assert.deepEqual(
    f.chords().map((voice) => voice.name),
    ['D', 'G'],
  );
  close(f.chords()[1].at, 4.04);
  assert.deepEqual(f.position(), { status: 'playing', bar: 0, tick: -1 });
  f.step(4.05);
  assert.deepEqual(f.position(), { status: 'playing', bar: 1, tick: -1 });
  assert.equal(f.chords().length, 2);
});

test('loop and metronome options preserve playing chords; disabling clicks cancels only clicks', () => {
  const f = fixture([bar('D'), bar('G')]);
  f.transport.play();
  const harmony = f.chords()[0];
  f.step(1.29);
  f.transport.setLoopRange(f.wholeRange);
  f.transport.setMetronome(true);
  assert.equal(f.clicks().length, 0, 'enabling between beats does not replay the last click');
  assert.deepEqual(f.position(), { status: 'playing', bar: 0, tick: 1 });

  f.step(1.99);
  assert.equal(f.clicks().length, 1);
  close(f.clicks()[0].at, 2.04);
  f.transport.setMetronome(false);
  f.transport.setLoopRange(null);
  assert.equal(f.clicks()[0].stops, 1, 'a click already scheduled ahead must be cancelled');
  assert.equal(harmony.stops, 0);
  assert.equal(f.chords().length, 1);
  assert.deepEqual(f.position(), { status: 'playing', bar: 0, tick: -1 });

  f.transport.setMetronome(true);
  close(f.clicks()[1].at, 2.04);
  f.transport.tick();
  assert.equal(f.clicks().length, 2, 'the replacement future click is not duplicated');
  assert.equal(harmony.stops, 0);
});

test('turning repeat off at the loop boundary cancels the prefetched next cycle, not this chord', () => {
  const f = fixture([bar('D', 2)], { meter: '2/4', pulses: 2 });
  f.transport.setLoopRange(f.wholeRange);
  f.transport.setMetronome(true);
  f.transport.play();
  const current = f.chords()[0];
  f.step(1.99);
  assert.equal(f.chords().length, 2);
  close(f.chords()[1].at, 2.04);
  const nextClick = f.clicks().find((voice) => Math.abs(voice.at - 2.04) < 1e-8)!;
  assert.ok(nextClick);

  f.transport.setLoopRange(null);
  assert.equal(current.stops, 0);
  assert.equal(f.chords()[1].stops, 1);
  assert.equal(nextClick.stops, 1);
  f.step(2.05);
  assert.deepEqual(f.position(), idlePosition);
  assert.equal(f.chords().length, 2, 'the cancelled next cycle is not rescheduled');
  assert.equal(current.stops, 1);
});

test('pause freezes a fractional chord position and resume plays only the remaining harmony', () => {
  const f = fixture([
    {
      events: [
        { chord: 'D', beats: 1.5 },
        { chord: 'G', beats: 2.5 },
      ],
    },
    bar('Am'),
  ]);
  f.transport.setMetronome(true);
  f.transport.play();
  f.step(1.79);
  f.transport.pause();
  assert.deepEqual(f.position(), { status: 'paused', bar: 0, tick: 3 });
  assert.equal(f.chords().at(-1)!.stops, 1);
  const voiceCount = f.voices.length;
  f.step(40);
  assert.equal(f.voices.length, voiceCount);
  assert.equal(f.position().status, 'paused');

  f.transport.play();
  const resumed = f.chords().at(-1)!;
  assert.equal(resumed.name, 'G');
  close(resumed.at, 40.04);
  close(resumed.duration, 2.25);
  assert.deepEqual(f.position(), { status: 'playing', bar: 0, tick: 3 });
  f.step(42.22);
  const next = f.chords().at(-1)!;
  assert.equal(next.name, 'Am');
  close(next.at, 42.29);
  close(next.duration, 4);
});

test('starting from a later occurrence uses its absolute bar index and clears previous audio', () => {
  const chorus = bar('G');
  const f = fixture([bar('D'), chorus, bar('Am'), chorus]);
  f.transport.setMetronome(true);
  f.transport.play();
  const previous = [...f.voices];
  f.time(1);
  f.transport.play(3);
  assert.ok(previous.every((voice) => voice.stops === 1));
  assert.deepEqual(f.position(), { status: 'playing', bar: 3, tick: 0 });
  assert.equal(f.chords().at(-1)!.name, 'G');
  close(f.chords().at(-1)!.at, 1.04);
  f.step(5.05);
  assert.deepEqual(f.position(), idlePosition);
  assert.equal(f.chords().length, 2, 'a later occurrence does not replay the earlier chorus');
});

test('stop resets the sequence and disposal cancels scheduled voices and prevents revival', () => {
  const f = fixture([bar('D'), bar('G')]);
  f.transport.setMetronome(true);
  f.transport.play();
  f.transport.stop();
  assert.deepEqual(f.position(), idlePosition);
  assert.ok(f.voices.every((voice) => voice.stops === 1));
  f.time(5);
  f.transport.play();
  assert.equal(f.position().bar, 0);
  close(f.chords().at(-1)!.at, 5.04);
  f.step(8.99);
  const pending = f.voices.filter(
    (voice) => voice.stops === 0 && voice.at + (voice.duration ?? 0.045) + 0.2 >= 8.99,
  );
  assert.ok(pending.some((voice) => voice.at > 8.99));
  f.transport.dispose();
  assert.ok(pending.every((voice) => voice.stops === 1));
  const counts = [f.voices.length, f.positions.length];
  f.transport.dispose();
  f.transport.play(1);
  f.transport.setMetronome(true);
  f.transport.setLoopRange(f.wholeRange);
  f.transport.pause();
  f.transport.stop();
  f.step(100);
  assert.deepEqual([f.voices.length, f.positions.length], counts);
  assert.ok(
    pending.every((voice) => voice.stops === 1),
    'dispose is idempotent',
  );
});

test('a delayed timer skips stale clicks and chords and resumes the current chord once', () => {
  const f = fixture([bar('D'), bar('G'), bar('Am'), bar('C')]);
  f.transport.setLoopRange(f.wholeRange);
  f.transport.setMetronome(true);
  f.transport.play();
  f.step(38.39);
  assert.deepEqual(
    f.chords().map((voice) => voice.name),
    ['D', 'G'],
  );
  const resumed = f.chords()[1];
  close(resumed.at, 38.39);
  close(resumed.duration, 1.65);
  assert.equal(f.clicks().length, 1, 'missed cycles and beats must not flush in a burst');
  assert.deepEqual(f.position(), { status: 'playing', bar: 1, tick: 2 });
  f.transport.tick();
  assert.equal(f.chords().length, 2);
  f.step(38.99);
  assert.equal(f.clicks().length, 2);
  close(f.clicks()[1].at, 39.04);
});

test('6/8 schedules six subdivisions for two dotted-quarter pulses without rounding tempo', () => {
  const bpm = (56 * 2) / 3;
  const duration = 120 / bpm;
  const spacing = duration / 6;
  const f = fixture(
    [
      {
        events: [
          { chord: 'D', beats: 1 },
          { chord: 'G', beats: 1 },
        ],
      },
    ],
    { meter: '6/8', pulses: 2, bpm },
  );
  f.transport.setMetronome(true);
  f.transport.play();
  for (let tick = 1; tick < 6; tick++) f.step(0.04 + tick * spacing - 0.05);
  assert.equal(f.clicks().length, 6);
  f.clicks().forEach((voice, index) => close(voice.at, 0.04 + index * spacing));
  assert.deepEqual(
    f.clicks().map((voice) => voice.frequency),
    [1200, 550, 550, 800, 550, 550],
  );
  assert.deepEqual(
    f.clicks().map((voice) => voice.volume),
    [0.12, 0.035, 0.035, 0.08, 0.035, 0.035],
  );
  assert.deepEqual(
    f.chords().map((voice) => voice.name),
    ['D', 'G'],
  );
  close(f.chords()[0].duration, 60 / bpm);
  close(f.chords()[1].at, 0.04 + 60 / bpm);
  f.step(0.04 + duration + 0.001);
  assert.deepEqual(f.position(), idlePosition);
});

test('a local 2/4 bar retains the pulse duration and returns to 4/4 at the correct boundary', () => {
  const f = fixture([bar('D'), { ...bar('G', 2), meter: '2/4', beats_per_bar: 2 }, bar('Am')]);
  f.transport.setMetronome(true);
  f.transport.play();
  f.step(3.99);
  close(f.chords()[1].at, 4.04);
  close(f.chords()[1].duration, 2);
  f.step(5.99);
  close(f.chords()[2].at, 6.04);
  assert.deepEqual(f.position(), { status: 'playing', bar: 1, tick: 1 });
  f.step(6.05);
  assert.deepEqual(f.position(), { status: 'playing', bar: 2, tick: 0 });
  f.step(10.05);
  assert.deepEqual(f.position(), idlePosition);
});

test('pause before scheduled start, paused options and empty or invalid selections never leak audio', () => {
  const f = fixture([bar('D')]);
  f.transport.play();
  f.transport.pause();
  assert.equal(f.chords()[0].stops, 1);
  assert.deepEqual(f.position(), { status: 'paused', bar: 0, tick: -1 });
  f.transport.setMetronome(true);
  f.transport.setLoopRange(f.wholeRange);
  f.transport.setLoopRange(null);
  f.step(20);
  assert.equal(f.voices.length, 1);
  f.transport.play(-1);
  f.transport.play(10);
  assert.equal(f.voices.length, 1);
  assert.equal(f.position().status, 'paused');
  f.transport.play();
  close(f.chords().at(-1)!.duration, 4);
  close(f.chords().at(-1)!.at, 20.04);
  assert.equal(f.clicks().length, 1);

  const empty = fixture([]);
  empty.transport.setLoopRange(empty.wholeRange);
  empty.transport.setLoopRange(null);
  empty.transport.setMetronome(true);
  empty.transport.play();
  empty.transport.play(0);
  empty.step(10);
  empty.transport.pause();
  empty.transport.stop();
  empty.transport.dispose();
  assert.equal(empty.voices.length, 0);
  assert.equal(empty.positions.length, 0);
});

test('arming a two-bar passage while idle is silent and play loops only that passage', () => {
  const f = fixture([bar('D'), bar('G'), bar('Am'), bar('C')]);
  f.transport.setLoopRange({ startBar: 1, endBar: 3 });
  assert.equal(f.voices.length, 0);
  assert.deepEqual(f.position(), idlePosition);
  f.transport.play();
  assert.equal(f.position().bar, 1);
  close(f.chords()[0].at, 0.04);
  for (const at of [3.99, 7.99, 11.99, 15.99]) f.step(at);
  assert.deepEqual(
    f.chords().map((voice) => voice.name),
    ['G', 'Am', 'G', 'Am', 'G'],
  );
  f.chords().forEach((voice, i) => close(voice.at, 0.04 + i * 4));
  f.step(16.05);
  assert.equal(f.position().bar, 1);
});

test('arming the current or a future passage preserves harmony and reaches its loop naturally', () => {
  const f = fixture([bar('D'), bar('G'), bar('Am'), bar('C')]);
  f.transport.play();
  f.step(1.29);
  const initial = f.chords()[0];
  f.transport.setLoopRange({ startBar: 1, endBar: 3 });
  assert.equal(initial.stops, 0);
  assert.equal(f.chords().length, 1);
  assert.equal(f.position().bar, 0);
  f.step(3.99);
  f.step(4.29);
  const current = f.chords().at(-1)!;
  f.transport.setLoopRange({ startBar: 1, endBar: 2 });
  assert.equal(current.stops, 0);
  assert.equal(f.chords().length, 2);
  for (const at of [7.99, 11.99]) f.step(at);
  assert.deepEqual(
    f.chords().map((voice) => voice.name),
    ['D', 'G', 'G', 'G'],
  );
});

test('a later repeated passage uses absolute indexes, and disabling after several loops continues the score', () => {
  const f = fixture([bar('D'), bar('G'), bar('Am'), bar('G'), bar('C')]);
  f.transport.setLoopRange({ startBar: 3, endBar: 4 });
  f.transport.play();
  assert.equal(f.position().bar, 3);
  for (const at of [3.99, 7.99, 11.99]) f.step(at);
  f.step(12.49);
  const current = f.chords().at(-1)!;
  const before = f.chords().length;
  f.transport.setLoopRange(null);
  assert.equal(current.stops, 0);
  assert.equal(f.chords().length, before);
  assert.equal(f.position().bar, 3);
  f.step(15.99);
  assert.equal(f.chords().at(-1)!.name, 'C');
  close(f.chords().at(-1)!.at, 16.04);
  f.step(16.05);
  assert.equal(f.position().bar, 4);
  f.step(20.05);
  assert.deepEqual(f.position(), idlePosition);
  assert.ok(f.chords().every((voice) => voice.name === 'G' || voice.name === 'C'));
});

test('disabling a passage in look-ahead cancels the next loop and schedules its successor', () => {
  const f = fixture([bar('D'), bar('G'), bar('Am')]);
  f.transport.setLoopRange({ startBar: 1, endBar: 2 });
  f.transport.setMetronome(true);
  f.transport.play();
  const current = f.chords()[0];
  f.step(3.99);
  const nextLoop = f.chords()[1];
  const nextClick = f.clicks().find((voice) => Math.abs(voice.at - 4.04) < 1e-8)!;
  assert.ok(nextClick);
  assert.equal(nextLoop.name, 'G');
  f.transport.setLoopRange(null);
  assert.equal(current.stops, 0);
  assert.equal(nextLoop.stops, 1);
  assert.equal(nextClick.stops, 1);
  assert.equal(f.chords().at(-1)!.name, 'Am');
  close(f.chords().at(-1)!.at, 4.04);
  f.step(4.05);
  assert.equal(f.position().bar, 2);
  f.step(8.05);
  assert.deepEqual(f.position(), idlePosition);
});

test('changing from a short passage to a longer passage preserves the clock and the current chord', () => {
  const f = fixture([bar('D'), bar('G'), bar('Am'), bar('C')]);
  f.transport.setLoopRange({ startBar: 1, endBar: 2 });
  f.transport.play();
  f.step(1.29);
  const current = f.chords()[0];
  f.transport.setLoopRange({ startBar: 2, endBar: 3 });
  f.transport.setMetronome(true);
  f.transport.setMetronome(false);
  assert.equal(current.stops, 0);
  assert.equal(f.chords().length, 1);
  assert.equal(f.position().bar, 1);
  f.step(3.99);
  f.step(7.99);
  assert.deepEqual(
    f.chords().map((voice) => voice.name),
    ['G', 'Am', 'Am'],
  );
  f.step(8.29);
  const looped = f.chords().at(-1)!;
  f.transport.setLoopRange(f.wholeRange);
  assert.equal(looped.stops, 0);
  f.step(11.99);
  assert.equal(f.chords().at(-1)!.name, 'C');
  f.step(15.99);
  assert.equal(f.chords().at(-1)!.name, 'D');
  f.transport.stop();
  f.transport.play();
  assert.equal(f.position().bar, 0, 'the longer passage replaces the previously armed range');
});

test('a passed passage waits for the next start instead of jumping backward', () => {
  const f = fixture([bar('D'), bar('G'), bar('Am')]);
  f.transport.play(2);
  f.step(1.29);
  const current = f.chords()[0];
  f.transport.setLoopRange({ startBar: 0, endBar: 1 });
  assert.equal(current.stops, 0);
  assert.equal(f.position().bar, 2);
  f.step(4.05);
  assert.deepEqual(f.position(), idlePosition);
  assert.equal(f.chords().length, 1);
  f.transport.play();
  assert.equal(f.position().bar, 0);
  assert.equal(f.chords().at(-1)!.name, 'D');
});

test('pause and resume preserve a fractional position inside a repeated passage', () => {
  const f = fixture([
    bar('D'),
    {
      events: [
        { chord: 'G', beats: 1.5 },
        { chord: 'Am', beats: 2.5 },
      ],
    },
    bar('C'),
  ]);
  f.transport.setLoopRange({ startBar: 1, endBar: 2 });
  f.transport.setMetronome(true);
  f.transport.play();
  f.step(3.99);
  f.step(5.79);
  f.transport.pause();
  assert.deepEqual(f.position(), { status: 'paused', bar: 1, tick: 3 });
  const before = f.voices.length;
  f.step(40);
  f.transport.setMetronome(false);
  f.transport.setMetronome(true);
  assert.equal(f.voices.length, before);
  f.transport.play();
  assert.equal(f.chords().at(-1)!.name, 'Am');
  close(f.chords().at(-1)!.duration, 2.25);
  close(f.chords().at(-1)!.at, 40.04);
  f.step(42.22);
  assert.equal(f.chords().at(-1)!.name, 'G');
  close(f.chords().at(-1)!.at, 42.29);
  assert.ok(f.chords().every((voice) => voice.name === 'G' || voice.name === 'Am'));
});

test('passage boundaries preserve compound subdivisions and local meter changes', () => {
  const bpm = 56 / 1.5;
  const duration = 120 / bpm;
  const f = fixture(
    [bar('D', 2), { ...bar('G', 2), meter: '2/4', beats_per_bar: 2 }, bar('Am', 2)],
    { meter: '6/8', pulses: 2, bpm },
  );
  f.transport.setLoopRange({ startBar: 0, endBar: 2 });
  f.transport.setMetronome(true);
  f.transport.play();
  for (let tick = 1; tick < 6; tick++) f.step(0.04 + (tick * duration) / 6 - 0.05);
  f.step(0.04 + duration - 0.05);
  f.step(0.04 + duration * 1.5 - 0.05);
  f.step(0.04 + duration * 2 - 0.05);
  assert.deepEqual(
    f.chords().map((voice) => voice.name),
    ['D', 'G', 'D'],
  );
  f.chords().forEach((voice, i) => close(voice.at, 0.04 + i * duration));
  assert.deepEqual(
    f.clicks().map((voice) => voice.frequency),
    [1200, 550, 550, 800, 550, 550, 1200, 800, 1200],
  );
  f.step(0.04 + duration * 2 + 0.01);
  assert.deepEqual(f.position(), { status: 'playing', bar: 0, tick: 0 });
});

test('invalid passage ranges are rejected without altering playback', () => {
  const f = fixture([bar('D'), bar('G')]);
  f.transport.play();
  for (const range of [
    { startBar: -1, endBar: 1 },
    { startBar: 0, endBar: 3 },
    { startBar: 1, endBar: 1 },
    { startBar: 0.5, endBar: 2 },
    { startBar: 0, endBar: NaN },
  ]) {
    assert.throws(() => f.transport.setLoopRange(range), { name: 'RangeError' });
  }
  assert.equal(f.chords().length, 1);
  assert.equal(f.chords()[0].stops, 0);
  assert.equal(f.position().bar, 0);
});

test('continuous snapshot follows fractional audio-clock beats even with silent metronome', () => {
  const f = fixture([bar('D'), { ...bar('G', 2), meter: '2/4', beats_per_bar: 2 }, bar('Am')], {
    bpm: 120,
  });
  assert.deepEqual(f.transport.snapshot(), {
    ...idlePosition,
    waitingForAudio: false,
    beat: -1,
    scoreSeconds: 0,
    durationSeconds: 5,
    elapsedSeconds: 0,
  });
  f.transport.play();
  assert.equal(f.transport.snapshot().waitingForAudio, true);
  f.time(0.039);
  assert.equal(f.transport.snapshot().waitingForAudio, true);
  f.time(0.04);
  assert.equal(f.transport.snapshot().waitingForAudio, false);
  const events = f.voices.length;
  f.time(0.79);
  let snapshot = f.transport.snapshot();
  assert.equal(snapshot.bar, 0);
  assert.equal(snapshot.tick, -1);
  close(snapshot.beat, 1.5);
  close(snapshot.scoreSeconds, 0.75);
  close(snapshot.elapsedSeconds, 0.75);
  assert.equal(f.voices.length, events, 'reading a frame does not schedule sound');
  assert.equal(f.positions.length, 1, 'continuous frames do not flood coarse position subscribers');

  f.time(2.29);
  snapshot = f.transport.snapshot();
  assert.equal(snapshot.bar, 1);
  close(snapshot.beat, 0.5);
  f.transport.pause();
  f.time(50);
  assert.deepEqual(f.transport.snapshot(), { ...snapshot, status: 'paused' });
  f.transport.play();
  assert.equal(
    f.transport.snapshot().waitingForAudio,
    true,
    'resume has its own scheduling lead-in',
  );
  f.time(50.29);
  snapshot = f.transport.snapshot();
  close(snapshot.scoreSeconds, 2.5);
  close(snapshot.elapsedSeconds, 2.5);
  close(snapshot.beat, 1);
  f.transport.stop();
  assert.equal(f.transport.snapshot().beat, -1);
  f.transport.dispose();
  assert.equal(f.transport.snapshot().status, 'idle');
});

test('snapshot tracks the exact occurrence through loops without counting skipped bars as elapsed', () => {
  const f = fixture([bar('D'), bar('G'), bar('Am'), bar('G'), bar('C')]);
  f.transport.setLoopRange({ startBar: 3, endBar: 4 });
  f.transport.play();
  close(f.transport.snapshot().scoreSeconds, 12);
  close(f.transport.snapshot().elapsedSeconds, 0);
  f.time(12.54);
  const looped = f.transport.snapshot();
  assert.equal(looped.bar, 3);
  close(looped.beat, 0.5);
  close(looped.scoreSeconds, 12.5);
  close(looped.elapsedSeconds, 12.5);
  f.transport.setLoopRange(null);
  f.time(16.29);
  const continued = f.transport.snapshot();
  assert.equal(continued.bar, 4);
  close(continued.beat, 0.25);
  close(continued.elapsedSeconds, 16.25);
  f.time(20.04);
  assert.equal(
    f.transport.snapshot().status,
    'idle',
    'frame ends even before the next scheduler tick',
  );
});

test('snapshot keeps compound fractional pulses and duration at noninteger tempos', () => {
  const bpm = 56 / 1.5;
  const f = fixture([bar('G', 2)], { meter: '6/8', pulses: 2, bpm });
  f.transport.play();
  f.time(0.04 + 60 / bpm / 3);
  const snapshot = f.transport.snapshot();
  close(snapshot.beat, 1 / 3);
  close(snapshot.durationSeconds, 120 / bpm);
  assert.equal(snapshot.tick, -1);
});

test('fractional-tempo loop boundaries remain readable without another scheduling lead-in', () => {
  const bpm = 56 / 1.5;
  const length = 120 / bpm;
  const f = fixture([bar('D', 2), bar('G', 2), bar('Am', 2)], {
    meter: '6/8',
    pulses: 2,
    bpm,
  });
  f.transport.setLoopRange({ startBar: 1, endBar: 3 });
  f.transport.play();
  for (const cycle of [1, 2, 17, 1000]) {
    for (const delta of [-0.000001, 0, 0.000001]) {
      f.time(0.04 + cycle * 2 * length + delta);
      const snapshot = f.transport.snapshot();
      assert.equal(snapshot.status, 'playing');
      assert.equal(snapshot.waitingForAudio, false);
      assert.ok(snapshot.bar === 1 || snapshot.bar === 2);
      assert.ok(snapshot.beat >= 0 && snapshot.beat < 2);
    }
  }
  f.transport.setLoopRange(null);
  const remaining = 3 * length - f.transport.snapshot().scoreSeconds;
  f.time(0.04 + 1000 * 2 * length + 0.000001 + remaining + 1e-8);
  assert.doesNotThrow(() => f.transport.snapshot());
  assert.equal(f.transport.snapshot().status, 'idle');
});

test('every course arrangement plays each written repeat in order and ends without an extra cycle', () => {
  for (const song of Object.values(songs)) {
    for (const [version, score] of Object.entries(song.versions)) {
      const label = `${song.title} / ${version}`;
      const bars = score.order.flatMap((part) =>
        Array.from(
          { length: part.repeat },
          () => score.sections.find((section) => section.id === part.section)!.bars,
        ).flat(),
      );
      const bpm = score.practice_bpm ?? 73;
      const expected: { name: string; duration: number; at: number }[] = [];
      let duration = 0;
      for (const bar of bars)
        for (const event of bar.events) {
          const length = (event.beats * 60) / bpm;
          expected.push({ name: event.chord, duration: length, at: 0.04 + duration });
          duration += length;
        }
      let now = 0;
      const actual: typeof expected = [];
      const player = new ChartTransport(
        bars,
        score,
        bpm,
        {
          now: () => now,
          chord: (name, duration, at) => {
            actual.push({ name, duration, at });
            return () => {};
          },
          click: () => () => {},
        },
        () => {},
      );
      player.play();
      close(player.snapshot().durationSeconds, duration);
      for (const event of expected.slice(1)) {
        now = event.at - 0.05;
        player.tick();
        now = event.at + 0.001;
        player.tick();
      }
      now = 0.04 + duration - 0.001;
      player.tick();
      assert.equal(player.snapshot().status, 'playing', label);
      assert.equal(player.snapshot().bar, bars.length - 1, label);
      now += 0.002;
      player.tick();
      assert.equal(player.snapshot().status, 'idle', label);
      assert.equal(actual.length, expected.length, label);
      actual.forEach((event, index) => {
        assert.equal(event.name, expected[index].name, label);
        close(event.at, expected[index].at);
        close(event.duration, expected[index].duration);
      });
      player.dispose();
    }
  }
});
