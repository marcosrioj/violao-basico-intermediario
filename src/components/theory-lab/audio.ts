import { midiToFrequency } from './theory';
export const AUDIO_STOP_EVENT = 'violao-theory-lab:stop-audio';
export interface SoundStep { notes: number[]; at: number; duration: number; drone?: boolean }
class MusicAudio {
  private context: AudioContext | null = null;
  private output: GainNode | null = null;
  private voices = new Set<OscillatorNode>();
  private visibilityBound = false;
  async ready(): Promise<AudioContext> {
    if (typeof window === 'undefined') throw new Error('O áudio está disponível no navegador.');
    const AudioConstructor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioConstructor) throw new Error('Este navegador não oferece áudio sintetizado. Você pode continuar pelo texto.');
    if (!this.context || this.context.state === 'closed') {
      this.context = new AudioConstructor();
      this.output = this.context.createGain(); this.output.gain.value = 0.55;
      const compressor = this.context.createDynamicsCompressor();
      compressor.threshold.value = -12; compressor.ratio.value = 5;
      this.output.connect(compressor); compressor.connect(this.context.destination);
    }
    if (!this.visibilityBound) {
      document.addEventListener('visibilitychange', () => { if (document.hidden) stopAudio(); });
      this.visibilityBound = true;
    }
    if (this.context.state === 'suspended') await this.context.resume();
    return this.context;
  }
  get now() { return this.context?.currentTime ?? 0; }
  tone(midi: number, at: number, duration: number, drone = false) {
    const context = this.context, output = this.output;
    if (!context || !output) return;
    const oscillator = context.createOscillator(), gain = context.createGain();
    oscillator.type = drone ? 'sine' : 'triangle';
    oscillator.frequency.value = midiToFrequency(midi);
    const start = Math.max(context.currentTime, at), length = Math.max(0.08, Math.min(60,duration));
    const peak = drone ? 0.055 : 0.11;
    gain.gain.setValueAtTime(0.0001,start);
    gain.gain.exponentialRampToValueAtTime(peak,start+0.008);
    if (drone) gain.gain.setValueAtTime(peak,start+Math.max(0.01,length-0.08));
    else gain.gain.exponentialRampToValueAtTime(peak*0.25,start+Math.min(length*0.6,0.8));
    gain.gain.exponentialRampToValueAtTime(0.0001,start+length);
    oscillator.connect(gain); gain.connect(output); this.voices.add(oscillator);
    oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(start); oscillator.stop(start+length+0.02);
  }
  chord(notes: number[], at: number, duration: number, drone = false) {
    notes.forEach((note,i) => this.tone(note,at+(drone ? 0 : i*0.012),duration,drone));
  }
  stop() {
    for (const oscillator of this.voices) { try { oscillator.stop(); } catch { /* Already ended. */ } }
    this.voices.clear();
  }
}
export const musicAudio = new MusicAudio();
let generation = 0;
export function stopAudio() {
  generation++; musicAudio.stop();
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(AUDIO_STOP_EVENT));
}
export async function playSoundSteps(steps: SoundStep[]): Promise<number> {
  stopAudio(); const request = generation; await musicAudio.ready();
  if (request !== generation || document.hidden) throw new DOMException('Reprodução interrompida.','AbortError');
  const start = musicAudio.now+0.05;
  for (const step of steps) musicAudio.chord(step.notes,start+step.at,step.duration,step.drone);
  return Math.max(0,...steps.map(step => step.at+step.duration));
}
