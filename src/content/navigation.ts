import { getChart, lessons, theoryReferences, studentGuides } from './course';
import type { Lesson } from './types';

export interface TextContext {
  field: string;
  lesson?: Lesson;
  theoryId?: string;
  route?: string;
}
export interface CourseTextToken {
  kind: 'text' | 'theory' | 'lesson' | 'bar';
  label: string;
  href?: string;
  anchor?: string;
  referenceId?: string;
}
export interface ReferenceOccurrence {
  referenceId: string;
  anchor: string;
  href: string;
  label: string;
}
const slug = (value: string) => value.replace(/[^a-zA-Z0-9_-]/g, '-');

/** Distinguishes R3 as refrain bar from R3 as theory. Never renders source HTML. */
export function tokenizeCourseText(text: string, context: TextContext): CourseTextToken[] {
  const result: CourseTextToken[] = [];
  const pattern =
    /\b(?:Teoria\s+)?R[1-8](?:[–-]R?[1-8])?\b(?!\.\d|\d)|\bM\d{1,2}-A[1-3]\b|\b[A-Z](?:[A-Za-z_]*\d*)?(?:\.\d+)?\b/g;
  let last = 0;
  let lastTheoryEnd = -1;
  for (const match of text.matchAll(pattern)) {
    const token = match[0];
    const pos = match.index ?? 0;
    if (pos > last) result.push({ kind: 'text', label: text.slice(last, pos) });
    const before = text.slice(Math.max(0, pos - 80), pos);
    const isTheory =
      /^(?:Teoria\s+)?R[1-8](?:[–-]R?[1-8])?$/.test(token) &&
      (/^Teoria\s+/i.test(token) ||
        !!context.theoryId ||
        context.field === 'review' ||
        context.field.startsWith('theory_refs') ||
        (lastTheoryEnd >= 0 && /^[\s,/·]*(?:e\s+)?$/.test(text.slice(lastTheoryEnd, pos))) ||
        /(?:teoria|consultas?|refer[eê]ncias?|exerc[ií]cio autoral(?: de)?|exemplos autorais|consulte|revise|use)\s+(?:a |as |o |os |de )?$/i.test(
          before,
        ));
    if (isTheory) {
      lastTheoryEnd = pos + token.length;
      const nums = token.match(/[1-8]/g)!.map(Number);
      const end = nums[1] ?? nums[0];
      for (let n = nums[0]; n <= end; n++) {
        if (n > nums[0]) result.push({ kind: 'text', label: ' · ' });
        const id = `R${n}`;
        const anchor = `ref-${slug(context.lesson?.id ?? context.theoryId ?? context.route ?? 'guide')}-${slug(context.field)}-${pos}-${id}`;
        result.push({
          kind: 'theory',
          label: `Teoria ${id}`,
          href: `/teoria/${id}`,
          anchor,
          referenceId: id,
        });
      }
    } else if (/^M\d+-A\d$/.test(token) && lessons.some((lesson) => lesson.display_id === token)) {
      result.push({ kind: 'lesson', label: token, href: `/aulas/${token.toLowerCase()}` });
    } else {
      const parts = token.split(/([–-])/);
      for (let part of parts) {
        if (/^\d$/.test(part) && /^R/.test(token)) part = `R${part}`;
        let bar: string | undefined;
        if (context.lesson) {
          for (const section of getChart(context.lesson).sections) {
            section.bars.forEach((_, index) => {
              const label = `${section.id}${/\d$/.test(section.id) ? '.' : ''}${index + 1}`;
              if (label === part) bar = `bar-${section.id}-${index}`;
            });
            if (
              part === section.id &&
              (context.field === 'focus' ||
                /[→]/.test(text.slice(Math.max(0, pos - 3), pos + token.length + 4)))
            )
              bar = `section-${section.id}`;
          }
        }
        result.push(
          bar ? { kind: 'bar', label: part, href: `#${bar}` } : { kind: 'text', label: part },
        );
      }
    }
    last = pos + token.length;
  }
  if (last < text.length) result.push({ kind: 'text', label: text.slice(last) });
  return result;
}

const fieldLabels: Record<string, string> = {
  explain: 'explicação',
  review: 'retomada',
  question: 'pergunta',
  answer: 'resposta',
  goal: 'meta',
  focus: 'trecho',
  studentText: 'material completo',
  theory_refs: 'consultas',
  steps: 'passo',
  practice: 'prática',
  checks: 'conferência',
};
export const referenceOccurrences: ReferenceOccurrence[] = [];
export function findTextReferenceOccurrences(
  text: string,
  context: TextContext,
  label: string,
  route: string,
): ReferenceOccurrence[] {
  return tokenizeCourseText(text, context).flatMap((token) =>
    token.kind === 'theory' && token.referenceId && token.anchor
      ? [
          {
            referenceId: token.referenceId,
            anchor: token.anchor,
            href: `${route}#${token.anchor}`,
            label,
          },
        ]
      : [],
  );
}
function collect(text: string, context: TextContext, label: string, route: string) {
  referenceOccurrences.push(...findTextReferenceOccurrences(text, context, label, route));
}
for (const lesson of lessons) {
  for (const field of [
    'goal',
    'explain',
    'review',
    'question',
    'answer',
    'focus',
    'studentText',
  ] as const) {
    collect(
      lesson[field],
      { lesson, field },
      `${lesson.display_id} · ${fieldLabels[field]}`,
      `/aulas/${lesson.id}`,
    );
  }
  for (const field of ['steps', 'practice', 'checks', 'theory_refs'] as const) {
    lesson[field].forEach((text, i) =>
      collect(
        text,
        { lesson, field: `${field}-${i}` },
        `${lesson.display_id} · ${fieldLabels[field]} ${i + 1}`,
        `/aulas/${lesson.id}`,
      ),
    );
  }
}
for (const theory of theoryReferences) {
  for (const field of ['lead', 'exercise', 'answer'] as const)
    collect(
      theory[field],
      { theoryId: theory.id, field },
      `${theory.id} · ${field}`,
      `/teoria/${theory.id}`,
    );
  theory.blocks.forEach((block, i) => {
    collect(
      block.heading,
      { theoryId: theory.id, field: `heading-${i}` },
      `${theory.id} · ${block.heading}`,
      `/teoria/${theory.id}`,
    );
    collect(
      block.text,
      { theoryId: theory.id, field: `block-${i}` },
      `${theory.id} · ${block.heading}`,
      `/teoria/${theory.id}`,
    );
  });
  theory.table.headers.forEach((text, i) =>
    collect(
      text,
      { theoryId: theory.id, field: `head-${i}` },
      `${theory.id} · tabela`,
      `/teoria/${theory.id}`,
    ),
  );
  theory.table.rows.forEach((row, i) =>
    row.forEach((text, j) =>
      collect(
        text,
        { theoryId: theory.id, field: `cell-${i}-${j}` },
        `${theory.id} · tabela`,
        `/teoria/${theory.id}`,
      ),
    ),
  );
}
for (const guide of studentGuides) {
  collect(
    guide.text,
    { field: guide.id },
    `Biblioteca · p. ${guide.page} · ${guide.title}`,
    '/materiais',
  );
}
export function getReferenceOccurrences(referenceId: string) {
  return referenceOccurrences.filter((occurrence) => occurrence.referenceId === referenceId);
}

/** Friendly alias for the React rich-text renderer. */
export const parseCourseText = tokenizeCourseText;
