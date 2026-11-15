import data from './course-data.json';
import guides from './student-guides.json';
import tempoData from './tempo-research.json';
import type { TempoResearch } from './tempo';
import type {
  CourseModule,
  Chord,
  Lesson,
  Song,
  TheoryReference,
  GuidePage,
  TheoryBacklink,
} from './types';

export type {
  CourseModule,
  Chord,
  ChartBar,
  ChartEvent,
  ChartSection,
  Lesson,
  Song,
  SongVersion,
  TheoryReference,
  GuidePage,
} from './types';
export const courseModules: CourseModule[] = data.modules;
export const lessons: Lesson[] = data.lessons;
const tempos = tempoData as Record<string, TempoResearch>;
export const songs: Record<string, Song> = Object.fromEntries(
  Object.entries(data.songs).map(([id, song]) => [id, { ...song, tempo: tempos[id] }]),
);
export const chords: Record<string, Chord> = data.chords;
export const theoryReferences: TheoryReference[] = data.references;
export const coursePrinciples: string[] = data.principles;
export const studentGuides: GuidePage[] = guides as GuidePage[];
export const theoryBacklinks: Record<string, TheoryBacklink[]> = Object.fromEntries(
  theoryReferences.map((reference) => [
    reference.id,
    lessons
      .filter(
        (lesson) =>
          lesson.theory_refs.includes(reference.id) ||
          new RegExp(
            `(?:Teoria|teoria|consulte|consulta|revise|use)\\s+${reference.id}\\b`,
            'i',
          ).test(
            [
              lesson.explain,
              lesson.review,
              lesson.question,
              lesson.answer,
              ...lesson.steps,
              ...lesson.practice,
            ].join(' '),
          ),
      )
      .map(({ id, display_id, title }) => ({ lessonId: id, display_id, title })),
  ]),
);
export function getLesson(id: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.id === id.toLowerCase() || lesson.sourceId === id);
}
export function getSong(lesson: Lesson): Song {
  return songs[lesson.song];
}
export function getChart(lesson: Lesson) {
  return getSong(lesson).versions[lesson.version];
}
export function getModuleLessons(module: number): Lesson[] {
  return lessons.filter((lesson) => lesson.module === module);
}
export const courseInfo = {
  name: 'Violão Vivo',
  tagline: 'Do primeiro acorde à liberdade de adorar.',
  edition: 6,
  modules: 13,
  lessons: 39,
  weeklyMinutes: 60,
  practiceDaysPerWeek: 4,
  techniqueModules: 9,
  techniqueStudies: 27,
};
