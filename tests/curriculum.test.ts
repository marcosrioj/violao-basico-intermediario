import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import base from '../src/content/course-data.json';
import preservation from '../src/content/content-preservation.json';
import teacher from '../src/content/teacher-enrichment.json';
import pdf from '../src/content/pdf-manifest.json';
import { lessons } from '../src/content/course';
import {
  getLessonEnrichment,
  getLessonStudies,
  getStudyLessonIds,
  techniqueModules,
  techniqueStudies,
  techniqueSources,
  lessonEnrichments,
} from '../src/content/curriculum';
import { buildLessonPresentation, visibleSlideBlocks } from '../src/lib/lesson-presentation';

test('The expanded curriculum preserves the entire original editorial base, repertoire and source artifacts', () => {
  for (const source of preservation.files) {
    const hash = createHash('sha256').update(readFileSync(source.path)).digest('hex');
    assert.equal(hash, source.sha256, `${source.path} must remain preserved`);
  }
  assert.equal(base.modules.length, 13);
  assert.equal(base.lessons.length, 39);
  assert.deepEqual(
    lessons.map((lesson) => lesson.id),
    base.lessons.map((lesson) => lesson.id),
  );
});

test('every enriched lesson has a teaching plan, four review days and valid technical links', () => {
  const ids = lessons.map((lesson) => lesson.id).sort();
  assert.deepEqual(lessonEnrichments.map((lesson) => lesson.lessonId).sort(), ids);
  assert.deepEqual(teacher.lessons.map((lesson) => lesson.lessonId).sort(), ids);
  const studyIds = new Set(techniqueStudies.map((study) => study.id));
  const teacherSourceIds = new Set(teacher.sources.map((source) => source.id));
  for (const lesson of lessonEnrichments) {
    assert.ok(lesson.understanding.length > 0, lesson.lessonId);
    assert.deepEqual(
      lesson.weeklyPlan.map((day) => day.day),
      [1, 2, 3, 4],
    );
    assert.ok(lesson.techniqueStudyIds.length > 0, lesson.lessonId);
    for (const id of lesson.techniqueStudyIds) assert.ok(studyIds.has(id), id);
    const currentModule = lessons.find((item) => item.id === lesson.lessonId)!.module;
    for (const studyId of lesson.techniqueStudyIds) {
      const minimumModule =
        studyId === 't3-e3'
          ? 5
          : studyId.startsWith('t4-')
            ? 4
            : studyId.startsWith('t5-')
              ? 8
              : studyId.startsWith('t6-')
                ? 9
                : studyId.startsWith('t8-')
                  ? 10
                  : 1;
      assert.ok(currentModule >= minimumModule, `${lesson.lessonId}: premature study ${studyId}`);
    }
    assert.equal(getLessonStudies(lesson.lessonId).length, lesson.techniqueStudyIds.length);
    const plan = teacher.lessons.find((item) => item.lessonId === lesson.lessonId)!;
    assert.equal(
      plan.sequence.reduce((total, stage) => total + stage.minutes, 0),
      60,
      lesson.lessonId,
    );
    assert.ok(plan.sequence.every((stage) => stage.minutes > 0 && stage.action.trim()));
    assert.ok(plan.sourceIds.length > 0);
    for (const id of plan.sourceIds) assert.ok(teacherSourceIds.has(id), id);
  }
});

test('all 27 studies have an application, prerequisites, corrections and traceable sources', () => {
  assert.equal(techniqueModules.length, 9);
  assert.equal(techniqueStudies.length, 27);
  assert.equal(new Set(techniqueStudies.map((study) => study.id)).size, 27);
  const lessonIds = new Set(lessons.map((lesson) => lesson.id));
  const sourceIds = new Set(techniqueSources.map((source) => source.id));
  for (const techniqueModule of techniqueModules) {
    assert.equal(techniqueModule.studies.length, 3);
    for (const study of techniqueModule.studies) {
      assert.match(study.id, /^t[1-9]-e[1-3]$/);
      assert.ok(study.prerequisites.length && study.explanation.length && study.steps.length);
      assert.ok(study.mistakes.length && study.checks.length && study.spacing.length);
      assert.ok(study.retrieval.question.trim() && study.retrieval.answer.trim());
      if (study.workedExample.tab) {
        const strings = study.workedExample.tab
          .split('\n')
          .filter((line) => /^[eBGDAE]\|/.test(line));
        assert.equal(strings.length, 6, `${study.id}: all six strings must be represented`);
        const boundaries = (line: string) => [...line.matchAll(/\|/g)].map((match) => match.index);
        for (const line of strings)
          assert.deepEqual(
            boundaries(line),
            boundaries(strings[0]),
            `${study.id}: aligned bar lines`,
          );
      }
      assert.ok(study.sourceIds.length > 0);
      for (const id of study.sourceIds) assert.ok(sourceIds.has(id), `${study.id}: ${id}`);
      const related = getStudyLessonIds(study.id);
      assert.ok(related.length > 0, study.id);
      for (const id of related) assert.ok(lessonIds.has(id), `${study.id}: ${id}`);
    }
  }
  for (const source of [...techniqueSources, ...teacher.sources]) {
    assert.equal(new URL(source.url).protocol, 'https:');
    assert.ok(source.scope.trim() && source.limitation.trim());
  }
});

test('Enriched presentations retain the original steps and hide both retrieval answers', () => {
  for (const lesson of lessons) {
    const original = buildLessonPresentation(lesson);
    const extended = buildLessonPresentation(lesson, getLessonEnrichment(lesson.id));
    assert.deepEqual(
      extended.filter((slide) => !slide.id.startsWith('learning-')),
      original,
    );
    assert.equal(extended.length, 12);
    const weeklyBlock = extended.find((slide) => slide.id === 'learning-week')!.blocks[0];
    assert.ok(weeklyBlock.kind === 'list');
    assert.equal(weeklyBlock.items.length, 4);
    for (const slide of extended.filter((slide) => slide.answer !== undefined)) {
      assert.ok(!visibleSlideBlocks(slide).some((block) => block.id === 'answer'));
      assert.ok(visibleSlideBlocks(slide, true).some((block) => block.id === 'answer'));
    }
  }
});

test('both published course PDFs include every lesson, study and original page', () => {
  for (const [name, expectedHash] of Object.entries(pdf.sourceHashes)) {
    const actual = createHash('sha256')
      .update(readFileSync(`src/content/${name}.json`))
      .digest('hex');
    assert.equal(actual, expectedHash, `Rebuild PDFs after changing ${name}`);
  }
  for (const [audience, originalPages] of [
    ['student', 130],
    ['teacher', 73],
  ] as const) {
    const document = pdf[audience];
    const bytes = readFileSync(`materials/${document.filename}`);
    assert.equal(createHash('sha256').update(bytes).digest('hex'), document.sha256);
    assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
    assert.equal(document.pages - document.legacyStartPage + 1, originalPages);
    for (const lesson of lessons) {
      const page = document.lessons[lesson.id as keyof typeof document.lessons];
      assert.ok(page > 0 && page < document.legacyStartPage, lesson.id);
    }
    for (const study of techniqueStudies) {
      const page = document.studies[study.id as keyof typeof document.studies];
      assert.ok(page > 0 && page < document.legacyStartPage, study.id);
    }
    assert.deepEqual(readFileSync(`output/pdf/${document.filename}`), bytes);
  }
});
