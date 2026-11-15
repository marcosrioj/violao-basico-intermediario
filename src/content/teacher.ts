import 'server-only';
import data from './teacher-data.json';
import enrichment from './teacher-enrichment.json';
import type { TeacherLesson, GuidePage } from './types';
import type { TeacherEnrichment, ResearchSource } from './curriculum-types';

export const teachingGuide = enrichment;
export const teachingSources: ResearchSource[] = enrichment.sources;
export function getTeacherEnrichment(lessonId: string): TeacherEnrichment | undefined {
  return enrichment.lessons.find((lesson) => lesson.lessonId === lessonId);
}

/** Import only from a server component after teacher authorization. */
export const teacherLessons: TeacherLesson[] = data.lessons;
export const teacherGuides: GuidePage[] = data.guides as GuidePage[];
export function getTeacherLesson(lessonId: string): TeacherLesson | undefined {
  return teacherLessons.find((lesson) => lesson.lessonId === lessonId);
}
export const weeklyPlan = [
  { minutes: 5, title: 'Afinar e preparar o som' },
  { minutes: 5, title: 'Retomar a habilidade anterior' },
  { minutes: 8, title: 'Demonstrar e orientar a escuta' },
  { minutes: 12, title: 'Trabalhar o trecho marcado' },
  { minutes: 22, title: 'Tocar a canção completa' },
  { minutes: 5, title: 'Comparar e registrar a evidência' },
  { minutes: 3, title: 'Combinar a tarefa da semana' },
];
export const finalPlan = [
  { minutes: 5, title: 'Afinação e combinação' },
  { minutes: 24, title: 'Apresentar três músicas preparadas' },
  { minutes: 8, title: 'Transpor um exercício autoral de Teoria R4' },
  { minutes: 8, title: 'Ouvido e explicação harmônica' },
  { minutes: 10, title: 'Feedback e rubrica' },
  { minutes: 5, title: 'Próximos passos' },
];
