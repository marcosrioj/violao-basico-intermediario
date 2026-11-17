import { audioContext, frequency, playTone } from './audio';
import { parseChordSymbol } from './chord-symbol';

/** Synthesized harmony for pasted chords without a course guitar fingering. */
export function soundChordSymbol(symbol: string, duration = 1, when?: number, semitones = 0) {
  const parsed = parseChordSymbol(symbol);
  return soundPitches(parsed?.midiNotes ?? [], duration, when, semitones);
}

/** Play precisely the provided pitches (for tablature), without supplying a chord or bass. */
export function soundPitches(notes: number[], duration = 1, when?: number, semitones = 0) {
  if (
    !notes.length ||
    notes.length > 16 ||
    !Number.isFinite(duration) ||
    duration <= 0 ||
    !Number.isInteger(semitones) ||
    Math.abs(semitones) > 24 ||
    (when !== undefined && (!Number.isFinite(when) || when < 0)) ||
    notes.some(
      (note) =>
        !Number.isInteger(note) ||
        note < 0 ||
        note > 127 ||
        note + semitones < 0 ||
        note + semitones > 127,
    )
  )
    return () => {};
  const now = audioContext().currentTime;
  const start = Math.max(when ?? now, now);
  const volume = 0.3 / notes.length;
  const voices = notes.map((note) =>
    playTone(frequency(note + semitones), duration, start, volume),
  );
  return () => voices.forEach((stop) => stop());
}
