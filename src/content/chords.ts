import data from './chords-data.json';
import type { Chord } from './types';

// Only instrument fingering data is bundled with interactive components.
// Lessons, theory texts and teacher plans stay in server-rendered course modules.
export const chords: Record<string, Chord> = data;
