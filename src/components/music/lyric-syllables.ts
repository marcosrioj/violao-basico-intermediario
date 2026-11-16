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

/** Shared by offline vocal-block retiming and the browser's per-phrase interpolation. */
export function lyricSyllableWeights(text: string, parts = splitLyricSyllables(text)): number[] {
  return parts.map((part, index) => {
    const syllable = text.slice(part.from, part.to);
    return index === parts.length - 1 ? 2 : /[áéíóúâêôãõ]/i.test(syllable) ? 1.25 : 1;
  });
}

/** Chord anchors fix compatible written onsets; durations between anchors are still estimates. */
export function estimateLyricSyllables(cue: LyricCue): LyricSyllable[] {
  const parts = splitLyricSyllables(cue.text);
  const weights = lyricSyllableWeights(cue.text, parts);
  const knots = [{ index: 0, beat: cue.startBeat }];
  for (const anchor of cue.chordAnchors ?? []) {
    const index = parts.findIndex((part) => part.from === anchor.from);
    if (index < 0) throw new RangeError('A âncora deve coincidir com o início de uma sílaba.');
    if (index === 0) knots[0] = { index, beat: anchor.beat };
    else knots.push({ index, beat: anchor.beat });
  }
  knots.push({ index: parts.length, beat: cue.endBeat });
  const result: LyricSyllable[] = [];
  for (let segment = 0; segment < knots.length - 1; segment++) {
    const left = knots[segment];
    const right = knots[segment + 1];
    const total = weights.slice(left.index, right.index).reduce((sum, value) => sum + value, 0);
    let position = left.beat;
    for (let index = left.index; index < right.index; index++) {
      const startBeat = position;
      position =
        index === right.index - 1
          ? right.beat
          : position + ((right.beat - left.beat) * weights[index]) / total;
      result.push({ ...parts[index], startBeat, endBeat: position, timing: 'estimated' });
    }
  }
  return result;
}

export function withLyricSyllables(cues: LyricCue[]): LyricCue[] {
  return cues.map((cue) => ({ ...cue, syllables: cue.syllables ?? estimateLyricSyllables(cue) }));
}
