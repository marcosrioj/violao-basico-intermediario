import { chords } from './chords';

export const chordFamilies = [
  {
    id: 'start',
    title: '1. Primeiras formas',
    description:
      'Comece com D, G e Em. Depois amplie as trocas com os demais acordes abertos e o F de três cordas.',
    names: ['D', 'G', 'Em', 'C', 'Am', 'F', 'Dm', 'A', 'E'],
  },
  {
    id: 'positions',
    title: '2. Pestanas e outras posições',
    description:
      'Compare Bm reduzido com Bm e F de três cordas com F completo. A harmonia permanece; a posição e a quantidade de cordas mudam.',
    names: ['Bm reduzido', 'Bm', 'F completo', 'F#m', 'C#m', 'B', 'C#', 'D#m', 'F#'],
  },
  {
    id: 'sevenths',
    title: '3. Acordes com sétima',
    description:
      'Compare com a tríade de origem. 7 indica sétima menor; maj7, sétima maior; m7 mantém a terça menor. Em Bm7(b5), a quinta também é diminuta.',
    names: ['Am7', 'Dm7', 'Em7', 'Bm7', 'C7', 'G7', 'B7', 'C#7', 'Fmaj7', 'Cmaj7', 'Bm7(b5)'],
  },
  {
    id: 'colors',
    title: '4. Suspensões e nona adicionada',
    description:
      'Em sus4, a quarta substitui a terça. Em add9, a nona é acrescentada e a terça permanece. Compare D, Dsus4 e Dadd9.',
    names: ['Dsus4', 'Gsus4', 'Esus4', 'Asus4', 'Dadd9', 'Gadd9'],
  },
  {
    id: 'bass',
    title: '5. Acordes com outro baixo',
    description:
      'A nota depois da barra é o baixo. Ela pode pertencer à tríade, como em D/F#, ou acrescentar outra sonoridade, como em D/E. Escute primeiro a nota mais grave.',
    names: [
      'D/F#',
      'D/A',
      'D/E',
      'G/B',
      'G/D',
      'G/F',
      'G7/F',
      'G/A',
      'C/E',
      'C/G',
      'F/A',
      'F/G',
      'A/C#',
      'A/E',
      'A/G',
      'Am7/G',
      'Bm/F#',
    ],
  },
] as const;

export const rootNames: Record<string, string> = {
  C: 'Dó',
  'C#': 'Dó sustenido',
  D: 'Ré',
  'D#': 'Ré sustenido',
  E: 'Mi',
  F: 'Fá',
  'F#': 'Fá sustenido',
  G: 'Sol',
  A: 'Lá',
  B: 'Si',
};
export function chordRoot(name: string) {
  return name.match(/^[A-G][#b]?/)?.[0] ?? '';
}
export function matchesChord(name: string, root: string, query: string) {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('pt-BR')
      .trim();
  const term = normalize(query);
  return (
    (!root || chordRoot(name) === root) &&
    (!term ||
      normalize(
        `${name} ${chords[name]?.display_name ?? ''} ${rootNames[chordRoot(name)] ?? ''}`,
      ).includes(term))
  );
}
