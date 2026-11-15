import assert from 'node:assert/strict';
import test from 'node:test';
import { createLyricsClock } from '../src/components/music/chart-lyrics-clock';
import type { PlaybackSnapshot } from '../src/components/music/chart-transport';

function activeSyllable(
  clock: ReturnType<typeof createLyricsClock>,
  firstBar: number,
  lastBar: number,
) {
  const [cue, , , syllable] = clock.rowSnapshot(firstBar, lastBar).split(':').map(Number);
  return syllable >= 0 ? `${cue}:${syllable}` : '';
}

test('syllabic fill follows the audio clock continuously, respects rests and pauses, and cancels on unmount', (t) => {
  const oldFrame = globalThis.requestAnimationFrame;
  const oldCancel = globalThis.cancelAnimationFrame;
  const frames = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  globalThis.requestAnimationFrame = (callback) => {
    frames.set(++nextId, callback);
    return nextId;
  };
  globalThis.cancelAnimationFrame = (id) => {
    frames.delete(id);
  };
  t.after(() => {
    globalThis.requestAnimationFrame = oldFrame;
    globalThis.cancelAnimationFrame = oldCancel;
  });
  function frame() {
    const run = [...frames.values()];
    frames.clear();
    run.forEach((callback) => callback(0));
  }
  let snapshot: PlaybackSnapshot = {
    status: 'playing',
    bar: 0,
    beat: 0,
    tick: -1,
    scoreSeconds: 0,
    durationSeconds: 4,
    elapsedSeconds: 0,
    waitingForAudio: true,
  };
  const clock = createLyricsClock(
    [
      {
        id: 0,
        text: 'Santo',
        startBeat: 0,
        endBeat: 4,
        startBar: 0,
        endBar: 0,
        syllables: [
          { from: 0, to: 3, startBeat: 0, endBeat: 1, timing: 'manual' },
          { from: 3, to: 5, startBeat: 2, endBeat: 4, timing: 'manual' },
        ],
      },
    ],
    60,
  );
  let notifications = 0;
  clock.subscribe(() => notifications++);
  let stop = clock.follow(true, () => snapshot);
  frame();
  assert.equal(activeSyllable(clock, 0, 0), '');
  snapshot = { ...snapshot, waitingForAudio: false, scoreSeconds: 0.25 };
  frame();
  assert.equal(activeSyllable(clock, 0, 0), '0:0');
  const properties = new Map<string, string>();
  const detach = clock.paint(
    {
      style: { setProperty: (name: string, value: string) => properties.set(name, value) },
    } as unknown as HTMLElement,
    0,
    0,
  );
  assert.equal(properties.get('--karaoke-fill'), '25%');
  const before = notifications;
  snapshot = { ...snapshot, scoreSeconds: 0.75 };
  frame();
  assert.equal(properties.get('--karaoke-fill'), '75%');
  assert.equal(notifications, before, 'fill does not rerender React on every animation frame');
  snapshot = { ...snapshot, scoreSeconds: 1.5 };
  frame();
  assert.equal(activeSyllable(clock, 0, 0), '', 'vocal rest must not hold a false syllable');
  snapshot = { ...snapshot, scoreSeconds: 3 };
  frame();
  assert.equal(activeSyllable(clock, 0, 0), '0:1');
  stop();
  snapshot = { ...snapshot, status: 'paused' };
  stop = clock.follow(false, () => snapshot);
  frame();
  assert.equal(activeSyllable(clock, 0, 0), '0:1');
  assert.equal(frames.size, 0);
  stop();
  detach();
  snapshot = { ...snapshot, status: 'playing', scoreSeconds: 0.1 };
  stop = clock.follow(true, () => snapshot);
  const unsubscribe = clock.subscribe(() => stop());
  frame();
  assert.equal(frames.size, 0, 'disposing during notification cannot schedule another frame');
  unsubscribe();
});

function animationFrames(t: { after(fn: () => void): void }) {
  const oldFrame = globalThis.requestAnimationFrame;
  const oldCancel = globalThis.cancelAnimationFrame;
  const frames = new Map<number, FrameRequestCallback>();
  let id = 0;
  globalThis.requestAnimationFrame = (callback) => {
    frames.set(++id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (key) => {
    frames.delete(key);
  };
  t.after(() => {
    globalThis.requestAnimationFrame = oldFrame;
    globalThis.cancelAnimationFrame = oldCancel;
  });
  return () => {
    const run = [...frames.values()];
    frames.clear();
    run.forEach((callback) => callback(0));
  };
}

function state(clock: ReturnType<typeof createLyricsClock>, cue: number, lastBar = 10000) {
  const snapshot = clock.rowSnapshot(0, lastBar);
  return snapshot.startsWith(`${cue}:`) ? snapshot.split(':').slice(1).map(Number) : [-1, -1, -1];
}

test('bold stays within the current lyric line; rests and pause preserve it, later lines and finish reset it', async (t) => {
  const { ChartTransport } = await import('../src/components/music/chart-transport');
  const { songs } = await import('../src/content/course');
  const frame = animationFrames(t);
  const bars = Array.from({ length: 2 }, () => ({ events: [{ chord: 'G', beats: 4 }] }));
  let now = 0;
  const player = new ChartTransport(
    bars,
    songs.santo_espirito.versions.base,
    60,
    {
      now: () => now,
      chord: () => () => {},
      click: () => () => {},
    },
    () => {},
  );
  const clock = createLyricsClock(
    [0, 1].map((id) => ({
      id,
      text: 'Santo',
      startBeat: id * 4,
      endBeat: id * 4 + 4,
      startBar: id,
      endBar: id,
      syllables: [
        { from: 0, to: 3, startBeat: id * 4, endBeat: id * 4 + 1, timing: 'manual' },
        { from: 3, to: 5, startBeat: id * 4 + 2, endBeat: id * 4 + 4, timing: 'manual' },
      ],
    })),
    60,
  );
  const cleanup = clock.follow(true, () => player.snapshot());
  function at(time: number) {
    now = time;
    player.tick();
    frame();
  }
  player.play();
  frame();
  at(1.54);
  assert.deepEqual(state(clock, 0), [0, 0, -1], 'rest retains the completed first syllable');
  at(3.04);
  assert.deepEqual(state(clock, 0), [0, 0, 1], 'previous syllable stays bold while the next fills');
  at(4.54);
  assert.deepEqual(state(clock, 0), [-1, -1, -1], 'the previous line returns to regular weight');
  assert.equal(clock.rowSnapshot(0, 0), '', 'inactive chart rows have no emphasis');
  assert.deepEqual(state(clock, 1), [-1, -1, 0]);
  player.pause();
  frame();
  const paused = clock.rowSnapshot(0, 1);
  at(20);
  assert.equal(clock.rowSnapshot(0, 1), paused);
  player.play();
  frame();
  assert.equal(clock.rowSnapshot(0, 1), paused, 'resume lead-in must not flash the text');
  at(20.54);
  assert.deepEqual(state(clock, 1), [0, 0, -1]);
  at(24);
  assert.deepEqual(state(clock, 1), [-1, -1, -1], 'natural finish clears the last line');
  clock.reset();
  player.stop();
  frame();
  assert.deepEqual(state(clock, 0), [-1, -1, -1]);
  assert.deepEqual(state(clock, 1), [-1, -1, -1]);
  player.setLoopRange({ startBar: 1, endBar: 2 });
  clock.reset();
  player.play(1);
  frame();
  at(27.54);
  assert.deepEqual(state(clock, 0), [-1, -1, -1], 'Tocar daqui does not mark skipped verses');
  assert.deepEqual(state(clock, 1), [0, 0, 1]);
  at(28.29);
  assert.deepEqual(
    state(clock, 1),
    [-1, -1, 0],
    'loop starts a fresh fill in the repeated passage',
  );
  at(37.54);
  assert.deepEqual(
    state(clock, 1),
    [0, 0, -1],
    'multiple loops between frames use the actual traversal start',
  );
  cleanup();
  player.dispose();
});

test('all 19 versions accumulate within each lyric line and clear earlier phrases', async (t) => {
  const { songs } = await import('../src/content/course');
  const { songLyrics } = await import('../src/content/song-lyrics');
  const { buildChartGroups } = await import('../src/components/music/chart-layout');
  const { projectLyricCues, totalChartBeats } =
    await import('../src/components/music/chart-lyrics');
  const { withLyricSyllables } = await import('../src/components/music/lyric-syllables');
  const frame = animationFrames(t);
  let versions = 0;
  let phrases = 0;
  for (const [songId, song] of Object.entries(songLyrics)) {
    for (const [versionId, lyrics] of Object.entries(song.versions)) {
      const label = `${songId}/${versionId}`;
      const chart = songs[songId].versions[versionId];
      const groups = buildChartGroups(chart);
      const cues = projectLyricCues(chart, groups, withLyricSyllables(lyrics.cues));
      const durationSeconds = totalChartBeats(
        groups.flatMap((group) => group.bars.map(({ bar }) => bar)),
      );
      let snapshot: PlaybackSnapshot = {
        status: 'playing',
        bar: 0,
        beat: 0,
        tick: -1,
        scoreSeconds: 0,
        elapsedSeconds: 0,
        passStartSeconds: 0,
        durationSeconds,
        waitingForAudio: false,
      };
      const clock = createLyricsClock(cues, 60);
      const cleanup = clock.follow(true, () => snapshot);
      frame();
      for (const cue of cues) {
        for (const [index, part] of cue.syllables!.entries()) {
          snapshot = {
            ...snapshot,
            bar: cue.startBar,
            scoreSeconds: (part.startBeat + part.endBeat) / 2,
            elapsedSeconds: (part.startBeat + part.endBeat) / 2,
          };
          frame();
          assert.deepEqual(
            state(clock, cue.id),
            [index ? 0 : -1, index - 1, index],
            `${label}: syllable ${index}`,
          );
          snapshot = { ...snapshot, scoreSeconds: part.endBeat, elapsedSeconds: part.endBeat };
          frame();
          assert.equal(
            state(clock, cue.id)[1],
            part.endBeat < cue.endBeat ? index : -1,
            `${label}: completed syllable stays bold only until the line ends`,
          );
        }
        phrases++;
      }
      for (const cue of cues)
        assert.deepEqual(state(clock, cue.id), [-1, -1, -1], `${label}: previous phrases reset`);
      clock.reset();
      for (const cue of cues) assert.deepEqual(state(clock, cue.id), [-1, -1, -1]);
      cleanup();
      versions++;
    }
  }
  assert.equal(versions, 19);
  assert.equal(phrases, 744);
});
