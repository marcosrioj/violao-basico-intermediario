import type { Lesson } from '../content/types';

export type LessonSlideBlock =
  | { id: string; label?: string; kind: 'text'; text: string }
  | { id: string; label?: string; kind: 'list'; items: readonly string[] };

export interface LessonSlide {
  id: string;
  label: string;
  title: string;
  blocks: readonly LessonSlideBlock[];
  answer?: string;
}

/** Derive the presentation from the authorized lesson; never import the course catalog here. */
export function buildLessonPresentation(lesson: Lesson): readonly LessonSlide[] {
  const review: LessonSlideBlock[] = [];
  if (lesson.review.trim())
    review.push({ id: 'review', label: 'Retomada', kind: 'text', text: lesson.review });
  if (lesson.focus.trim())
    review.push({ id: 'focus', label: 'Nosso foco', kind: 'text', text: lesson.focus });

  return [
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
      title: 'Leve a prática para a semana',
      blocks: [{ id: 'practice', kind: 'list', items: [...lesson.practice] }],
    },
    {
      id: 'checks',
      label: 'Observar',
      title: 'O que observar ao tocar',
      blocks: [{ id: 'checks', kind: 'list', items: [...lesson.checks] }],
    },
  ];
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
