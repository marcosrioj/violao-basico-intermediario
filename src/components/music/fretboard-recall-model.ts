/** Standard guitar tuning; strings numbered from treble (1) to bass (6). */
const tuning = [64, 59, 55, 50, 45, 40];
export function positionMidi(string: number, fret: number): number {
  if (
    !Number.isInteger(string) ||
    string < 1 ||
    string > 6 ||
    !Number.isInteger(fret) ||
    fret < 0 ||
    fret > 12
  )
    throw new RangeError('Posição inválida.');
  return tuning[string - 1] + fret;
}
export function pitchName(midi: number): string {
  return ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'][((midi % 12) + 12) % 12];
}
export const fretboardQuestions = [
  { string: 2, fret: 3, note: 'D' },
  { string: 1, fret: 3, note: 'G' },
  { string: 4, fret: 2, note: 'E' },
  { string: 2, fret: 1, note: 'C' },
  { string: 6, fret: 1, note: 'F' },
  { string: 3, fret: 2, note: 'A' },
];
