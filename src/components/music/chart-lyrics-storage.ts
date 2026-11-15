'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { validateLyricCues, type LyricCue } from './chart-lyrics';

interface LyricsState {
  cues: LyricCue[];
  notice: string;
  customized: boolean;
}

/** Browser-only personal annotations; never sent to Auth, the database or analytics. */
function createLyricsStore(key: string, totalBeats: number, defaults: LyricCue[]) {
  const initial: LyricsState = { cues: defaults, notice: '', customized: false };
  let state = initial;
  let previous: string | null | undefined;
  let memoryOnly = false;
  const listeners = new Set<() => void>();
  const read = () => {
    if (memoryOnly) return state;
    try {
      const raw = localStorage.getItem(key);
      if (raw !== previous) {
        previous = raw;
        state = raw
          ? { cues: validateLyricCues(JSON.parse(raw), totalBeats), notice: '', customized: true }
          : initial;
      }
    } catch {
      state = {
        cues: defaults,
        customized: false,
        notice:
          'Não foi possível ler a letra salva. Você pode importar uma cópia ou preparar outra.',
      };
      memoryOnly = true;
    }
    return state;
  };
  return {
    read,
    server: () => initial,
    subscribe(listener: () => void) {
      listeners.add(listener);
      const changed = (event: StorageEvent) => {
        if (event.key === key || event.key === null) listener();
      };
      window.addEventListener('storage', changed);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', changed);
      };
    },
    save(cues: LyricCue[]) {
      const checked = validateLyricCues(cues, totalBeats);
      const raw = JSON.stringify(checked);
      state = {
        cues: checked.length ? checked : defaults,
        notice: '',
        customized: checked.length > 0,
      };
      try {
        if (checked.length) localStorage.setItem(key, raw);
        else localStorage.removeItem(key);
        previous = checked.length ? raw : null;
        memoryOnly = false;
      } catch {
        memoryOnly = true;
        state = {
          cues: checked.length ? checked : defaults,
          customized: checked.length > 0,
          notice: 'O navegador não permitiu salvar. Exporte uma cópia antes de sair desta aula.',
        };
      }
      listeners.forEach((listener) => listener());
      return !memoryOnly;
    },
  };
}

export function useChartLyrics(key: string, totalBeats: number, defaults: LyricCue[]) {
  const store = useMemo(
    () => createLyricsStore(key, totalBeats, defaults),
    [key, totalBeats, defaults],
  );
  const state = useSyncExternalStore(store.subscribe, store.read, store.server);
  return { ...state, save: store.save };
}
