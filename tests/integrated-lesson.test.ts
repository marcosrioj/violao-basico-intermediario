import assert from 'node:assert/strict';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TeacherDeepening, TechniqueStudyContent } from '../src/components/course/learning-content';
import { LessonView } from '../src/components/course/lesson-view';
import { LessonProgress } from '../src/components/course/lesson-progress';
import { TheoryReading } from '../src/components/course/theory-reading';
import { lessons, theoryReferences } from '../src/content/course';
import teacherContent from '../src/content/teacher-enrichment.json';
import { parseCourseText } from '../src/content/navigation';
import {
  getLessonEnrichment,
  getLessonTechniqueEntries,
  techniqueSources,
  techniqueStudies,
} from '../src/content/curriculum';

// Next supplies the JSX runtime in the app; tsx preserves this project's JSX setting in tests.
Object.assign(globalThis, { React });

test('the completion action stays outside disclosures and follows its checklist in keyboard order', () => {
  for (const lesson of lessons) {
    const html = renderToStaticMarkup(React.createElement(LessonProgress, { lesson }));
    let depth = 0;
    let completionActions = 0;
    for (const [tag] of html.matchAll(/<details\b[^>]*>|<\/details>|<button\b[^>]*>/g)) {
      if (tag.startsWith('<details')) depth++;
      else if (tag === '</details>') depth--;
      else if (tag.includes('aria-controls=')) {
        completionActions++;
        assert.equal(depth, 0, `${lesson.id}: completion cannot be hidden in a disclosure`);
      }
    }
    assert.equal(completionActions, 1, `${lesson.id}: one completion action`);
    assert.ok(
      html.indexOf('<select') < html.indexOf('aria-controls='),
      `${lesson.id}: fields precede submission`,
    );
    assert.equal((html.match(/type="checkbox"/g) ?? []).length, lesson.checks.length);
  }
});

function escapedText(text: string): string {
  return renderToStaticMarkup(React.createElement('span', null, text)).slice(6, -7);
}

function textContent(html: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#x27;': "'",
    '&#39;': "'",
  };
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&(?:amp|lt|gt|quot|#x27|#39);/g, (entity) => entities[entity])
    .replace(/\s+/g, ' ')
    .trim();
}

test('all 27 full technical studies render every teaching field and preserve literal tablatures', () => {
  for (const study of techniqueStudies) {
    const html = renderToStaticMarkup(
      React.createElement(TechniqueStudyContent, { study, sources: [] }),
    );
    const fields = [
      study.goal,
      ...study.prerequisites,
      ...study.explanation,
      study.workedExample.title,
      study.workedExample.text,
      ...study.steps,
      study.easier,
      study.harder,
      ...study.mistakes.flatMap((mistake) => [mistake.symptom, mistake.adjustment]),
      ...study.checks,
      study.retrieval.question,
      study.retrieval.answer,
      ...study.spacing,
    ];
    for (const field of fields) {
      assert.ok(html.includes(escapedText(field)), `${study.id}: missing teaching text: ${field}`);
    }
    if (study.workedExample.tab) {
      assert.ok(html.includes(`<code>${escapedText(study.workedExample.tab)}</code>`), study.id);
      assert.ok(html.includes(`aria-label="Tablatura: ${escapedText(study.title)}"`), study.id);
    }
    // The answer is available inside a closed disclosure, rather than removed from the material.
    assert.ok(html.includes('<summary>Conferir e comparar minha tentativa</summary>'));
    assert.ok(!html.includes('<details open=""'));
  }
});

test('technical references remain available and are limited to the study being read', () => {
  for (const study of techniqueStudies) {
    const html = renderToStaticMarkup(
      React.createElement(TechniqueStudyContent, { study, sources: techniqueSources }),
    );
    for (const source of techniqueSources) {
      assert.equal(
        html.includes(`href="${escapedText(source.url)}"`),
        study.sourceIds.includes(source.id),
        `${study.id}: source ${source.id}`,
      );
    }
  }
});

test('all 39 lessons retain their material and render only their canonical studies in the learning path', () => {
  for (const lesson of lessons) {
    const html = renderToStaticMarkup(React.createElement(LessonView, { lesson }));
    const text = textContent(html);
    const enrichment = getLessonEnrichment(lesson.id)!;
    const entries = getLessonTechniqueEntries(lesson.id);
    const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
    const anchors = [...html.matchAll(/href="#([^"]+)"/g)].map((match) => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${lesson.id}: duplicate element IDs`);
    for (const anchor of anchors) assert.ok(ids.includes(anchor), `${lesson.id}: #${anchor}`);
    const studyAnchors = ids.filter((id) => id.startsWith('estudo-'));
    assert.deepEqual(
      studyAnchors,
      entries.map((entry) => `estudo-${entry.study.id}`),
      `${lesson.id}: canonical studies must appear exactly once and in order`,
    );
    const stages = ['entender', 'tecnica', 'aplicar', 'revisar'];
    const stagePositions = stages.map((stage) => html.indexOf(`id="${stage}"`));
    assert.ok(
      stagePositions.every((position) => position >= 0),
      lesson.id,
    );
    assert.deepEqual(
      stagePositions,
      [...stagePositions].sort((a, b) => a - b),
    );
    const stagePanels = [...html.matchAll(/<details\b[^>]*name="lesson-stage"[^>]*>/g)].map(
      (match) => match[0],
    );
    assert.equal(stagePanels.length, 4, `${lesson.id}: four exclusive stages`);
    const initiallyOpen = stagePanels.filter((panel) => panel.includes('open=""'));
    assert.equal(initiallyOpen.length, 1, `${lesson.id}: one initial activity`);
    assert.ok(initiallyOpen[0].includes('id="entender"'));
    const completionPosition = html.indexOf('id="meu-progresso"');
    assert.ok(
      completionPosition > 0 && completionPosition < stagePositions[0],
      `${lesson.id}: completion is available before any closed stage`,
    );
    assert.ok(
      html.includes('<section id="meu-progresso"'),
      `${lesson.id}: progress is not a disclosure`,
    );
    assert.ok(
      html.includes('href="#tocar"') && html.includes('href="#diario-pratica"'),
      `${lesson.id}: practice actions are directly reachable`,
    );
    for (const id of ['diario-pratica']) {
      const position = html.indexOf(`id="${id}"`);
      assert.ok(
        position > stagePositions[3] && position < html.indexOf('id="apoio"'),
        `${lesson.id}: ${id} belongs to the review`,
      );
    }
    for (const entry of entries) {
      assert.ok(html.includes(escapedText(entry.study.title)), lesson.id);
      assert.ok(html.includes(escapedText(entry.focus)), lesson.id);
      const studyPosition = html.indexOf(`id="estudo-${entry.study.id}"`);
      assert.ok(studyPosition > stagePositions[1] && studyPosition < stagePositions[2], lesson.id);
    }
    const original = [
      ...(['goal', 'explain', 'focus', 'review', 'question', 'answer', 'studentText'] as const).map(
        (field) => ({ field, text: lesson[field] }),
      ),
      ...(['steps', 'practice', 'checks', 'theory_refs'] as const).flatMap((field) =>
        lesson[field].map((text, index) => ({ field: `${field}-${index}`, text })),
      ),
    ].map(({ field, text }) =>
      parseCourseText(text, { lesson, field })
        .map((token) => token.label)
        .join(''),
    );
    const preserved = [
      lesson.title,
      ...original,
      ...enrichment.understanding,
      enrichment.workedExample.title,
      enrichment.workedExample.text,
      ...enrichment.guidedPractice,
      enrichment.retrieval.question,
      enrichment.retrieval.answer,
      ...enrichment.weeklyPlan.flatMap((day) => [day.title, day.task]),
      ...enrichment.successCriteria,
      enrichment.nextStep,
    ];
    for (const field of preserved) {
      assert.ok(
        text.includes(field.replace(/\s+/g, ' ').trim()),
        `${lesson.id}: original or enriched lesson text missing: ${field}`,
      );
    }
    assert.ok(html.includes('id="meu-progresso"'), lesson.id);
    assert.ok(html.includes('id="diario-pratica"'), lesson.id);
  }
});

test('all teacher plans retain diagnosis, timing, adaptations and feedback inside their reading groups', () => {
  for (const content of teacherContent.lessons) {
    const html = renderToStaticMarkup(
      React.createElement(TeacherDeepening, {
        content,
        sources: teacherContent.sources,
      }),
    );
    const fields = [
      content.diagnosis,
      content.demonstration,
      content.commonDifficulty,
      content.intervention,
      content.easier,
      content.extension,
      content.observation,
      content.feedbackPrompt,
      content.transferCheck,
      ...content.sequence.flatMap((stage) => [stage.title, stage.action]),
    ];
    for (const field of fields) {
      assert.ok(
        textContent(html).includes(field.replace(/\s+/g, ' ').trim()),
        `${content.lessonId}: ${field}`,
      );
    }
    assert.equal(
      content.sequence.reduce((sum, stage) => sum + stage.minutes, 0),
      60,
    );
    for (const source of teacherContent.sources.filter((item) =>
      content.sourceIds.includes(item.id),
    )) {
      assert.ok(html.includes(escapedText(source.url)), `${content.lessonId}: ${source.id}`);
    }
  }
});

test('all theory reading groups retain paragraphs, tables and exact reference anchors', () => {
  for (const reference of theoryReferences) {
    const html = renderToStaticMarkup(React.createElement(TheoryReading, { reference }));
    const fields = [
      { text: reference.lead, field: 'lead' },
      ...reference.blocks.flatMap((block, i) => [
        { text: block.heading, field: `heading-${i}` },
        { text: block.text, field: `block-${i}` },
      ]),
      ...reference.table.headers.map((text, i) => ({ text, field: `head-${i}` })),
      ...reference.table.rows.flatMap((row, i) =>
        row.map((text, j) => ({ text, field: `cell-${i}-${j}` })),
      ),
    ];
    for (const { text, field } of fields) {
      const tokens = parseCourseText(text, { theoryId: reference.id, field });
      assert.ok(
        textContent(html).includes(
          tokens
            .map((token) => token.label)
            .join('')
            .replace(/\s+/g, ' ')
            .trim(),
        ),
        `${reference.id}: ${field}`,
      );
      for (const token of tokens) {
        if (token.anchor)
          assert.ok(html.includes(`id="${token.anchor}"`), `${reference.id}: ${token.anchor}`);
      }
    }
    for (const summary of html.matchAll(/<summary>([\s\S]*?)<\/summary>/g)) {
      assert.ok(
        !/<(?:a|button|input)\b/.test(summary[1]),
        'disclosure label cannot contain another control',
      );
    }
  }
});

test('the public demonstration keeps its limited scope while retaining the four learning stages', () => {
  const html = renderToStaticMarkup(
    React.createElement(LessonView, { lesson: lessons[0], demo: true }),
  );
  assert.ok(!html.includes('id="estudo-'));
  assert.ok(!html.includes('id="aprofundar"'));
  assert.ok(!html.includes('id="pratica-semanal"'));
  for (const stage of ['entender', 'tecnica', 'aplicar', 'revisar']) {
    assert.ok(html.includes(`id="${stage}"`));
  }
  assert.ok(html.includes('Nenhum progresso é gravado nesta prévia.'));
});
