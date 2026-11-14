'use client';
import { useState } from 'react';
import { playTone, frequency, audioContext } from './audio';
export function EarTraining() {
  const [interval, setIntervalValue] = useState<number | null>(null);
  const [result, setResult] = useState('');
  const [answered, setAnswered] = useState(false);
  function listen(value: number) {
    const ctx = audioContext();
    playTone(frequency(60), 0.6);
    playTone(frequency(60 + value), 0.9, ctx.currentTime + 0.75);
  }
  return (
    <section className="card">
      <p className="eyebrow">ESCUTA ATIVA</p>
      <h2>Qual é o intervalo?</h2>
      <p>
        Ouça duas notas e compare a distância entre elas. Tente responder antes de consultar a
        explicação.
      </p>
      <div className="control-row">
        <button
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
          disabled={interval === null}
          className="button secondary"
          onClick={() => interval !== null && listen(interval)}
        >
          Ouvir novamente
        </button>
      </div>
      <div className="choice-row">
        {[
          [4, 'Terça maior'],
          [7, 'Quinta justa'],
          [12, 'Oitava justa'],
        ].map(([value, label]) => (
          <button
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
        {result || 'Use um volume confortável e ouça sem pressa.'}
      </p>
    </section>
  );
}
export function TuningReference() {
  return (
    <section className="card">
      <p className="eyebrow">ANTES DE COMEÇAR</p>
      <h2>Afinação de referência</h2>
      <p>
        Ouça as cordas soltas, da mais grave à mais aguda. Compare com seu instrumento ou use um
        afinador.
      </p>
      <div className="tuning-notes">
        {['E₂', 'A₂', 'D₃', 'G₃', 'B₃', 'E₄'].map((note, i) => (
          <button
            className="choice"
            key={note}
            onClick={() => playTone(frequency([40, 45, 50, 55, 59, 64][i]), 2)}
          >
            <strong>{note}</strong>
            <small>{6 - i}ª corda</small>
          </button>
        ))}
      </div>
      <p className="hint">
        Lá de referência: 440 Hz. Esta ferramenta emite notas; não mede a afinação pelo microfone.
      </p>
    </section>
  );
}
