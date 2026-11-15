import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { lessons, songs } from '../src/content/course';
import { songLyrics, getLessonLyrics } from '../src/content/song-lyrics';
import provenance from '../src/content/song-lyrics-provenance.json';
import { buildChartGroups } from '../src/components/music/chart-layout';
import {
  projectLyricCues,
  totalChartBeats,
  validateLyricCues,
} from '../src/components/music/chart-lyrics';
import { splitLyricSyllables, withLyricSyllables } from '../src/components/music/lyric-syllables';

test('all supplied lyrics and all 39 lesson arrangements retain their text and initial timing provenance', () => {
  assert.equal(Object.keys(songLyrics).length, 13);
  let versions = 0;
  let lines = 0;
  for (const [id, song] of Object.entries(songLyrics)) {
    const expected = provenance.songs[id as keyof typeof provenance.songs];
    assert.equal(song.providedLines.length, expected.lines);
    assert.equal(
      createHash('sha256').update(song.providedLines.join('\n')).digest('hex'),
      expected.sha256,
    );
    lines += song.providedLines.length;
    assert.deepEqual(Object.keys(song.versions).sort(), Object.keys(songs[id].versions).sort());
    for (const [version, lyrics] of Object.entries(song.versions)) {
      versions++;
      const chart = songs[id].versions[version];
      const groups = buildChartGroups(chart);
      const beats = totalChartBeats(groups.flatMap((group) => group.bars.map(({ bar }) => bar)));
      const prepared = withLyricSyllables(lyrics.cues);
      validateLyricCues(prepared, beats);
      assert.equal(
        lyrics.status,
        'draft',
        'unmeasured recording timing must remain explicitly provisional',
      );
      assert.ok(lyrics.alignmentNote.length > 0);
      for (const cue of prepared) {
        assert.ok(song.providedLines.includes(cue.text), `${id}: unexpected text`);
        assert.equal(
          cue.syllables!.map((part) => cue.text.slice(part.from, part.to)).join(''),
          cue.text,
        );
        assert.ok(cue.syllables!.every((part) => part.timing === 'estimated'));
      }
      assert.equal(projectLyricCues(chart, groups, prepared).length, prepared.length);
    }
  }
  assert.equal(lines, 712);
  assert.equal(versions, 19);
  for (const lesson of lessons)
    assert.ok(getLessonLyrics(lesson.song, lesson.version)?.cues.length);
  assert.equal(getLessonLyrics('missing', 'base'), undefined);
});

test('written syllables retain case, accents, apostrophes, punctuation and whitespace', () => {
  for (const text of [
    'Santo Espírito, és bem-vindo aqui',
    'Minh’alma anseia por Ti',
    'Não há nada igual',
    '  Tua presença!  ',
  ]) {
    const split = splitLyricSyllables(text);
    assert.equal(split.map((part) => text.slice(part.from, part.to)).join(''), text);
  }
  assert.deepEqual(
    splitLyricSyllables('Espírito').map((part) => 'Espírito'.slice(part.from, part.to)),
    ['Es', 'pí', 'ri', 'to'],
  );
});

test('explicit syllable durations and vocal rests survive validation and section projection', () => {
  const chart = songs.santo_espirito.versions.base;
  const groups = buildChartGroups(chart);
  const target = groups[1];
  const start = totalChartBeats(groups[0].bars.map(({ bar }) => bar));
  const text = 'Santo';
  const cue = {
    text,
    startBeat: start,
    endBeat: start + 4,
    syllables: [
      { from: 0, to: 3, startBeat: start, endBeat: start + 0.5, timing: 'manual' as const },
      { from: 3, to: 5, startBeat: start + 1, endBeat: start + 4, timing: 'manual' as const },
    ],
  };
  const checked = validateLyricCues([cue], 184);
  assert.deepEqual(
    withLyricSyllables(checked),
    checked,
    'manual sustained vowel must not be re-estimated',
  );
  const projected = projectLyricCues(chart, buildChartGroups(chart, target.sectionId), checked)[0];
  assert.deepEqual(
    projected.syllables!.map(({ startBeat, endBeat }) => [startBeat, endBeat]),
    [
      [0, 0.5],
      [1, 4],
    ],
  );
  assert.throws(
    () => validateLyricCues([{ ...cue, syllables: [cue.syllables[0]] }], 184),
    /sílabas|divisão|completa/,
  );
  assert.throws(
    () =>
      validateLyricCues(
        [
          {
            ...cue,
            syllables: [cue.syllables[0], { ...cue.syllables[1], startBeat: start + 0.25 }],
          },
        ],
        184,
      ),
    /sobreposição/,
  );
});
