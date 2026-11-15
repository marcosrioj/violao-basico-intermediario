import type { PlaybackSnapshot } from './chart-transport';
import type { ProjectedLyricCue } from './chart-lyrics';

export interface LyricsClock {
  subscribe(listener: () => void): () => void;
  /** Current phrase only: cue, first completed syllable, last completed syllable, active syllable. */
  rowSnapshot(firstBar: number, lastBar: number): string;
  reset(): void;
  paint(element: HTMLElement, cue: number, syllable: number): () => void;
  follow(playing: boolean, readPosition: () => PlaybackSnapshot | null): () => void;
}

/** One audio clock; React changes on syllable boundaries, the text fill advances every frame. */
export function createLyricsClock(cues: ProjectedLyricCue[], bpm: number): LyricsClock {
  const listeners = new Set<() => void>();
  const fills = new Set<{ element: HTMLElement; cue: number; syllable: number }>();
  let cueId = -1;
  let syllableId = -1;
  let firstDone = -1;
  let lastDone = -1;
  let bar = -1;
  let progress = 0;
  let fromBeat = Infinity;
  let previous: PlaybackSnapshot | null = null;
  const notify = () => listeners.forEach((listener) => listener());
  const fill = (target: { element: HTMLElement; cue: number; syllable: number }) => {
    const value = target.cue === cueId && target.syllable === syllableId ? progress : 0;
    target.element.style.setProperty('--karaoke-fill', `${Math.max(0, Math.min(1, value)) * 100}%`);
  };
  return {
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    rowSnapshot(firstBar, lastBar) {
      return cueId >= 0 && bar >= firstBar && bar <= lastBar
        ? `${cueId}:${firstDone}:${lastDone}:${syllableId}`
        : '';
    },
    reset() {
      previous = null;
      fromBeat = Infinity;
      cueId = syllableId = firstDone = lastDone = bar = -1;
      progress = 0;
      fills.forEach(fill);
      notify();
    },
    paint(element, cue, syllable) {
      const target = { element, cue, syllable };
      fills.add(target);
      fill(target);
      return () => {
        fills.delete(target);
      };
    },
    follow(playing, readPosition) {
      let frame = 0;
      let active = true;
      function update() {
        if (!active) return;
        const position = readPosition();
        const beat = ((position?.scoreSeconds ?? 0) * bpm) / 60;
        if (position && position.status !== 'idle') {
          // Both clocks distinguish a loop from ordinary progress, even when frames skip.
          const looped =
            previous &&
            previous.status !== 'idle' &&
            position.elapsedSeconds - previous.elapsedSeconds >
              position.scoreSeconds - previous.scoreSeconds + 1e-6;
          if (fromBeat === Infinity || looped) {
            fromBeat =
              position.passStartSeconds === undefined
                ? beat - position.beat
                : (position.passStartSeconds * bpm) / 60;
          }
          // Preserve the frozen syllable through the short audio scheduling lead-in on resume.
          if (position.waitingForAudio) {
            previous = position;
            if (active && playing && cues.length) frame = requestAnimationFrame(update);
            return;
          }
        }
        const cue =
          position && position.status !== 'idle'
            ? cues.find((item) => beat >= item.startBeat && beat < item.endBeat)
            : undefined;
        const parts = cue?.syllables ?? [];
        const isComplete = (part: (typeof parts)[number]) =>
          part.endBeat > fromBeat + 1e-7 && part.endBeat <= beat + 1e-7;
        const nextFirst = parts.findIndex(isComplete);
        const nextLast = parts.findLastIndex(isComplete);
        const nextId = cue?.id ?? -1;
        const nextBar = position?.bar ?? -1;
        const nextSyllable = parts.findIndex(
          (item) => beat >= item.startBeat && beat < item.endBeat,
        );
        const syllable = parts[nextSyllable];
        progress = syllable
          ? (beat - syllable.startBeat) / (syllable.endBeat - syllable.startBeat)
          : 0;
        const changed =
          cueId !== nextId ||
          bar !== nextBar ||
          syllableId !== nextSyllable ||
          firstDone !== nextFirst ||
          lastDone !== nextLast;
        cueId = nextId;
        bar = nextBar;
        syllableId = nextSyllable;
        firstDone = nextFirst;
        lastDone = nextLast;
        previous = position;
        fills.forEach(fill);
        if (changed) notify();
        if (active && playing && cues.length) frame = requestAnimationFrame(update);
      }
      frame = requestAnimationFrame(update);
      return () => {
        active = false;
        cancelAnimationFrame(frame);
      };
    },
  };
}
