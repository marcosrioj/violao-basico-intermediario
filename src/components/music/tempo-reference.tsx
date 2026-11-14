import {
  formatBpm,
  referenceBpm,
  tempoStatusLabel,
  tempoUnitLabel,
  type TempoResearch,
} from '@/content/tempo';

export function TempoReference({ tempo }: { tempo: TempoResearch }) {
  const bpm = referenceBpm(tempo);
  return (
    <div className="tempo-reference">
      <p>
        <strong>
          {tempoStatusLabel(tempo.status)}
          {bpm !== null ? ` · ${formatBpm(bpm)} BPM` : ''}
        </strong>
        {bpm !== null && (
          <span className="hint"> · pulso de {tempoUnitLabel(tempo.playerUnit)}</span>
        )}
      </p>
      <p className="hint">{tempo.note}</p>
      {tempo.variable && (
        <p className="hint">
          A gravação varia de andamento. Este valor é uma referência fixa para praticar; não
          acompanha todas as mudanças do áudio original.
        </p>
      )}
      <details>
        <summary>Gravação e fontes do andamento</summary>
        <p className="hint">{tempo.recording}</p>
        <ul className="tempo-sources">
          {tempo.sources.map((source) => (
            <li key={source.url}>
              <a href={source.url} target="_blank" rel="noopener noreferrer">
                {source.title}
              </a>
              <p className="hint">{source.evidence}</p>
            </li>
          ))}
        </ul>
        <p className="hint">Revisão: {tempo.reviewedOn.split('-').reverse().join('/')}.</p>
      </details>
    </div>
  );
}
