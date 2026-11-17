import assert from 'node:assert/strict';
import test from 'node:test';
import { parsePastedChart, PastedChartError } from '../src/components/music/pasted-chart';
import { buildChartGroups } from '../src/components/music/chart-layout';
import { totalChartBeats, validateLyricCues } from '../src/components/music/chart-lyrics';
import { withLyricSyllables } from '../src/components/music/lyric-syllables';

function played(text: string) {
  const result = parsePastedChart(text);
  return buildChartGroups(result.chart).flatMap((group) => group.bars.map(({ bar }) => bar));
}

test('plain chords and explicit bars retain their written order with distinct timing rules', () => {
  const chart = parsePastedChart('C Am\n| F G | C |').chart;
  const bars = chart.sections[0].bars;
  assert.deepEqual(
    bars.map((bar) => bar.events),
    [
      [{ chord: 'C', beats: 4 }],
      [{ chord: 'Am', beats: 4 }],
      [
        { chord: 'F', beats: 2 },
        { chord: 'G', beats: 2 },
      ],
      [{ chord: 'C', beats: 4 }],
    ],
  );
  assert.equal(totalChartBeats(bars), 16);
});

test('parenthesized chord groups load without changing extensions, inversions or repetitions', () => {
  for (const source of ['( A#9 F/A )', '(A#9 F/A)', '[Intro] ( A#9 F/A )']) {
    assert.deepEqual(
      played(source).map((bar) => bar.events),
      [[{ chord: 'A#9', beats: 4 }], [{ chord: 'F/A', beats: 4 }]],
    );
  }
  assert.deepEqual(
    played('| ( C7(b9) F/A ) | A7(9/11) | x2'),
    played('| C7(b9) F/A | A7(9/11) | x2'),
  );
  assert.deepEqual(played('(Am G) (F C) x2'), played('Am G F C x2'));
  assert.deepEqual(played('(C7(b9))'), played('C7(b9)'));
});

test('group parentheses retain lyric and tab columns while parenthesized lyrics stay literal', () => {
  const grouped = parsePastedChart('( C            G )\n  Minha voz ecoa');
  const aligned = parsePastedChart('  C            G  \n  Minha voz ecoa');
  assert.deepEqual(grouped.lyricsContent, aligned.lyricsContent);
  const tab =
    '\ne|0---------3---|\nB|1-------------|\nG|0-------------|\nD|2-------------|\nA|3-------------|\nE|--------------|';
  assert.deepEqual(
    parsePastedChart('( C         G )' + tab).chart,
    parsePastedChart('  C         G  ' + tab).chart,
  );
  const lyrics = parsePastedChart('C G\n(Canto com alegria)');
  assert.deepEqual(lyrics.lyricsContent?.providedLines, ['(Canto com alegria)']);
});

test('grouped chords preserve source line numbers and still reject invalid chord symbols', () => {
  const prefix = '\n'.repeat(81);
  assert.equal(parsePastedChart(prefix + '( A#9 F/A )').barCount, 2);
  assert.throws(
    () => parsePastedChart(prefix + '( C H7 )'),
    (error: unknown) => {
      assert.ok(error instanceof PastedChartError);
      assert.equal(error.issues[0].line, 82);
      assert.match(error.issues[0].message, /“H7”/);
      return true;
    },
  );
});

test('the editor example loads headings, bracket repetition and chord-over-lyric anchors', () => {
  const result = parsePastedChart(
    'Intro:\n| C | Am | F | G |\n\n[Verso]\nC               Am\nUm novo som vai começar\nF               G\nMeu violão vai acompanhar\n\n[Refrão x2]\n| C G | Am F |',
  );
  assert.equal(result.barCount, 12);
  assert.deepEqual(
    result.chart.sections.map((section) => section.title),
    ['Intro', 'Verso', 'Refrão'],
  );
  assert.deepEqual(
    result.chart.order.map((item) => item.repeat),
    [1, 1, 2],
  );
  assert.equal(result.lyricsContent?.cues.length, 2);
  assert.equal(result.lyricsContent?.status, 'draft');
  assert.deepEqual(result.lyricsContent?.providedLines, [
    'Um novo som vai começar',
    'Meu violão vai acompanhar',
  ]);
  const cues = withLyricSyllables(result.lyricsContent!.cues);
  for (const cue of cues) {
    for (const anchor of cue.chordAnchors ?? []) {
      assert.equal(
        cue.syllables?.find((syllable) => syllable.from === anchor.from)?.startBeat,
        anchor.beat,
      );
    }
  }
});

test('section references and line repeats expand the matching vocal occurrence', () => {
  const result = parsePastedChart('[Verso]\n[C]Primeira [G]voz x2\n[Ponte]\nAm F\n[Verso] 2x');
  assert.equal(result.chart.sections.length, 2);
  assert.deepEqual(
    result.chart.order.map((item) => [item.section, item.repeat]),
    [
      ['T1', 1],
      ['T2', 1],
      ['T1', 2],
    ],
  );
  assert.equal(result.barCount, 14);
  assert.deepEqual(
    result.lyricsContent!.cues.map((cue) => cue.startBeat),
    [0, 8, 24, 32, 40, 48],
  );
  assert.ok(result.lyricsContent!.cues.every((cue) => cue.text === 'Primeira voz'));
  assert.equal(result.lyricsContent!.providedLines.length, 1);
  validateLyricCues(withLyricSyllables(result.lyricsContent!.cues), result.barCount * 4);
});

test('compound and triple meter use their own pulse unit and equal chord durations', () => {
  const compound = parsePastedChart('| D A Bm | G |', { meter: '6/8' });
  assert.equal(compound.chart.beats_per_bar, 2);
  assert.equal(compound.chart.beat_unit, 'dotted-quarter');
  assert.equal(compound.chart.subdivisions_per_beat, 3);
  assert.equal(compound.chart.sections[0].bars[0].events[0].beats, 2 / 3);
  assert.equal(totalChartBeats(compound.chart.sections[0].bars), 4);
  assert.equal(
    parsePastedChart('C', { meter: '3/4' }).chart.sections[0].bars[0].events[0].beats,
    3,
  );
});

test('literal columns locate syllables while unsupported first pickups remain explicitly estimated', () => {
  const result = parsePastedChart('       Am          F\nFaz chover, faz chover');
  const cue = result.lyricsContent!.cues[0];
  assert.ok(result.warnings.some((warning) => warning.message.includes('primeira entrada')));
  assert.deepEqual(cue.chordAnchors, [{ from: 19, beat: 4 }]);
  const prepared = withLyricSyllables([cue]);
  assert.ok(prepared[0].syllables!.every((part) => part.endBeat > part.startBeat));
  assert.equal(prepared[0].syllables!.find((part) => part.from === 19)!.startBeat, 4);
});

test('leading spaces and tabs preserve chord correspondence without trimming lyrics offsets incorrectly', () => {
  const result = parsePastedChart('\tC\tG\n\tMinha voz');
  assert.equal(result.lyricsContent!.cues[0].text, 'Minha voz');
  assert.equal(result.lyricsContent!.cues[0].chordAnchors?.[0].from, 0);
  validateLyricCues(withLyricSyllables(result.lyricsContent!.cues), 8);
});

test('lyrics without a paired chord line remain visible without fabricated accompaniment', () => {
  const result = parsePastedChart(
    'Tom: D\nCapotraste: 2\n[Verso]\nC G\nA Ti\nOutra linha sem acordes',
  );
  assert.equal(result.chart.key, 'D');
  assert.equal(result.barCount, 2);
  assert.deepEqual(result.lyricsContent!.providedLines, ['A Ti', 'Outra linha sem acordes']);
  assert.equal(result.lyricsContent!.cues.length, 1);
  assert.equal(result.chart.capo, 2);
  assert.equal(result.chart.sections[0].bars[0].events[0].chord, 'C');
  assert.ok(result.warnings.some((warning) => warning.message.includes('Linhas sem acordes')));
});

test('slash chords, extensions, rests and same-line repeat signs preserve their events', () => {
  const bars = played('|: C7M/G | N.C. | F#m7(b5) B7 :|');
  assert.equal(bars.length, 6);
  assert.deepEqual(bars.slice(0, 3), bars.slice(3));
  assert.equal(bars[1].events[0].chord, 'N.C.');
  assert.equal(bars[0].events[0].chord, 'C7M/G');
});

test('invalid chords, ambiguous repeats and empty bars report line numbers instead of silently dropping notes', () => {
  for (const [input, line] of [
    ['C\nAm H7 G', 2],
    ['C\n| Am | | G |', 2],
    ['C x17', 1],
    ['[Refrão x2] x3\nC G', 1],
    ['[Outro]\ntexto', 1],
    ['|: C G', 1],
    ['[C]Texto [H7]letra', 1],
  ] as const) {
    assert.throws(
      () => parsePastedChart(input),
      (error: unknown) => {
        assert.ok(error instanceof PastedChartError, input);
        assert.equal(error.issues[0].line, line, input);
        return true;
      },
    );
  }
});

test('bounded input cannot create oversized arrangements through nested repetitions', () => {
  for (const input of ['', 'C '.repeat(25_001), '[Acordes x16]\n' + 'C '.repeat(64) + 'x16']) {
    assert.throws(() => parsePastedChart(input), PastedChartError);
  }
});

test('markup stays plain lyric text and is never evaluated', () => {
  const result = parsePastedChart('C G\n<script>alert(1)</script>');
  assert.equal(result.lyricsContent?.providedLines[0], '<script>alert(1)</script>');
});

test('natural words beginning like chord symbols remain lyric text', () => {
  const result = parsePastedChart('C G\nAmém\nAmor e paz');
  assert.equal(result.lyricsContent!.cues[0].text, 'Amém');
  assert.deepEqual(result.lyricsContent!.providedLines, ['Amém', 'Amor e paz']);
});

test('all 13 supplied song charts load individually, preserving positive vocal durations', async () => {
  const { readFileSync } = await import('node:fs');
  const source = readFileSync('materials/references/cifras_13_musicas_vscode.txt', 'utf8');
  const songs = source
    .slice(source.indexOf('\n01. SANTO'))
    .trim()
    .split(/\n(?=\d{2}\. [A-ZÁÉÍÓÚ])/);
  assert.equal(songs.length, 13);
  for (const song of songs) {
    const result = parsePastedChart(song);
    assert.ok(result.barCount > 0 && result.barCount <= 1000, song.split('\n')[0]);
    assert.ok(result.lyricsContent!.cues.length > 0);
    const prepared = withLyricSyllables(result.lyricsContent!.cues);
    validateLyricCues(prepared, result.barCount * result.chart.beats_per_bar);
    assert.ok(
      prepared.every((cue) => cue.syllables!.every((part) => part.endBeat > part.startBeat)),
    );
  }
});

test('combined capo metadata preserves written shapes and never transposes events twice', () => {
  const source = 'Tom: Db (com forma de C)Capotraste: 1ª casa\n[Intro] C A#9 G C';
  const detected = parsePastedChart(source);
  assert.equal(detected.chart.key, 'Db');
  assert.equal(detected.chart.shape_key, 'C');
  assert.equal(detected.chart.capo, 1);
  assert.deepEqual(
    detected.chart.sections[0].bars.map((bar) => bar.events[0].chord),
    ['C', 'A#9', 'G', 'C'],
  );
  const changed = parsePastedChart(source, { capo: 2 });
  assert.equal(changed.chart.key, 'D');
  assert.equal(changed.chart.capo, 2);
  assert.deepEqual(changed.chart.sections, detected.chart.sections);
  const removed = parsePastedChart(source, { capo: 0 });
  assert.equal(removed.chart.key, 'C');
  assert.equal(removed.chart.capo, 0);
});

test('arbitrary bracket titles accept trailing chords and webpage whitespace without a predefined name list', () => {
  const result = parsePastedChart(
    '\uFEFF[Tab - Intro]\u200B C G\n | \n---\n[Primeira\u00a0Parte]\u2060\nAm7 F\n[Qualquer título meu] | G7 C7 |\n[Notas] Dm',
  );
  assert.deepEqual(
    result.chart.sections.map((section) => section.title),
    ['Tab - Intro', 'Primeira Parte', 'Qualquer título meu', 'Notas'],
  );
  assert.equal(result.barCount, 6);
  assert.equal(result.lyricsContent, undefined);
  assert.deepEqual(
    result.chart.sections[2].bars[0].events.map((event) => event.chord),
    ['G7', 'C7'],
  );
});

test('arbitrary colon titles load same-line screenshot chords and following tablature', () => {
  const result = parsePastedChart(
    'Tom: G\n\nIntro: G D/F# Em D11 C7M D G D\n\nDedilhado Intro:\ne|0---|\nB|----|\nG|----|\nD|----|\nA|----|\nE|----|\nUma divisão inventada por mim:\n( A#9 F/A )\nMais um título livre:',
  );
  assert.equal(result.chart.key, 'G');
  assert.deepEqual(
    result.chart.sections.map((section) => section.title),
    ['Intro', 'Dedilhado Intro', 'Uma divisão inventada por mim', 'Mais um título livre'],
  );
  assert.deepEqual(
    result.chart.sections[0].bars.map((bar) => bar.events[0].chord),
    ['G', 'D/F#', 'Em', 'D11', 'C7M', 'D', 'G', 'D'],
  );
  assert.equal(result.chart.sections[1].bars[0].tablature?.length, 6);
  assert.deepEqual(result.chart.sections[1].bars[0].events[0].notes, [64]);
  assert.equal(result.chart.sections[3].bars.length, 0);
  assert.equal(result.barCount, 11);
  assert.equal(result.lyricsContent, undefined);
});

test('colon and bracket headings share repetition, lyric alignment and reference semantics', () => {
  const colon = parsePastedChart(
    'Minha parte x2: C           G\nMinha voz vai cantar\nOutra parte:|: (Am F) | G :|\nMinha parte: x2\nÚltima: [C]Minha [G]voz\n[Acabou]: Dm\nC: Am',
  );
  const bracket = parsePastedChart(
    '[Minha parte x2] C           G\nMinha voz vai cantar\n[Outra parte] |: (Am F) | G :|\n[Minha parte] x2\n[Última] [C]Minha [G]voz\n[Acabou] Dm\n[C:] Am',
  );
  assert.deepEqual(colon.chart, bracket.chart);
  assert.deepEqual(colon.lyricsContent, bracket.lyricsContent);
  assert.equal(colon.barCount, 16);
});

test('colon headings do not turn metadata, URLs, repeat bars or lyric punctuation into titles', () => {
  const result = parsePastedChart(
    'Tom de referência (som real): Db (com forma de C)Capotraste: 1ª casa\nBPM: 80\nCompasso: 4/4\nParte livre:\nC G\nEu digo: meu canto vai continuar\n|: Am F :|\nReferências:\n- Solo: Bm G (2x) | G. Confira a referência.\nhttps://example.com/cifra',
  );
  assert.equal(result.chart.key, 'Db');
  assert.equal(result.chart.shape_key, 'C');
  assert.equal(result.chart.capo, 1);
  assert.deepEqual(
    result.chart.sections.map((section) => section.title),
    ['Parte livre', 'Referências'],
  );
  assert.deepEqual(result.lyricsContent?.providedLines, ['Eu digo: meu canto vai continuar']);
  assert.equal(result.barCount, 4);
  assert.ok(result.warnings.some((warning) => warning.message.includes('andamento')));
  assert.ok(result.warnings.some((warning) => warning.message.includes('fontes')));
});

test('invalid chords after a colon retain their actual line number and error', () => {
  assert.throws(
    () => parsePastedChart('Tom: G\n\nUma divisão livre: C H7 G'),
    (error: unknown) => {
      assert.ok(error instanceof PastedChartError);
      assert.equal(error.issues[0].line, 3);
      assert.match(error.issues[0].message, /“H7”/);
      return true;
    },
  );
});

test('empty named sections stay visible without inserting music or suppressing later content', () => {
  const result = parsePastedChart('[Minha abertura]\n[Um trecho qualquer] C G\n[Outro título]');
  assert.deepEqual(
    result.chart.sections.map((section) => [section.title, section.bars.length]),
    [
      ['Minha abertura', 0],
      ['Um trecho qualquer', 2],
      ['Outro título', 0],
    ],
  );
  assert.equal(result.barCount, 2);
  assert.equal(
    totalChartBeats(
      buildChartGroups(result.chart).flatMap((group) => group.bars.map(({ bar }) => bar)),
    ),
    8,
  );
});

test('six-string tab consumes its preceding chord line and keeps written pitches before capo', () => {
  const result = parsePastedChart(
    'Tom: Db (com forma de C)Capotraste: 1ª casa\n[Tab - Intro]\nC          G\ne|0----1----3---|\nB|1------------|\nG|0------------|\nD|2------------|\nA|3------------|\nE|-------------|\n[Primeira Parte]\nAm F',
  );
  const intro = result.chart.sections[0];
  assert.ok(intro.bars.every((bar) => bar.tablature?.length === 6));
  const events = intro.bars.flatMap((bar) => bar.events);
  assert.ok(
    events.some((event) => event.notes?.includes(64)),
    'open high E is MIDI64 before capo',
  );
  assert.ok(
    events.some((event) => event.notes?.includes(65)),
    'fret1 is MIDI65 before capo',
  );
  assert.ok(
    events.some((event) => event.notes?.includes(67)),
    'fret3 is MIDI67 before capo',
  );
  assert.ok(
    events.every((event) => event.notes !== undefined),
    'chord-only bars were consumed, not duplicated',
  );
  assert.equal(result.chart.capo, 1);
  assert.equal(result.chart.sections[1].bars.length, 2);
});

test('capo values are bounded and incomplete tablature gets an actionable line error', () => {
  for (const input of ['Capotraste: 13ª casa\nC', 'Capotraste: -1\nC', 'Capotraste: 1.5\nC']) {
    assert.throws(() => parsePastedChart(input), PastedChartError);
  }
  for (const capo of [-1, 13, 1.5, NaN])
    assert.throws(() => parsePastedChart('C', { capo }), PastedChartError);
  assert.throws(
    () => parsePastedChart('[Tab]\ne|0---|\nB|1---|'),
    (error: unknown) => {
      assert.ok(error instanceof PastedChartError);
      assert.equal(error.issues[0].line, 2);
      assert.match(error.issues[0].message, /seis linhas/);
      return true;
    },
  );
});

test('an unlabeled silent first string and a completely silent six-string measure remain music', () => {
  const firstSilent = parsePastedChart('[Tab]\n|----|\n|1---|\n|----|\n|----|\n|----|\n|----|');
  assert.equal(firstSilent.barCount, 1);
  assert.deepEqual(firstSilent.chart.sections[0].bars[0].events[0].notes, [60]);
  assert.equal(firstSilent.chart.sections[0].bars[0].tablature?.length, 6);
  const rest = parsePastedChart('[Tab]\n' + '|----|\n'.repeat(6) + '|\n---\n[Verso]\nC');
  assert.equal(rest.barCount, 2);
  assert.deepEqual(
    rest.chart.sections[0].bars[0].events.map((event) => event.notes),
    [[]],
  );
  assert.equal(rest.chart.sections[1].bars[0].events[0].chord, 'C');
});

test('compact heading harmony before tablature preserves every chord with an explicit timing estimate', () => {
  const result = parsePastedChart(
    '[Intro] C G\ne|0----12---|\nB|1---------|\nG|0---------|\nD|2---------|\nA|3---------|\nE|----------|',
  );
  const events = result.chart.sections[0].bars.flatMap((bar) => bar.events);
  assert.deepEqual([...new Set(events.map((event) => event.chord))], ['C', 'G']);
  assert.ok(
    events.some((event) => event.notes?.includes(76)),
    'fret12 remains the written MIDI76',
  );
  assert.ok(result.warnings.some((warning) => /acordes|harmonia/.test(warning.message)));
  assert.ok(result.chart.sections[0].bars.every((bar) => bar.tablature?.length === 6));
});

test('barred dominant chords are harmony even when their spelling resembles tab bend notation', () => {
  for (const source of ['E|B7|', 'C|B7|', 'E|B9|F#7|']) {
    const result = parsePastedChart(source);
    assert.equal(result.barCount, source.split('|').filter(Boolean).length);
    assert.ok(result.chart.sections[0].bars.every((bar) => !bar.tablature));
  }
});
