'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { validateLyricCues, type LyricCue } from './chart-lyrics';

interface LyricsState {
  cues: LyricCue[];
}

/** Read existing personal annotations without discarding previously saved lyrics. */
function createLyricsStore(key: string, totalBeats: number, defaults: LyricCue[]) {
  const initial: LyricsState = { cues: defaults };
  let state = initial;
  let previous: string | null | undefined;
  let memoryOnly = false;
  const read = () => {
    if (memoryOnly) return state;
    try {
      const raw = localStorage.getItem(key);
      if (raw !== previous) {
        previous = raw;
        state = raw ? { cues: validateLyricCues(JSON.parse(raw), totalBeats) } : initial;
      }
    } catch {
      state = initial;
      memoryOnly = true;
    }
    return state;
  };
  return {
    read,
    server: () => initial,
    subscribe(listener: () => void) {
      const changed = (event: StorageEvent) => {
        if (event.key === key || event.key === null) listener();
      };
      window.addEventListener('storage', changed);
      return () => {
        window.removeEventListener('storage', changed);
      };
    },
  };
}

export function useChartLyrics(key: string, totalBeats: number, defaults: LyricCue[]) {
  const store = useMemo(
    () => createLyricsStore(key, totalBeats, defaults),
    [key, totalBeats, defaults],
  );
  const state = useSyncExternalStore(store.subscribe, store.read, store.server);
  return state;
}
