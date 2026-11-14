import { Fragment } from 'react';
import Link from 'next/link';
import { parseCourseText } from '@/content/navigation';
import type { Lesson } from '@/content/types';

export function RichText({
  text,
  lesson,
  field = 'text',
  theoryId,
}: {
  text: string;
  lesson?: Lesson;
  field?: string;
  theoryId?: string;
}) {
  return (
    <span className="rich-text">
      {parseCourseText(text, { lesson, field, theoryId }).map((token, i) =>
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
