/** Curriculum expansion enriches the stable v5 lesson IDs without changing repertoire or progress keys. */
export interface ResearchSource {
  id: string;
  title: string;
  author: string;
  url: string;
  accessed: string;
  scope: string;
  limitation: string;
}

export interface TechniqueStudy {
  id: string;
  title: string;
  goal: string;
  prerequisites: string[];
  relatedLessons: string[];
  explanation: string[];
  workedExample: { title: string; text: string; tab?: string };
  steps: string[];
  easier: string;
  harder: string;
  mistakes: { symptom: string; adjustment: string }[];
  checks: string[];
  retrieval: { question: string; answer: string };
  spacing: string[];
  sourceIds: string[];
}

export interface TechniqueModule {
  id: string;
  title: string;
  goal: string;
  prerequisites: string[];
  relatedModules: number[];
  introduction: string;
  studies: TechniqueStudy[];
}

export interface LessonEnrichment {
  lessonId: string;
  techniqueStudyIds: string[];
  understanding: string[];
  workedExample: { title: string; text: string };
  guidedPractice: string[];
  retrieval: { question: string; answer: string };
  weeklyPlan: { day: number; title: string; task: string }[];
  successCriteria: string[];
  nextStep: string;
}

export interface TeacherEnrichment {
  lessonId: string;
  diagnosis: string;
  demonstration: string;
  sequence: { minutes: number; title: string; action: string }[];
  commonDifficulty: string;
  intervention: string;
  easier: string;
  extension: string;
  observation: string;
  feedbackPrompt: string;
  transferCheck: string;
  sourceIds: string[];
}
