import { lessons, theoryReferences } from './course';
import { getReferenceOccurrences } from './navigation';
/** Only references assigned to the first public lesson are available here. */
export function getDemoTheory(id: string) {
  const lesson = lessons[0];
  const reference = theoryReferences.find((item) => item.id.toLowerCase() === id.toLowerCase());
  if (!reference || !lesson.theory_refs.includes(reference.id)) return undefined;
  const lessonPrefix = '/aulas/' + lesson.id + '#';
  const occurrences = getReferenceOccurrences(reference.id)
    .filter((item) => item.href.startsWith(lessonPrefix))
    .map((item) => ({ ...item, href: '/demonstracao#' + item.anchor }));
  return { reference, occurrences };
}
