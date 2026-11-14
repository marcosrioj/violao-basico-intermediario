/** BPM always includes its note value; a 6/8 pulse is not a quarter note. */
export type TempoUnit = 'quarter' | 'dotted-quarter' | 'eighth';

export interface TempoResearch {
  reviewedOn: string;
  recording: string;
  recordingUrl: string;
  meter: string;
  playerUnit: TempoUnit;
  status: 'documented' | 'estimated' | 'unresolved';
  reference: { bpm: number; unit: TempoUnit } | null;
  /** Explicit editorial choice; an estimate does not become a confirmed measurement. */
  useAsDefault?: boolean;
  variable: boolean;
  note: string;
  sources: { title: string; url: string; evidence: string }[];
}

const quarterLengths: Record<TempoUnit, number> = {
  quarter: 1,
  'dotted-quarter': 1.5,
  eighth: 0.5,
};

export function referenceBpm(tempo: TempoResearch): number | null {
  if (tempo.status === 'unresolved' || !tempo.reference) return null;
  const { bpm, unit } = tempo.reference;
  if (!Number.isFinite(bpm) || bpm <= 0) return null;
  return (bpm * quarterLengths[unit]) / quarterLengths[tempo.playerUnit];
}

export function defaultPlaybackBpm(studyBpm: number, tempo?: TempoResearch): number {
  return tempo?.useAsDefault ? (referenceBpm(tempo) ?? studyBpm) : studyBpm;
}

export function formatBpm(bpm: number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(bpm);
}

export function tempoUnitLabel(unit: TempoUnit): string {
  return { quarter: 'semínima', 'dotted-quarter': 'semínima pontuada', eighth: 'colcheia' }[unit];
}

export function tempoStatusLabel(status: TempoResearch['status']): string {
  return {
    documented: 'Referência documentada',
    estimated: 'Andamento estimado',
    unresolved: 'Sem referência de andamento',
  }[status];
}
