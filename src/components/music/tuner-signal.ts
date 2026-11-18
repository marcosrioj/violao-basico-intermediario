/** Capture sensitivity affects confidence and gating, never microphone gain. */
export type TunerSensitivity = 'balanced' | 'soft' | 'noisy';
export type TunerSignal =
  'quiet' | 'unstable' | 'tracking' | 'clipped' | 'calibrating' | 'below-noise' | 'muted';
export type NoiseCalibration = 'idle' | 'sampling' | 'ready' | 'rejected';

export type TunerSensitivityProfile = {
  minRms: number;
  minClarity: number;
  frames: number;
};

export const TUNER_SENSITIVITY_PROFILES: Record<TunerSensitivity, TunerSensitivityProfile> = {
  balanced: { minRms: 0.00035, minClarity: 0.9, frames: 3 },
  soft: { minRms: 0.00008, minClarity: 0.94, frames: 5 },
  noisy: { minRms: 0.001, minClarity: 0.96, frames: 5 },
};

export type SignalMeasurement = { rms: number; clipped: boolean };

/** Ignore DC offset for loudness, but inspect original samples for input overload. */
export function measureSignal(samples: Float32Array): SignalMeasurement {
  if (!samples.length) return { rms: 0, clipped: false };
  let sum = 0;
  let squareSum = 0;
  let clippedSamples = 0;
  for (const sample of samples) {
    if (!Number.isFinite(sample)) return { rms: 0, clipped: true };
    sum += sample;
    squareSum += sample * sample;
    if (Math.abs(sample) >= 0.985) clippedSamples++;
  }
  const mean = sum / samples.length;
  return {
    rms: Math.sqrt(Math.max(0, squareSum / samples.length - mean * mean)),
    clipped: clippedSamples / samples.length > 0.005,
  };
}

/** Digital input level in dBFS; this is not a sound-pressure measurement. */
export function signalDb(rms: number): number {
  return 20 * Math.log10(Math.max(Number.isFinite(rms) ? rms : 0, 0.000001));
}

/** Keep quiet strings visible: -90 dBFS to -6 dBFS, without changing the audio. */
export function signalLevel(rms: number): number {
  return Math.max(0, Math.min(1, (signalDb(rms) + 90) / 84));
}

function percentile(sorted: readonly number[], fraction: number): number {
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

/**
 * Learn background level only on explicit request, with strings muted by the player.
 * A steady hum is a valid background: periodicity alone cannot identify a played note.
 * Reject clipping, bursts and changing backgrounds instead of learning a misleading gate.
 */
export function estimateNoiseFloor(frames: readonly SignalMeasurement[]): number | null {
  if (
    frames.length < 12 ||
    frames.some(({ rms, clipped }) => clipped || !Number.isFinite(rms) || rms < 0)
  ) {
    return null;
  }
  const levels = frames.map(({ rms }) => rms).sort((a, b) => a - b);
  const low = Math.max(percentile(levels, 0.2), 0.000001);
  const floor = Math.max(percentile(levels, 0.75), 0.000001);
  if (percentile(levels, 0.9) > low * 4 || levels.at(-1)! > floor * 8) return null;
  return floor;
}

/** Require roughly 6 dB above the measured background; never weaken a profile's gate. */
export function effectiveSignalFloor(
  profile: TunerSensitivityProfile,
  noiseFloor: number | null,
): number {
  return Math.max(profile.minRms, noiseFloor === null ? 0 : noiseFloor * 2);
}

/** Enough time-domain samples for the lowest supported note even at high input rates. */
export function tunerFftSize(sampleRate: number): number {
  return sampleRate > 96000 ? 16384 : 8192;
}

/**
 * Frequencies are held as cents (log2) so smoothing is musically symmetric.
 * Returning null invalidates the previous reading immediately, including octave jumps.
 */
export function trackPitch(
  history: number[],
  frequency: number | null,
  profile: TunerSensitivityProfile,
): number | null {
  if (frequency === null || !Number.isFinite(frequency) || frequency <= 0) {
    history.length = 0;
    return null;
  }
  const cents = 1200 * Math.log2(frequency);
  const previous = history.at(-1);
  if (previous !== undefined && Math.abs(cents - previous) > 70) history.length = 0;
  history.push(cents);
  while (history.length > profile.frames) history.shift();
  if (history.length < profile.frames) return null;
  const sorted = [...history].sort((a, b) => a - b);
  if (sorted.at(-1)! - sorted[0] > 40) return null;
  return 2 ** (percentile(sorted, 0.5) / 1200);
}
