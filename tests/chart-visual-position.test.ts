import assert from 'node:assert/strict';
import test, { type TestContext } from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SongVersion } from '../src/content/types';
import {
  ChartTransport,
  type PlaybackPosition,
  type PlaybackSnapshot,
} from '../src/components/music/chart-transport';
import { createLyricsClock } from '../src/components/music/chart-lyrics-clock';
import { ChartPlaybackReadout } from '../src/components/music/chart-playback-readout';
import {
  idleVisualPosition,
  visualPlaybackPosition,
} from '../src/components/music/chart-visual-position';

function animationFrames(t: TestContext) {
  const oldFrame = globalThis.requestAnimationFrame;
  const oldCancel = globalThis.cancelAnimationFrame;
  const pending = new Map<number, FrameRequestCallback>();
  const cleanup: (() => void)[] = [];
  let nextId = 0;
  globalThis.requestAnimationFrame = (callback) => {
    pending.set(++nextId, callback);
    return nextId;
  };
  globalThis.cancelAnimationFrame = (id) => {
    pending.delete(id);
  };
  t.after(() => {
    cleanup.forEach((dispose) => dispose());
    globalThis.requestAnimationFrame = oldFrame;
    globalThis.cancelAnimationFrame = oldCancel;
  });
  return Object.assign(
    () => {
      const callbacks = [...pending.values()];
      pending.clear();
      callbacks.forEach((callback) => callback(0));
    },
    { after: (dispose: () => void) => cleanup.push(dispose) },
  );
}

function activeCue(row: string) {
  const entry = row.split(';').map((item) => item.split(':').map(Number));
  return entry.find((item) => item[3] >= 0)?.[0] ?? -1;
}

function fixture() {
  const bars = [{ events: [{ chord: 'D', beats: 4 }] }, { events: [{ chord: 'G', beats: 4 }] }];
  const chart: SongVersion = {
    key: 'D',
    meter: '4/4',
    beats_per_bar: 4,
    beat_unit: 'quarter',
    adaptations: '',
    sections: [{ id: 'A', title: 'Teste', bars }],
    order: [{ section: 'A', repeat: 1 }],
  };
  let now = 0;
  let published: PlaybackPosition = { status: 'idle', bar: -1, tick: -1 };
  const notes: { name: string; at: number }[] = [];
  const transport = new ChartTransport(
    bars,
    chart,
    60,
    {
      now: () => now,
      chord: (name, _duration, at) => {
        notes.push({ name, at });
        return () => {};
      },
      click: () => () => {},
    },
    (position) => {
      published = position;
    },
  );
  return {
    transport,
    notes,
    published: () => published,
    time: (value: number) => {
      now = value;
    },
  };
}

test('bar, readout and a short lyric change share the audio frame before the next 25 ms scheduler tick', (t) => {
  const frame = animationFrames(t);
  const f = fixture();
  const clock = createLyricsClock(
    [
      {
        id: 0,
        text: 'A',
        startBeat: 0,
        endBeat: 4,
        startBar: 0,
        endBar: 0,
        syllables: [{ from: 0, to: 1, startBeat: 0, endBeat: 4, timing: 'manual' }],
      },
      {
        id: 1,
        text: 'B',
        startBeat: 4,
        endBeat: 4.02,
        startBar: 1,
        endBar: 1,
        syllables: [{ from: 0, to: 1, startBeat: 4, endBeat: 4.02, timing: 'manual' }],
      },
    ],
    60,
  );
  let visual = idleVisualPosition;
  const end = clock.follow(
    true,
    () => f.transport.snapshot(),
    (snapshot) => {
      visual = visualPlaybackPosition(visual, snapshot);
    },
  );
  frame.after(() => {
    end();
    f.transport.dispose();
  });
  f.transport.play();
  frame();
  assert.equal(visual.bar, -1, 'no bar is shown as sounding during the scheduling lead-in');
  assert.equal(clock.rowSnapshot(0, 0), '');
  f.time(0.04);
  frame();
  assert.equal(visual.bar, 0);
  assert.equal(activeCue(clock.rowSnapshot(0, 0)), 0);

  f.time(3.99);
  f.transport.tick();
  assert.equal(f.notes[1].at, 4.04, 'the next chord is already scheduled on the audio clock');
  assert.equal(f.published().bar, 0);
  f.time(4.045);
  frame();
  assert.equal(f.published().bar, 0, 'coarse subscriber has not reached another scheduler tick');
  assert.equal(visual.bar, 1, 'the visible bar follows the new sounding chord immediately');
  assert.equal(activeCue(clock.rowSnapshot(1, 1)), 1, 'the 20 ms syllable uses that same frame');
  const readout = renderToStaticMarkup(
    React.createElement(ChartPlaybackReadout, {
      position: visual,
      duration: 8,
      bars: 2,
    }),
  );
  assert.ok(readout.includes('Compasso 2 de 2'));
  assert.ok(readout.includes('<strong>0:04</strong>'));

  f.time(4.061);
  frame();
  assert.equal(
    activeCue(clock.rowSnapshot(1, 1)),
    -1,
    'the short syllable completes without a scheduler tick',
  );
  assert.equal(visual.bar, 1);
});

test('visual playback works without lyrics and preserves pause, resume, passage loop and natural completion', (t) => {
  const frame = animationFrames(t);
  const f = fixture();
  const clock = createLyricsClock([], 60);
  let visual = idleVisualPosition;
  const receive = (snapshot: PlaybackSnapshot | null) => {
    visual = visualPlaybackPosition(visual, snapshot);
  };
  let end = clock.follow(true, () => f.transport.snapshot(), receive);
  frame.after(() => {
    end();
    f.transport.dispose();
  });
  f.transport.setLoopRange({ startBar: 1, endBar: 2 });
  f.transport.play();
  f.time(1.29);
  frame();
  assert.deepEqual(visual, { status: 'playing', bar: 1, tick: -1, seconds: 5 });
  f.transport.pause();
  end();
  end = clock.follow(false, () => f.transport.snapshot(), receive);
  frame();
  assert.deepEqual(visual, { status: 'paused', bar: 1, tick: -1, seconds: 5 });
  f.time(30);
  frame();
  assert.equal(visual.seconds, 5);

  f.transport.play();
  end();
  end = clock.follow(true, () => f.transport.snapshot(), receive);
  frame();
  assert.deepEqual(
    visual,
    { status: 'playing', bar: 1, tick: -1, seconds: 5 },
    'resume keeps the frozen bar during the short lead-in',
  );
  f.time(31.04);
  frame();
  assert.equal(visual.seconds, 6);
  f.time(32.8);
  frame();
  assert.equal(visual.seconds, 4, 'passage repetition returns to its written position');
  assert.equal(visual.bar, 1);
  f.transport.setLoopRange(null);
  f.time(36.8);
  frame();
  assert.equal(
    f.published().status,
    'playing',
    'the scheduler has not published its final stop yet',
  );
  assert.deepEqual(
    visual,
    idleVisualPosition,
    'completion clears the visible playhead on the audio frame',
  );
});

test('intermediate frames preserve visual state identity while bar, tick and displayed seconds change when needed', () => {
  const snapshot: PlaybackSnapshot = {
    status: 'playing',
    waitingForAudio: false,
    bar: 0,
    beat: 0.2,
    tick: -1,
    scoreSeconds: 0.2,
    durationSeconds: 8,
    elapsedSeconds: 0.2,
  };
  const initial = visualPlaybackPosition(idleVisualPosition, snapshot);
  assert.equal(
    visualPlaybackPosition(initial, { ...snapshot, beat: 0.8, scoreSeconds: 0.8 }),
    initial,
    'smooth lyric paint does not force the chart/readout to rerender every frame',
  );
  const counted = visualPlaybackPosition(initial, { ...snapshot, tick: 1 });
  assert.equal(counted.tick, 1);
  assert.notEqual(counted, initial);
  const nextSecond = visualPlaybackPosition(initial, { ...snapshot, scoreSeconds: 1.1 });
  assert.equal(nextSecond.seconds, 1);
  assert.equal(visualPlaybackPosition(idleVisualPosition, null), idleVisualPosition);
});
