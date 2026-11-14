import type { ChartBar, SongVersion } from '@/content/types';
import { scheduleChartBar, scheduleChartMetronome } from './chart-timing';

export interface PlaybackPosition {
  status: 'idle' | 'playing' | 'paused';
  bar: number;
  tick: number;
}

interface AudioPort {
  now(): number;
  chord(name: string, duration: number, at: number): () => void;
  click(frequency: number, volume: number, at: number): () => void;
}

interface Voice {
  kind: 'chord' | 'click';
  at: number;
  end: number;
  stop(): void;
}

export const idlePosition: PlaybackPosition = { status: 'idle', bar: -1, tick: -1 };

/** One audio clock survives option changes; only explicit transport actions move it. */
export class ChartTransport {
  private timeline;
  private duration: number;
  private status: PlaybackPosition['status'] = 'idle';
  private offset = 0;
  private anchor = 0;
  private finishAt: number;
  private loop = false;
  private metronome = false;
  private disposed = false;
  private voices = new Map<string, Voice>();
  private previous = idlePosition;

  constructor(
    bars: ChartBar[],
    chart: SongVersion,
    bpm: number,
    private audio: AudioPort,
    private onPosition: (position: PlaybackPosition) => void,
  ) {
    let start = 0;
    this.timeline = bars.map((bar) => {
      const chords = scheduleChartBar(bar, start, bpm);
      const clicks = scheduleChartMetronome(bar, chart, start, bpm);
      const item = { start, end: chords.endAt, events: chords.events, ticks: clicks.ticks };
      start = chords.endAt;
      return item;
    });
    this.duration = start;
    this.finishAt = start;
  }

  private position() {
    return this.status === 'playing'
      ? this.offset + Math.max(0, this.audio.now() - this.anchor)
      : this.offset;
  }

  private clearVoices(predicate: (voice: Voice) => boolean = () => true) {
    for (const [key, voice] of this.voices) {
      if (!predicate(voice)) continue;
      voice.stop();
      this.voices.delete(key);
    }
  }

  private publish(at = this.position()) {
    let next = idlePosition;
    if (this.status !== 'idle' && this.duration > 0) {
      const position = at % this.duration;
      const bar = this.timeline.findIndex((item) => position < item.end);
      const tick = this.metronome
        ? this.timeline[bar].ticks.findLastIndex((item) => item.at <= position)
        : -1;
      next = { status: this.status, bar, tick };
    }
    if (
      next.status !== this.previous.status ||
      next.bar !== this.previous.bar ||
      next.tick !== this.previous.tick
    ) {
      this.previous = next;
      this.onPosition(next);
    }
  }

  play(fromBar?: number) {
    if (this.disposed || !this.duration) return;
    if (fromBar !== undefined) {
      const bar = this.timeline[fromBar];
      if (!bar) return;
      this.clearVoices();
      this.offset = bar.start;
    } else if (this.status === 'playing') return;
    else if (this.status === 'idle') this.offset = 0;

    this.finishAt = this.loop
      ? Infinity
      : (Math.floor(this.offset / this.duration) + 1) * this.duration;
    this.anchor = this.audio.now() + 0.04;
    this.status = 'playing';
    this.tick();
  }

  pause() {
    if (this.disposed || this.status !== 'playing') return;
    const position = this.position();
    if (position >= this.finishAt) return this.stop();
    this.offset = position;
    this.status = 'paused';
    this.clearVoices();
    this.publish();
  }

  stop() {
    if (this.disposed) return;
    this.status = 'idle';
    this.offset = 0;
    this.clearVoices();
    this.publish();
  }

  setLoop(enabled: boolean) {
    if (this.disposed || !this.duration) return;
    this.loop = enabled;
    this.finishAt = enabled
      ? Infinity
      : (Math.floor(this.position() / this.duration) + 1) * this.duration;
    // The next cycle may already be in the look-ahead window. Keep the current chord intact.
    this.clearVoices((voice) => voice.at >= this.finishAt);
    if (this.status === 'playing') this.tick();
  }

  setMetronome(enabled: boolean) {
    if (this.disposed) return;
    this.metronome = enabled;
    if (!enabled) this.clearVoices((voice) => voice.kind === 'click');
    if (this.status === 'playing') this.tick();
    else this.publish();
  }

  /** Called every 25 ms in the browser; tests advance a deterministic audio clock. */
  tick() {
    if (this.disposed || this.status !== 'playing') return;
    const now = this.audio.now();
    const position = this.position();
    if (position >= this.finishAt) return this.stop();
    for (const [key, voice] of this.voices) {
      if (voice.end + 0.2 < position) this.voices.delete(key);
    }
    const until = Math.min(position + 0.1, this.finishAt);
    const firstCycle = Math.floor(position / this.duration);
    const lastCycle = Math.floor(until / this.duration);
    for (let cycle = firstCycle; cycle <= lastCycle; cycle++) {
      const cycleAt = cycle * this.duration;
      this.timeline.forEach((bar, barIndex) => {
        if (cycleAt + bar.end <= position || cycleAt + bar.start > until) return;
        bar.events.forEach((event, index) => {
          const at = cycleAt + event.at;
          const end = at + event.duration;
          const key = `chord:${cycle}:${barIndex}:${index}`;
          if (at > until || at >= this.finishAt || end <= position || this.voices.has(key)) return;
          // After pause or a delayed timer, resume the current harmony for its remaining duration.
          const start = Math.max(at, position);
          const when = Math.max(now, this.anchor + start - this.offset);
          this.voices.set(key, {
            kind: 'chord',
            at,
            end,
            stop: this.audio.chord(event.chord, end - start, when),
          });
        });
        if (!this.metronome) return;
        bar.ticks.forEach((tick, index) => {
          const at = cycleAt + tick.at;
          const key = `click:${cycle}:${barIndex}:${index}`;
          // Never flush missed clicks in a burst, including when enabling mid-beat.
          if (at < position || at > until || at >= this.finishAt || this.voices.has(key)) return;
          const when = Math.max(now, this.anchor + at - this.offset);
          this.voices.set(key, {
            kind: 'click',
            at,
            end: at + 0.045,
            stop: this.audio.click(tick.frequency, tick.volume, when),
          });
        });
      });
    }
    this.publish(position);
  }

  dispose() {
    this.clearVoices();
    this.disposed = true;
  }
}
