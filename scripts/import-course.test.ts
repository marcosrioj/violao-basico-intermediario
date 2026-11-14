import assert from 'node:assert/strict';
import test from 'node:test';
import {
  chords,
  courseModules,
  getChart,
  lessons,
  songs,
  theoryReferences,
} from '../src/content/course';
import { getReferenceOccurrences, parseCourseText } from '../src/content/navigation';

test('v5 retains the 13 by 3 progression and introduces barre at module 5', () => {
  assert.equal(courseModules.length, 13);
  assert.equal(lessons.length, 39);
  for (const courseModule of courseModules) {
    assert.deepEqual(
      lessons.filter((lesson) => lesson.module === courseModule.n).map((lesson) => lesson.local_n),
      [1, 2, 3],
    );
  }
  lessons
    .slice(0, 12)
    .forEach((lesson) =>
      lesson.chords.forEach((name) => assert.equal(chords[name].barres.length, 0)),
    );
  assert.equal(lessons[12].id, 'm5-a1');
  assert.ok(lessons[12].new_chords.includes('Bm'));
  assert.deepEqual(chords.F.frets, [null, null, 3, 2, 1, null]);
  assert.equal(new Set(lessons.map((lesson) => lesson.id)).size, 39);
});

test('every song form has playable chords, correct bar duration and correct total duration', () => {
  for (const lesson of lessons) {
    const version = getChart(lesson);
    let totalBeats = 0;
    let totalBars = 0;
    for (const part of version.order) {
      const section = version.sections.find((section) => section.id === part.section);
      assert.ok(section, lesson.id);
      for (const bar of section.bars) {
        const beats = bar.events.reduce((sum, event) => sum + event.beats, 0);
        assert.equal(beats, bar.beats_per_bar ?? version.beats_per_bar, lesson.id);
        bar.events.forEach((event) => {
          assert.ok(chords[event.chord]);
          assert.ok(event.beats > 0);
        });
        totalBeats += beats * part.repeat;
        totalBars += part.repeat;
      }
    }
    assert.equal(totalBeats, lesson.total_beats);
    assert.equal(totalBars, lesson.total_bars);
    if (version.meter === '6/8') assert.equal(version.beats_per_bar, 2);
  }
});

test('theory references and refrain bar references have distinct destinations', () => {
  const first = lessons[0];
  assert.deepEqual(
    parseCourseText('Em R3–R4, troque.', { lesson: first, field: 'explain' })
      .filter((token) => token.kind !== 'text')
      .map((token) => token.href),
    ['#bar-R-2', '#bar-R-3'],
  );
  assert.equal(
    parseCourseText('Consulte R3.', { lesson: first, field: 'explain' }).find(
      (token) => token.kind === 'theory',
    )?.href,
    '/teoria/R3',
  );
  assert.equal(
    parseCourseText('R1–R8', { lesson: first, field: 'review' }).filter(
      (token) => token.kind === 'theory',
    ).length,
    8,
  );
  assert.equal(
    parseCourseText('M5-A1', { lesson: first, field: 'review' }).find(
      (token) => token.kind === 'lesson',
    )?.href,
    '/aulas/m5-a1',
  );
  const compound = lessons[12];
  assert.equal(
    parseCourseText('R1.2', { lesson: compound, field: 'explain' }).find(
      (token) => token.kind === 'bar',
    )?.href,
    '#bar-R1-1',
  );
});

test('backlinks target real stable occurrences rendered by the same tokenizer', () => {
  const ids = new Set<string>();
  for (const theory of theoryReferences) {
    const occurrences = getReferenceOccurrences(theory.id);
    assert.ok(occurrences.length > 0);
    for (const occurrence of occurrences) {
      assert.ok(!ids.has(occurrence.anchor), `Duplicate ${occurrence.anchor}`);
      ids.add(occurrence.anchor);
      assert.ok(occurrence.href.endsWith(`#${occurrence.anchor}`));
    }
  }
  const first = parseCourseText('R1', { lesson: lessons[0], field: 'theory_refs-0' }).find(
    (token) => token.kind === 'theory',
  );
  assert.ok(
    getReferenceOccurrences('R1').some((occurrence) => occurrence.anchor === first?.anchor),
  );
});

test('all imported lessons preserve student PDF pages without teacher plans or forbidden repertoire', () => {
  lessons.forEach((lesson) => {
    assert.ok(lesson.studentPages.length >= 2);
    assert.ok(lesson.studentText.length > 1000);
    assert.ok(!('teacher' in lesson));
  });
  assert.equal(Object.keys(songs).length, 13);
  assert.equal(Object.keys(chords).length, 52);
  assert.doesNotMatch(JSON.stringify({ lessons, songs }), /thalles|thales|capotraste/i);
  Object.values(songs).forEach((song) =>
    [song.listen_url, song.lyrics_chords_url].forEach((url) => assert.match(url, /^https:\/\//)),
  );
});

test('all chord diagrams and audio pitches agree including enharmonic spellings', () => {
  const openMidi = [40, 45, 50, 55, 59, 64];
  const pitchClasses: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  for (const [name, chord] of Object.entries(chords)) {
    assert.equal(chord.frets.length, 6, name);
    assert.equal(chord.fingers.length, 6, name);
    const played = chord.frets.flatMap((fret, i) =>
      fret === null ? [] : [(openMidi[i] + fret) % 12],
    );
    const declared = chord.notes.map(
      (note) =>
        (pitchClasses[note[0]] +
          (note.match(/#/g)?.length ?? 0) -
          (note.match(/b/g)?.length ?? 0) +
          12) %
        12,
    );
    assert.deepEqual(played, declared, name);
    chord.frets.forEach((fret, i) => {
      if (fret === null) assert.equal(chord.fingers[i], null, name);
      else if (fret === 0) assert.equal(chord.fingers[i], 0, name);
      else {
        assert.ok(Number.isInteger(fret) && fret > 0 && fret <= 20, name);
        assert.ok(chord.fingers[i]! >= 1 && chord.fingers[i]! <= 4, name);
      }
    });
    assert.equal(chord.bass_string, 6 - chord.frets.findIndex((fret) => fret !== null), name);
    const positive = chord.frets.filter((fret): fret is number => fret !== null && fret > 0);
    const firstFret = Math.max(...positive) > 5 ? Math.min(...positive) : 1;
    positive.forEach((fret) =>
      assert.ok(fret >= firstFret && fret < firstFret + 5, `Diagram crops ${name}`),
    );
    chord.barres.forEach(([fret, from, to]) => {
      assert.ok(Number.isInteger(fret) && fret > 0 && from >= 0 && to <= 5 && from < to, name);
      assert.ok(fret >= firstFret && fret < firstFret + 5, name);
      for (let i = from; i <= to; i++)
        assert.ok(chord.frets[i] !== null && chord.frets[i]! >= fret, name);
    });
  }
});

test('linked theory lists preserve their context without treating dotted music bars as theory', () => {
  const text = 'Use os exemplos autorais R6/R7 para comparar.';
  assert.deepEqual(
    parseCourseText(text, { lesson: lessons[35], field: 'teacher' })
      .filter((token) => token.kind === 'theory')
      .map((token) => token.referenceId),
    ['R6', 'R7'],
  );
  assert.deepEqual(
    parseCourseText('Consulte R1, R2 e R3.', { lesson: lessons[12], field: 'explain' })
      .filter((token) => token.kind === 'theory')
      .map((token) => token.referenceId),
    ['R1', 'R2', 'R3'],
  );
  assert.equal(
    parseCourseText('R1.2', { lesson: lessons[12], field: 'review' }).find(
      (token) => token.kind === 'bar',
    )?.href,
    '#bar-R1-1',
  );
});

test('all external resource links are HTTP(S) without embedded credentials', () => {
  const visit = (value: unknown, key = '') => {
    if (Array.isArray(value)) value.forEach((child) => visit(child, key));
    else if (value && typeof value === 'object')
      Object.entries(value).forEach(([field, child]) => visit(child, field));
    else if (typeof value === 'string' && (key === 'url' || key.endsWith('_url'))) {
      const url = new URL(value);
      assert.ok(url.protocol === 'https:' || url.protocol === 'http:');
      assert.equal(url.username, '');
      assert.equal(url.password, '');
    }
  };
  visit(songs);
  visit(theoryReferences);
});
