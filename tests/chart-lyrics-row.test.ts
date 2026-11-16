import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ChartLyricsRow } from '../src/components/music/chart-lyrics-row';
import { createLyricsClock } from '../src/components/music/chart-lyrics-clock';
import { buildChartGroups, buildChartRows } from '../src/components/music/chart-layout';
import { projectLyricCues, type ProjectedLyricCue } from '../src/components/music/chart-lyrics';
import { withLyricSyllables } from '../src/components/music/lyric-syllables';
import { songs } from '../src/content/course';
import { songLyrics } from '../src/content/song-lyrics';

function visibleSyllables(cues: ProjectedLyricCue[], firstBar: number, lastBar: number) {
  const html = renderToStaticMarkup(
    React.createElement(ChartLyricsRow, {
      cues,
      firstBar,
      lastBar,
      clock: createLyricsClock(cues, 60),
    }),
  );
  return [...html.matchAll(/class="karaoke-glyph">([^<]*)<\/span>/g)].map((match) => match[1]);
}

function escapedText(text: string) {
  return renderToStaticMarkup(React.createElement('span', null, text)).slice(6, -7);
}

test('a phrase stays complete across chart rows instead of breaking words into timed fragments', () => {
  const text = 'Faz chover, faz chover';
  const cues: ProjectedLyricCue[] = [
    {
      id: 0,
      text,
      startBeat: 2,
      endBeat: 12,
      startBar: 0,
      endBar: 2,
      syllableBars: [0, 0, 1, 1, 1, 2],
      syllables: [
        [0, 4, 2, 3],
        [4, 7, 3, 4],
        [7, 12, 4, 5],
        [12, 16, 5, 6],
        [16, 19, 6, 8],
        [19, 22, 8, 12],
      ].map(([from, to, startBeat, endBeat]) => ({
        from,
        to: Math.min(to, text.length),
        startBeat,
        endBeat,
        timing: 'manual',
      })),
    },
  ];
  const fullPhrase = ['Faz', 'cho', 'ver,', 'faz', 'cho', 'ver'];
  for (const [first, last] of [
    [0, 0],
    [1, 1],
    [2, 2],
    [0, 1],
  ]) {
    assert.deepEqual(visibleSyllables(cues, first, last), fullPhrase);
  }
  assert.deepEqual(visibleSyllables(cues, 3, 3), []);
});

test('all 19 versions retain their original full phrases and row placement after vocal retiming', () => {
  let versions = 0;
  for (const [songId, lyrics] of Object.entries(songLyrics)) {
    for (const [version, arrangement] of Object.entries(lyrics.versions)) {
      const chart = songs[songId].versions[version];
      const groups = buildChartGroups(chart);
      const prepared = withLyricSyllables(arrangement.cues);
      const before = structuredClone(prepared);
      const cues = projectLyricCues(chart, groups, prepared);
      const original = projectLyricCues(
        chart,
        groups,
        arrangement.cues.map((cue) => ({
          text: cue.text,
          startBeat: cue.scoreWindow?.startBeat ?? cue.startBeat,
          endBeat: cue.scoreWindow?.endBeat ?? cue.endBeat,
        })),
      );
      for (const width of [1, 2, 4]) {
        for (const group of groups) {
          for (const row of buildChartRows(group.bars, chart, width)) {
            const first = row[0].playbackIndex;
            const last = row.at(-1)!.playbackIndex;
            const expected = original
              .filter((cue) => cue.startBar <= last && cue.endBar >= first)
              .flatMap((cue) =>
                prepared[cue.id].syllables!.map(({ from, to }) =>
                  escapedText(cue.text.slice(from, to).trimEnd()),
                ),
              );
            assert.deepEqual(
              visibleSyllables(cues, first, last),
              expected,
              `${songId}/${version}, ${width} bars per row, bar ${first}`,
            );
          }
        }
      }
      assert.deepEqual(prepared, before, 'rendering preserves every new timing and chord anchor');
      for (const cue of cues) {
        assert.deepEqual(cue.syllables, prepared[cue.id].syllables);
      }
      versions++;
    }
  }
  assert.equal(versions, 19);
});

test('the Faz Chover pickup retains its new timing but is printed with the complete refrain', () => {
  const chart = songs.faz_chover_tna.versions.base;
  const source = withLyricSyllables(songLyrics.faz_chover_tna.versions.base.cues);
  const projected = projectLyricCues(chart, buildChartGroups(chart), source);
  const cue = projected.find((cue) => cue.text === 'Faz chover, faz chover')!;
  assert.ok(cue.startBeat < 64, 'the new pickup starts before the Am');
  assert.equal(cue.startBar, 16, 'the printed refrain stays on the original Am row');
  assert.equal(cue.endBar, 17);
  assert.equal(cue.syllables!.find((part) => part.from === 7)!.startBeat, 64);
  assert.equal(cue.syllables!.find((part) => part.from === 19)!.startBeat, 68);
  assert.ok(cue.syllableBars!.every((bar) => bar >= 16 && bar <= 17));
  assert.deepEqual(visibleSyllables([cue], 15, 15), []);
  assert.deepEqual(visibleSyllables([cue], 16, 16), ['Faz', 'cho', 'ver,', 'faz', 'cho', 'ver']);
});
