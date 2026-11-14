import data from './course-data.json';
import guides from './student-guides.json';
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
export const songs: Record<string, Song> = data.songs;
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
  edition: 5,
  modules: 13,
  lessons: 39,
  weeklyMinutes: 60,
  practiceDaysPerWeek: 4,
};
