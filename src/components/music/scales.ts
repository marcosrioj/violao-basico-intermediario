export type ScaleKind = 'major' | 'minor' | 'pentatonic';
export const scaleRoots = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const naturals: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const definitions = {
  major: { intervals: [0, 2, 4, 5, 7, 9, 11], degrees: [1, 2, 3, 4, 5, 6, 7] },
  minor: { intervals: [0, 2, 3, 5, 7, 8, 10], degrees: [1, 2, 3, 4, 5, 6, 7] },
  pentatonic: { intervals: [0, 2, 4, 7, 9], degrees: [1, 2, 3, 5, 6] },
};
export function scaleNotes(root: number, kind: ScaleKind) {
  const tonic = scaleRoots[root];
  if (!tonic) throw new RangeError('Tônica inválida.');
  const definition = definitions[kind];
  return definition.intervals.map((distance, index) => {
    const degree = definition.degrees[index];
    const letter = letters[(letters.indexOf(tonic[0]) + degree - 1) % 7];
    const pitch = (root + distance) % 12;
    let accidental = (pitch - naturals[letter] + 12) % 12;
    if (accidental > 6) accidental -= 12;
    const name = letter + (accidental < 0 ? '♭'.repeat(-accidental) : '♯'.repeat(accidental));
    return { degree, pitch, name };
  });
}
