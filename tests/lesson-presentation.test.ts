import assert from 'node:assert/strict';
import test from 'node:test';
import { lessons } from '../src/content/course';
import {
  getLessonEnrichment,
  getLessonTechniqueEntries,
  techniqueStudies,
} from '../src/content/curriculum';
import {
  buildLessonPresentation,
  presentationIndex,
  visibleSlideBlocks,
} from '../src/lib/lesson-presentation';

test('all 39 presentation decks preserve the lesson material without exposing teacher plans', () => {
  for (const lesson of lessons) {
    const deck = buildLessonPresentation(lesson);
    assert.deepEqual(
      deck.map((slide) => slide.id),
      ['goal', 'review', 'explain', 'steps', 'question', 'practice', 'checks'],
    );
    assert.equal(deck[0].title, lesson.title);
    const blocks = deck.flatMap((slide) => slide.blocks);
    for (const field of ['goal', 'review', 'focus', 'explain', 'question'] as const) {
      const block = blocks.find((item) => item.id === field);
      if (!lesson[field].trim()) {
        assert.equal(block, undefined);
        continue;
      }
      assert.ok(block?.kind === 'text');
      assert.equal(block.text, lesson[field], `${lesson.id}: ${field} text must be preserved`);
    }
    for (const field of ['steps', 'practice', 'checks'] as const) {
      const block = blocks.find((item) => item.id === field);
      assert.ok(block?.kind === 'list');
      assert.deepEqual(block.items, lesson[field]);
      assert.notEqual(block.items, lesson[field], 'deck must not mutate the source array');
    }
    assert.equal('teacherText' in deck[0], false);
  }
});

test('answer appears only after explicit reveal and hiding it preserves the question', () => {
  for (const lesson of lessons) {
    const question = buildLessonPresentation(lesson).find((slide) => slide.id === 'question')!;
    assert.equal(
      visibleSlideBlocks(question).some((block) => block.id === 'answer'),
      false,
    );
    const revealed = visibleSlideBlocks(question, true);
    const answer = revealed.find((block) => block.id === 'answer');
    assert.ok(answer?.kind === 'text');
    assert.equal(answer.text, lesson.answer);
    assert.deepEqual(visibleSlideBlocks(question, false), question.blocks);
    assert.equal(question.blocks.length, 1, 'reveal must not mutate the original blocks');
  }
});

test('presentation navigation stays inside the available steps', () => {
  assert.equal(presentationIndex(0, 'previous', 7), 0);
  assert.equal(presentationIndex(6, 'next', 7), 6);
  assert.equal(presentationIndex(2, 'previous', 7), 1);
  assert.equal(presentationIndex(2, 'next', 7), 3);
  assert.equal(presentationIndex(2, 'first', 7), 0);
  assert.equal(presentationIndex(2, 'last', 7), 6);
  assert.equal(presentationIndex(0, 4, 7), 4);
  assert.equal(presentationIndex(0, 99, 7), 6);
  assert.equal(presentationIndex(0, -5, 7), 0);
  assert.equal(presentationIndex(0, 'next', 0), 0);
});

test('integrated decks preserve the original and enriched slides with technique before application', () => {
  for (const lesson of lessons) {
    const entries = getLessonTechniqueEntries(lesson.id);
    for (const enrichment of [undefined, getLessonEnrichment(lesson.id)]) {
      const previous = buildLessonPresentation(lesson, enrichment);
      const integrated = buildLessonPresentation(lesson, enrichment, entries);
      assert.equal(previous.length, enrichment ? 12 : 7);
      assert.equal(integrated.length, previous.length + entries.length * 2);
      assert.deepEqual(
        integrated.filter((slide) => !slide.id.startsWith('technique-')),
        previous,
        `${lesson.id}: existing presentation content must survive integration`,
      );
      const explainIndex = integrated.findIndex((slide) => slide.id === 'explain');
      const applicationIndex = integrated.findIndex((slide) => slide.id === 'steps');
      const techniqueSlides = integrated.slice(explainIndex + 1, applicationIndex);
      assert.equal(techniqueSlides.length, entries.length * 2);
      assert.ok(techniqueSlides.every((slide) => slide.id.startsWith('technique-')));
      assert.equal(new Set(integrated.map((slide) => slide.id)).size, integrated.length);
      for (const study of techniqueStudies) {
        assert.equal(
          integrated.some((slide) => slide.id === `technique-${study.id}`),
          entries.some((entry) => entry.study.id === study.id),
          `${lesson.id}: only the assigned studies belong in this presentation`,
        );
      }
    }
  }
});

test('technique slides retain focus, examples, practice and tablature with retrieval answers concealed', () => {
  let tablatures = 0;
  for (const lesson of lessons) {
    const entries = getLessonTechniqueEntries(lesson.id);
    const deck = buildLessonPresentation(lesson, getLessonEnrichment(lesson.id), entries);
    for (const { study, stage, focus } of entries) {
      const concept = deck.find((slide) => slide.id === `technique-${study.id}`)!;
      const practice = deck.find((slide) => slide.id === `technique-practice-${study.id}`)!;
      assert.equal(concept.title, study.title);
      assert.equal(concept.label, stage === 'introducao' ? 'Começar técnica' : 'Retomar técnica');
      const conceptText = concept.blocks.filter((block) => block.kind === 'text');
      assert.ok(conceptText.some((block) => block.text === focus));
      assert.ok(conceptText.some((block) => block.text === study.workedExample.text));
      assert.ok(conceptText.some((block) => block.label === study.workedExample.title));
      const tab = concept.blocks.find((block) => block.kind === 'tab');
      if (study.workedExample.tab) {
        assert.ok(tab?.kind === 'tab');
        assert.equal(tab.text, study.workedExample.tab, 'tablature spacing must remain intact');
        tablatures += 1;
      } else {
        assert.equal(tab, undefined);
      }
      const steps = practice.blocks.find((block) => block.id === `steps-${study.id}`);
      const checks = practice.blocks.find((block) => block.id === `checks-${study.id}`);
      assert.ok(steps?.kind === 'list' && checks?.kind === 'list');
      assert.deepEqual(steps.items, study.steps);
      assert.deepEqual(checks.items, study.checks);
      assert.notEqual(steps.items, study.steps);
      assert.notEqual(checks.items, study.checks);
      assert.ok(
        practice.blocks.some(
          (block) => block.kind === 'text' && block.text === study.retrieval.question,
        ),
      );
      assert.equal(practice.answer, study.retrieval.answer);
      assert.ok(!visibleSlideBlocks(practice).some((block) => block.id === 'answer'));
      const revealed = visibleSlideBlocks(practice, true).find((block) => block.id === 'answer');
      assert.ok(revealed?.kind === 'text');
      assert.equal(revealed.text, study.retrieval.answer);
      assert.deepEqual(visibleSlideBlocks(practice, false), practice.blocks);
    }
  }
  assert.ok(tablatures > 0, 'the preservation check must exercise real tablatures');
});
