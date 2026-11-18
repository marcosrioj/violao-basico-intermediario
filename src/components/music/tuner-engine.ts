/**
 * Monophonic, time-domain pitch estimation, based on YIN:
 * de Cheveigné & Kawahara (2002), https://doi.org/10.1121/1.1458024.
 * The confidence gate and harmonic candidate selection below are application
 * choices, not a guarantee of a microphone's physical measurement accuracy.
 */
export type PitchEstimate = { frequency: number; clarity: number; rms: number };
export type PitchDetectionOptions = { minRms?: number; minClarity?: number };

export const frequencyForMidi = (midi: number, concertA = 440) =>
  concertA * 2 ** ((midi - 69) / 12);

export const centsBetween = (frequency: number, target: number) =>
  1200 * Math.log2(frequency / target);

export const nearestMidi = (frequency: number, concertA = 440) =>
  Math.round(69 + 12 * Math.log2(frequency / concertA));

// Leave room below a seven-string B1 at A4 = 400 Hz for an initially flat string.
const MIN_FREQUENCY = 45;
const MAX_FREQUENCY = 1400;
// Cubic interpolation can move an exact endpoint by a fraction of one cent.
const RANGE_ROUNDING = 2 ** (0.25 / 1200);
const MIN_RMS = 0.00035;
const MIN_CLARITY = 0.9;
const filterCache = new Map<number, Float64Array>();

/** Windowed-sinc low-pass filter prevents high partials aliasing on decimation. */
function decimationFilter(factor: number): Float64Array {
  const cached = filterCache.get(factor);
  if (cached) return cached;
  const size = 16 * factor + 1;
  const middle = (size - 1) / 2;
  const cutoff = 0.45 / factor;
  const filter = new Float64Array(size);
  let sum = 0;
  for (let i = 0; i < size; i++) {
    const distance = i - middle;
    const sinc =
      distance === 0
        ? 2 * cutoff
        : Math.sin(2 * Math.PI * cutoff * distance) / (Math.PI * distance);
    const window = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (size - 1));
    filter[i] = sinc * window;
    sum += filter[i];
  }
  for (let i = 0; i < size; i++) filter[i] /= sum;
  filterCache.set(factor, filter);
  return filter;
}

function downsample(samples: Float32Array, factor: number): Float32Array {
  if (factor === 1) return samples;
  const filter = decimationFilter(factor);
  const count = Math.floor((samples.length - filter.length) / factor) + 1;
  if (count <= 0) return new Float32Array(0);
  const result = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    let value = 0;
    const start = i * factor;
    for (let j = 0; j < filter.length; j++) value += samples[start + j] * filter[j];
    result[i] = value;
  }
  return result;
}

/** Evaluate a fractional delay without rounding away the fundamental's valley. */
function fractionalDifference(
  buffer: Float32Array,
  start: number,
  size: number,
  period: number,
): number {
  const lag = Math.floor(period);
  const t = period - lag;
  const square = t * t;
  const cube = square * t;
  const a = -0.5 * t + square - 0.5 * cube;
  const b = 1 - 2.5 * square + 1.5 * cube;
  const c = 0.5 * t + 2 * square - 1.5 * cube;
  const d = -0.5 * square + 0.5 * cube;
  let difference = 0;
  for (let j = start; j < start + size; j++) {
    const k = j + lag;
    const shifted = a * buffer[k - 1] + b * buffer[k] + c * buffer[k + 1] + d * buffer[k + 2];
    const delta = buffer[j] - shifted;
    difference += delta * delta;
  }
  return difference;
}

/** Gain-normalized, mean-removed correlation for one local period candidate. */
function periodCorrelation(buffer: Float32Array, start: number, size: number, period: number) {
  const lag = Math.floor(period);
  const t = period - lag;
  const square = t * t;
  const cube = square * t;
  const a = -0.5 * t + square - 0.5 * cube;
  const b = 1 - 2.5 * square + 1.5 * cube;
  const c = 0.5 * t + 2 * square - 1.5 * cube;
  const d = -0.5 * square + 0.5 * cube;
  let x = 0;
  let y = 0;
  let xx = 0;
  let yy = 0;
  let xy = 0;
  for (let i = start; i < start + size; i++) {
    const k = i + lag;
    const first = buffer[i];
    const shifted = a * buffer[k - 1] + b * buffer[k] + c * buffer[k + 1] + d * buffer[k + 2];
    x += first;
    y += shifted;
    xx += first * first;
    yy += shifted * shifted;
    xy += first * shifted;
  }
  const varianceX = Math.max(0, xx - (x * x) / size);
  const varianceY = Math.max(0, yy - (y * y) / size);
  const denominator = Math.sqrt(varianceX * varianceY);
  return denominator > 0 ? (xy - (x * y) / size) / denominator : 0;
}

/**
 * Check the candidate against two time regions, including earlier audio that
 * was not used for YIN's local valley selection. Agreement rejects many note
 * changes and isolated transients; these are related periodicity checks, not
 * two statistically independent detectors or proof that a sound is a guitar.
 */
function validatePeriod(buffer: Float32Array, rate: number, period: number, minClarity: number) {
  // Reserve room for the longest probe and cubic interpolation's neighbors.
  const available = buffer.length - Math.ceil(period * 1.01) - 4;
  const size = Math.min(Math.floor(available / 2), Math.floor(rate * 0.035));
  if (size < period) return null;
  const step = period * 0.01;
  const periods: number[] = [];
  const shorterPeriods: boolean[][] = [];
  let clarity = 1;
  for (const start of [1, available - size]) {
    const before = periodCorrelation(buffer, start, size, period - step);
    const center = periodCorrelation(buffer, start, size, period);
    const after = periodCorrelation(buffer, start, size, period + step);
    if (center < minClarity) return null;
    const curvature = before - 2 * center + after;
    if (curvature >= 0) return null;
    const correction = ((before - after) * step) / (2 * curvature);
    const localPeriod = period + correction;
    if (!Number.isFinite(localPeriod) || Math.abs(1200 * Math.log2(localPeriod / period)) > 12) {
      return null;
    }
    periods.push(localPeriod);
    // A high note also repeats at a lower note's period. Check that evidence
    // for half/third periods agrees across regions instead of hiding a jump.
    shorterPeriods.push(
      [2, 3].map(
        (divisor) => periodCorrelation(buffer, start, size, localPeriod / divisor) >= center - 0.01,
      ),
    );
    clarity = Math.min(clarity, center);
  }
  if (Math.abs(1200 * Math.log2(periods[0] / periods[1])) > 12) return null;
  if (shorterPeriods[0].some((present, index) => present !== shorterPeriods[1][index])) return null;
  return clarity;
}

/**
 * Refine an already validated candidate over the audio we have, without adding
 * another capture window. More cycles reduce low-note jitter in broadband noise.
 * A bounded correction cannot replace the candidate with a different note.
 */
function refinePeriod(buffer: Float32Array, period: number): number {
  const step = period * 0.01;
  const size = buffer.length - Math.ceil(period + step) - 5;
  const before = periodCorrelation(buffer, 1, size, period - step);
  const center = periodCorrelation(buffer, 1, size, period);
  const after = periodCorrelation(buffer, 1, size, period + step);
  const curvature = before - 2 * center + after;
  if (curvature >= 0) return period;
  const refined = period + ((before - after) * step) / (2 * curvature);
  return Number.isFinite(refined) && Math.abs(1200 * Math.log2(refined / period)) <= 12
    ? refined
    : period;
}

/**
 * Analyze a microphone frame (8192 samples through 96 kHz, 16384 at 192 kHz).
 * Returns null for silence, insufficient periodicity or an unsupported frame.
 * The input is never mutated. Its actual sample rate must be supplied.
 */
export function detectPitch(
  samples: Float32Array,
  sampleRate: number,
  options: PitchDetectionOptions = {},
): PitchEstimate | null {
  const minRms = options.minRms ?? MIN_RMS;
  const minClarity = options.minClarity ?? MIN_CLARITY;
  if (!Number.isFinite(minRms) || minRms <= 0 || minRms > 1) return null;
  if (!Number.isFinite(minClarity) || minClarity < 0.8 || minClarity >= 1) return null;
  const maxDifference = 1 - minClarity;
  if (!Number.isFinite(sampleRate) || sampleRate < 8000 || sampleRate > 192000) return null;
  if (samples.length < (sampleRate / MIN_FREQUENCY) * 3) return null;
  let sum = 0;
  let squareSum = 0;
  let clippedSamples = 0;
  for (let i = 0; i < samples.length; i++) {
    const value = samples[i];
    if (!Number.isFinite(value)) return null;
    sum += value;
    squareSum += value * value;
    if (Math.abs(value) >= 0.985) clippedSamples++;
  }
  const mean = sum / samples.length;
  const rms = Math.sqrt(Math.max(0, squareSum / samples.length - mean * mean));
  if (rms < minRms || clippedSamples / samples.length > 0.005) return null;

  // About 24 kHz preserves interpolation accuracy for upper guitar notes while
  // keeping the quadratic difference calculation small on mobile devices.
  const factor = Math.max(1, Math.floor(sampleRate / 22050));
  const buffer = downsample(samples, factor);
  const rate = sampleRate / factor;
  // Include short periods before range-checking the chosen estimate, so a note
  // above our supported range cannot masquerade as its in-range subharmonic.
  const minLag = 2;
  const maxLag = Math.ceil(rate / MIN_FREQUENCY) + 1;
  const windowSize = Math.min(Math.floor(rate * 0.045), buffer.length - maxLag - 1);
  if (windowSize < rate / MIN_FREQUENCY) return null;
  const start = buffer.length - windowSize - maxLag - 1;
  const normalized = new Float64Array(maxLag + 1);
  const meanDifferences = new Float64Array(maxLag + 1);
  normalized[0] = 1;
  let runningSum = 0;
  for (let lag = 1; lag <= maxLag; lag++) {
    let difference = 0;
    for (let j = 0; j < windowSize; j++) {
      const delta = buffer[start + j] - buffer[start + j + lag];
      difference += delta * delta;
    }
    runningSum += difference;
    meanDifferences[lag] = runningSum / lag;
    normalized[lag] = runningSum > 0 ? (difference * lag) / runningSum : 1;
  }

  // Compare all valleys before choosing the earliest good one. A loud second
  // harmonic can otherwise make the half-period cross YIN's threshold first.
  const valleys: { lag: number; difference: number; correction: number; score: number }[] = [];
  let best = Infinity;
  for (let lag = minLag; lag < maxLag; lag++) {
    const value = normalized[lag];
    if (value <= maxDifference && value <= normalized[lag - 1] && value < normalized[lag + 1]) {
      const left = normalized[lag - 1];
      const right = normalized[lag + 1];
      const curvature = left - 2 * value + right;
      let correction = curvature > 0 ? (left - right) / (2 * curvature) : 0;
      // Compare fractional-delay differences: integer sampling penalizes upper
      // notes with loud harmonics and can favor their longer exact multiples.
      // A short refinement also removes bias from YIN's normalization slope.
      const initialPeriod = lag + correction;
      const before = fractionalDifference(buffer, start, windowSize, initialPeriod - 0.2);
      const middle = fractionalDifference(buffer, start, windowSize, initialPeriod);
      const after = fractionalDifference(buffer, start, windowSize, initialPeriod + 0.2);
      const refinedCurvature = before - 2 * middle + after;
      if (refinedCurvature > 0) {
        correction += Math.max(-0.2, Math.min(0.2, (0.1 * (before - after)) / refinedCurvature));
      }
      const difference =
        fractionalDifference(buffer, start, windowSize, lag + correction) / meanDifferences[lag];
      // Rank candidates over the same longer stretch. A short noisy window can
      // randomly favor twice the period and turn A2 into A1; using more cycles
      // reduces that variance without preferring a weak fundamental's harmonic.
      const score = 1 - periodCorrelation(buffer, 1, buffer.length - maxLag - 4, lag + correction);
      valleys.push({ lag, difference, correction, score });
      best = Math.min(best, score);
    }
  }
  if (best > maxDifference) return null;
  const acceptance = Math.min(maxDifference, best + Math.max(0.002, best * 0.15));
  const candidate = valleys.find(
    (valley) => valley.difference <= maxDifference && valley.score <= acceptance,
  );
  if (!candidate) return null;
  const { lag, correction, difference } = candidate;
  const period = lag + Math.max(-1, Math.min(1, correction));
  const frequency = rate / period;
  if (frequency < MIN_FREQUENCY / RANGE_ROUNDING || frequency > MAX_FREQUENCY * RANGE_ROUNDING) {
    return null;
  }
  const temporalClarity = validatePeriod(buffer, rate, period, minClarity);
  if (temporalClarity === null) return null;
  const refinedFrequency = rate / refinePeriod(buffer, period);
  if (
    refinedFrequency < MIN_FREQUENCY / RANGE_ROUNDING ||
    refinedFrequency > MAX_FREQUENCY * RANGE_ROUNDING
  ) {
    return null;
  }
  return {
    frequency: refinedFrequency,
    clarity: Math.max(0, Math.min(1, 1 - difference, temporalClarity)),
    rms,
  };
}
