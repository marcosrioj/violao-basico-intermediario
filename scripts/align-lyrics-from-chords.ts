import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { songs } from '../src/content/course';
import type { SongLyrics } from '../src/content/song-lyrics-types';
import { validateLyricCues, totalChartBeats } from '../src/components/music/chart-lyrics';
import { buildChartGroups } from '../src/components/music/chart-layout';
import { withLyricSyllables } from '../src/components/music/lyric-syllables';
import {
  alignLyricArrangement,
  existingChordTimeline,
  parseChordReference,
} from './lib/lyric-chord-alignment';
import { retimeLyricCues } from './lib/retime-lyric-blocks';

const sourcePath = 'materials/references/cifras_13_musicas_vscode.txt';
const source = readFileSync(sourcePath, 'utf8');
const references = parseChordReference(source);
const hash = (data: string | Buffer) => createHash('sha256').update(data).digest('hex');
const write = process.argv.includes('--write');
const check = process.argv.includes('--check');
const report: {
  song: string;
  version: string;
  cue: number;
  text: string;
  startBeat: number;
  endBeat: number;
  scoreWindow: { startBeat: number; endBeat: number };
  sourceLine?: number;
  sourceSection?: string;
  anchors: ReturnType<typeof alignLyricArrangement>[number]['anchors'];
  pending: ReturnType<typeof alignLyricArrangement>[number]['pending'];
}[] = [];
const unchangedText: Record<string, string> = {};
let outOfDate = false;
const outputs = new Map<string, string>();
const adjustments: { song: string; version: string; cues: number }[] = [];
function output(path: string, value: unknown) {
  const serialized = JSON.stringify(value, null, 2) + '\n';
  outputs.set(path, serialized);
}

for (let file = 1; file <= 3; file++) {
  const path = `src/content/song-lyrics-${file}.json`;
  const catalog = JSON.parse(readFileSync(path, 'utf8')) as Record<string, SongLyrics>;
  for (const [song, lyrics] of Object.entries(catalog)) {
    const lines = references.filter((line) => line.songId === song);
    for (const [version, arrangement] of Object.entries(lyrics.versions)) {
      unchangedText[`${song}/${version}`] = hash(
        JSON.stringify({
          providedLines: lyrics.providedLines,
          cues: arrangement.cues.map((cue) => ({
            text: cue.text,
            startBeat: (cue.scoreWindow ?? cue).startBeat,
            endBeat: (cue.scoreWindow ?? cue).endBeat,
          })),
        }),
      );
      const chart = songs[song].versions[version];
      const timeline = existingChordTimeline(chart);
      const alignments = alignLyricArrangement(arrangement.cues, timeline, lines);
      if (alignments.length !== arrangement.cues.length)
        throw new Error(`Alinhamento incompleto: ${song}/${version}`);
      arrangement.cues.forEach((cue, index) => {
        if (cue.syllables?.some((part) => part.timing === 'manual')) return;
        delete cue.chordAnchors;
        if (alignments[index].anchors.length)
          cue.chordAnchors = alignments[index].anchors.map(({ from, beat }) => ({ from, beat }));
      });
      const beats = totalChartBeats(
        buildChartGroups(chart).flatMap((g) => g.bars.map(({ bar }) => bar)),
      );
      const retimed = (() => {
        try {
          return retimeLyricCues(arrangement.cues, beats);
        } catch (error) {
          throw new Error(`${song}/${version}: ${String(error)}`);
        }
      })();
      arrangement.cues = retimed.cues;
      adjustments.push({ song, version, cues: retimed.adjustments.length });
      arrangement.cues.forEach((cue, index) =>
        report.push({
          song,
          version,
          cue: index,
          text: cue.text,
          startBeat: cue.startBeat,
          endBeat: cue.endBeat,
          scoreWindow: cue.scoreWindow!,
          ...alignments[index],
        }),
      );
      validateLyricCues(withLyricSyllables(arrangement.cues), beats);
    }
  }
  output(path, catalog);
}

const summary = Object.keys(songs).map((song) => {
  const cues = report.filter((entry) => entry.song === song);
  return {
    song,
    versions: new Set(cues.map((cue) => cue.version)).size,
    cues: cues.length,
    anchoredCues: cues.filter((cue) => cue.anchors.length).length,
    anchors: cues.reduce((total, cue) => total + cue.anchors.length, 0),
    pendingCues: cues.filter((cue) => cue.pending.length).length,
  };
});
output('docs/lyric-chord-alignment.json', {
  source: {
    path: sourcePath,
    sha256: hash(source),
    columns: 'zero-based, relative to trimmed lyric',
    beats: 'zero-based absolute pulses of the existing expanded arrangement',
  },
  preserved: {
    files: [
      'src/content/course-data.json',
      'src/content/chords-data.json',
      'src/content/tempo-research.json',
    ].map((path) => ({ path, sha256: hash(readFileSync(path)) })),
    lyricTextAndWindows: unchangedText,
  },
  policy:
    'Existing notes, chord events, durations, form and BPM prevail. Source syllables follow compatible existing events in global order; only vocal windows are reflowed, retaining scoreWindow for reproducibility. Vocal durations between anchors remain estimated.',
  adjustments,
  summary,
  cues: report,
});
// Validate every arrangement before touching any generated file.
for (const [path, serialized] of outputs) {
  if (write) writeFileSync(path, serialized);
  if (check && readFileSync(path, 'utf8') !== serialized) {
    console.error(`Desatualizado: ${path}`);
    outOfDate = true;
  }
}
console.table(summary);
console.log(
  `${write ? 'Gravado' : check ? 'Conferido' : 'Prévia (use --write para gravar)'}: ${report.reduce((sum, cue) => sum + cue.anchors.length, 0)} âncoras.`,
);
if (outOfDate) process.exitCode = 1;
