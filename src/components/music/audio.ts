let context: AudioContext | undefined;
export function audioContext() {
  context ??= new AudioContext();
  return context;
}
export function playTone(frequency: number, duration = 0.8, when?: number, volume = 0.15) {
  if (!Number.isFinite(duration) || duration <= 0) return () => {};
  const ctx = audioContext();
  void ctx.resume();
  const start = Math.max(when ?? ctx.currentTime, ctx.currentTime);
  const end = start + duration;
  const fade = Math.min(0.008, duration / 4);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + fade);
  gain.gain.exponentialRampToValueAtTime(0.001, end - fade);
  gain.gain.linearRampToValueAtTime(0, end);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(end);
  osc.onended = () => {
    osc.disconnect();
    gain.disconnect();
  };
  return () => {
    gain.gain.cancelScheduledValues(ctx.currentTime);
    gain.gain.setTargetAtTime(0, ctx.currentTime, 0.005);
    try {
      osc.stop(ctx.currentTime + 0.03);
    } catch {
      /* Voice already ended. */
    }
  };
}
export const openMidi = [40, 45, 50, 55, 59, 64];
export const frequency = (midi: number) => 440 * 2 ** ((midi - 69) / 12);
export function soundChord(frets: (number | null)[], duration = 1, when?: number) {
  if (!Number.isFinite(duration) || duration <= 0) return () => {};
  const ctx = audioContext();
  const start = Math.max(when ?? ctx.currentTime, ctx.currentTime);
  const stop: (() => void)[] = [];
  const notes = frets.flatMap((f, i) => (f !== null && f >= 0 ? [openMidi[i] + f] : []));
  const spacing = Math.min(0.022, duration / (notes.length + 1));
  notes.forEach((midi, index) => {
    const delay = index * spacing;
    // The strum starts on its first sounding string and all strings end at the chord boundary.
    stop.push(playTone(frequency(midi), duration - delay, start + delay, 0.075));
  });
  return () => stop.forEach((cancel) => cancel());
}
