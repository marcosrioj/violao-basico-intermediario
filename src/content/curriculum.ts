import techniqueData from './technique-data.json';
import lessonData from './lesson-enrichment.json';
import journeyData from './lesson-journey.json';
import type {
  LessonEnrichment,
  LessonJourney,
  LessonTechniqueEntry,
  ResearchSource,
  TechniqueModule,
  TechniqueStudyIntroduction,
  TechniqueStudyWithModule,
} from './curriculum-types';

// Editorial data is read by server pages. Client components receive only the selected content.
export const techniqueModules: TechniqueModule[] = techniqueData.modules;
export const techniqueSources: ResearchSource[] = techniqueData.sources;
export const techniqueIntroduction = techniqueData.introduction;
export const lessonEnrichments: LessonEnrichment[] = lessonData.lessons;
/** Shared by the course, study index, teaching material and PDFs. */
export const lessonJourneys = journeyData.lessons as LessonJourney[];
export const practicePrinciples = lessonData.practicePrinciples;
export const practiceIntroduction = lessonData.introduction;
export const techniqueStudies: TechniqueStudyWithModule[] = techniqueModules.flatMap((module) =>
  module.studies.map((study) => ({ ...study, moduleId: module.id, moduleTitle: module.title })),
);

export function getLessonEnrichment(lessonId: string) {
  return lessonEnrichments.find((item) => item.lessonId === lessonId);
}

export function getTechniqueStudy(id: string) {
  return techniqueStudies.find((study) => study.id === id.toLowerCase());
}

export function getLessonStudies(lessonId: string) {
  return getLessonTechniqueEntries(lessonId).map((entry) => entry.study);
}

export function getStudyLessonIds(studyId: string) {
  return lessonJourneys
    .filter((lesson) => lesson.techniques.some((entry) => entry.studyId === studyId.toLowerCase()))
    .map((lesson) => lesson.lessonId);
}

export function getLessonTechniqueEntries(lessonId: string): LessonTechniqueEntry[] {
  const journey = lessonJourneys.find((lesson) => lesson.lessonId === lessonId.toLowerCase());
  return (journey?.techniques ?? []).flatMap(({ studyId, stage, focus }) => {
    const study = getTechniqueStudy(studyId);
    return study ? [{ study, stage, focus }] : [];
  });
}

export function getTechniqueStudyIntroduction(
  studyId: string,
): TechniqueStudyIntroduction | undefined {
  for (const lesson of lessonJourneys) {
    const introduction = lesson.techniques.find(
      (entry) => entry.studyId === studyId.toLowerCase() && entry.stage === 'introducao',
    );
    if (introduction) return { lessonId: lesson.lessonId, focus: introduction.focus };
  }
  return undefined;
}

export function getModuleTechniqueCount(moduleNumber: number): number {
  return new Set(
    lessonJourneys
      .filter((lesson) => lesson.lessonId.startsWith(`m${moduleNumber}-`))
      .flatMap((lesson) => lesson.techniques.map((entry) => entry.studyId)),
  ).size;
}
