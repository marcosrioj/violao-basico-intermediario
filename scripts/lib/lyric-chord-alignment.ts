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
  if (/final|encerramento|coda/i.test(section)) return 'ending';
  if (/estrofe|verso|parte|seja a honra/i.test(section)) return 'verse';
  return 'other';
}

const EPSILON = 1e-7;
const scoreWindow = (cue: LyricCue) => cue.scoreWindow ?? cue;
const isManual = (cue: LyricCue) =>
  cue.syllables?.some((part) => part.timing === 'manual') ?? false;

interface Score {
  count: number;
  section: number;
  sourceOrder: number;
  delayedStart: number;
  distance: number;
  exact: number;
  occurrence: number;
}
function better(a: Score, b: Score): boolean {
  return a.count !== b.count
    ? a.count > b.count
    : a.section !== b.section
      ? a.section > b.section
      : a.sourceOrder !== b.sourceOrder
        ? a.sourceOrder < b.sourceOrder
        : a.delayedStart !== b.delayedStart
          ? a.delayedStart < b.delayedStart
          : Math.abs(a.distance - b.distance) > EPSILON
            ? a.distance < b.distance
            : a.exact !== b.exact
              ? a.exact > b.exact
              : a.occurrence < b.occurrence;
}
interface Route extends Score {
  lastEvent: number;
  line?: ReferenceLine;
  group: string;
  kind: string;
  anchors: AlignmentAnchor[];
  previous?: Route;
  cueIndex: number;
  ambiguous: number[];
}
const initialRoute: Route = {
  count: 0,
  section: 0,
  sourceOrder: 0,
  delayedStart: 0,
  distance: 0,
  exact: 0,
  occurrence: 0,
  lastEvent: -1,
  group: '',
  kind: 'other',
  anchors: [],
  cueIndex: -1,
  ambiguous: [],
};

function retain<T extends Route>(routes: Map<string, T>, key: string, candidate: T): void {
  const existing = routes.get(key);
  if (!existing || better(candidate, existing)) {
    routes.set(key, candidate);
    return;
  }
  if (better(existing, candidate)) return;
  const ambiguous = new Set([...existing.ambiguous, ...candidate.ambiguous]);
  let left: Route | undefined = existing,
    right: Route | undefined = candidate;
  while (left && right && left.cueIndex >= 0) {
    if (
      JSON.stringify(left.anchors.map(({ from, beat }) => [from, beat])) !==
      JSON.stringify(right.anchors.map(({ from, beat }) => [from, beat]))
    )
      ambiguous.add(left.cueIndex);
    left = left.previous;
    right = right.previous;
  }
  routes.set(key, { ...existing, ambiguous: [...ambiguous] });
}

/**
 * Match the written source jointly across each vocal block. Vocal windows may move; the
 * expanded chord timeline never does. Neighbouring phrases cannot steal or reuse an event.
 */
export function alignLyricArrangement(
  cues: LyricCue[],
  timeline: ExistingChord[],
  references: ReferenceLine[],
  firstOccurrence = 0,
): AlignmentResult[] {
  if (!cues.length) return [];
  const bars = timeline.filter((event, index) => timeline[index - 1]?.bar !== event.bar);
  const occurrences = new Map<string, number>();
  const output: AlignmentResult[] = [];
  let blockStart = 0;
  while (blockStart < cues.length) {
    if (isManual(cues[blockStart])) {
      const key = normalizeLyric(cues[blockStart].text);
      occurrences.set(key, (occurrences.get(key) ?? firstOccurrence) + 1);
      output.push({ anchors: [], pending: [{ reason: 'explicit-syllables-preserved' }] });
      blockStart++;
      continue;
    }
    let blockEnd = blockStart + 1;
    while (
      blockEnd < cues.length &&
      !isManual(cues[blockEnd]) &&
      scoreWindow(cues[blockEnd]).startBeat - scoreWindow(cues[blockEnd - 1]).endBeat < 4 - EPSILON
    )
      blockEnd++;
    const lowerLimit = blockStart ? scoreWindow(cues[blockStart - 1]).endBeat : 0;
    const upperLimit = scoreWindow(cues[blockEnd - 1]).endBeat;
    let routes = new Map<string, Route>([['initial', initialRoute]]);
    const considered: {
      events: { event: ExistingChord; index: number }[];
    }[] = [];
    for (let cueIndex = blockStart; cueIndex < blockEnd; cueIndex++) {
      const cue = cues[cueIndex],
        window = scoreWindow(cue);
      const current = timeline.findLast((event) => event.beat <= window.startBeat);
      const group = `${current?.section ?? ''}:${current?.passage ?? 0}`;
      const kind = sectionKind(current?.section ?? '');
      const startBar = Math.max(
        0,
        bars.findLastIndex((event) => event.beat <= window.startBeat),
      );
      const endBar = Math.max(
        0,
        bars.findLastIndex((event) => event.beat < window.endBeat - EPSILON),
      );
      const lower = Math.max(lowerLimit, bars[Math.max(0, startBar - 1)]?.beat ?? lowerLimit);
      const upper = Math.min(upperLimit, bars[endBar + 2]?.beat ?? upperLimit);
      const events = timeline
        .map((event, index) => ({ event, index }))
        .filter(({ event }) => event.beat >= lower && event.beat < upper - EPSILON);
      const key = normalizeLyric(cue.text);
      const occurrence = occurrences.get(key) ?? firstOccurrence;
      occurrences.set(key, occurrence + 1);
      const allLines = references.filter((line) => normalizeLyric(line.text) === key);
      // Keep distinct harmonic/section patterns; identical printed repetitions differ only in provenance.
      const patterns = new Map<string, { line: ReferenceLine; ordinal: number }>();
      allLines.forEach((line, ordinal) => {
        const signature = JSON.stringify([line.section, line.free, line.chords]);
        const previous = patterns.get(signature);
        if (!previous || Math.abs(ordinal - occurrence) < Math.abs(previous.ordinal - occurrence))
          patterns.set(signature, { line, ordinal });
      });
      const candidates = [...patterns.values()];
      const nominal = estimateLyricSyllables({
        text: cue.text,
        startBeat: window.startBeat,
        endBeat: window.endBeat,
      });
      const nextRoutes = new Map<string, Route>();
      considered.push({ events });
      const options = candidates.length ? candidates : [{ line: undefined, ordinal: occurrence }];
      for (const { line, ordinal } of options) {
        const tokens =
          line?.chords.map((token) => ({
            ...token,
            from: syllableAtColumn(cue.text, token.column),
          })) ?? [];
        const firstVocal = tokens.findIndex((token) => token.from !== undefined);
        type Local = Route & { afterFrom: number };
        let states = new Map<string, Local>();
        for (const previous of routes.values()) {
          const state: Local = {
            ...previous,
            previous,
            group,
            kind,
            line,
            anchors: [],
            afterFrom: -1,
            cueIndex,
            section:
              previous.section +
              Number(
                Boolean(line && sectionKind(line.section) === sectionKind(current?.section ?? '')),
              ),
            sourceOrder:
              previous.sourceOrder +
              Number(
                Boolean(
                  line &&
                  previous.line &&
                  (previous.group === group || (kind === 'ending' && previous.kind === kind)) &&
                  ((previous.line.section === line.section && line.line <= previous.line.line) ||
                    (previous.line.section !== line.section &&
                      sectionKind(previous.line.section) === sectionKind(line.section))),
                ),
              ),
            occurrence: previous.occurrence + Math.abs(ordinal - occurrence),
          };
          const stateKey = `${state.lastEvent}:-1`;
          retain(states, stateKey, state);
        }
        if (!line?.free)
          for (const [tokenIndex, token] of tokens.entries()) {
            if (token.from === undefined) continue;
            const following = new Map(states);
            for (const state of states.values()) {
              if (token.from <= state.afterFrom) continue;
              for (const { event, index } of events) {
                if (index <= state.lastEvent) continue;
                if (cueIndex === blockStart && token.from > 0 && event.beat <= lowerLimit + EPSILON)
                  continue;
                const match = chordMatch(token.chord, event.chord);
                if (!match) continue;
                // A newly printed lyric line may enter over a repeated strum. An interior token
                // cannot turn a sustained, unchanged chord into a different harmonic change.
                if (timeline[index - 1]?.chord === event.chord) {
                  if (tokenIndex !== firstVocal) continue;
                  // If this printed entry already has a harmonic onset in its score cell,
                  // its later strums sustain that entry. Mid-bar lyric pickups may instead
                  // enter on a reattack when the actual change preceded the score cell.
                  if (
                    timeline.some(
                      (earlier, at) =>
                        earlier.beat >= window.startBeat &&
                        earlier.beat < event.beat &&
                        chordMatch(token.chord, earlier.chord) &&
                        timeline[at - 1]?.chord !== earlier.chord,
                    )
                  )
                    continue;
                }
                const candidate: Local = {
                  ...state,
                  lastEvent: index,
                  afterFrom: token.from,
                  count: state.count + 1,
                  delayedStart:
                    state.delayedStart + Number(token.from === 0 && event.beat > window.startBeat),
                  distance:
                    state.distance +
                    Math.abs(
                      event.beat - nominal.find((unit) => unit.from === token.from)!.startBeat,
                    ),
                  exact: state.exact + Number(match === 'exact'),
                  anchors: [
                    ...state.anchors,
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
                  ],
                };
                const stateKey = `${index}:${token.from}`;
                retain(following, stateKey, candidate);
              }
            }
            states = following;
          }
        for (const state of states.values()) {
          const stateKey = `${state.lastEvent}:${line?.line ?? 0}`;
          retain(nextRoutes, stateKey, state);
        }
      }
      routes = nextRoutes;
    }
    const finalists = new Map<string, Route>();
    for (const route of routes.values()) retain(finalists, 'best', route);
    let best = finalists.get('best');
    const ambiguous = best?.ambiguous ?? [];
    const chosen: Route[] = [];
    while (best?.previous) {
      chosen.unshift(best);
      best = best.previous;
    }
    chosen.forEach((route, localIndex) => {
      const cue = cues[blockStart + localIndex],
        line = route.line;
      const pending: AlignmentResult['pending'] = [];
      if (ambiguous.includes(blockStart + localIndex))
        pending.push({ reason: 'ambiguous-reference-occurrence' });
      if (!line) pending.push({ reason: 'phrase-not-in-reference' });
      else if (line.free) pending.push({ reason: 'free-vocal-passage' });
      else if (!line.chords.length) pending.push({ reason: 'no-written-chord-onset' });
      else
        for (const token of line.chords) {
          if (route.anchors.some((anchor) => anchor.column === token.column)) continue;
          const from = syllableAtColumn(cue.text, token.column);
          const compatible = considered[localIndex].events.some(({ event }) =>
            chordMatch(token.chord, event.chord),
          );
          pending.push({
            ...token,
            reason:
              from === undefined
                ? 'outside-lyric'
                : route.anchors.some((anchor) => anchor.from === from)
                  ? 'multiple-chords-on-one-syllable'
                  : compatible
                    ? 'conflicting-source-order-or-sustained-chord'
                    : 'no-compatible-chord-in-context',
          });
        }
      output.push({
        ...(line ? { sourceLine: line.line, sourceSection: line.section } : {}),
        anchors: route.anchors,
        pending,
      });
    });
    blockStart = blockEnd;
  }
  return output;
}

/** Single-phrase inspection; whole-arrangement generation uses the joint matcher above. */
export function alignLyricCue(
  cue: LyricCue,
  timeline: ExistingChord[],
  references: ReferenceLine[],
  occurrence = 0,
): AlignmentResult {
  return alignLyricArrangement([cue], timeline, references, occurrence)[0];
}
