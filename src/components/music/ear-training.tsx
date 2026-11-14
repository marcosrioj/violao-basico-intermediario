'use client';
import { useEffect, useRef, useState } from 'react';
import { playTone, frequency, audioContext } from './audio';
import { Hint } from '@/components/ui/hint';
export function EarTraining() {
  const [interval, setIntervalValue] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const [answered, setAnswered] = useState(false);
  const voices = useRef<(() => void)[]>([]);
  useEffect(() => {
    const stop = () => {
      voices.current.forEach((cancel) => cancel());
      voices.current = [];
    };
    const stopHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', stopHidden);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', stopHidden);
    };
  }, []);
  function listen(value: number) {
    voices.current.forEach((cancel) => cancel());
    const ctx = audioContext();
    voices.current = [
      playTone(frequency(60), 0.6),
      playTone(frequency(60 + value), 0.9, ctx.currentTime + 0.75),
    ];
  }
  return (
    <section className="card">
      <p className="eyebrow">ESCUTA ATIVA</p>
      <div className="section-title">
        <h2>Qual é o intervalo?</h2>
        <Hint label="Responder ao desafio auditivo">
          Novo desafio toca um par de notas. Escolha uma resposta para conferir a explicação; Ouvir
          novamente repete o mesmo par. Use um volume confortável.
        </Hint>
      </div>
      <p>
        Ouça duas notas e compare a distância entre elas. Tente responder antes de consultar a
        explicação.
      </p>
      <div className="control-row">
        <button
          type="button"
          className="button"
          onClick={() => {
            const value = [4, 7, 12][Math.floor(Math.random() * 3)];
            setIntervalValue(value);
            setResult('');
            setAnswered(false);
            listen(value);
          }}
        >
          Novo desafio
        </button>
        <button
          type="button"
          disabled={interval === null}
          className="button secondary"
          onClick={() => interval !== null && listen(interval)}
        >
          Ouvir novamente
        </button>
      </div>
      <div className="choice-row" role="group" aria-label="Escolha o intervalo ouvido">
        {[
          [4, 'Terça maior'],
          [7, 'Quinta justa'],
          [12, 'Oitava justa'],
        ].map(([value, label]) => (
          <button
            type="button"
            className="choice"
            key={value}
            disabled={interval === null || answered}
            onClick={() => {
              setAnswered(true);
              setResult(
                value === interval
                  ? `Isso! ${label}: ${interval} semitons.`
                  : `Você ouviu ${interval === 4 ? 'uma terça maior' : interval === 7 ? 'uma quinta justa' : 'uma oitava justa'} (${interval} semitons). Ouça novamente e compare.`,
              );
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <p aria-live="polite" className="hint">
        {result}
      </p>
    </section>
  );
}
export function TuningReference() {
  return (
    <section className="card">
      <p className="eyebrow">ANTES DE COMEÇAR</p>
      <div className="section-title">
        <h2>Afinação de referência</h2>
        <Hint label="Usar as notas de afinação">
          Cada botão emite a nota da corda indicada. Esta ferramenta não usa o microfone nem mede a
          afinação do seu instrumento.
        </Hint>
      </div>
      <p>
        Ouça as cordas soltas, da mais grave à mais aguda. Compare com seu instrumento ou use um
        afinador.
      </p>
      <div className="tuning-notes">
        {['E₂', 'A₂', 'D₃', 'G₃', 'B₃', 'E₄'].map((note, i) => (
          <button
            type="button"
            className="choice"
            key={note}
            aria-label={`Ouvir ${note}, ${6 - i}ª corda solta`}
            onClick={() => playTone(frequency([40, 45, 50, 55, 59, 64][i]), 2)}
          >
            <strong>{note}</strong>
            <small>{6 - i}ª corda</small>
          </button>
        ))}
      </div>
      <p className="hint">Lá de referência: 440 Hz.</p>
    </section>
  );
}
