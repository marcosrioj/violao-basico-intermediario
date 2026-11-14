import assert from 'node:assert/strict';
import test from 'node:test';
import type { ChartBar, SongVersion } from '../src/content/types';
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
  f.transport.setLoop(true);
  f.transport.setMetronome(true);
  assert.equal(f.clicks().length, 0, 'enabling between beats does not replay the last click');
  assert.deepEqual(f.position(), { status: 'playing', bar: 0, tick: 1 });

  f.step(1.99);
  assert.equal(f.clicks().length, 1);
  close(f.clicks()[0].at, 2.04);
  f.transport.setMetronome(false);
  f.transport.setLoop(false);
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
  f.transport.setLoop(true);
  f.transport.setMetronome(true);
  f.transport.play();
  const current = f.chords()[0];
  f.step(1.99);
  assert.equal(f.chords().length, 2);
  close(f.chords()[1].at, 2.04);
  const nextClick = f.clicks().find((voice) => Math.abs(voice.at - 2.04) < 1e-8)!;
  assert.ok(nextClick);

  f.transport.setLoop(false);
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
  f.transport.setLoop(true);
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
  f.transport.setLoop(true);
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
  f.transport.setLoop(true);
  f.transport.setLoop(false);
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
  empty.transport.setLoop(true);
  empty.transport.setLoop(false);
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
