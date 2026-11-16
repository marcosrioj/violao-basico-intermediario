import type { SongVersion } from '../../src/content/types';
import type { LyricCue } from '../../src/components/music/chart-lyrics';
import { buildChartGroups } from '../../src/components/music/chart-layout';
import {
  estimateLyricSyllables,
  splitLyricSyllables,
} from '../../src/components/music/lyric-syllables';

export const referenceSongIds = [
  'santo_espirito',
  'faz_chover_tna',
  'me_derramar',
  'sonda_me_usa_me',
  'renova_me',
  'poderoso_deus',
  'faz_chover',
  'lugar_secreto',
  'rompendo_em_fe',
  'ousado_amor',
  'preciso_de_ti',
  'a_ele_a_gloria',
  'bondade_de_deus',
] as const;

export interface ReferenceLine {
  songId: string;
  line: number;
  section: string;
  text: string;
  free: boolean;
  chords: { chord: string; column: number }[];
}

const chordPattern = /^[A-G][#b]?(?:(?:maj|sus|add|dim|aug|m|M)|[0-9()+/#b-])*(?:\/[A-G][#b]?)?$/;

/** Columns belong to the literal monospaced source. No source instruction is executed. */
export function parseChordReference(source: string): ReferenceLine[] {
  const result: ReferenceLine[] = [];
  let songId = '';
  let section = '';
  let pending: ReferenceLine['chords'] = [];
  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    const heading = raw.match(/^(\d{2})\. (.+)$/);
    if (heading && heading[2] === heading[2].toLocaleUpperCase('pt-BR')) {
      songId = referenceSongIds[Number(heading[1]) - 1] ?? '';
      section = '';
      pending = [];
      continue;
    }
    if (!songId) continue;
    if (raw.startsWith('[')) {
      section = raw.replace(/^\[|\]$/g, '');
      pending = [];
      continue;
    }
    if (!raw.trim() || !section || /fontes|observações/i.test(section)) continue;
    const tokens = [...raw.matchAll(/\S+/g)];
    if (tokens.every(([token]) => chordPattern.test(token) || /^(\||\(\d+x\))$/.test(token))) {
      pending = tokens
        .filter(([token]) => chordPattern.test(token))
        .map((match) => ({ chord: match[0], column: match.index }));
      continue;
    }
    const indent = raw.length - raw.trimStart().length;
    result.push({
      songId,
      line: index + 1,
      section,
      text: raw.trim(),
      free: /livre|ministração/i.test(section),
      chords: pending.map(({ chord, column }) => ({ chord, column: column - indent })),
    });
    pending = [];
  }
  return result;
}

export function normalizeLyric(text: string): string {
  return text.normalize('NFC').replace(/[’‘]/g, "'").toLocaleLowerCase('pt-BR');
}

// Explicitly permitted ornament families. Never compare by slash bass or transpose roots.
const ornaments = new Set([
  '',
  '2',
  '4',
  '5',
  '6',
  '7',
  '9',
  '7(4)',
  '9(11)',
  '4(6)',
  '7(4/9)',
  '7M',
  '7M(9)',
  'sus4',
  'add9',
  'maj7',
  'm',
  'm7',
  'm9',
  'm7(9)',
  'm7(11)',
]);
function chordFamily(chord: string): string | undefined {
  const match = chord.match(/^([A-G][#b]?)(.*?)(?:\/[A-G][#b]?)?$/);
  if (!match || !ornaments.has(match[2])) return undefined;
  return `${match[1]}:${/^m(?!aj)/.test(match[2]) ? 'minor' : 'major-or-suspended'}`;
}

export function chordMatch(source: string, existing: string): 'exact' | 'ornament' | undefined {
  if (source === existing) return 'exact';
  const family = chordFamily(source);
  return family && family === chordFamily(existing) ? 'ornament' : undefined;
}

export interface ExistingChord {
  chord: string;
  beat: number;
  bar: number;
  event: number;
  section: string;
  passage: number;
}

export function existingChordTimeline(chart: SongVersion): ExistingChord[] {
  let beat = 0;
  return buildChartGroups(chart).flatMap((group) =>
    group.bars.flatMap(({ bar, playbackIndex }) =>
      bar.events.map((event, index) => {
        const item = {
          chord: event.chord,
          beat,
          bar: playbackIndex,
          event: index,
          section: group.title,
          passage: group.passage,
        };
        beat += event.beats;
        return item;
      }),
    ),
  );
}

/** A chord printed in whitespace belongs to the following syllable, never to a blank glyph. */
export function syllableAtColumn(text: string, column: number): number | undefined {
  if (column < 0 || column >= text.length) return undefined;
  while (column < text.length && !/\p{L}/u.test(text[column])) column++;
  if (column >= text.length) return undefined;
  return splitLyricSyllables(text).find((part) => part.from <= column && part.to > column)?.from;
}

export interface AlignmentAnchor {
  from: number;
  beat: number;
  column: number;
  sourceChord: string;
  existingChord: string;
  bar: number;
  event: number;
  match: 'exact' | 'ornament';
}
export interface AlignmentResult {
  sourceLine?: number;
  sourceSection?: string;
  anchors: AlignmentAnchor[];
  pending: { chord?: string; column?: number; reason: string }[];
}

function sectionKind(section: string): string {
  if (/pré-refrão|preparação/i.test(section)) return 'pre';
  if (/refrão/i.test(section)) return 'chorus';
  if (/ponte/i.test(section)) return 'bridge';
  if (/estrofe|verso|parte|seja a honra/i.test(section)) return 'verse';
  if (/final|encerramento|coda/i.test(section)) return 'ending';
  return 'other';
}

/** Only attach written syllables to compatible events already inside this phrase's window. */
export function alignLyricCue(
  cue: LyricCue,
  timeline: ExistingChord[],
  references: ReferenceLine[],
  occurrence = 0,
): AlignmentResult {
  // A repeated strum of an unchanged chord is not evidence of a new written harmonic change.
  const events = timeline.filter(
    (event, index) =>
      event.beat >= cue.startBeat &&
      event.beat < cue.endBeat &&
      (event.beat === cue.startBeat || timeline[index - 1]?.chord !== event.chord),
  );
  const candidates = references.filter(
    (line) => normalizeLyric(line.text) === normalizeLyric(cue.text),
  );
  const currentSection = timeline.findLast((event) => event.beat <= cue.startBeat)?.section ?? '';
  if (!candidates.length) return { anchors: [], pending: [{ reason: 'phrase-not-in-reference' }] };
  const estimated = estimateLyricSyllables({
    text: cue.text,
    startBeat: cue.startBeat,
    endBeat: cue.endBeat,
  });
  const plans = candidates.map((line, lineIndex) => {
    const pending: AlignmentResult['pending'] = [];
    const tokens = line.chords.map((token) => ({
      ...token,
      from: syllableAtColumn(line.text, token.column),
    }));
    type Path = {
      anchors: AlignmentAnchor[];
      delayedStart: number;
      exact: number;
      distance: number;
    };
    const better = (a: Path, b: Path) =>
      a.anchors.length !== b.anchors.length
        ? a.anchors.length > b.anchors.length
        : a.delayedStart !== b.delayedStart
          ? a.delayedStart < b.delayedStart
          : a.exact !== b.exact
            ? a.exact > b.exact
            : a.distance < b.distance;
    const memo = new Map<string, Path>();
    const solve = (tokenIndex: number, afterEvent: number, afterFrom: number): Path => {
      const key = `${tokenIndex}:${afterEvent}:${afterFrom}`;
      if (memo.has(key)) return memo.get(key)!;
      if (tokenIndex >= tokens.length || line.free)
        return { anchors: [], delayedStart: 0, exact: 0, distance: 0 };
      const token = tokens[tokenIndex];
      let best = solve(tokenIndex + 1, afterEvent, afterFrom);
      if (token.from !== undefined && token.from > afterFrom) {
        for (let e = afterEvent + 1; e < events.length; e++) {
          const event = events[e];
          const match = chordMatch(token.chord, event.chord);
          if (!match || (token.from > 0 && event.beat <= cue.startBeat)) continue;
          const tail = solve(tokenIndex + 1, e, token.from);
          const path: Path = {
            anchors: [
              {
                from: token.from,
                beat: event.beat,
                column: token.column,
                sourceChord: token.chord,
                existingChord: event.chord,
                bar: event.bar,
                event: event.event,
                match,
              },
              ...tail.anchors,
            ],
            // With equally complete matches, a chord under an interior syllable is stronger
            // evidence than inventing a vocal rest just to match an earlier chord literally.
            delayedStart:
              tail.delayedStart + Number(token.from === 0 && event.beat > cue.startBeat),
            exact: tail.exact + Number(match === 'exact'),
            distance:
              tail.distance +
              Math.abs(event.beat - estimated.find((s) => s.from === token.from)!.startBeat),
          };
          if (better(path, best)) best = path;
        }
      }
      memo.set(key, best);
      return best;
    };
    const path = solve(0, -1, -1);
    if (line.free) pending.push({ reason: 'free-vocal-passage' });
    else if (!tokens.length) pending.push({ reason: 'no-written-chord-onset' });
    else
      for (const token of tokens) {
        if (path.anchors.some((a) => a.column === token.column)) continue;
        const atStart = events.find(
          (event) => event.beat === cue.startBeat && chordMatch(token.chord, event.chord),
        );
        pending.push({
          chord: token.chord,
          column: token.column,
          reason:
            token.from === undefined
              ? 'outside-lyric'
              : token.from > 0 && atStart
                ? 'pickup-before-phrase-window'
                : 'no-compatible-ordered-event',
        });
      }
    return {
      line,
      lineIndex,
      path,
      pending,
      sameSection: Number(sectionKind(line.section) === sectionKind(currentSection)),
    };
  });
  plans.sort(
    (a, b) =>
      b.path.anchors.length - a.path.anchors.length ||
      b.sameSection - a.sameSection ||
      a.path.delayedStart - b.path.delayedStart ||
      b.path.exact - a.path.exact ||
      a.path.distance - b.path.distance ||
      Math.abs(a.lineIndex - occurrence) - Math.abs(b.lineIndex - occurrence) ||
      a.line.line - b.line.line,
  );
  const chosen = plans[0];
  // Do not arbitrarily select one of two equally supported, differently timed chord placements.
  const ambiguous = plans.some(
    (other) =>
      other !== chosen &&
      other.path.anchors.length === chosen.path.anchors.length &&
      other.sameSection === chosen.sameSection &&
      other.path.delayedStart === chosen.path.delayedStart &&
      other.path.exact === chosen.path.exact &&
      Math.abs(other.path.distance - chosen.path.distance) < 1e-7 &&
      Math.abs(other.lineIndex - occurrence) === Math.abs(chosen.lineIndex - occurrence) &&
      JSON.stringify(other.path.anchors.map(({ from, beat }) => ({ from, beat }))) !==
        JSON.stringify(chosen.path.anchors.map(({ from, beat }) => ({ from, beat }))),
  );
  return {
    sourceLine: chosen.line.line,
    sourceSection: chosen.line.section,
    anchors: ambiguous ? [] : chosen.path.anchors,
    pending: ambiguous ? [{ reason: 'ambiguous-reference-occurrence' }] : chosen.pending,
  };
}
