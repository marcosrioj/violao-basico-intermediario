/** Design thresholds for reflection, not validated measures of instrumental ability. */
export const RHYTHM_TAP_COUNT = 8;
export const RHYTHM_TEMPO_TOLERANCE = 0.1;
export const RHYTHM_REGULARITY_TOLERANCE = 0.12;

export interface PulseFeedback {
  averageBpm: number;
  intervalVariation: number;
  tempo: 'faster' | 'slower' | 'near';
  regular: boolean;
  interrupted: boolean;
  intervals: number[];
}

/** First tap anchors the attempt, so onset reaction time is never scored. */
export function analyzePulseTaps(taps: readonly number[], bpm: number): PulseFeedback | null {
  if (
    taps.length !== RHYTHM_TAP_COUNT ||
    !Number.isFinite(bpm) ||
    bpm <= 0 ||
    taps.some((tap, index) => !Number.isFinite(tap) || (index > 0 && tap <= taps[index - 1]))
  )
    return null;
  const expected = 60000 / bpm;
  const intervals = taps.slice(1).map((tap, index) => tap - taps[index]);
  const mean = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
  const variance =
    intervals.reduce((sum, interval) => sum + (interval - mean) ** 2, 0) / intervals.length;
  const intervalVariation = Math.sqrt(variance) / mean;
  const deviation = (mean - expected) / expected;
  return {
    averageBpm: 60000 / mean,
    intervalVariation,
    tempo:
      deviation < -RHYTHM_TEMPO_TOLERANCE
        ? 'faster'
        : deviation > RHYTHM_TEMPO_TOLERANCE
          ? 'slower'
          : 'near',
    regular: intervalVariation <= RHYTHM_REGULARITY_TOLERANCE,
    interrupted: intervals.some((interval) => interval > expected * 3 || interval < expected / 4),
    intervals,
  };
}
