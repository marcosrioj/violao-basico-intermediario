'use client';
import { useId, useState, type ReactNode } from 'react';

export function TheoryExercise({ exercise, answer }: { exercise: ReactNode; answer: ReactNode }) {
  const [attempt, setAttempt] = useState('');
  const [notice, setNotice] = useState('');
  const inputId = useId();
  return (
    <section className="card quiz">
      <p className="eyebrow">EXPERIMENTE ANTES DE CONFERIR</p>
      <h2>Transforme a ideia em música</h2>
      <p>{exercise}</p>
      <label htmlFor={inputId}>
        Sua tentativa ou o que você ouviu
        <textarea
          id={inputId}
          value={attempt}
          onChange={(event) => {
            setAttempt(event.target.value);
            setNotice('');
          }}
          maxLength={2000}
          placeholder="Toque o exercício, anote sua resposta e depois compare."
        />
      </label>
      <p className="hint">
        Este rascunho fica apenas nesta página. Compare sua execução com o professor.
      </p>
      <details className="section">
        <summary
          onClick={(event) => {
            if (!attempt.trim() && !event.currentTarget.parentElement?.hasAttribute('open')) {
              event.preventDefault();
              setNotice(
                'Registre uma tentativa antes de conferir. Pode ser uma dúvida ou o que você conseguiu ouvir.',
              );
            }
          }}
        >
          Conferir e comparar minha tentativa
        </summary>
        <div className="answer-panel">{answer}</div>
        <p className="hint">
          Observe o que coincidiu e escolha um ponto para testar novamente no instrumento.
        </p>
      </details>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
    </section>
  );
}
