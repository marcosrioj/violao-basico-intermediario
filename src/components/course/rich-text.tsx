import { Fragment } from 'react';
import Link from 'next/link';
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
  return (
    <span className="rich-text">
      {parseCourseText(text, { lesson, field, theoryId, route: demo ? '/demonstracao' : undefined }).map((token, i) =>
        token.href ? (
          <Link key={`${token.anchor ?? token.href}-${i}`} id={token.anchor} href={token.href}>
            {token.label}
          </Link>
        ) : (
          <Fragment key={i}>{token.label}</Fragment>
        ),
      )}
    </span>
  );
}
