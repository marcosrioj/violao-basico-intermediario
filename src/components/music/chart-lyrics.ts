import type { ChartBar, SongVersion } from '@/content/types';
import { buildChartGroups, type ChartGroup } from './chart-layout';

/** Absolute pulses in the full written arrangement; an explicit end preserves vocal rests. */
export interface LyricSyllable {
  /** Character offsets in the unchanged phrase, including adjacent spaces/punctuation. */
  from: number;
  to: number;
  startBeat: number;
  endBeat: number;
  timing: 'estimated' | 'manual';
}

export interface LyricCue {
  text: string;
  startBeat: number;
  endBeat: number;
  syllables?: LyricSyllable[];
}

export interface ProjectedLyricCue extends LyricCue {
  /** Index in the original cue list, including when a selection clips the line. */
  id: number;
  /** Inclusive bar indexes in the selected playback sequence. */
  startBar: number;
  endBar: number;
}

const EPSILON = 1e-7;

export function totalChartBeats(bars: ChartBar[]): number {
  return bars.reduce(
    (total, bar) => total + bar.events.reduce((sum, event) => sum + event.beats, 0),
    0,
  );
}

/** Validate imported/local data without guessing timings from the length of a sentence. */
export function validateLyricCues(input: unknown, totalBeats: number): LyricCue[] {
  if (!Number.isFinite(totalBeats) || totalBeats < 0)
    throw new RangeError('A duração do arranjo em pulsos é inválida.');
  if (!Array.isArray(input))
    throw new TypeError('A letra sincronizada deve ser uma lista de frases.');
  if (input.length > 1000) throw new RangeError('Use até 1.000 frases por arranjo.');
  let previousEnd = 0;
  return input.map((value: unknown, index) => {
    const label = `Frase ${index + 1}`;
    if (value === null || typeof value !== 'object' || Array.isArray(value))
      throw new TypeError(`${label}: informe texto, pulso inicial e pulso final.`);
    const cue = value as Record<string, unknown>;
    if (typeof cue.text !== 'string' || !cue.text.trim())
      throw new TypeError(`${label}: o texto não pode ficar vazio.`);
    if (cue.text.length > 6000)
      throw new RangeError(`${label}: divida textos longos em frases de até 6.000 caracteres.`);
    if (
      typeof cue.startBeat !== 'number' ||
      typeof cue.endBeat !== 'number' ||
      !Number.isFinite(cue.startBeat) ||
      !Number.isFinite(cue.endBeat)
    )
      throw new TypeError(`${label}: os pulsos inicial e final devem ser números finitos.`);
    if (cue.startBeat < 0 || cue.endBeat <= cue.startBeat)
      throw new RangeError(`${label}: o início deve ser zero ou maior, e o final deve vir depois.`);
    if (cue.endBeat > totalBeats + EPSILON || cue.startBeat >= totalBeats)
      throw new RangeError(`${label}: os pulsos ultrapassam o final do arranjo.`);
    if (cue.startBeat < previousEnd)
      throw new RangeError(
        `${label}: ordene as frases por início e evite sobrepor seus intervalos.`,
      );
    const endBeat = Math.min(cue.endBeat, totalBeats);
    previousEnd = endBeat;
    const checked: LyricCue = { text: cue.text.trim(), startBeat: cue.startBeat, endBeat };
    if (cue.syllables !== undefined) {
      if (cue.text !== checked.text)
        throw new RangeError(`${label}: remova espaços externos antes de marcar sílabas.`);
      if (!Array.isArray(cue.syllables) || !cue.syllables.length || cue.syllables.length > 2000)
        throw new RangeError(`${label}: informe uma lista de até 2.000 sílabas.`);
      let previousChar = 0;
      let previousBeat = checked.startBeat;
      checked.syllables = cue.syllables.map((value: unknown, index) => {
        const at = `${label}, sílaba ${index + 1}`;
        if (!value || typeof value !== 'object') throw new TypeError(`${at}: marcação inválida.`);
        const syllable = value as Record<string, unknown>;
        const { from, to, startBeat, endBeat, timing } = syllable;
        if (
          typeof from !== 'number' ||
          typeof to !== 'number' ||
          !Number.isInteger(from) ||
          !Number.isInteger(to) ||
          from !== previousChar ||
          to <= from ||
          to > checked.text.length
        )
          throw new RangeError(`${at}: a divisão deve preservar o texto inteiro e sua ordem.`);
        if (
          typeof startBeat !== 'number' ||
          typeof endBeat !== 'number' ||
          !Number.isFinite(startBeat) ||
          !Number.isFinite(endBeat) ||
          startBeat < previousBeat - EPSILON ||
          endBeat <= startBeat ||
          endBeat > checked.endBeat + EPSILON
        )
          throw new RangeError(`${at}: confira entrada, saída e sobreposição dentro da frase.`);
        if (timing !== 'manual' && timing !== 'estimated')
          throw new TypeError(`${at}: indique se a marcação é manual ou estimada.`);
        previousChar = to;
        previousBeat = endBeat;
        return { from, to, startBeat, endBeat: Math.min(endBeat, checked.endBeat), timing };
      });
      if (previousChar !== checked.text.length)
        throw new RangeError(`${label}: a divisão em sílabas está incompleta.`);
    }
    return checked;
  });
}

interface BeatBar {
  start: number;
  end: number;
  index: number;
}

/**
 * Project full-arrangement cues onto the chosen sequence. Repeated occurrences retain
 * their own lyrics; an isolated section uses only its first occurrence in the full form.
 */
export function projectLyricCues(
  chart: SongVersion,
  groups: ChartGroup[],
  cues: LyricCue[],
): ProjectedLyricCue[] {
  let sourceBeat = 0;
  const sourceGroups = buildChartGroups(chart).map((group) => {
    const start = sourceBeat;
    sourceBeat += totalChartBeats(group.bars.map(({ bar }) => bar));
    return { key: group.key, sectionId: group.sectionId, start, end: sourceBeat };
  });
  let playbackBeat = 0;
  const spans = groups.flatMap((group) => {
    const start = playbackBeat;
    const bars: BeatBar[] = group.bars.map(({ bar, playbackIndex }) => {
      const barStart = playbackBeat;
      playbackBeat += totalChartBeats([bar]);
      return { start: barStart, end: playbackBeat, index: playbackIndex };
    });
    const source =
      sourceGroups.find((part) => part.key === group.key) ??
      sourceGroups.find((part) => part.sectionId === group.sectionId);
    return source ? [{ source, start, end: playbackBeat, bars }] : [];
  });
  const projected: (ProjectedLyricCue & { sourceEnd: number })[] = [];
  for (const span of spans) {
    cues.forEach((cue, id) => {
      const sourceStart = Math.max(cue.startBeat, span.source.start);
      const sourceEnd = Math.min(cue.endBeat, span.source.end);
      if (sourceEnd <= sourceStart) return;
      const shift = span.start - span.source.start;
      const startBeat = sourceStart + shift;
      const endBeat = Math.min(sourceEnd + shift, span.end);
      const touched = span.bars.filter((bar) => bar.end > startBeat && bar.start < endBeat);
      if (!touched.length) return;
      const previous = projected.at(-1);
      if (
        previous?.id === id &&
        Math.abs(previous.endBeat - startBeat) < EPSILON &&
        Math.abs(previous.sourceEnd - sourceStart) < EPSILON
      ) {
        previous.endBeat = endBeat;
        previous.endBar = touched.at(-1)!.index;
        previous.sourceEnd = sourceEnd;
      } else {
        projected.push({
          id,
          text: cue.text,
          startBeat,
          endBeat,
          startBar: touched[0].index,
          endBar: touched.at(-1)!.index,
          sourceEnd,
          ...(cue.syllables
            ? {
                syllables: cue.syllables.map((syllable) => ({
                  ...syllable,
                  startBeat: syllable.startBeat + shift,
                  endBeat: syllable.endBeat + shift,
                })),
              }
            : {}),
        });
      }
    });
  }
  return projected.map(({ id, text, startBeat, endBeat, startBar, endBar, syllables }) => ({
    id,
    text,
    startBeat,
    endBeat,
    startBar,
    endBar,
    ...(syllables ? { syllables } : {}),
  }));
}

/** Save per musical arrangement, so lessons at different study tempos share the same cues. */
export function chartLyricsKey(chart: SongVersion, songId: string): string {
  const definition = JSON.stringify({
    key: chart.key,
    meter: chart.meter,
    beatsPerBar: chart.beats_per_bar,
    beatUnit: chart.beat_unit,
    subdivisions: chart.subdivisions_per_beat,
    order: chart.order.map(({ section, repeat }) => ({ section, repeat })),
    sections: chart.sections.map(({ id, bars }) => ({
      id,
      bars: bars.map((bar) => ({
        meter: bar.meter,
        beatsPerBar: bar.beats_per_bar,
        events: bar.events.map(({ chord, beats }) => ({ chord, beats })),
      })),
    })),
  });
  // Two 32-bit accumulators keep this small, synchronous and browser-compatible.
  let first = 0x811c9dc5;
  let second = 0x9e3779b9;
  for (let index = 0; index < definition.length; index++) {
    const code = definition.charCodeAt(index);
    first = Math.imul(first ^ code, 0x01000193);
    second = Math.imul(second ^ code, 0x85ebca6b);
  }
  const fingerprint = [first, second]
    .map((hash) => (hash >>> 0).toString(16).padStart(8, '0'))
    .join('');
  return `violao-vivo:chart-lyrics:v1:${songId}:${fingerprint}`;
}
