import first from './song-lyrics-1.json';
import second from './song-lyrics-2.json';
import third from './song-lyrics-3.json';
import type { LessonLyrics, SongLyrics } from './song-lyrics-types';

/** The full catalog stays on the server; a lesson receives only its own song and version. */
export const songLyrics = { ...first, ...second, ...third } as Record<string, SongLyrics>;

export function getLessonLyrics(songId: string, version: string): LessonLyrics | undefined {
  const song = songLyrics[songId];
  const arrangement = song?.versions[version];
  return arrangement ? { ...arrangement, providedLines: song.providedLines } : undefined;
}
