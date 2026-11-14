export const GUITAR_TUNING = [40, 45, 50, 55, 59, 64] as const;
const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const NATURAL: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
export const ROOT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const modulo = (value: number, n: number) => ((value % n) + n) % n;
export function parseNote(note: string) {
  const match = /^([A-G])([#b]*)$/.exec(note.replaceAll('♯', '#').replaceAll('♭', 'b'));
  if (!match) throw new Error('Nota inválida: ' + note);
  const accidental = [...match[2]].reduce((n, c) => n + (c === '#' ? 1 : -1), 0);
  return { letter: match[1], accidental, pitch: NATURAL[match[1]] + accidental };
}
export const noteToMidi = (note: string, octave = 4) => (octave + 1) * 12 + parseNote(note).pitch;
export function midiToFrequency(midi: number) {
  if (!Number.isFinite(midi)) throw new Error('Altura inválida.');
  return 440 * 2 ** ((midi - 69) / 12);
}
export const midiNoteName = (midi: number, flats = false) => (flats ? FLAT_NAMES : SHARP_NAMES)[modulo(midi, 12)];
export function spellDegree(root: string, semitones: number, letterSteps: number) {
  const parsed = parseNote(root);
  const letter = LETTERS[modulo(LETTERS.indexOf(parsed.letter) + letterSteps, 7)];
  let difference = modulo(parsed.pitch + semitones - NATURAL[letter], 12);
  if (difference > 6) difference -= 12;
  return letter + (difference >= 0 ? '#'.repeat(difference) : 'b'.repeat(-difference));
}
export interface ModeDefinition {
  id: string; name: string; intervals: readonly number[]; colorIndex: number;
  colorLabel: string; explanation: string; parentDegree: number;
}
export const MODES: readonly ModeDefinition[] = [
  { id: 'ionian', name: 'Jônio', intervals: [0,2,4,5,7,9,11], colorIndex: 6, colorLabel: '7ª maior', explanation: 'É o modelo da escala maior. Ouça a chegada ao centro.', parentDegree: 0 },
  { id: 'dorian', name: 'Dórico', intervals: [0,2,3,5,7,9,10], colorIndex: 5, colorLabel: '6ª maior', explanation: 'A sexta maior diferencia o dórico da menor natural.', parentDegree: 1 },
  { id: 'phrygian', name: 'Frígio', intervals: [0,1,3,5,7,8,10], colorIndex: 1, colorLabel: '2ª menor', explanation: 'A segunda menor fica um semitom acima do centro.', parentDegree: 2 },
  { id: 'lydian', name: 'Lídio', intervals: [0,2,4,6,7,9,11], colorIndex: 3, colorLabel: '4ª aumentada', explanation: 'A quarta aumentada diferencia o lídio do maior.', parentDegree: 3 },
  { id: 'mixolydian', name: 'Mixolídio', intervals: [0,2,4,5,7,9,10], colorIndex: 6, colorLabel: '7ª menor', explanation: 'A sétima menor diferencia o mixolídio do maior.', parentDegree: 4 },
  { id: 'aeolian', name: 'Eólio', intervals: [0,2,3,5,7,8,10], colorIndex: 5, colorLabel: '6ª menor', explanation: 'É a menor natural. Compare sua sexta com a do dórico.', parentDegree: 5 },
  { id: 'locrian', name: 'Lócrio', intervals: [0,1,3,5,6,8,10], colorIndex: 4, colorLabel: '5ª diminuta', explanation: 'A tríade sobre o centro é diminuta; há também segunda menor.', parentDegree: 6 },
];
export const MINOR_FORMS = [
  { id: 'natural', name: 'Natural', intervals: [0,2,3,5,7,8,10] },
  { id: 'harmonic', name: 'Harmônica', intervals: [0,2,3,5,7,8,11] },
  { id: 'melodic', name: 'Melódica ascendente', intervals: [0,2,3,5,7,9,11] },
] as const;
export const TRIADS = [
  { id: 'major', name: 'Maior', suffix: '', formula: '1 · 3 · 5', intervals: [0,4,7] },
  { id: 'minor', name: 'Menor', suffix: 'm', formula: '1 · b3 · 5', intervals: [0,3,7] },
  { id: 'diminished', name: 'Diminuta', suffix: 'dim', formula: '1 · b3 · b5', intervals: [0,3,6] },
  { id: 'augmented', name: 'Aumentada', suffix: 'aug', formula: '1 · 3 · #5', intervals: [0,4,8] },
] as const;
export const INTERVALS = [
  { name: '2ª menor', semitones: 1, steps: 1 }, { name: '2ª maior', semitones: 2, steps: 1 },
  { name: '3ª menor', semitones: 3, steps: 2 }, { name: '3ª maior', semitones: 4, steps: 2 },
  { name: '4ª justa', semitones: 5, steps: 3 }, { name: '4ª aumentada', semitones: 6, steps: 3 },
  { name: '5ª diminuta', semitones: 6, steps: 4 }, { name: '5ª justa', semitones: 7, steps: 4 },
  { name: '6ª menor', semitones: 8, steps: 5 }, { name: '6ª maior', semitones: 9, steps: 5 },
  { name: '7ª menor', semitones: 10, steps: 6 }, { name: '7ª maior', semitones: 11, steps: 6 },
  { name: '8ª justa', semitones: 12, steps: 7 },
] as const;
export const spellHeptatonic = (root: string, intervals: readonly number[]) => intervals.map((n,i) => spellDegree(root,n,i));
export const spellChord = (root: string, intervals: readonly number[]) => intervals.map((n,i) => spellDegree(root,n,i*2));
export const parentMajor = (root: string, mode: ModeDefinition) => spellDegree(root,-MODES[0].intervals[mode.parentDegree],-mode.parentDegree);
export const scaleSteps = (intervals: readonly number[]) => intervals.map((n,i) => {
  const distance = (intervals[i+1] ?? 12)-n;
  return distance === 1 ? 'S' : distance === 2 ? 'T' : 'T + S';
});
const CHORD_TYPES: Record<string, { suffix: string; name: string }> = {
  '0,4,7': { suffix: '', name: 'maior' }, '0,3,7': { suffix: 'm', name: 'menor' },
  '0,3,6': { suffix: 'dim', name: 'diminuta' }, '0,4,8': { suffix: 'aug', name: 'aumentada' },
  '0,4,7,11': { suffix: 'maj7', name: 'maior com sétima maior' },
  '0,4,7,10': { suffix: '7', name: 'maior com sétima menor' },
  '0,3,7,10': { suffix: 'm7', name: 'menor com sétima menor' },
  '0,3,6,10': { suffix: 'm7(b5)', name: 'meio diminuta' },
};
export function harmonicField(root: string, minor = false, sevenths = false) {
  const intervals: readonly number[] = minor ? MINOR_FORMS[0].intervals : MODES[0].intervals;
  const scale = spellHeptatonic(root, intervals);
  const roman = sevenths
    ? minor ? ['i7','iiø7','IIImaj7','iv7','v7','VImaj7','VII7'] : ['Imaj7','ii7','iii7','IVmaj7','V7','vi7','viiø7']
    : minor ? ['i','ii°','III','iv','v','VI','VII'] : ['I','ii','iii','IV','V','vi','vii°'];
  return scale.map((note,degree) => {
    const indexes = Array.from({ length: sevenths ? 4 : 3 }, (_,i) => degree+i*2);
    const absolute = indexes.map(i => intervals[i%7]+Math.floor(i/7)*12);
    const offsets = absolute.map(n => n-absolute[0]);
    const quality = CHORD_TYPES[offsets.join(',')];
    if (!quality) throw new Error('Qualidade de acorde não reconhecida.');
    return { degree: degree+1, roman: roman[degree], name: note+quality.suffix, quality: quality.name,
      notes: indexes.map(i => scale[i%7]), intervals: offsets, midi: absolute.map(n => noteToMidi(root,3)+n) };
  });
}
