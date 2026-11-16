import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { songs } from '../src/content/course';
import type { SongLyrics } from '../src/content/song-lyrics-types';
import {
  totalChartBeats,
  validateLyricCues,
  type LyricCue,
} from '../src/components/music/chart-lyrics';
import { buildChartGroups } from '../src/components/music/chart-layout';
import {
  estimateLyricSyllables,
  withLyricSyllables,
} from '../src/components/music/lyric-syllables';
import {
  alignLyricArrangement,
  existingChordTimeline,
  parseChordReference,
} from '../scripts/lib/lyric-chord-alignment';
import { retimeLyricCues } from '../scripts/lib/retime-lyric-blocks';

const references = parseChordReference(
  readFileSync('materials/references/cifras_13_musicas_vscode.txt', 'utf8'),
);
const catalog = Object.assign(
  {},
  ...[1, 2, 3].map((file) =>
    JSON.parse(readFileSync(`src/content/song-lyrics-${file}.json`, 'utf8')),
  ),
) as Record<string, SongLyrics>;
function aligned(song: string, version: string) {
  const chart = songs[song].versions[version];
  const cues = structuredClone(catalog[song].versions[version].cues);
  const timeline = existingChordTimeline(chart);
  const alignments = alignLyricArrangement(
    cues,
    timeline,
    references.filter((line) => line.songId === song),
  );
  cues.forEach((cue, index) => {
    cue.chordAnchors = alignments[index].anchors.map(({ from, beat }) => ({ from, beat }));
  });
  const total = totalChartBeats(
    buildChartGroups(chart).flatMap((group) => group.bars.map(({ bar }) => bar)),
  );
  return { ...retimeLyricCues(cues, total), total, alignments, timeline };
}

test('the two ver syllables in Faz Chover coincide with Am64 and F68, with the pickup before Am', () => {
  for (const version of ['base', 'completa']) {
    const { cues } = aligned('faz_chover_tna', version);
    const cue = cues[8],
      units = estimateLyricSyllables(cue);
    assert.equal(cue.text, 'Faz chover, faz chover');
    assert.deepEqual(cue.chordAnchors, [
      { from: 7, beat: 64 },
      { from: 19, beat: 68 },
    ]);
    assert.equal(units.find((unit) => unit.from === 7)!.startBeat, 64);
    assert.equal(units.find((unit) => unit.from === 19)!.startBeat, 68);
    assert.ok(cue.startBeat < 64);
    assert.equal(cues[7].endBeat, cue.startBeat);
    assert.deepEqual(cues[9].chordAnchors, [
      { from: 0, beat: 72 },
      { from: 22, beat: 76 },
    ]);
  }
});

test('joint source matching retains Me Derramar pickup, Ousado bridge ending and Preciso Coda order', () => {
  assert.deepEqual(aligned('me_derramar', 'base').cues[12].chordAnchors, [
    { from: 0, beat: 59 },
    { from: 9, beat: 60 },
    { from: 22, beat: 62 },
  ]);
  const ousado = aligned('ousado_amor', 'base').cues;
  for (const index of [16, 18, 20, 22]) {
    assert.equal(ousado[index].chordAnchors!.at(-1)!.beat, ousado[index].scoreWindow!.endBeat);
    assert.ok(ousado[index].endBeat > ousado[index].scoreWindow!.endBeat);
  }
  for (const version of ['base', 'baixos']) {
    const { alignments } = aligned('preciso_de_ti', version);
    assert.deepEqual(
      alignments.slice(49, 52).map((alignment) => alignment.sourceLine),
      [1491, 1493, 1495],
    );
    assert.deepEqual(
      alignments.slice(49, 52).map((alignment) => alignment.anchors[0].beat),
      [396, 404, 412],
    );
  }
});

test('all 19 arrangements remain valid and idempotent, retaining original windows and manual-free storage', () => {
  let count = 0;
  for (const [song, lyrics] of Object.entries(catalog))
    for (const version of Object.keys(lyrics.versions)) {
      const { cues, total, alignments, timeline } = aligned(song, version);
      validateLyricCues(withLyricSyllables(cues), total);
      assert.deepEqual(retimeLyricCues(cues, total).cues, cues);
      assert.ok(cues.every((cue) => cue.scoreWindow && !cue.syllables));
      const second = alignLyricArrangement(
        cues,
        timeline,
        references.filter((line) => line.songId === song),
      );
      assert.deepEqual(second, alignments);
      const anchorBeats = cues.flatMap((cue) =>
        (cue.chordAnchors ?? []).map((anchor) => anchor.beat),
      );
      assert.ok(anchorBeats.every((beat, index) => !index || beat > anchorBeats[index - 1]));
      count++;
    }
  assert.equal(count, 19);
});

test('manual units and intentional vocal gaps are barriers; estimated caches are regenerated', () => {
  const manual: LyricCue = {
    text: 'Ti',
    startBeat: 8,
    endBeat: 10,
    syllables: [{ from: 0, to: 2, startBeat: 8, endBeat: 10, timing: 'manual' }],
  };
  const cues: LyricCue[] = [
    { text: 'Eu canto', startBeat: 2, endBeat: 6, chordAnchors: [{ from: 3, beat: 3 }] },
    manual,
    {
      text: 'Eu canto',
      startBeat: 14,
      endBeat: 18,
      chordAnchors: [{ from: 3, beat: 14 }],
      syllables: estimateLyricSyllables({ text: 'Eu canto', startBeat: 14, endBeat: 18 }),
    },
  ];
  const result = retimeLyricCues(cues, 20).cues;
  assert.equal(result[0].endBeat, 6);
  assert.deepEqual(result[1], { ...manual, scoreWindow: { startBeat: 8, endBeat: 10 } });
  assert.ok(result[2].startBeat >= 10 && result[2].startBeat < 14);
  assert.equal(result[2].endBeat, 18);
  assert.equal(result[2].syllables, undefined);
  assert.deepEqual(cues[0].scoreWindow, undefined);
});

test('impossible pickups fail explicitly rather than producing negative or zero-length syllables', () => {
  assert.throws(
    () =>
      retimeLyricCues(
        [{ text: 'Eu canto', startBeat: 0, endBeat: 4, chordAnchors: [{ from: 3, beat: 0 }] }],
        4,
      ),
    /Âncoras incompatíveis/,
  );
});

test('intro events and later strums cannot replace the written harmonic entries of a vocal section', () => {
  assert.equal(aligned('sonda_me_usa_me', 'base').cues[0].chordAnchors![0].beat, 20);
  assert.deepEqual(
    aligned('rompendo_em_fe', 'base').cues[0].chordAnchors!.map((anchor) => anchor.beat),
    [20, 24],
  );
  assert.equal(aligned('bondade_de_deus', 'base').cues[0].chordAnchors![0].beat, 16);
  const poderoso = aligned('poderoso_deus', 'base');
  assert.deepEqual(
    [8, 9, 10, 12, 13, 14].map((index) => poderoso.cues[index].chordAnchors![0].beat),
    [96, 104, 112, 128, 136, 144],
  );
  assert.deepEqual(
    [8, 9, 10, 12, 13, 14].map((index) => poderoso.alignments[index].sourceLine),
    [730, 732, 734, 740, 742, 744],
  );
  // A vocal line beginning after the harmonic onset may still enter on a later strum.
  assert.equal(aligned('preciso_de_ti', 'base').cues[0].chordAnchors![0].beat, 20);
});

test('short breaths keep their duration while moving earlier to make room for the next pickup', () => {
  const { cues } = aligned('a_ele_a_gloria', 'base');
  assert.ok(cues[6].startBeat < 95.5);
  for (let index = 1; index < cues.length; index++) {
    const originalGap = cues[index].scoreWindow!.startBeat - cues[index - 1].scoreWindow!.endBeat;
    if (originalGap > 0 && originalGap < 4)
      assert.ok(Math.abs(cues[index].startBeat - cues[index - 1].endBeat - originalGap) < 1e-7);
  }
  assert.equal(estimateLyricSyllables(cues[6]).find((unit) => unit.from === 18)!.startBeat, 96);
});

test('an unmatched middle phrase does not poison later candidate scores', () => {
  const cues: LyricCue[] = [
    { text: 'Ti', startBeat: 0, endBeat: 4 },
    { text: 'Uma frase sem fonte', startBeat: 4, endBeat: 10 },
    { text: 'Eu canto aqui', startBeat: 10, endBeat: 16 },
  ];
  const timeline = [
    ['D', 0],
    ['G', 4],
    ['D', 8],
    ['G', 10],
    ['D', 12],
  ].map(([chord, beat], index) => ({
    chord: String(chord),
    beat: Number(beat),
    bar: index,
    event: 0,
    section: 'Verso',
    passage: 1,
  }));
  const result = alignLyricArrangement(cues, timeline, [
    {
      songId: 'test',
      text: 'Ti',
      line: 1,
      section: 'Verso',
      free: false,
      chords: [{ chord: 'D', column: 0 }],
    },
    {
      songId: 'test',
      text: 'Eu canto aqui',
      line: 3,
      section: 'Verso',
      free: false,
      chords: [{ chord: 'D', column: 3 }],
    },
  ]);
  assert.equal(result[1].pending[0].reason, 'phrase-not-in-reference');
  assert.equal(result[2].anchors[0].beat, 12);
});
