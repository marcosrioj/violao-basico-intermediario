import { Fragment } from 'react';
import Link from '@/components/ui/page-link';
import { parseCourseText } from '@/content/navigation';
import type { Lesson } from '@/content/types';

export function RichText({
  text,
  lesson,
  field = 'text',
  theoryId,
  demo = false,
}: {
  text: string;
  lesson?: Lesson;
  field?: string;
  theoryId?: string;
  demo?: boolean;
}) {
  const tokens = parseCourseText(text, {
    lesson,
    field,
    theoryId,
    route: demo ? '/demonstracao' : undefined,
  });
  // Link the existing preparation action, not every mention of tuning in the course.
  const tunerToken =
    lesson && field === 'practice-0' && !theoryId
      ? tokens.findIndex((token) => !token.href && /\bafine\b/i.test(token.label))
      : -1;
  return (
    <span className="rich-text">
      {tokens.map((token, i) => {
        if (i === tunerToken) {
          const match = /\bafine\b/i.exec(token.label)!;
          return (
            <Fragment key={i}>
              {token.label.slice(0, match.index)}
              <Link
                purpose="reference"
                href="/laboratorio#afinador"
                title="Afinar o violão no laboratório"
                aria-label={`${match[0]} com o afinador do laboratório`}
              >
                {match[0]}
              </Link>
              {token.label.slice(match.index + match[0].length)}
            </Fragment>
          );
        }
        return token.href ? (
          <Link
            purpose="reference"
            key={`${token.anchor ?? token.href}-${i}`}
            id={token.anchor}
            href={token.href}
          >
            {token.label}
          </Link>
        ) : (
          <Fragment key={i}>{token.label}</Fragment>
        );
      })}
    </span>
  );
}
