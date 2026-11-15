import boundaries from '@/content/lyric-syllable-boundaries.json';
import type { LyricCue, LyricSyllable } from './chart-lyrics';

const words = boundaries as Record<string, number[]>;

/** Written Portuguese boundaries; singing may join vowels or sustain a syllable differently. */
export function splitLyricSyllables(text: string): { from: number; to: number }[] {
  const starts: number[] = [];
  for (const match of text.matchAll(/\p{L}+(?:[’']\p{L}+)*/gu)) {
    starts.push(match.index);
    for (const offset of words[match[0].toLocaleLowerCase('pt-BR')] ?? [])
      starts.push(match.index + offset);
  }
  if (!starts.length) return text ? [{ from: 0, to: text.length }] : [];
  starts[0] = 0;
  return starts.map((from, index) => ({ from, to: starts[index + 1] ?? text.length }));
}

/** Preview only: phrase boundaries are known, but vocal syllable durations have not been measured. */
export function estimateLyricSyllables(cue: LyricCue): LyricSyllable[] {
  const parts = splitLyricSyllables(cue.text);
  const weights = parts.map((part, index) => {
    const text = cue.text.slice(part.from, part.to);
    return index === parts.length - 1 ? 2 : /[áéíóúâêôãõ]/i.test(text) ? 1.25 : 1;
  });
  const total = weights.reduce((sum, value) => sum + value, 0);
  let position = cue.startBeat;
  return parts.map((part, index) => {
    const startBeat = position;
    position =
      index === parts.length - 1
        ? cue.endBeat
        : position + ((cue.endBeat - cue.startBeat) * weights[index]) / total;
    return { ...part, startBeat, endBeat: position, timing: 'estimated' };
  });
}

export function withLyricSyllables(cues: LyricCue[]): LyricCue[] {
  return cues.map((cue) => ({ ...cue, syllables: cue.syllables ?? estimateLyricSyllables(cue) }));
}
