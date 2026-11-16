import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { resolveStoredLyricCues } from '../src/components/music/chart-lyrics-overrides';
import {
  totalChartBeats,
  validateLyricCues,
  type LyricCue,
} from '../src/components/music/chart-lyrics';
import {
  estimateLyricSyllables,
  withLyricSyllables,
} from '../src/components/music/lyric-syllables';
import { buildChartGroups } from '../src/components/music/chart-layout';
import { songs } from '../src/content/course';
import { songLyrics } from '../src/content/song-lyrics';
import {
  existingChordTimeline,
  parseChordReference,
  syllableAtColumn,
} from '../scripts/lib/lyric-chord-alignment';

function legacy(cue: LyricCue): LyricCue {
  const window = cue.scoreWindow ?? cue;
  return { text: cue.text, startBeat: window.startBeat, endBeat: window.endBeat };
}

test('the supplied Am and F chords start on the first and second ver in every Faz Chover refrain occurrence', () => {
  const reference = parseChordReference(
    readFileSync('materials/references/cifras_13_musicas_vscode.txt', 'utf8'),
  ).filter(({ songId }) => songId === 'faz_chover_tna');
  for (const [text, firstVer, secondVer] of [
    ['Faz chover, faz chover', 7, 19],
    ['E faz chover, faz chover', 9, 21],
  ] as const) {
    const lines = reference.filter((line) => line.text === text);
    assert.ok(lines.length > 0);
    for (const line of lines) {
      const am = line.chords.find(({ chord }) => chord === 'Am');
      assert.ok(am);
      assert.equal(syllableAtColumn(line.text, am.column), firstVer);
      assert.equal(line.chords.find(({ chord }) => chord === 'F')?.column, secondVer);
    }
    assert.equal(text.slice(firstVer, firstVer + 3), 'ver');
    assert.equal(text.slice(secondVer), 'ver');
  }
  let checked = 0;
  for (const [version, lyrics] of Object.entries(songLyrics.faz_chover_tna.versions)) {
    const events = existingChordTimeline(songs.faz_chover_tna.versions[version]);
    for (const cue of withLyricSyllables(lyrics.cues)) {
      if (!/^(?:E )?Faz chover, faz chover$/i.test(cue.text)) continue;
      const window = cue.scoreWindow ?? cue;
      for (const [harmony, offset] of [
        ['Am', cue.text.indexOf('ver')],
        ['F', cue.text.lastIndexOf('ver')],
      ] as const) {
        const event = events.find(
          ({ beat, chord }) =>
            chord === harmony && beat >= window.startBeat && beat < window.endBeat,
        );
        assert.ok(event, `${version}: ${harmony} is still in its original score window`);
        assert.equal(cue.syllables!.find(({ from }) => from === offset)?.startBeat, event.beat);
        assert.ok(
          cue.startBeat < event.beat,
          'the vocal prefix begins before the fixed chord onset',
        );
      }
      checked++;
    }
  }
  assert.ok(checked >= 6, 'base and complete arrangements retain their repeated refrains');
});

test('legacy phrases and cached estimates inherit current chord anchors instead of masking them', () => {
  const cue = songLyrics.faz_chover_tna.versions.base.cues[8];
  assert.equal(cue.text, 'Faz chover, faz chover');
  const old = legacy(cue);
  const oldSyllables = estimateLyricSyllables(old);
  assert.ok(
    oldSyllables.find(({ from }) => from === 19)!.startBeat > 69,
    'the old uniform estimate missed the F event at pulse 68',
  );
  for (const saved of [old, { ...old, syllables: oldSyllables }]) {
    const raw = JSON.stringify([saved]);
    const before = JSON.stringify(cue);
    const resolved = resolveStoredLyricCues(raw, 196, [cue]);
    assert.deepEqual(resolved[0].chordAnchors, cue.chordAnchors);
    assert.equal(resolved[0].startBeat, cue.startBeat);
    assert.equal(resolved[0].endBeat, cue.endBeat);
    assert.ok(resolved[0].startBeat < old.startBeat, 'legacy saves inherit the new vocal pickup');
    assert.deepEqual(
      resolved[0].syllables,
      cue.syllables,
      'cached estimates must be replaced by the current data or regenerated when absent',
    );
    const syllables = withLyricSyllables(resolved)[0].syllables!;
    assert.equal(syllables.find(({ from }) => from === 7)!.startBeat, 64);
    assert.equal(syllables.find(({ from }) => from === 19)!.startBeat, 68);
    assert.equal(raw, JSON.stringify([saved]), 'saved annotations are not rewritten');
    assert.equal(JSON.stringify(cue), before, 'catalog data remains unchanged');
  }
});

test('all 13 songs recover current anchors from matching legacy annotations in every version', () => {
  let versions = 0;
  let inherited = 0;
  const covered = new Set<string>();
  for (const [songId, song] of Object.entries(songLyrics)) {
    for (const [version, lyrics] of Object.entries(song.versions)) {
      const chart = songs[songId].versions[version];
      const beats = totalChartBeats(
        buildChartGroups(chart).flatMap(({ bars }) => bars.map(({ bar }) => bar)),
      );
      for (const estimated of [false, true]) {
        const saved = lyrics.cues.map((cue) => {
          const old = legacy(cue);
          return estimated ? { ...old, syllables: estimateLyricSyllables(old) } : old;
        });
        const resolved = withLyricSyllables(
          resolveStoredLyricCues(JSON.stringify(saved), beats, lyrics.cues),
        );
        for (const [index, cue] of lyrics.cues.entries()) {
          assert.equal(resolved[index].text, cue.text);
          assert.equal(resolved[index].startBeat, cue.startBeat);
          assert.equal(resolved[index].endBeat, cue.endBeat);
          for (const anchor of cue.chordAnchors ?? []) {
            assert.equal(
              resolved[index].syllables!.find(({ from }) => from === anchor.from)!.startBeat,
              anchor.beat,
              `${songId}/${version}, phrase ${index}`,
            );
            if (!estimated) inherited++;
            covered.add(songId);
          }
        }
      }
      versions++;
    }
  }
  assert.equal(versions, 19);
  assert.equal(covered.size, 13);
  assert.ok(inherited > 0);
});

test('personal text or phrase-window edits and actual manual syllable timings remain authoritative', () => {
  const cue = songLyrics.faz_chover_tna.versions.base.cues[8];
  const old = legacy(cue);
  const units = estimateLyricSyllables(old);
  const cases: LyricCue[] = [
    { ...old, text: 'Minha frase pessoal' },
    { ...old, startBeat: old.startBeat - 0.123456 },
    { ...old, endBeat: old.endBeat + 0.123456 },
    { ...old, syllables: units.map((unit) => ({ ...unit, timing: 'manual' })) },
    {
      ...old,
      syllables: units.map((unit, index) => ({
        ...unit,
        timing: index === 0 ? 'manual' : 'estimated',
      })),
    },
  ];
  for (const saved of cases)
    assert.deepEqual(resolveStoredLyricCues(JSON.stringify([saved]), 196, [cue]), [saved]);
  const empty: LyricCue[] = [];
  assert.deepEqual(
    resolveStoredLyricCues('[]', 196, [cue]),
    empty,
    'an intentionally empty personal lyric is not repopulated',
  );
});

test('missing or invalid stored lyrics fall back to the current catalog without changing it', () => {
  const defaults = songLyrics.faz_chover_tna.versions.base.cues;
  for (const raw of [
    null,
    '',
    '{broken',
    'null',
    '{}',
    '[{"text":"x","startBeat":0,"endBeat":9999}]',
  ])
    assert.equal(resolveStoredLyricCues(raw, 196, defaults), defaults);
  const old = legacy(defaults[8]);
  assert.equal(
    resolveStoredLyricCues(JSON.stringify([old, old]), 196, defaults),
    defaults,
    'overlapping annotations remain invalid',
  );
});

function estimatedCue(text: string, startBeat: number, endBeat: number): LyricCue {
  return {
    text,
    startBeat,
    endBeat,
    syllables: [{ from: 0, to: text.length, startBeat, endBeat, timing: 'estimated' }],
  };
}

test('legacy score windows inherit the entire retimed catalog cue without retaining stale estimates', () => {
  const defaults: LyricCue[] = [
    {
      ...estimatedCue('Sol', 0, 3),
      scoreWindow: { startBeat: 0, endBeat: 4 },
      chordAnchors: [{ from: 0, beat: 0 }],
    },
    { text: 'Luz', startBeat: 3, endBeat: 8, scoreWindow: { startBeat: 4, endBeat: 8 } },
  ];
  const before = JSON.stringify(defaults);
  const old = [estimatedCue('Sol', 0, 4), estimatedCue('Luz', 4, 8)];
  const raw = JSON.stringify(old);
  const result = resolveStoredLyricCues(raw, 8, defaults);
  assert.deepEqual(result, defaults);
  assert.notEqual(result[0], defaults[0]);
  assert.notEqual(result[0].syllables, defaults[0].syllables);
  assert.notEqual(result[0].chordAnchors, defaults[0].chordAnchors);
  assert.equal(result[1].syllables, undefined, 'the old 4–8 estimate must not mask the 3–8 pickup');
  assert.equal(withLyricSyllables(result)[1].syllables![0].startBeat, 3);
  validateLyricCues(withLyricSyllables(result), 8);
  assert.equal(JSON.stringify(defaults), before);
  assert.equal(JSON.stringify(old), raw);

  const alreadyRetimed = result.map(({ text, startBeat, endBeat }) => ({
    text,
    startBeat,
    endBeat,
  }));
  assert.deepEqual(
    resolveStoredLyricCues(JSON.stringify(alreadyRetimed), 8, defaults),
    defaults,
    'current-window saves also receive the latest estimates',
  );
});

test('manual or personal entries roll back only connected retiming conflicts, preserving independent upgrades', () => {
  const defaults: LyricCue[] = [
    { ...estimatedCue('Sol', 0, 5), scoreWindow: { startBeat: 0, endBeat: 4 } },
    { ...estimatedCue('Luz', 5, 9), scoreWindow: { startBeat: 4, endBeat: 8 } },
    { ...estimatedCue('Mar', 9, 12), scoreWindow: { startBeat: 8, endBeat: 12 } },
    { ...estimatedCue('Céu', 12, 15), scoreWindow: { startBeat: 12, endBeat: 16 } },
    { ...estimatedCue('Flor', 15, 20), scoreWindow: { startBeat: 16, endBeat: 20 } },
  ];
  const baseline = defaults.map(legacy);
  const manual = {
    ...estimatedCue('Mar', 8, 12),
    syllables: [{ from: 0, to: 3, startBeat: 8, endBeat: 12, timing: 'manual' as const }],
  };
  for (const personal of [
    manual,
    { text: 'Minha frase pessoal', startBeat: 8, endBeat: 12 },
    { text: 'Mar', startBeat: 8.25, endBeat: 12 },
  ]) {
    const saved = baseline.map((cue, index) => (index === 2 ? personal : cue));
    const result = resolveStoredLyricCues(JSON.stringify(saved), 20, defaults);
    assert.deepEqual(
      result.slice(0, 3),
      saved.slice(0, 3),
      'rolling the conflicting neighbor back also protects its newly conflicting predecessor',
    );
    assert.deepEqual(
      result.slice(3),
      defaults.slice(3),
      'a separate compatible pair must still receive its updated pickup and syllables',
    );
    validateLyricCues(result, 20);
  }
});

test('a retimed phrase cannot overwrite a personal entry across an omitted catalog passage', () => {
  const defaults: LyricCue[] = [
    { ...estimatedCue('Sol', 0, 10), scoreWindow: { startBeat: 0, endBeat: 4 } },
    { ...estimatedCue('Mar', 10, 12), scoreWindow: { startBeat: 8, endBeat: 12 } },
  ];
  const personal: LyricCue[] = [
    { text: 'Sol', startBeat: 0, endBeat: 4 },
    { text: 'Minha resposta', startBeat: 6, endBeat: 9 },
  ];
  const result = resolveStoredLyricCues(JSON.stringify(personal), 12, defaults);
  assert.deepEqual(result, personal);
  validateLyricCues(result, 12);
});

test('ambiguous repeated-text identities stay personal instead of migrating to the wrong occurrence', () => {
  const saved: LyricCue[] = [{ text: 'Sol', startBeat: 0, endBeat: 4 }];
  const defaults: LyricCue[] = [
    estimatedCue('Sol', 0, 4),
    { ...estimatedCue('Sol', 4, 8), scoreWindow: { startBeat: 0, endBeat: 4 } },
  ];
  assert.deepEqual(resolveStoredLyricCues(JSON.stringify(saved), 8, defaults), saved);
});
