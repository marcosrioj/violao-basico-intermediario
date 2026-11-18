import type { TunerSensitivity } from './tuner-signal';

export const TUNINGS = [
  { id: 'standard', name: 'Padrão', notes: [40, 45, 50, 55, 59, 64] },
  { id: 'drop-d', name: 'Drop D', notes: [38, 45, 50, 55, 59, 64] },
  { id: 'dadgad', name: 'DADGAD', notes: [38, 45, 50, 55, 57, 62] },
  { id: 'open-d', name: 'Open D', notes: [38, 45, 50, 54, 57, 62] },
  { id: 'open-g', name: 'Open G', notes: [38, 43, 50, 55, 59, 62] },
  { id: 'half-down', name: 'Meio tom abaixo', notes: [39, 44, 49, 54, 58, 63] },
  { id: 'whole-down', name: 'Um tom abaixo', notes: [38, 43, 48, 53, 57, 62] },
  { id: 'seven-c', name: '7 cordas · baixo em Dó', notes: [36, 40, 45, 50, 55, 59, 64] },
  { id: 'seven-b', name: '7 cordas · baixo em Si', notes: [35, 40, 45, 50, 55, 59, 64] },
] as const;

export type TunerSettings = {
  tuning: string;
  concertA: number;
  capo: number;
  tolerance: 1 | 3;
  mode: 'strings' | 'chromatic';
  sensitivity: TunerSensitivity;
};

export const DEFAULT_TUNER_SETTINGS: TunerSettings = {
  tuning: 'standard',
  concertA: 440,
  capo: 0,
  tolerance: 3,
  mode: 'strings',
  sensitivity: 'balanced',
};
export const TUNER_STORAGE_KEY = 'violao-vivo:tuner:v1';
export const DEFAULT_TUNER_SNAPSHOT = JSON.stringify(DEFAULT_TUNER_SETTINGS);

export function parseTunerSettings(raw: string): TunerSettings {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object') return DEFAULT_TUNER_SETTINGS;
    return {
      tuning: TUNINGS.some((tuning) => tuning.id === value.tuning) ? value.tuning : 'standard',
      concertA:
        Number.isFinite(value.concertA) && value.concertA >= 400 && value.concertA <= 480
          ? value.concertA
          : 440,
      capo: Number.isInteger(value.capo) && value.capo >= 0 && value.capo <= 7 ? value.capo : 0,
      tolerance: value.tolerance === 1 ? 1 : 3,
      mode: value.mode === 'chromatic' ? 'chromatic' : 'strings',
      sensitivity:
        value.sensitivity === 'soft' || value.sensitivity === 'noisy'
          ? value.sensitivity
          : 'balanced',
    };
  } catch {
    return DEFAULT_TUNER_SETTINGS;
  }
}

const letters = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'F♯', 'G', 'A♭', 'A', 'B♭', 'B'];
const names = [
  'Dó',
  'Ré bemol',
  'Ré',
  'Mi bemol',
  'Mi',
  'Fá',
  'Fá sustenido',
  'Sol',
  'Lá bemol',
  'Lá',
  'Si bemol',
  'Si',
];
export function tunerNote(midi: number) {
  const rounded = Math.round(midi);
  const pitch = ((rounded % 12) + 12) % 12;
  return { letter: letters[pitch], name: names[pitch], octave: Math.floor(rounded / 12) - 1 };
}
export function tunerNoteLabel(midi: number) {
  const note = tunerNote(midi);
  return `${note.letter}${note.octave}`;
}

/** Match actual register; never fold octaves onto a guitar string. */
export function closestTunerString(midi: number, notes: readonly number[]) {
  if (!Number.isFinite(midi) || notes.length === 0) return null;
  let index = 0;
  for (let i = 1; i < notes.length; i++) {
    if (Math.abs(notes[i] - midi) < Math.abs(notes[index] - midi)) index = i;
  }
  return Math.abs(notes[index] - midi) <= 2.5 ? index : null;
}
