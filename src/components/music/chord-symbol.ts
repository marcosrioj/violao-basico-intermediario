/** Chord spelling only: no guesses from a song title, key or recording. */
export interface ParsedChordSymbol {
  symbol: string;
  root: number;
  bass: number;
  intervals: number[];
  /** Bass in octave 2 and chord tones above it; this is not a guitar fingering. */
  midiNotes: number[];
}

const natural: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const degree: Record<number, number> = { 2: 2, 3: 4, 4: 5, 5: 7, 6: 9, 9: 14, 11: 17, 13: 21 };
const solfege: Record<string, string> = {
  do: 'C',
  re: 'D',
  mi: 'E',
  fa: 'F',
  sol: 'G',
  la: 'A',
  si: 'B',
};
function noteLetter(name: string) {
  return solfege[
    name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
  ];
}
function pitch(note: string) {
  const accidental = note.slice(1);
  const offset =
    accidental === 'x'
      ? 2
      : accidental.startsWith('#')
        ? accidental.length
        : accidental.startsWith('b')
          ? -accidental.length
          : 0;
  return (natural[note[0]] + offset + 12) % 12;
}

function extensionModifier(part: string) {
  const alteration = /^(5|9|11|13)([+-])$/.exec(part);
  if (alteration) return `${alteration[2] === '+' ? '#' : 'b'}${alteration[1]}`;
  return /^(2|4|6|9|11|13)$/.test(part) ? `add${part}` : part;
}

/** Returns null for unsupported/ambiguous symbols instead of silently simplifying them. */
export function parseChordSymbol(input: string): ParsedChordSymbol | null {
  const symbol = input
    .trim()
    .replaceAll('♯', '#')
    .replaceAll('♭', 'b')
    .replaceAll('𝄪', '##')
    .replaceAll('𝄫', 'bb')
    .replace(/^(D[oó]|R[eé]|Mi|F[aá]|Sol|L[aá]|Si)/i, (name) => noteLetter(name))
    .replace(
      /\/(D[oó]|R[eé]|Mi|F[aá]|Sol|L[aá]|Si)((?:##|bb|#|b|x)?)$/i,
      (_all, name: string, accidental: string) => `/${noteLetter(name)}${accidental}`,
    );
  if (!symbol || symbol.length > 64 || /\s/.test(symbol)) return null;
  const match = /^([A-G](?:##|bb|#|b|x)?)(.*)$/.exec(symbol);
  if (!match) return null;
  const root = pitch(match[1]);
  let tail = match[2];
  let bass = root;
  const inversion = /\/([A-G](?:##|bb|#|b|x)?)$/.exec(tail);
  if (inversion) {
    bass = pitch(inversion[1]);
    tail = tail.slice(0, -inversion[0].length);
  }
  // Parentheses annotate additions/alterations; an unqualified C(9) means Cadd9.
  let invalidParenthesis = false;
  tail = tail.replace(/\(([^()]*)\)/g, (_all, contents: string) => {
    // Brazilian chord charts write the suspended fourth + ninth as (4/9).
    // Preserve the suspension instead of adding a fourth over an unchanged third.
    if (contents === '4/9') return 'sus4add9';
    if (contents.split(/[,/]/).some((part) => !part)) invalidParenthesis = true;
    return contents.split(/[,/]/).map(extensionModifier).join('');
  });
  if (invalidParenthesis || /[(),]/.test(tail)) return null;
  tail = tail
    .replace(/^(?:maj|M)$/, '')
    .replace(/^min/, 'm')
    .replace(/^maj/, 'M')
    .replaceAll('maj', 'M')
    .replaceAll('Maj', 'M')
    .replaceAll('Δ', 'M')
    .replace(/^(?:°|º|o)/, 'dim')
    .replace(/^ø7?/, 'm7b5')
    .replace(/^\+/, 'aug')
    .replace(/^-/, 'm')
    .replace(/^(m?)(7|9|11|13)M/, '$1M$2')
    // Brazilian notation: 7+ is a major seventh; 5+ is the augmented triad.
    // C+7 / C7(5+) still mean an augmented fifth with a minor seventh.
    .replace(/^(m?)7\+/, '$1M7')
    .replace(/^5\+/, 'aug')
    .replace(/^6\/9/, '6add9')
    .replace(/\/([#b]?(?:13|11|9|6|5|4|2)[+-]?)(?=$|\/)/g, (_all, part: string) =>
      part === '4' ? 'sus4' : extensionModifier(part),
    )
    // Standalone 2/4 in these charts are suspended triads; add2/add4 keep the third.
    .replace(/^([24])(?=$|add|[#b]|no|omit)/, 'sus$1');
  let quality: 'major' | 'minor' | 'diminished' | 'augmented' = 'major';
  if (tail.startsWith('dim')) {
    quality = 'diminished';
    tail = tail.slice(3);
  } else if (tail.startsWith('aug')) {
    quality = 'augmented';
    tail = tail.slice(3);
  } else if (tail.startsWith('m')) {
    quality = 'minor';
    tail = tail.slice(1);
  }
  const intervals = new Set([
    0,
    quality === 'minor' || quality === 'diminished' ? 3 : 4,
    quality === 'diminished' ? 6 : quality === 'augmented' ? 8 : 7,
  ]);
  const extension = /^(M?)(13|11|9|7|6|5)/.exec(tail);
  if (extension) {
    const majorSeventh = extension[1] === 'M';
    const number = Number(extension[2]);
    if (majorSeventh && number < 7) return null;
    if (number === 5) {
      if (quality !== 'major') return null;
      intervals.delete(4);
    } else if (number === 6) intervals.add(9);
    else {
      intervals.add(majorSeventh ? 11 : quality === 'diminished' ? 9 : 10);
      if (number >= 9) intervals.add(14);
      if (number >= 11) intervals.add(17);
      if (number >= 13) intervals.add(21);
    }
    tail = tail.slice(extension[0].length);
  }
  const modifiers = new Set<string>();
  while (tail) {
    const modifier = /^(add(?:13|11|9|6|4|2)|sus[24]?|[#b](?:13|11|9|5)|(?:no|omit)[35])/.exec(
      tail,
    );
    if (!modifier || modifiers.has(modifier[0])) return null;
    const token = modifier[0];
    modifiers.add(token);
    tail = tail.slice(token.length);
    if (token.startsWith('sus')) {
      if (quality !== 'major' || [...modifiers].filter((item) => item.startsWith('sus')).length > 1)
        return null;
      intervals.delete(4);
      intervals.add(token === 'sus2' ? 2 : 5);
    } else if (token.startsWith('add')) intervals.add(degree[Number(token.slice(3))]);
    else if (token.startsWith('no') || token.startsWith('omit')) {
      if (token.endsWith('3')) {
        intervals.delete(3);
        intervals.delete(4);
      } else {
        intervals.delete(6);
        intervals.delete(7);
        intervals.delete(8);
      }
    } else {
      const base = degree[Number(token.slice(1))];
      if (
        token.endsWith('5') &&
        [...modifiers].filter((item) => /^[#b]5$/.test(item)).length === 1
      ) {
        // Replace even an already diminished/augmented fifth. A second explicitly written
        // alteration may coexist (b5,#5); the unaltered quality must not leave a ghost note.
        intervals.delete(6);
        intervals.delete(7);
        intervals.delete(8);
      } else intervals.delete(base);
      intervals.add(base + (token[0] === '#' ? 1 : -1));
    }
  }
  const ordered = [...intervals].sort((a, b) => a - b);
  return {
    symbol,
    root,
    bass,
    intervals: ordered,
    midiNotes: [36 + bass, ...ordered.map((interval) => 48 + root + interval)],
  };
}

/** Transpose spelling and slash bass together, preserving every written quality/alteration. */
export function transposeChordSymbol(symbol: string, semitones: number): string | null {
  if (!Number.isInteger(semitones) || Math.abs(semitones) > 24) return null;
  const parsed = parseChordSymbol(symbol);
  if (!parsed) return null;
  if (semitones % 12 === 0) return parsed.symbol;
  const sharp = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const flat = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const transpose = (note: string) =>
    (note.includes('b') ? flat : sharp)[(pitch(note) + semitones + 24) % 12];
  return parsed.symbol
    .replace(/^([A-G](?:##|bb|#|b|x)?)/, transpose)
    .replace(/\/([A-G](?:##|bb|#|b|x)?)$/, (_all, note: string) => `/${transpose(note)}`);
}
