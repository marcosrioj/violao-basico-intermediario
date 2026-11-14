import {
  formatBpm,
  referenceBpm,
  tempoStatusLabel,
  tempoUnitLabel,
  type TempoResearch,
} from '@/content/tempo';
import { Hint } from '@/components/ui/hint';

export function TempoReference({ tempo }: { tempo: TempoResearch }) {
  const bpm = referenceBpm(tempo);
  if (bpm === null) return null;
  const details = (
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
        <div className="control-row">
          <p className="hint">A gravação varia de andamento.</p>
          <Hint label="Praticar uma gravação com andamento variável">
            O player mantém o BPM escolhido. Ele não acompanha automaticamente as mudanças de
            andamento do áudio original; ajuste o BPM ao estudar cada passagem.
          </Hint>
        </div>
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
  return tempo.useAsDefault ? <Hint label="Andamento da música">{details}</Hint> : details;
}
