import type { LyricCue } from '@/components/music/chart-lyrics';

export interface SongLyricsVersion {
  cues: LyricCue[];
  alignmentNote: string;
  /** Score-based initial alignment is distinct from measured vocal timing. */
  status: 'draft' | 'score-aligned';
}

export interface SongLyrics {
  providedLines: string[];
  versions: Record<string, SongLyricsVersion>;
}

export interface LessonLyrics extends SongLyricsVersion {
  providedLines: string[];
}
