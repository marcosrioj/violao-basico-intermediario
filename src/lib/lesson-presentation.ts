import type { Lesson } from '../content/types';
import type { LessonEnrichment, TechniqueStudy } from '../content/curriculum-types';
import type { IllustratedStep, PracticeVisual } from '../components/course/practice-visual-types';

export interface TechniquePresentationEntry {
  study: Pick<TechniqueStudy, 'id' | 'title' | 'workedExample' | 'steps' | 'checks' | 'retrieval'>;
  stage: 'introducao' | 'retomada';
  focus: string;
  visuals?: PracticeVisual[];
}

export type LessonSlideBlock =
  | { id: string; label?: string; kind: 'text'; text: string }
  | { id: string; label?: string; kind: 'tab'; text: string }
  | { id: string; label?: string; kind: 'visual'; visual: PracticeVisual }
  | { id: string; label?: string; kind: 'list'; items: readonly string[] };

export interface LessonSlide {
  id: string;
  label: string;
  title: string;
  blocks: readonly LessonSlideBlock[];
  answer?: string;
}

/** Projection keeps one task per slide; the complete deck stays available for preparation. */
export function buildEssentialPresentation(
  lesson: Lesson,
  illustratedSteps: readonly IllustratedStep[] = [],
): readonly LessonSlide[] {
  return buildLessonPresentation(lesson, undefined, [], illustratedSteps).filter(
    (slide) =>
      ['goal', 'question', 'checks', 'steps'].includes(slide.id) || slide.id.startsWith('steps-'),
  );
}

/** Derive the presentation from the authorized lesson; never import the course catalog here. */
export function buildLessonPresentation(
  lesson: Lesson,
  enrichment?: LessonEnrichment,
  techniques: readonly TechniquePresentationEntry[] = [],
  illustratedSteps: readonly IllustratedStep[] = [],
): readonly LessonSlide[] {
  const review: LessonSlideBlock[] = [];
  if (lesson.review.trim())
    review.push({ id: 'review', label: 'Retomada', kind: 'text', text: lesson.review });
  if (lesson.focus.trim())
    review.push({ id: 'focus', label: 'Nosso foco', kind: 'text', text: lesson.focus });

  const slides: LessonSlide[] = [
    {
      id: 'goal',
      label: 'Objetivo',
      title: lesson.title,
      blocks: [{ id: 'goal', label: 'Ao final deste encontro', kind: 'text', text: lesson.goal }],
    },
    { id: 'review', label: 'Retomar', title: 'Prepare a escuta e as mãos', blocks: review },
    {
      id: 'explain',
      label: 'Entender',
      title: 'Entenda o que vai tocar',
      blocks: [{ id: 'explain', kind: 'text', text: lesson.explain }],
    },
    {
      id: 'steps',
      label: 'Experimentar',
      title: 'Um passo de cada vez',
      blocks: [{ id: 'steps', kind: 'list', items: [...lesson.steps] }],
    },
    {
      id: 'question',
      label: 'Conectar',
      title: 'Pense antes de conferir',
      blocks: [{ id: 'question', kind: 'text', text: lesson.question }],
      answer: lesson.answer,
    },
    {
      id: 'practice',
      label: 'Praticar',
      title: 'Organize uma sessão de prática',
      blocks: [{ id: 'practice', kind: 'list', items: [...lesson.practice] }],
    },
    {
      id: 'checks',
      label: 'Observar',
      title: 'O que observar ao tocar',
      blocks: [{ id: 'checks', kind: 'list', items: [...lesson.checks] }],
    },
  ];
  if (enrichment) {
    slides.splice(
      4,
      0,
      {
        id: 'learning-example',
        label: 'Aprofundar',
        title: enrichment.workedExample.title,
        blocks: [{ id: 'learning-example', kind: 'text', text: enrichment.workedExample.text }],
      },
      {
        id: 'learning-practice',
        label: 'Aplicar',
        title: 'Experimente e escute o resultado',
        blocks: [{ id: 'learning-practice', kind: 'list', items: [...enrichment.guidedPractice] }],
      },
      {
        id: 'learning-retrieval',
        label: 'Recuperar',
        title: 'Tente explicar antes de conferir',
        blocks: [{ id: 'learning-question', kind: 'text', text: enrichment.retrieval.question }],
        answer: enrichment.retrieval.answer,
      },
    );
    slides.push({
      id: 'learning-week',
      label: 'Distribuir',
      title: 'Quatro momentos para retomar e aplicar',
      blocks: [
        {
          id: 'learning-week',
          kind: 'list',
          items: enrichment.weeklyPlan.map((day) => `Dia ${day.day} · ${day.title}: ${day.task}`),
        },
      ],
    });
    slides.push({
      id: 'learning-transfer',
      label: 'Continuar',
      title: 'O próximo passo de aprendizagem',
      blocks: [
        { id: 'learning-evidence', kind: 'list', items: [...enrichment.successCriteria] },
        { id: 'learning-next', kind: 'text', text: enrichment.nextStep },
      ],
    });
  }
  // Technical practice happens before applying the same movement to the repertoire.
  const techniqueSlides: LessonSlide[] = techniques.flatMap(
    ({ study, stage, focus, visuals = [] }) => [
      {
        id: `technique-${study.id}`,
        label: stage === 'introducao' ? 'Começar técnica' : 'Retomar técnica',
        title: study.title,
        blocks: [
          { id: `focus-${study.id}`, label: 'Foco nesta aula', kind: 'text', text: focus },
          {
            id: `example-${study.id}`,
            label: study.workedExample.title,
            kind: 'text',
            text: study.workedExample.text,
          },
          ...(study.workedExample.tab
            ? [{ id: `tab-${study.id}`, kind: 'tab' as const, text: study.workedExample.tab }]
            : []),
        ],
      },
      ...visuals.map((visual, i): LessonSlide => ({
        id: `technique-visual-${study.id}-${i}`,
        label: 'Demonstrar técnica',
        title: visual.title,
        blocks: [
          { id: `visual-${study.id}-${i}`, kind: 'visual', visual },
          {
            id: `visual-focus-${study.id}-${i}`,
            label: 'Foco nesta aula',
            kind: 'text',
            text: focus,
          },
        ],
      })),
      {
        id: `technique-practice-${study.id}`,
        label: 'Praticar técnica',
        title: study.title,
        blocks: [
          {
            id: `steps-${study.id}`,
            label: 'Escolha os passos adequados ao foco de hoje',
            kind: 'list',
            items: [...study.steps],
          },
          {
            id: `checks-${study.id}`,
            label: 'O que observar',
            kind: 'list',
            items: [...study.checks],
          },
          {
            id: `question-${study.id}`,
            label: 'Tente antes de conferir',
            kind: 'text',
            text: study.retrieval.question,
          },
        ],
        answer: study.retrieval.answer,
      },
    ],
  );
  slides.splice(3, 0, ...techniqueSlides);
  if (illustratedSteps.length) {
    const applicationIndex = slides.findIndex((slide) => slide.id === 'steps');
    slides.splice(
      applicationIndex,
      1,
      ...illustratedSteps.map((step, i): LessonSlide => ({
        id: i === 0 ? 'steps' : `steps-${i}`,
        label: `Prática visual ${i + 1}`,
        title: step.visual.title,
        blocks: [
          { id: `step-visual-${i}`, kind: 'visual', visual: step.visual },
          {
            id: `step-instruction-${i}`,
            kind: 'text',
            label: 'Demonstre e convide o aluno a repetir',
            text: step.instruction,
          },
        ],
      })),
    );
  }
  return slides;
}

/** Answer visibility is a teaching control, not an authorization boundary. */
export function visibleSlideBlocks(
  slide: LessonSlide,
  answerRevealed = false,
): readonly LessonSlideBlock[] {
  if (!answerRevealed || slide.answer === undefined) return slide.blocks;
  return [...slide.blocks, { id: 'answer', label: 'Resposta', kind: 'text', text: slide.answer }];
}

export type PresentationMove = 'previous' | 'next' | 'first' | 'last' | number;

export function presentationIndex(current: number, move: PresentationMove, total: number): number {
  const last = Math.max(0, total - 1);
  const target =
    typeof move === 'number'
      ? move
      : { previous: current - 1, next: current + 1, first: 0, last }[move];
  return Math.max(0, Math.min(last, target));
}
