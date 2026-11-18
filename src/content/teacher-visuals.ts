import type { Lesson, SongVersion } from './types';
import { getLessonVisualSteps, passage } from './lesson-visuals';
import type { PracticeVisual } from '@/components/course/practice-visual-types';

/** Select the illustration that supports the teacher's demonstration, not merely the first step. */
const demonstrationStep: Record<string, number> = {
  'm1-a1': 1,
  'm1-a2': 1,
  'm1-a3': 1,
  'm2-a1': 1,
  'm2-a3': 2,
  'm3-a1': 2,
  'm3-a3': 1,
  'm4-a1': 1,
  'm5-a2': 1,
  'm5-a3': 1,
  'm6-a3': 1,
  'm7-a1': 1,
  'm7-a2': 1,
  'm8-a1': 1,
  'm9-a3': 1,
  'm10-a3': 1,
  'm11-a2': 1,
  'm11-a3': 1,
  'm12-a3': 1,
};

export function getTeacherDemoVisual(
  lesson: Lesson,
  chart: SongVersion,
): PracticeVisual | undefined {
  if (lesson.id === 'm13-a3') return undefined;
  if (lesson.id === 'm12-a1')
    return passage(
      chart,
      'Três entradas em quatro pulsos',
      'G no 1; D no e de 2; A no 4. Conte oito colcheias: 1 e 2 e 3 e 4 e.',
      ['I', 1],
    );
  return getLessonVisualSteps(lesson, chart)[demonstrationStep[lesson.id] ?? 0].visual;
}
