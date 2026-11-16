import type { LyricCue } from '../../src/components/music/chart-lyrics';
import {
  estimateLyricSyllables,
  lyricSyllableWeights,
  splitLyricSyllables,
} from '../../src/components/music/lyric-syllables';

const EPSILON = 1e-7;
const original = (cue: LyricCue) => cue.scoreWindow ?? cue;
const manual = (cue: LyricCue) => cue.syllables?.some((part) => part.timing === 'manual') ?? false;

export interface LyricWindowAdjustment {
  cue: number;
  startBeat: number;
  endBeat: number;
  scoreWindow: { startBeat: number; endBeat: number };
}

/**
 * Reflow only vocal windows around fixed harmonic onsets; score events never enter here.
 * Breaths shorter than four pulses keep their duration as movable slots between phrases.
 * Longer instrumental gaps and manually timed phrases delimit independent vocal blocks.
 */
export function retimeLyricCues(
  input: LyricCue[],
  totalBeats: number,
): {
  cues: LyricCue[];
  adjustments: LyricWindowAdjustment[];
} {
  const cues = input.map((cue) => {
    const { chordAnchors, scoreWindow, ...rest } = cue;
    return {
      ...rest,
      scoreWindow: {
        startBeat: (scoreWindow ?? cue).startBeat,
        endBeat: (scoreWindow ?? cue).endBeat,
      },
      ...(chordAnchors ? { chordAnchors } : {}),
    };
  });
  const adjustments: LyricWindowAdjustment[] = [];
  for (let begin = 0; begin < cues.length;) {
    if (manual(cues[begin])) {
      begin++;
      continue;
    }
    let end = begin + 1;
    while (
      end < cues.length &&
      !manual(cues[end]) &&
      original(cues[end]).startBeat - original(cues[end - 1]).endBeat < 4 - EPSILON
    )
      end++;
    const block = cues.slice(begin, end);
    const weights: number[] = [];
    const offsets = [0];
    const gaps = new Map<number, number>();
    const anchors: { index: number; beat: number }[] = [];
    for (const [cueIndex, cue] of block.entries()) {
      const parts = splitLyricSyllables(cue.text);
      const offset = weights.length;
      if (cueIndex)
        gaps.set(offset, original(cue).startBeat - original(block[cueIndex - 1]).endBeat);
      weights.push(...lyricSyllableWeights(cue.text, parts));
      for (const anchor of cue.chordAnchors ?? []) {
        const index = parts.findIndex((part) => part.from === anchor.from);
        if (index < 0) throw new Error(`Âncora fora de sílaba: ${cue.text}`);
        anchors.push({ index: offset + index, beat: anchor.beat });
      }
      offsets.push(weights.length);
    }
    if (!weights.length) throw new Error(`Bloco vocal vazio na frase ${begin}.`);
    const cumulative = [0];
    for (const weight of weights) cumulative.push(cumulative.at(-1)! + weight);
    const cumulativeGaps = [0];
    for (let index = 1; index <= weights.length; index++)
      cumulativeGaps.push(cumulativeGaps.at(-1)! + (gaps.get(index) ?? 0));
    const originalStart = original(block[0]).startBeat;
    const finish = original(block.at(-1)!).endBeat;
    const lower = begin ? cues[begin - 1].endBeat : 0;
    let start = originalStart;
    const first = anchors[0];
    if (first?.index === 0) start = first.beat;
    else if (first && first.beat <= originalStart + EPSILON) {
      const next = anchors[1];
      const firstCueWeight = cumulative[offsets[1]];
      const pace = next
        ? (next.beat - first.beat - cumulativeGaps[next.index] + cumulativeGaps[first.index]) /
          (cumulative[next.index] - cumulative[first.index])
        : (original(block[0]).endBeat - originalStart) / firstCueWeight;
      start = Math.max(
        lower,
        first.beat - cumulative[first.index] * pace - cumulativeGaps[first.index],
      );
    }
    if (start < lower - EPSILON || start < 0 || finish > totalBeats + EPSILON)
      throw new Error(`Bloco ${begin} ultrapassa uma pausa, frase manual ou o arranjo.`);
    const knots = [
      { index: 0, beat: start },
      ...anchors,
      { index: weights.length, beat: finish },
    ].filter(
      (knot, index, all) =>
        !index || knot.index !== all[index - 1].index || knot.beat !== all[index - 1].beat,
    );
    const times: number[] = [];
    for (let knot = 1; knot < knots.length; knot++) {
      const left = knots[knot - 1],
        right = knots[knot];
      if (right.index <= left.index || right.beat <= left.beat)
        throw new Error(
          `Âncoras incompatíveis no bloco ${begin}: ${JSON.stringify([left, right])}.`,
        );
      const sum = cumulative[right.index] - cumulative[left.index];
      const span =
        right.beat - left.beat - cumulativeGaps[right.index] + cumulativeGaps[left.index];
      if (span <= 0) throw new Error(`As pausas não cabem entre as âncoras no bloco ${begin}.`);
      for (let index = left.index; index <= right.index; index++) {
        times[index] =
          index === right.index
            ? right.beat
            : left.beat +
              (span * (cumulative[index] - cumulative[left.index])) / sum +
              cumulativeGaps[index] -
              cumulativeGaps[left.index];
      }
    }
    block.forEach((cue, index) => {
      cue.startBeat = times[offsets[index]];
      cue.endBeat = times[offsets[index + 1]] - (gaps.get(offsets[index + 1]) ?? 0);
      // Estimated caches are derived data. Manual units never enter a reflow block.
      delete cue.syllables;
      const estimated = estimateLyricSyllables(cue);
      estimated.forEach((unit, unitIndex) => {
        const at = offsets[index] + unitIndex;
        if (
          Math.abs(unit.startBeat - times[at]) > EPSILON ||
          Math.abs(unit.endBeat - (times[at + 1] - (gaps.get(at + 1) ?? 0))) > EPSILON
        )
          throw new Error(`A interpolação local divergiu do bloco na frase ${begin + index}.`);
      });
      if (
        Math.abs(cue.startBeat - cue.scoreWindow.startBeat) > EPSILON ||
        Math.abs(cue.endBeat - cue.scoreWindow.endBeat) > EPSILON
      )
        adjustments.push({
          cue: begin + index,
          startBeat: cue.startBeat,
          endBeat: cue.endBeat,
          scoreWindow: cue.scoreWindow,
        });
    });
    begin = end;
  }
  return { cues, adjustments };
}
