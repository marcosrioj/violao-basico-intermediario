import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidElement, type ReactNode } from 'react';
import { LessonView } from '../src/components/course/lesson-view';
import { lessons } from '../src/content/course';
import { getDemoTheory } from '../src/content/demo';
import { parseCourseText } from '../src/content/navigation';
function assertSiblingKeys(node: ReactNode): void {
  if (Array.isArray(node)) {
    const keys = new Set<string>();
    for (const child of node) {
      if (isValidElement(child) && child.key !== null) {
        assert.ok(!keys.has(child.key), 'Duplicate sibling key: ' + child.key);
        keys.add(child.key);
      }
      assertSiblingKeys(child);
    }
  } else if (isValidElement<{ children?: ReactNode }>(node)) assertSiblingKeys(node.props.children);
}
test('lesson view gives progress and practice distinct sibling keys', () => {
  assertSiblingKeys(LessonView({ lesson: lessons[0], demo: true }));
  assertSiblingKeys(LessonView({ lesson: lessons[12], teacher: true }));
});
test('demo theory returns to exact demo anchors and excludes other references', () => {
  const lesson = lessons[0];
  const token = parseCourseText('R1', { lesson, field: 'theory_refs-0', route: '/demonstracao' }).find(item => item.kind === 'theory');
  assert.ok(token);
  assert.equal(token.href, '/demonstracao/teoria/R1');
  const content = getDemoTheory('r1');
  assert.ok(content);
  assert.ok(content.occurrences.some(item => item.href === '/demonstracao#' + token.anchor));
  assert.ok(content.occurrences.every(item => item.href.startsWith('/demonstracao#')));
  assert.equal(getDemoTheory('R2'), undefined);
  assert.equal(getDemoTheory('missing'), undefined);
  assert.equal(parseCourseText('R1', { lesson, field: 'theory_refs-0' }).find(item => item.kind === 'theory')?.href, '/teoria/R1');
});
