import type { PlaybackSnapshot } from './chart-transport';
import type { ProjectedLyricCue } from './chart-lyrics';

export interface LyricsClock {
  subscribe(listener: () => void): () => void;
  /** Prefix before the playhead in this row: id:first:last:active, separated by semicolons. */
  rowSnapshot(firstBar: number, lastBar: number): string;
  reset(): void;
  paint(element: HTMLElement, cue: number, syllable: number): () => void;
  follow(
    playing: boolean,
    readPosition: () => PlaybackSnapshot | null,
    onFrame?: (position: PlaybackSnapshot | null) => void,
  ): () => void;
}

/** One audio clock; React changes on syllable boundaries, the text fill advances every frame. */
export function createLyricsClock(cues: ProjectedLyricCue[], bpm: number): LyricsClock {
  const listeners = new Set<() => void>();
  const fills = new Set<{ element: HTMLElement; cue: number; syllable: number }>();
  const finalBar = cues.reduce((last, cue) => Math.max(last, cue.endBar), -1);
  let cueId = -1;
  let syllableId = -1;
  let completed: { cue: ProjectedLyricCue; first: number; last: number }[] = [];
  let completedKey = '';
  let bar = -1;
  let syllableBar = -1;
  let progress = 0;
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
      // A pickup can start before its printed cell. Only its active copy may light up ahead;
      // later copies of the same complete phrase remain unaccented until their row is reached.
      return completed
        .filter(
          ({ cue }) =>
            cue.startBar <= lastBar &&
            cue.endBar >= firstBar &&
            (firstBar <= bar ||
              (cue.id === cueId && syllableBar >= firstBar && syllableBar <= lastBar)),
        )
        .map(({ cue, first, last }) => {
          const active =
            cue.id === cueId && syllableBar >= firstBar && syllableBar <= lastBar ? syllableId : -1;
          return `${cue.id}:${first}:${last}:${active}`;
        })
        .join(';');
    },
    reset() {
      previous = null;
      completed = [];
      completedKey = '';
      cueId = syllableId = bar = syllableBar = -1;
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
    follow(playing, readPosition, onFrame) {
      let frame = 0;
      let active = true;
      function update() {
        if (!active) return;
        const position = readPosition();
        onFrame?.(position);
        if (!active) return;
        let beat = ((position?.scoreSeconds ?? 0) * bpm) / 60;
        let nextBar = position?.bar ?? -1;
        const finished = position?.status === 'idle' && previous && previous.status !== 'idle';
        if (finished) {
          // Explicit stop calls reset first; natural completion keeps the sung text for review.
          beat = (position.durationSeconds * bpm) / 60;
          nextBar = finalBar;
        } else if (!position || position.status === 'idle') {
          previous = position;
          if (active && playing) frame = requestAnimationFrame(update);
          return;
        }
        // Preserve the frozen syllable through the short audio scheduling lead-in on resume.
        if (position?.waitingForAudio) {
          previous = position;
          if (active && playing) frame = requestAnimationFrame(update);
          return;
        }
        const cue =
          position && position.status !== 'idle'
            ? cues.find((item) => beat >= item.startBeat && beat < item.endBeat)
            : undefined;
        const parts = cue?.syllables ?? [];
        const nextId = cue?.id ?? -1;
        const nextCompleted = cues.flatMap((candidate) => {
          const last =
            candidate.syllables?.findLastIndex((part) => part.endBeat <= beat + 1e-7) ?? -1;
          const first = last >= 0 ? 0 : -1;
          return first >= 0 || candidate.id === nextId ? [{ cue: candidate, first, last }] : [];
        });
        const nextKey = nextCompleted
          .map(({ cue, first, last }) => `${cue.id}:${first}:${last}`)
          .join(';');
        const nextSyllable = parts.findIndex(
          (item) => beat >= item.startBeat && beat < item.endBeat,
        );
        const syllable = parts[nextSyllable];
        const nextSyllableBar = syllable ? (cue?.syllableBars?.[nextSyllable] ?? nextBar) : -1;
        progress = syllable
          ? (beat - syllable.startBeat) / (syllable.endBeat - syllable.startBeat)
          : 0;
        const changed =
          cueId !== nextId ||
          bar !== nextBar ||
          syllableBar !== nextSyllableBar ||
          syllableId !== nextSyllable ||
          completedKey !== nextKey;
        cueId = nextId;
        bar = nextBar;
        syllableId = nextSyllable;
        syllableBar = nextSyllableBar;
        completed = nextCompleted;
        completedKey = nextKey;
        previous = position;
        fills.forEach(fill);
        if (changed) notify();
        if (active && playing) frame = requestAnimationFrame(update);
      }
      frame = requestAnimationFrame(update);
      return () => {
        active = false;
        cancelAnimationFrame(frame);
      };
    },
  };
}
