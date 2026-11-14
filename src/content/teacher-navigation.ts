import 'server-only';
import { getLesson } from './course';
import { teacherGuides, teacherLessons, weeklyPlan, finalPlan } from './teacher';
import { findTextReferenceOccurrences, type ReferenceOccurrence } from './navigation';

export function getTeacherReferenceOccurrences(referenceId: string): ReferenceOccurrence[] {
  const occurrences: ReferenceOccurrence[] = [];
  for (const guide of teacherGuides) {
    occurrences.push(
      ...findTextReferenceOccurrences(
        guide.text,
        { field: guide.id },
        `Manual docente · p. ${guide.page} · ${guide.title}`,
        '/materiais',
      ),
    );
  }
  for (const plan of teacherLessons) {
    const lesson = getLesson(plan.lessonId);
    if (!lesson) continue;
    occurrences.push(
      ...findTextReferenceOccurrences(
        plan.teacher,
        { lesson, field: 'teacher' },
        `${lesson.display_id} · condução do professor`,
        `/aulas/${lesson.id}`,
      ),
    );
    occurrences.push(
      ...findTextReferenceOccurrences(
        plan.teacherText,
        { lesson, field: 'teacherText' },
        `${lesson.display_id} · plano completo do professor`,
        `/aulas/${lesson.id}`,
      ),
    );
    (lesson.n === 39 ? finalPlan : weeklyPlan).forEach((activity, i) =>
      occurrences.push(
        ...findTextReferenceOccurrences(
          activity.title,
          { lesson, field: `schedule-${i}` },
          `${lesson.display_id} · roteiro do encontro`,
          `/aulas/${lesson.id}`,
        ),
      ),
    );
  }
  return occurrences.filter((occurrence) => occurrence.referenceId === referenceId);
}
