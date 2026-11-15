import type { ChartBar, SongVersion } from '@/content/types';
import { scheduleChartBar, scheduleChartMetronome } from './chart-timing';

export interface PlaybackPosition {
  status: 'idle' | 'playing' | 'paused';
  bar: number;
  tick: number;
}

/** A read-only view of the audio clock, suitable for animation-frame lyric highlighting. */
export interface PlaybackSnapshot extends PlaybackPosition {
  /** The scheduled start is still ahead of the audio clock; do not highlight a new lyric yet. */
  waitingForAudio: boolean;
  /** Zero-based fractional pulse within the current bar; -1 when idle. */
  beat: number;
  /** Position in the expanded arrangement, including its written repeats. */
  scoreSeconds: number;
  durationSeconds: number;
  /** Time actually played since this start, excluding pauses and including practice loops. */
  elapsedSeconds: number;
  /** Start of the current traversal (explicit start or practice-loop return); absent when idle. */
  passStartSeconds?: number;
}

/** End is exclusive, so repeated occurrences keep their own absolute bar indexes. */
export interface LoopRange {
  startBar: number;
  endBar: number;
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
interface Route {
  at: number;
  from: number;
  repeatFrom: number;
  to: number;
  repeat: boolean;
}

export const idlePosition: PlaybackPosition = { status: 'idle', bar: -1, tick: -1 };

/** A monotonic audio clock maps onto the score, with optional full or passage repetition. */
export class ChartTransport {
  private timeline;
  private duration: number;
  private status: PlaybackPosition['status'] = 'idle';
  private offset = 0;
  private elapsedStart = 0;
  private anchor = 0;
  private finishAt: number;
  private loop = false;
  private loopRange: LoopRange | null = null;
  private metronome = false;
  private disposed = false;
  private voices = new Map<string, Voice>();
  private previous = idlePosition;
  private route: Route;

  constructor(
    bars: ChartBar[],
    chart: SongVersion,
    private bpm: number,
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
    this.route = { at: 0, from: 0, repeatFrom: 0, to: start, repeat: false };
  }

  private position(now = this.audio.now()) {
    return this.status === 'playing' ? this.offset + Math.max(0, now - this.anchor) : this.offset;
  }

  private segmentAt(at: number) {
    const r = this.route;
    const firstEnd = r.at + r.to - r.from;
    if (at < firstEnd) return { at: r.at, from: r.from, to: r.to };
    if (!r.repeat || r.to <= r.repeatFrom) return null;
    const length = r.to - r.repeatFrom;
    const cycle = Math.floor((at - firstEnd + 1e-9) / length);
    return { at: firstEnd + cycle * length, from: r.repeatFrom, to: r.to };
  }

  private scoreAt(at: number) {
    const segment = this.segmentAt(at);
    return segment ? segment.from + Math.max(0, at - segment.at) : this.duration;
  }

  /** Reading the position never schedules audio or advances a separate visual timer. */
  snapshot(): PlaybackSnapshot {
    const now = this.audio.now();
    const at = this.position(now);
    const inactive: PlaybackSnapshot = {
      ...idlePosition,
      waitingForAudio: false,
      beat: -1,
      scoreSeconds: 0,
      durationSeconds: this.duration,
      elapsedSeconds: 0,
    };
    if (this.disposed || this.status === 'idle' || !this.duration || at >= this.finishAt) {
      return inactive;
    }
    const scoreSeconds = this.scoreAt(at);
    const bar = this.timeline.findIndex((item) => scoreSeconds < item.end);
    const item = this.timeline[bar];
    // Floating-point arithmetic can reach the final score boundary just before finishAt.
    if (!item) return inactive;
    return {
      status: this.status,
      waitingForAudio: this.status === 'playing' && now < this.anchor,
      bar,
      tick: this.metronome ? item.ticks.findLastIndex((tick) => tick.at <= scoreSeconds) : -1,
      beat: ((scoreSeconds - item.start) * this.bpm) / 60,
      scoreSeconds,
      durationSeconds: this.duration,
      elapsedSeconds: Math.max(0, at - this.elapsedStart),
      passStartSeconds: this.segmentAt(at)?.from,
    };
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
      const score = this.scoreAt(at);
      const bar = this.timeline.findIndex((item) => score < item.end);
      if (bar >= 0) {
        const tick = this.metronome
          ? this.timeline[bar].ticks.findLastIndex((item) => item.at <= score)
          : -1;
        next = { status: this.status, bar, tick };
      }
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

  private plan(at: number, score: number) {
    const rangeStart = this.loopRange ? this.timeline[this.loopRange.startBar].start : 0;
    const rangeEnd = this.loopRange ? this.timeline[this.loopRange.endBar - 1].end : this.duration;
    // An armed passage ahead is reached naturally. One already passed waits for a new start.
    const inReach = this.loopRange !== null && score < rangeEnd;
    this.route = {
      at,
      from: score,
      repeatFrom: inReach ? rangeStart : 0,
      to: inReach ? rangeEnd : this.duration,
      repeat: inReach || this.loop,
    };
    this.finishAt = this.route.repeat ? Infinity : at + this.duration - score;
  }

  private replan() {
    const at = this.position();
    const score = this.scoreAt(at);
    // Preserve sounding harmony; only future events can belong to an obsolete route.
    this.clearVoices((voice) => voice.at > at + 1e-7);
    this.plan(at, score);
    if (this.status === 'playing') this.tick();
  }

  play(fromBar?: number) {
    if (this.disposed || !this.duration) return;
    if (fromBar !== undefined) {
      const bar = this.timeline[fromBar];
      if (!bar) return;
      this.clearVoices();
      this.offset = bar.start;
      this.elapsedStart = this.offset;
      this.plan(this.offset, bar.start);
    } else if (this.status === 'playing') return;
    else if (this.status === 'idle') {
      this.offset = this.loopRange ? this.timeline[this.loopRange.startBar].start : 0;
      this.elapsedStart = this.offset;
      this.plan(this.offset, this.offset);
    }
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
    this.elapsedStart = 0;
    this.clearVoices();
    this.plan(0, 0);
    this.publish();
  }

  setLoop(enabled: boolean) {
    if (this.disposed || !this.duration || (this.loop === enabled && !(enabled && this.loopRange)))
      return;
    this.loop = enabled;
    if (enabled) this.loopRange = null;
    this.replan();
  }

  setLoopRange(range: LoopRange | null) {
    if (this.disposed || !this.duration) return;
    if (
      range &&
      (!Number.isInteger(range.startBar) ||
        !Number.isInteger(range.endBar) ||
        range.startBar < 0 ||
        range.endBar > this.timeline.length ||
        range.endBar <= range.startBar)
    ) {
      throw new RangeError('Trecho de repetição inválido.');
    }
    if (range?.startBar === this.loopRange?.startBar && range?.endBar === this.loopRange?.endBar)
      return;
    this.loopRange = range ? { ...range } : null;
    if (range) this.loop = false;
    this.replan();
  }

  setMetronome(enabled: boolean) {
    if (this.disposed) return;
    this.metronome = enabled;
    if (!enabled) this.clearVoices((voice) => voice.kind === 'click');
    if (this.status === 'playing') this.tick();
    else this.publish();
  }

  /** Called every 25 ms; scheduling looks 100 ms ahead without moving the visual cursor. */
  tick() {
    if (this.disposed || this.status !== 'playing') return;
    const now = this.audio.now();
    const position = this.position();
    if (position >= this.finishAt) return this.stop();
    for (const [key, voice] of this.voices) {
      if (voice.end + 0.2 < position) this.voices.delete(key);
    }
    const until = Math.min(position + 0.1, this.finishAt);
    let cursor = position;
    while (cursor < until) {
      const segment = this.segmentAt(cursor);
      if (!segment) break;
      const shift = segment.at - segment.from;
      this.timeline.forEach((bar, barIndex) => {
        if (
          bar.end <= segment.from ||
          bar.start >= segment.to ||
          shift + bar.end <= position ||
          shift + bar.start > until
        )
          return;
        bar.events.forEach((event, index) => {
          const at = shift + event.at;
          const end = at + event.duration;
          const key = `chord:${barIndex}:${index}:${at.toFixed(6)}`;
          if (at > until || at >= this.finishAt || end <= position || this.voices.has(key)) return;
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
          const at = shift + tick.at;
          const key = `click:${barIndex}:${index}:${at.toFixed(6)}`;
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
      const next = segment.at + segment.to - segment.from;
      if (next <= cursor) break;
      cursor = next;
    }
    this.publish(position);
  }

  dispose() {
    this.clearVoices();
    this.disposed = true;
  }
}
