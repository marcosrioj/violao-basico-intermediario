import techniqueData from './technique-data.json';
import lessonData from './lesson-enrichment.json';
import type { LessonEnrichment, ResearchSource, TechniqueModule } from './curriculum-types';

// Editorial data is read by server pages. Client components receive only the selected content.
export const techniqueModules: TechniqueModule[] = techniqueData.modules;
export const techniqueSources: ResearchSource[] = techniqueData.sources;
export const techniqueIntroduction = techniqueData.introduction;
export const lessonEnrichments: LessonEnrichment[] = lessonData.lessons;
export const practicePrinciples = lessonData.practicePrinciples;
export const practiceIntroduction = lessonData.introduction;
export const techniqueStudies = techniqueModules.flatMap((module) =>
  module.studies.map((study) => ({ ...study, moduleId: module.id, moduleTitle: module.title })),
);

export function getLessonEnrichment(lessonId: string) {
  return lessonEnrichments.find((item) => item.lessonId === lessonId);
}

export function getTechniqueStudy(id: string) {
  return techniqueStudies.find((study) => study.id === id.toLowerCase());
}

export function getLessonStudies(lessonId: string) {
  const ids = new Set(getLessonEnrichment(lessonId)?.techniqueStudyIds ?? []);
  return techniqueStudies.filter((study) => ids.has(study.id));
}

export function getStudyLessonIds(studyId: string) {
  return [
    ...new Set([
      ...(getTechniqueStudy(studyId)?.relatedLessons ?? []),
      ...lessonEnrichments
        .filter((lesson) => lesson.techniqueStudyIds.includes(studyId))
        .map((lesson) => lesson.lessonId),
    ]),
  ];
}
