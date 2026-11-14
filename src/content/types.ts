/** Course source contracts. String fret positions run from sixth to first string. */
export interface CourseModule {
  n: number;
  title: string;
  goal: string;
}
export interface Chord {
  frets: (number | null)[];
  fingers: (number | null)[];
  code: string;
  tip: string;
  notes: string[];
  barres: number[][];
  bass_string: number;
  display_name?: string;
}
export interface ChartEvent {
  chord: string;
  beats: number;
}
export interface ChartBar {
  events: ChartEvent[];
  beats_per_bar?: number;
  meter?: string;
}
export interface ChartSection {
  id: string;
  title: string;
  bars: ChartBar[];
}
export interface SongVersion {
  key: string;
  key_label?: string;
  meter: string;
  beats_per_bar: number;
  beat_unit: string;
  sections: ChartSection[];
  order: { section: string; repeat: number }[];
  adaptations: string;
  subdivisions_per_beat?: number;
  counting?: string;
  practice_bpm?: number;
  duration_policy?: string;
  reference_tempo_note?: string;
  voicing_policy?: string;
  source_ids?: string[];
}
export interface Source {
  id?: string;
  title: string;
  url?: string;
  kind?: string;
  evidence?: string;
}
export interface Song {
  title: string;
  artist: string;
  composers?: string[];
  source_url: string;
  lyrics_chords_url: string;
  listen_url: string;
  versions: Record<string, SongVersion>;
  sources: Source[];
  original_key?: string;
  recording?: string;
  recording_url?: string;
  recording_year?: number;
  tuning?: string;
  lyrics_chords_note?: string;
  identity_note?: string;
  key_verification?: unknown;
  key_evidence?: unknown;
  recording_metadata?: unknown;
  short_form?: unknown;
}
export interface Lesson {
  id: string;
  sourceId: string;
  n: number;
  module: number;
  local_n: number;
  display_id: string;
  song: string;
  version: string;
  title: string;
  goal: string;
  new_chords: string[];
  focus: string;
  explain: string;
  steps: string[];
  question: string;
  answer: string;
  bpm: number;
  pattern: string;
  review: string;
  practice: string[];
  checks: string[];
  chords: string[];
  total_bars: number;
  total_beats: number;
  duration_minutes: number;
  practice_minutes: number;
  theory_refs: string[];
  reference_refs: string[];
  studentText: string;
  studentPages: number[];
}
export interface TheoryReference {
  id: string;
  title: string;
  lead: string;
  blocks: { heading: string; text: string }[];
  table: { headers: string[]; rows: string[][] };
  exercise: string;
  answer: string;
  sources: Source[];
}
export interface TeacherLesson {
  lessonId: string;
  teacher: string;
  teacherText: string;
  teacherPages: number[];
}
export interface GuidePage {
  id: string;
  title: string;
  text: string;
  page: number;
  audience: 'student' | 'teacher';
}
export interface TheoryBacklink {
  lessonId: string;
  display_id: string;
  title: string;
}
