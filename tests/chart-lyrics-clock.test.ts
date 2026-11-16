import assert from 'node:assert/strict';
import test from 'node:test';
import { createLyricsClock } from '../src/components/music/chart-lyrics-clock';
import type { PlaybackSnapshot } from '../src/components/music/chart-transport';

function activeSyllable(
  clock: ReturnType<typeof createLyricsClock>,
  firstBar: number,
  lastBar: number,
) {
  const active = clock
    .rowSnapshot(firstBar, lastBar)
    .split(';')
    .map((entry) => entry.split(':').map(Number))
    .find(([, , , syllable]) => syllable >= 0);
  return active ? `${active[0]}:${active[3]}` : '';
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
  const snapshot = clock
    .rowSnapshot(0, lastBar)
    .split(';')
    .find((entry) => entry.startsWith(`${cue}:`));
  return snapshot ? snapshot.split(':').slice(1).map(Number) : [-1, -1, -1];
}

test('the prefix before the playhead stays bold across pauses, natural finish, jumps and loops', async (t) => {
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
  let cleanup = clock.follow(true, () => player.snapshot());
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
  assert.deepEqual(state(clock, 0), [0, 1, -1], 'the previous line keeps its completed syllables');
  assert.equal(clock.rowSnapshot(0, 0), '0:0:1:-1', 'an earlier chart row stays bold');
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
  assert.deepEqual(state(clock, 0), [0, 1, -1], 'natural finish preserves the first line');
  assert.deepEqual(state(clock, 1), [0, 1, -1], 'natural finish preserves the last line');
  clock.reset();
  player.stop();
  frame();
  assert.deepEqual(state(clock, 0), [-1, -1, -1]);
  assert.deepEqual(state(clock, 1), [-1, -1, -1]);
  player.setLoopRange({ startBar: 1, endBar: 2 });
  clock.reset();
  player.play(1);
  cleanup();
  cleanup = clock.follow(true, () => player.snapshot());
  frame();
  at(27.54);
  assert.deepEqual(state(clock, 0), [0, 1, -1], 'starting later marks all earlier text');
  assert.deepEqual(state(clock, 1), [0, 0, 1]);
  at(28.29);
  assert.deepEqual(
    state(clock, 1),
    [-1, -1, 0],
    'loop starts a fresh fill in the repeated passage',
  );
  assert.deepEqual(state(clock, 0), [0, 1, -1], 'text before the loop stays in the prefix');
  at(37.54);
  assert.deepEqual(
    state(clock, 1),
    [0, 0, -1],
    'multiple loops between frames use the actual traversal start',
  );
  cleanup();
  player.dispose();
});

test('all 19 versions emphasize every phrase before the playhead and clear on reset', async (t) => {
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
            index,
            `${label}: completed syllable remains bold after its line ends`,
          );
        }
        phrases++;
      }
      for (const cue of cues)
        assert.deepEqual(
          state(clock, cue.id),
          [0, cue.syllables!.length - 1, -1],
          `${label}: earlier phrases remain sung`,
        );
      clock.reset();
      for (const cue of cues) assert.deepEqual(state(clock, cue.id), [-1, -1, -1]);
      cleanup();
      versions++;
    }
  }
  assert.equal(versions, 19);
  assert.equal(phrases, 744);
});

test('completed text persists across chart rows while future rows and duplicate active fills stay clear', (t) => {
  const frame = animationFrames(t);
  const clock = createLyricsClock(
    [
      {
        id: 0,
        text: 'Santo',
        startBeat: 0,
        endBeat: 8,
        startBar: 0,
        endBar: 1,
        syllables: [
          { from: 0, to: 3, startBeat: 0, endBeat: 2, timing: 'manual' },
          { from: 3, to: 5, startBeat: 6, endBeat: 8, timing: 'manual' },
        ],
      },
      {
        id: 1,
        text: 'Eu',
        startBeat: 8,
        endBeat: 10,
        startBar: 2,
        endBar: 2,
        syllables: [{ from: 0, to: 2, startBeat: 8, endBeat: 10, timing: 'manual' }],
      },
      {
        id: 2,
        text: 'Ti',
        startBeat: 10,
        endBeat: 12,
        startBar: 2,
        endBar: 2,
        syllables: [{ from: 0, to: 2, startBeat: 10, endBeat: 12, timing: 'manual' }],
      },
    ],
    60,
  );
  let snapshot: PlaybackSnapshot = {
    status: 'playing',
    bar: 0,
    beat: 0,
    tick: -1,
    scoreSeconds: 0,
    elapsedSeconds: 0,
    passStartSeconds: 0,
    durationSeconds: 12,
    waitingForAudio: false,
  };
  const cleanup = clock.follow(true, () => snapshot);
  function at(scoreSeconds: number, bar: number) {
    snapshot = { ...snapshot, scoreSeconds, elapsedSeconds: scoreSeconds, bar };
    frame();
  }
  at(1, 0);
  assert.equal(activeSyllable(clock, 0, 0), '0:0');
  assert.equal(clock.rowSnapshot(1, 1), '', 'a duplicate phrase under a future bar is untouched');
  at(3, 0);
  assert.equal(clock.rowSnapshot(0, 0), '0:0:0:-1', 'a vocal rest keeps the sung prefix');
  assert.equal(clock.rowSnapshot(1, 1), '', 'completed prefix cannot light up a future row');
  at(7, 1);
  assert.equal(
    clock.rowSnapshot(0, 0),
    '0:0:0:-1',
    'previous row keeps completion without active fill',
  );
  assert.equal(clock.rowSnapshot(1, 1), '0:0:0:1', 'only current row advances the active syllable');
  at(8.5, 2);
  assert.equal(clock.rowSnapshot(0, 0), '0:0:1:-1');
  assert.equal(clock.rowSnapshot(1, 1), '0:0:1:-1');
  assert.equal(activeSyllable(clock, 2, 2), '1:0');
  at(10.5, 2);
  assert.equal(
    clock.rowSnapshot(2, 2),
    '1:0:0:-1;2:-1:-1:0',
    'multiple phrases on the same row retain their own state',
  );
  assert.deepEqual(state(clock, 0), [0, 1, -1]);
  at(1, 0);
  assert.equal(clock.rowSnapshot(0, 0), '0:-1:-1:0', 'returning earlier recalculates the prefix');
  assert.equal(clock.rowSnapshot(1, 1), '', 'a previously reached duplicate becomes future again');
  assert.equal(clock.rowSnapshot(2, 2), '', 'later completed phrases clear on a backward jump');
  clock.reset();
  for (let bar = 0; bar < 3; bar++) assert.equal(clock.rowSnapshot(bar, bar), '');
  cleanup();
});

test('delayed initial chord anchors introduce a vocal rest without erasing an earlier sung phrase', async (t) => {
  const { withLyricSyllables } = await import('../src/components/music/lyric-syllables');
  const frame = animationFrames(t);
  const cues = withLyricSyllables([
    { text: 'Eu', startBeat: 0, endBeat: 4, chordAnchors: [{ from: 0, beat: 2 }] },
    { text: 'Ti', startBeat: 4, endBeat: 8, chordAnchors: [{ from: 0, beat: 6 }] },
  ]).map((cue, id) => ({ ...cue, id, startBar: id, endBar: id }));
  const clock = createLyricsClock(cues, 60);
  let snapshot: PlaybackSnapshot = {
    status: 'playing',
    bar: 0,
    beat: 0,
    tick: -1,
    scoreSeconds: 1,
    elapsedSeconds: 1,
    passStartSeconds: 0,
    durationSeconds: 8,
    waitingForAudio: false,
  };
  const cleanup = clock.follow(true, () => snapshot);
  frame();
  assert.deepEqual(state(clock, 0), [-1, -1, -1], 'no syllable is marked before its delayed onset');
  snapshot = { ...snapshot, scoreSeconds: 3, elapsedSeconds: 3 };
  frame();
  assert.equal(activeSyllable(clock, 0, 0), '0:0');
  snapshot = { ...snapshot, scoreSeconds: 5, elapsedSeconds: 5, bar: 1 };
  frame();
  assert.equal(
    clock.rowSnapshot(0, 0),
    '0:0:0:-1',
    'the earlier line stays sung during the next initial rest',
  );
  assert.deepEqual(state(clock, 1), [-1, -1, -1], 'the second line has not started singing');
  snapshot = { ...snapshot, scoreSeconds: 7, elapsedSeconds: 7 };
  frame();
  assert.equal(activeSyllable(clock, 1, 1), '1:0');
  assert.deepEqual(state(clock, 0), [0, 0, -1]);
  cleanup();
});

test('starting or looping in the middle of a phrase marks the complete prefix regardless of playback history', (t) => {
  const frame = animationFrames(t);
  const clock = createLyricsClock(
    [
      {
        id: 0,
        text: 'Santo',
        startBeat: 0,
        endBeat: 8,
        startBar: 0,
        endBar: 1,
        syllables: [
          { from: 0, to: 3, startBeat: 0, endBeat: 2, timing: 'manual' },
          { from: 3, to: 5, startBeat: 6, endBeat: 8, timing: 'manual' },
        ],
      },
    ],
    60,
  );
  let snapshot: PlaybackSnapshot = {
    status: 'playing',
    bar: 1,
    beat: 2.5,
    tick: -1,
    scoreSeconds: 6.5,
    elapsedSeconds: 2.5,
    passStartSeconds: 4,
    durationSeconds: 8,
    waitingForAudio: false,
  };
  const cleanup = clock.follow(true, () => snapshot);
  frame();
  assert.equal(
    clock.rowSnapshot(0, 0),
    '0:0:0:-1',
    'the earlier row is marked even when playback begins in the middle of the phrase',
  );
  assert.equal(
    clock.rowSnapshot(1, 1),
    '0:0:0:1',
    'the current syllable advances after the complete prefix',
  );
  snapshot = { ...snapshot, scoreSeconds: 4.5, elapsedSeconds: 4.5, beat: 0.5 };
  frame();
  assert.equal(clock.rowSnapshot(0, 0), '0:0:0:-1');
  assert.deepEqual(
    state(clock, 0),
    [0, 0, -1],
    'looping preserves only the prefix before its new position during a vocal rest',
  );
  snapshot = { ...snapshot, scoreSeconds: 7, elapsedSeconds: 7, beat: 3 };
  frame();
  assert.equal(clock.rowSnapshot(1, 1), '0:0:0:1');
  snapshot = { ...snapshot, status: 'idle', scoreSeconds: 8, elapsedSeconds: 8, beat: 4 };
  frame();
  assert.equal(clock.rowSnapshot(0, 0), '0:0:1:-1');
  assert.equal(
    clock.rowSnapshot(1, 1),
    '0:0:1:-1',
    'natural completion retains the full prefix, including the skipped beginning',
  );
  clock.reset();
  assert.equal(clock.rowSnapshot(1, 1), '');
  cleanup();
});

test('a manual syllable crossing beats 37.6–38.4 keeps its onset row in the Ousado Amor chart at widths 1, 2 and 4', async (t) => {
  const { songs } = await import('../src/content/course');
  const { buildChartGroups, buildChartRows } = await import('../src/components/music/chart-layout');
  const { projectLyricCues, totalChartBeats } =
    await import('../src/components/music/chart-lyrics');
  const { withLyricSyllables } = await import('../src/components/music/lyric-syllables');
  const frame = animationFrames(t);
  const chart = songs.ousado_amor.versions.base;
  const groups = buildChartGroups(chart);
  const prepared = withLyricSyllables([
    {
      text: 'Eu vou lá',
      startBeat: 32,
      endBeat: 40,
      syllables: [
        { from: 0, to: 3, startBeat: 32, endBeat: 37.6, timing: 'manual' },
        { from: 3, to: 7, startBeat: 37.6, endBeat: 38.4, timing: 'manual' },
        { from: 7, to: 9, startBeat: 38.4, endBeat: 40, timing: 'manual' },
      ],
    },
  ]);
  const before = structuredClone(prepared);
  const cues = projectLyricCues(chart, groups, prepared);
  const cue = cues.find(({ startBeat }) => startBeat === 32)!;
  const index = cue.syllables!.findIndex(
    ({ startBeat, endBeat }) => startBeat < 38 && endBeat > 38,
  );
  const part = cue.syllables![index];
  assert.equal(cue.text.slice(part.from, part.to), 'vou ');
  assert.ok(Math.abs(part.startBeat - 37.6) < 1e-7);
  assert.ok(Math.abs(part.endBeat - 38.4) < 1e-7);
  assert.equal(cue.syllableBars![index], 18);
  assert.deepEqual(cue.syllables, prepared[cue.id].syllables);
  const clock = createLyricsClock(cues, 60);
  let snapshot: PlaybackSnapshot = {
    status: 'playing',
    bar: 18,
    beat: 1.8,
    tick: -1,
    scoreSeconds: 37.8,
    elapsedSeconds: 0.2,
    passStartSeconds: 36,
    waitingForAudio: false,
    durationSeconds: totalChartBeats(groups.flatMap(({ bars }) => bars.map(({ bar }) => bar))),
  };
  const cleanup = clock.follow(true, () => snapshot);
  const properties = new Map<string, string>();
  const detach = clock.paint(
    {
      style: { setProperty: (name: string, value: string) => properties.set(name, value) },
    } as unknown as HTMLElement,
    cue.id,
    index,
  );
  frame();
  assert.ok(Math.abs(parseFloat(properties.get('--karaoke-fill')!) - 25) < 1e-7);
  snapshot = { ...snapshot, scoreSeconds: 38.2, elapsedSeconds: 0.6, bar: 19, beat: 0.2 };
  frame();
  assert.ok(Math.abs(parseFloat(properties.get('--karaoke-fill')!) - 75) < 1e-7);
  assert.equal(activeSyllable(clock, 18, 18), `${cue.id}:${index}`);
  assert.equal(
    activeSyllable(clock, 19, 19),
    '',
    'the new bar does not steal a sustained syllable',
  );
  for (const width of [1, 2, 4]) {
    const rows = groups.flatMap((group) => buildChartRows(group.bars, chart, width));
    const activeRows = rows.filter((row) =>
      activeSyllable(clock, row[0].playbackIndex, row.at(-1)!.playbackIndex),
    );
    assert.equal(activeRows.length, 1, `width ${width}: exactly one copy fills`);
    assert.ok(activeRows[0].some(({ playbackIndex }) => playbackIndex === 18));
  }
  snapshot = { ...snapshot, scoreSeconds: 38.5, elapsedSeconds: 0.9, beat: 0.5 };
  frame();
  assert.equal(activeSyllable(clock, 18, 18), '');
  assert.equal(
    activeSyllable(clock, 19, 19),
    `${cue.id}:${index + 1}`,
    'the next syllable owns the new bar',
  );
  assert.ok(state(clock, cue.id)[1] >= index, 'the completed syllable stays bold');
  assert.deepEqual(
    prepared,
    before,
    'visual ownership never changes notes, anchors or vocal timing',
  );
  detach();
  cleanup();
});

test('a clipped selection and a direct jump preserve sustained progress without moving its onset', async (t) => {
  const { projectLyricCues } = await import('../src/components/music/chart-lyrics');
  const { buildChartGroups } = await import('../src/components/music/chart-layout');
  const frame = animationFrames(t);
  const chart = {
    key: 'D',
    meter: '4/4',
    beats_per_bar: 4,
    beat_unit: 'quarter' as const,
    adaptations: '',
    sections: [
      { id: 'A', title: 'Verso', bars: [{ events: [{ chord: 'D', beats: 4 }] }] },
      { id: 'B', title: 'Refrão', bars: [{ events: [{ chord: 'G', beats: 4 }] }] },
    ],
    order: [
      { section: 'A', repeat: 1 },
      { section: 'B', repeat: 1 },
    ],
  };
  const cue = {
    text: 'Ti',
    startBeat: 3.5,
    endBeat: 4.5,
    syllables: [{ from: 0, to: 2, startBeat: 3.5, endBeat: 4.5, timing: 'manual' as const }],
  };
  for (const selected of [false, true]) {
    const projected = projectLyricCues(chart, buildChartGroups(chart, selected ? 'B' : 'all'), [
      cue,
    ]);
    const clock = createLyricsClock(projected, 60);
    const snapshot: PlaybackSnapshot = {
      status: 'playing',
      bar: selected ? 0 : 1,
      beat: 0.25,
      tick: -1,
      scoreSeconds: selected ? 0.25 : 4.25,
      elapsedSeconds: 0.25,
      passStartSeconds: selected ? 0 : 4,
      durationSeconds: selected ? 4 : 8,
      waitingForAudio: false,
    };
    const cleanup = clock.follow(true, () => snapshot);
    frame();
    assert.equal(activeSyllable(clock, 0, 0), '0:0');
    assert.equal(activeSyllable(clock, 1, 1), '');
    let fill = '';
    const detach = clock.paint(
      {
        style: {
          setProperty: (_name: string, value: string) => {
            fill = value;
          },
        },
      } as unknown as HTMLElement,
      0,
      0,
    );
    assert.equal(fill, '75%', 'clipping and direct starting preserve fractional vocal progress');
    detach();
    cleanup();
  }
});

test('frame consumers receive the same snapshot during waiting, instrumental playback and completion', (t) => {
  const frame = animationFrames(t);
  const clock = createLyricsClock([], 60);
  let snapshot: PlaybackSnapshot | null = {
    status: 'playing',
    bar: 0,
    tick: -1,
    beat: 0,
    scoreSeconds: 0,
    durationSeconds: 8,
    elapsedSeconds: 0,
    waitingForAudio: true,
  };
  const received: (PlaybackSnapshot | null)[] = [];
  let reads = 0;
  let notifications = 0;
  clock.subscribe(() => notifications++);
  let cleanup = clock.follow(
    true,
    () => {
      reads++;
      return snapshot;
    },
    (value) => received.push(value),
  );
  frame();
  assert.equal(received[0], snapshot, 'the waiting sample is shared unchanged');
  snapshot = { ...snapshot, waitingForAudio: false, scoreSeconds: 0.25 };
  frame();
  const boundaries = notifications;
  snapshot = { ...snapshot, scoreSeconds: 0.5 };
  frame();
  assert.equal(
    notifications,
    boundaries,
    'continuous frame delivery does not notify unchanged lyric state',
  );
  snapshot = { ...snapshot, status: 'idle', bar: -1, scoreSeconds: 0 };
  frame();
  assert.equal(received.at(-1), snapshot, 'natural completion reaches every visual consumer');
  assert.equal(reads, received.length, 'all consumers share exactly one read per frame');
  cleanup();
  const count = received.length;
  frame();
  assert.equal(received.length, count);
  snapshot = null;
  cleanup = clock.follow(
    true,
    () => snapshot,
    (value) => {
      received.push(value);
      cleanup();
    },
  );
  frame();
  frame();
  assert.equal(
    received.length,
    count + 1,
    'disposal inside the frame callback cancels further work',
  );
  assert.equal(received.at(-1), null);
});

test('a retimed pickup fills its original printed phrase before the Am bar without changing rows', async (t) => {
  const { songs } = await import('../src/content/course');
  const { songLyrics } = await import('../src/content/song-lyrics');
  const { buildChartGroups } = await import('../src/components/music/chart-layout');
  const { projectLyricCues } = await import('../src/components/music/chart-lyrics');
  const { withLyricSyllables } = await import('../src/components/music/lyric-syllables');
  const frame = animationFrames(t);
  const chart = songs.faz_chover_tna.versions.base;
  const cues = projectLyricCues(
    chart,
    buildChartGroups(chart),
    withLyricSyllables(songLyrics.faz_chover_tna.versions.base.cues),
  );
  const cue = cues.find((item) => item.text === 'Faz chover, faz chover')!;
  const first = cue.syllables![0];
  const clock = createLyricsClock(cues, 60);
  let snapshot: PlaybackSnapshot = {
    status: 'playing',
    bar: 15,
    beat: 3,
    tick: -1,
    scoreSeconds: (first.startBeat + first.endBeat) / 2,
    elapsedSeconds: 0,
    durationSeconds: 196,
    waitingForAudio: false,
  };
  const cleanup = clock.follow(true, () => snapshot);
  frame();
  assert.equal(activeSyllable(clock, 15, 15), '', 'no duplicate phrase added to the preceding row');
  assert.equal(activeSyllable(clock, 16, 16), `${cue.id}:0`, 'pickup fills the original refrain');
  assert.equal(activeSyllable(clock, 17, 17), '', 'the later full copy does not fill early');
  snapshot = { ...snapshot, bar: 16, scoreSeconds: 64.1 };
  frame();
  const am = cue.syllables!.findIndex((part) => part.from === 7);
  assert.equal(activeSyllable(clock, 16, 16), `${cue.id}:${am}`);
  snapshot = { ...snapshot, bar: 17, scoreSeconds: 68.1 };
  frame();
  const f = cue.syllables!.findIndex((part) => part.from === 19);
  assert.equal(activeSyllable(clock, 17, 17), `${cue.id}:${f}`);
  assert.equal(activeSyllable(clock, 16, 16), '');
  assert.ok(clock.rowSnapshot(16, 16).includes(`${cue.id}:0:${f - 1}:-1`));
  cleanup();
});
