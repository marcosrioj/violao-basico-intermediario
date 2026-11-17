import type { ChartBarDescription } from '@/components/music/chart-layout';

/** Serializable diagrams: the server selects only the current lesson's material. */
export type PracticeDiagram =
  | { kind: 'chords'; names: string[] }
  | { kind: 'fretboard'; points: { string: number; fret: number; note: string }[] }
  | {
      kind: 'rhythm';
      groups: { label: string; cells: { count: string; action: string; detail?: string }[] }[];
    }
  | { kind: 'sequence'; items: { label: string; detail: string }[] }
  | { kind: 'dynamics'; items: { label: string; detail: string; level: number }[] }
  | { kind: 'bars'; bars: (ChartBarDescription & { label: string })[] }
  | { kind: 'instrument'; focus: 'support' | 'damping' };

export interface PracticeVisual {
  title: string;
  caption: string;
  diagram: PracticeDiagram;
}

export interface IllustratedStep {
  /** Exact lesson.steps entry; links are rendered server-side by the lesson view. */
  instruction: string;
  visual: PracticeVisual;
}
