import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import report from '../docs/lyric-chord-alignment.json';
import {
  alignLyricCue,
  chordMatch,
  existingChordTimeline,
  parseChordReference,
  syllableAtColumn,
  type ExistingChord,
  type ReferenceLine,
} from '../scripts/lib/lyric-chord-alignment';
import { retimeLyricCues } from '../scripts/lib/retime-lyric-blocks';
import { songs } from '../src/content/course';
import { songLyrics } from '../src/content/song-lyrics';
import type { SongVersion } from '../src/content/types';
import { buildChartGroups } from '../src/components/music/chart-layout';
import {
  projectLyricCues,
  totalChartBeats,
  validateLyricCues,
  type LyricCue,
} from '../src/components/music/chart-lyrics';
import {
  estimateLyricSyllables,
  withLyricSyllables,
} from '../src/components/music/lyric-syllables';

function fixture(): SongVersion {
  return {
    key: 'D',
    meter: '4/4',
    beats_per_bar: 4,
    beat_unit: 'quarter',
    adaptations: 'Exemplo autoral para testar entradas vocais.',
    sections: [
      { id: 'I', title: 'Introdução', bars: [{ events: [{ chord: 'D', beats: 4 }] }] },
      {
        id: 'V',
        title: 'Verso',
        bars: [
          {
            events: [
              { chord: 'G', beats: 1 },
              { chord: 'A', beats: 1.25 },
              { chord: 'Bm', beats: 1.75 },
            ],
          },
        ],
      },
    ],
    order: [
      { section: 'I', repeat: 1 },
      { section: 'V', repeat: 2 },
    ],
  };
}

function timeline(...events: [string, number][]): ExistingChord[] {
  return events.map(([chord, beat], index) => ({
    chord,
    beat,
    bar: index,
    event: 0,
    section: 'Verso',
    passage: 1,
  }));
}

function reference(text: string, chords: [string, number][], line = 10): ReferenceLine {
  return {
    songId: 'santo_espirito',
    line,
    section: 'Verso',
    text,
    free: false,
    chords: chords.map(([chord, column]) => ({ chord, column })),
  };
}

test('reference parsing preserves literal columns, lyric indentation and free-passage context', () => {
  const lines = parseChordReference(
    [
      '01. SANTO ESPÍRITO',
      '[Verso]',
      'Fmaj7   Am7       Gsus4',
      '   Eu canto aqui',
      '',
      '[Ponte livre]',
      'C',
      'Outra frase',
      '[Observações da referência]',
      'Não importar notas',
    ].join('\n'),
  );
  assert.equal(lines.length, 2);
  assert.deepEqual(lines[0], {
    songId: 'santo_espirito',
    line: 4,
    section: 'Verso',
    text: 'Eu canto aqui',
    free: false,
    chords: [
      { chord: 'Fmaj7', column: -3 },
      { chord: 'Am7', column: 5 },
      { chord: 'Gsus4', column: 15 },
    ],
  });
  assert.equal(lines[1].free, true);
  assert.equal(lines[1].section, 'Ponte livre');
});

test('chord correspondence preserves root and minor quality and never matches by slash bass', () => {
  assert.equal(chordMatch('Am7', 'Am7'), 'exact');
  for (const [source, existing] of [
    ['D9', 'D'],
    ['C#4', 'C#'],
    ['Em7', 'Em'],
    ['G/D', 'G'],
    ['D/F#', 'D'],
  ])
    assert.equal(chordMatch(source, existing), 'ornament', `${source} → ${existing}`);
  for (const [source, existing] of [
    ['Em', 'E'],
    ['E', 'Em'],
    ['G/D', 'D'],
    ['Am/G', 'G'],
    ['C#m7', 'A'],
    ['F#', 'Gb'],
    ['Bdim', 'B'],
    ['Caug', 'C'],
  ])
    assert.equal(chordMatch(source, existing), undefined, `${source} must not match ${existing}`);
});

test('a printed chord in whitespace advances to a sung syllable, and outside columns stay unbound', () => {
  const text = 'Eu,  canto aqui!';
  assert.equal(syllableAtColumn(text, 3), 5);
  assert.equal(syllableAtColumn(text, 4), 5);
  assert.equal(syllableAtColumn('Espírito', 3), 2, 'inside a syllable resolves to its onset');
  for (const column of [-3, -1, text.length - 1, text.length, text.length + 5])
    assert.equal(syllableAtColumn(text, column), undefined, `column ${column}`);
});

test('existing event timeline preserves fractional pulses and all written repeats without mutation', () => {
  const chart = fixture();
  const original = structuredClone(chart);
  assert.deepEqual(
    existingChordTimeline(chart).map(({ chord, beat, passage }) => [chord, beat, passage]),
    [
      ['D', 0, 1],
      ['G', 4, 1],
      ['A', 5, 1],
      ['Bm', 6.25, 1],
      ['G', 8, 2],
      ['A', 9, 2],
      ['Bm', 10.25, 2],
    ],
  );
  assert.deepEqual(chart, original);
});

test('a pickup before the old phrase window moves the vocal prefix while preserving its chord onsets', () => {
  const cue: LyricCue = { text: 'Eu canto aqui', startBeat: 4, endBeat: 12 };
  const events = timeline(['G', 4], ['C', 8]);
  const unchangedEvents = structuredClone(events);
  const result = alignLyricCue(cue, events, [
    reference(cue.text, [
      ['G', 3],
      ['C', 9],
    ]),
  ]);
  assert.deepEqual(
    result.anchors.map(({ from, beat }) => ({ from, beat })),
    [
      { from: 3, beat: 4 },
      { from: 9, beat: 8 },
    ],
  );
  assert.deepEqual(result.pending, []);
  const retimed = retimeLyricCues([{ ...cue, chordAnchors: result.anchors }], 12);
  const prepared = withLyricSyllables(retimed.cues);
  validateLyricCues(prepared, 12);
  assert.ok(prepared[0].startBeat >= 0 && prepared[0].startBeat < cue.startBeat);
  assert.deepEqual(prepared[0].scoreWindow, { startBeat: 4, endBeat: 12 });
  assert.ok(prepared[0].syllables!.every(({ startBeat, endBeat }) => endBeat > startBeat));
  assert.equal(prepared[0].syllables!.find(({ from }) => from === 3)!.startBeat, 4);
  assert.equal(prepared[0].syllables!.find(({ from }) => from === 9)!.startBeat, 8);
  assert.deepEqual(events, unchangedEvents);
});

test('a sustained chord cannot be moved to a later reattack but can match a real harmonic return', () => {
  const cue: LyricCue = { text: 'Eu canto aqui', startBeat: 4, endBeat: 10 };
  const source = [
    reference(cue.text, [
      ['D', 3],
      ['D', 9],
    ]),
  ];
  const sustained = alignLyricCue(cue, timeline(['D', 4], ['D', 6], ['D', 8]), source);
  assert.deepEqual(
    sustained.anchors.map(({ from, beat }) => ({ from, beat })),
    [{ from: 3, beat: 4 }],
  );
  assert.ok(
    sustained.pending.some(
      ({ reason }) => reason === 'conflicting-source-order-or-sustained-chord',
    ),
  );
  const returned = alignLyricCue(cue, timeline(['D', 4], ['G', 6], ['D', 8]), source);
  assert.deepEqual(
    returned.anchors.map(({ from, beat }) => ({ from, beat })),
    [
      { from: 3, beat: 4 },
      { from: 9, beat: 8 },
    ],
  );
});

test('interior chord anchors move the vocal prefix before the old boundary without delaying fixed harmony', () => {
  const cue: LyricCue = {
    text: 'Eu venho me derramar, dizer que Te amo',
    startBeat: 60,
    endBeat: 64,
  };
  const source = reference(cue.text, [
    ['D', 0],
    ['G', 9],
    ['D/F#', 22],
  ]);
  const result = alignLyricCue(cue, timeline(['G', 60], ['D', 62]), [source]);
  assert.deepEqual(
    result.anchors.map(({ from, beat, sourceChord }) => ({ from, beat, sourceChord })),
    [
      { from: syllableAtColumn(cue.text, 9), beat: 60, sourceChord: 'G' },
      { from: syllableAtColumn(cue.text, 22), beat: 62, sourceChord: 'D/F#' },
    ],
  );
  const [retimed] = retimeLyricCues([{ ...cue, chordAnchors: result.anchors }], 64).cues;
  const syllables = estimateLyricSyllables(retimed);
  assert.ok(syllables[0].startBeat < 60, 'the vocal prefix starts before the fixed G onset');
  assert.equal(syllables.find(({ from }) => from === result.anchors[0].from)!.startBeat, 60);
  assert.equal(syllables.find(({ from }) => from === result.anchors[1].from)!.startBeat, 62);
  validateLyricCues([retimed], 64);

  const referenceLines = parseChordReference(readFileSync(report.source.path, 'utf8')).filter(
    ({ songId }) => songId === 'me_derramar',
  );
  for (const [version, indexes] of [
    ['base', [12]],
    ['completa', [12, 24]],
  ] as const) {
    const chart = songs.me_derramar.versions[version];
    for (const index of indexes) {
      const actual = songLyrics.me_derramar.versions[version].cues[index];
      const aligned = alignLyricCue(actual, existingChordTimeline(chart), referenceLines);
      const originalStart = actual.scoreWindow?.startBeat ?? actual.startBeat;
      assert.deepEqual(
        aligned.anchors.map(({ from, beat }) => ({ from, beat })),
        [
          { from: 0, beat: originalStart - 1 },
          { from: 9, beat: originalStart },
          { from: 22, beat: originalStart + 2 },
        ],
      );
      const [prepared] = retimeLyricCues(
        [{ ...actual, chordAnchors: aligned.anchors }],
        actual.scoreWindow?.endBeat ?? actual.endBeat,
      ).cues;
      assert.equal(estimateLyricSyllables(prepared)[0].startBeat, originalStart - 1);
    }
  }
});

test('a supported vocal entry after instrumental harmony remains possible', () => {
  const cue: LyricCue = { text: 'Eu canto aqui', startBeat: 0, endBeat: 6 };
  const only = alignLyricCue(cue, timeline(['G', 0], ['D', 2]), [reference(cue.text, [['D', 0]])]);
  assert.deepEqual(
    only.anchors.map(({ from, beat }) => ({ from, beat })),
    [{ from: 0, beat: 2 }],
  );
  const complete = alignLyricCue(cue, timeline(['G', 0], ['D', 2], ['D/F#', 4]), [
    reference(cue.text, [
      ['D', 0],
      ['D/F#', 9],
    ]),
  ]);
  assert.deepEqual(
    complete.anchors.map(({ from, beat }) => ({ from, beat })),
    [
      { from: 0, beat: 2 },
      { from: 9, beat: 4 },
    ],
  );
});

test('the same lyric with different harmonies selects a compatible occurrence rather than the first text match', () => {
  const cue: LyricCue = { text: 'Eu canto aqui', startBeat: 8, endBeat: 12 };
  const result = alignLyricCue(cue, timeline(['Bm', 8], ['G', 10]), [
    reference(
      cue.text,
      [
        ['D', 0],
        ['A', 3],
      ],
      10,
    ),
    reference(
      cue.text,
      [
        ['Bm', 0],
        ['G', 3],
      ],
      20,
    ),
  ]);
  assert.equal(result.sourceLine, 20);
  assert.deepEqual(
    result.anchors.map(({ sourceChord, existingChord, beat }) => [
      sourceChord,
      existingChord,
      beat,
    ]),
    [
      ['Bm', 'Bm', 8],
      ['G', 'G', 10],
    ],
  );
  assert.deepEqual(result.pending, []);
});

test('unmatched, free and out-of-line reference passages remain explicit and do not create timing anchors', () => {
  const cue: LyricCue = { text: 'Eu canto aqui', startBeat: 0, endBeat: 4 };
  const events = timeline(['D', 0], ['A', 2]);
  assert.equal(alignLyricCue(cue, events, []).pending[0].reason, 'phrase-not-in-reference');
  const free = alignLyricCue(cue, events, [{ ...reference(cue.text, [['D', 0]]), free: true }]);
  assert.deepEqual(free.anchors, []);
  assert.equal(free.pending[0].reason, 'free-vocal-passage');
  const outside = alignLyricCue(cue, events, [
    reference(cue.text, [
      ['D', -1],
      ['A', 99],
    ]),
  ]);
  assert.deepEqual(outside.anchors, []);
  assert.ok(outside.pending.every(({ reason }) => reason === 'outside-lyric'));
});

test('a phrase inside a held chord keeps verse provenance and its existing onset before the old window', () => {
  const cue: LyricCue = { text: 'Eu canto aqui', startBeat: 5.5, endBeat: 7.5 };
  const result = alignLyricCue(cue, timeline(['D', 4], ['D', 8]), [
    reference(cue.text, [['D', 3]], 10),
    { ...reference(cue.text, [], 20), section: 'Repetições livres na ministração', free: true },
  ]);
  assert.equal(result.sourceLine, 10);
  assert.equal(result.sourceSection, 'Verso');
  assert.deepEqual(
    result.anchors.map(({ from, beat }) => ({ from, beat })),
    [{ from: 3, beat: 4 }],
  );
  assert.deepEqual(result.pending, []);
  const [retimed] = retimeLyricCues([{ ...cue, chordAnchors: result.anchors }], 12).cues;
  validateLyricCues([retimed], 12);
  assert.ok(retimed.startBeat < 4);
  assert.equal(estimateLyricSyllables(retimed).find(({ from }) => from === 3)!.startBeat, 4);
});

test('anchor validation rejects reversed, duplicate, out-of-window and zero-length pickup constraints', () => {
  const cue: LyricCue = { text: 'Eu canto aqui', startBeat: 4, endBeat: 8 };
  for (const anchors of [
    [{ from: 3, beat: 4 }],
    [{ from: 0, beat: 3 }],
    [{ from: 0, beat: 8 }],
    [{ from: -1, beat: 4 }],
    [{ from: 99, beat: 4 }],
    [{ from: 0, beat: NaN }],
    [
      { from: 3, beat: 5 },
      { from: 3, beat: 6 },
    ],
    [
      { from: 9, beat: 5 },
      { from: 3, beat: 6 },
    ],
    [
      { from: 3, beat: 6 },
      { from: 9, beat: 5 },
    ],
  ])
    assert.throws(() => validateLyricCues([{ ...cue, chordAnchors: anchors }], 12));
  assert.throws(() => validateLyricCues([{ ...cue, chordAnchors: [{ from: 4, beat: 5 }] }], 12));
  assert.throws(
    () =>
      validateLyricCues(
        [
          {
            text: ' Eu canto aqui ',
            startBeat: 0,
            endBeat: 4,
            chordAnchors: [{ from: 4, beat: 2 }],
          },
        ],
        4,
      ),
    /espaços/,
  );
  assert.throws(
    () => estimateLyricSyllables({ ...cue, chordAnchors: [{ from: 4, beat: 5 }] }),
    /sílaba/,
  );
});

test('fractional chord anchors remain exact after interpolation and selecting either repeated section', () => {
  const chart = fixture();
  const cues: LyricCue[] = [4, 8].map((startBeat) => ({
    text: 'Eu canto aqui',
    startBeat,
    endBeat: startBeat + 4,
    chordAnchors: [
      { from: 0, beat: startBeat },
      { from: 3, beat: startBeat + 1 },
      { from: 9, beat: startBeat + 2.25 },
    ],
  }));
  const prepared = withLyricSyllables(validateLyricCues(cues, 12));
  validateLyricCues(prepared, 12);
  for (const cue of prepared) {
    assert.equal(cue.syllables!.map(({ from, to }) => cue.text.slice(from, to)).join(''), cue.text);
    assert.ok(cue.syllables!.every(({ startBeat, endBeat }) => endBeat > startBeat));
    for (const anchor of cue.chordAnchors!)
      assert.equal(cue.syllables!.find(({ from }) => from === anchor.from)!.startBeat, anchor.beat);
  }
  const groups = buildChartGroups(chart);
  for (const input of [prepared, cues]) {
    for (const selection of [buildChartGroups(chart, 'V'), [groups[2]]]) {
      const [projected] = projectLyricCues(chart, selection, input);
      assert.deepEqual(
        [0, 3, 9].map((from) => projected.syllables!.find((part) => part.from === from)!.startBeat),
        [0, 1, 2.25],
      );
      assert.equal(projected.endBeat, 4);
    }
  }
});

test('alignment provenance identifies the supplied source and preserves musical data and original lyric windows', () => {
  const hash = (contents: string | Buffer) => createHash('sha256').update(contents).digest('hex');
  assert.equal(hash(readFileSync(report.source.path)), report.source.sha256);
  for (const file of report.preserved.files)
    assert.equal(hash(readFileSync(file.path)), file.sha256, file.path);
  for (const [key, expected] of Object.entries(report.preserved.lyricTextAndWindows)) {
    const [song, version] = key.split('/');
    const unchanged = songLyrics[song].versions[version].cues.map(
      ({ text, startBeat, endBeat, scoreWindow }) => ({
        text,
        startBeat: scoreWindow?.startBeat ?? startBeat,
        endBeat: scoreWindow?.endBeat ?? endBeat,
      }),
    );
    assert.equal(
      hash(JSON.stringify({ providedLines: songLyrics[song].providedLines, cues: unchanged })),
      expected,
      key,
    );
  }
});

test('every reported anchor traces the exact source column, syllable and existing event without transposing', () => {
  const source = parseChordReference(readFileSync(report.source.path, 'utf8'));
  for (const cue of report.cues) {
    const events = existingChordTimeline(songs[cue.song].versions[cue.version]);
    const sourceLine = source.find(
      ({ line, songId }) => line === cue.sourceLine && songId === cue.song,
    );
    const writtenCue = songLyrics[cue.song].versions[cue.version].cues[cue.cue];
    assert.deepEqual(
      writtenCue.chordAnchors ?? [],
      cue.anchors.map(({ from, beat }) => ({ from, beat })),
    );
    for (const anchor of cue.anchors) {
      const label = `${cue.song}/${cue.version}, phrase ${cue.cue}, character ${anchor.from}`;
      assert.ok(sourceLine, `${label}: source line`);
      assert.ok(
        sourceLine.chords.some(
          ({ chord, column }) => chord === anchor.sourceChord && column === anchor.column,
        ),
        `${label}: source column`,
      );
      assert.equal(syllableAtColumn(sourceLine.text, anchor.column), anchor.from, label);
      const event = events.find(({ bar, event }) => bar === anchor.bar && event === anchor.event);
      assert.ok(event, `${label}: event exists`);
      assert.equal(event.chord, anchor.existingChord, `${label}: unchanged chord`);
      assert.equal(event.beat, anchor.beat, `${label}: unchanged onset`);
      assert.equal(
        chordMatch(anchor.sourceChord, event.chord),
        anchor.match,
        `${label}: compatible chord family`,
      );
    }
  }
});

test('generated catalog anchors all point to existing chord events and survive playback projection', () => {
  let anchoredCues = 0;
  const coveredSongs = new Set<string>();
  for (const [songId, song] of Object.entries(songLyrics)) {
    for (const [version, lyrics] of Object.entries(song.versions)) {
      const chart = songs[songId].versions[version];
      const events = existingChordTimeline(chart);
      const groups = buildChartGroups(chart);
      const total = totalChartBeats(groups.flatMap(({ bars }) => bars.map(({ bar }) => bar)));
      const prepared = withLyricSyllables(validateLyricCues(lyrics.cues, total));
      validateLyricCues(prepared, total);
      const projected = projectLyricCues(chart, groups, prepared);
      for (const [index, cue] of prepared.entries()) {
        if (!cue.chordAnchors?.length) continue;
        anchoredCues++;
        coveredSongs.add(songId);
        for (const anchor of cue.chordAnchors) {
          const label = `${songId}/${version}, phrase ${index}, character ${anchor.from}`;
          assert.ok(
            events.some(({ beat }) => beat === anchor.beat),
            `${label}: existing event onset`,
          );
          assert.equal(
            cue.syllables!.find(({ from }) => from === anchor.from)?.startBeat,
            anchor.beat,
            label,
          );
          assert.equal(
            projected
              .find(({ id }) => id === index)!
              .syllables!.find(({ from }) => from === anchor.from)?.startBeat,
            anchor.beat,
            `${label}: playback`,
          );
        }
      }
    }
  }
  assert.ok(anchoredCues > 0, 'the generated catalog must retain its harmonic anchors');
  assert.equal(coveredSongs.size, 13, 'every supplied song has compatible reference anchors');
});
