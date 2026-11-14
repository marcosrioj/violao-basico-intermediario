let context: AudioContext | undefined;
export function audioContext() {
  context ??= new AudioContext();
  return context;
}
export function playTone(frequency: number, duration = 0.8, when?: number, volume = 0.15) {
  const ctx = audioContext();
  void ctx.resume();
  const start = when ?? ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.value = frequency;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.03);
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
export function soundChord(frets: (number | null)[], duration = 1) {
  const ctx = audioContext();
  const stop: (() => void)[] = [];
  frets.forEach((f, i) => {
    if (f !== null && f >= 0)
      stop.push(playTone(frequency(openMidi[i] + f), duration, ctx.currentTime + i * 0.022, 0.075));
  });
  return () => stop.forEach((cancel) => cancel());
}
