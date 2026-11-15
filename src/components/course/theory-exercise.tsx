'use client';
import { useId, useState, type ReactNode } from 'react';
import { Hint } from '@/components/ui/hint';

export function TheoryExercise({
  exercise,
  answer,
  compact = false,
  headingLevel = 3,
}: {
  exercise: ReactNode;
  answer: ReactNode;
  compact?: boolean;
  headingLevel?: 3 | 4;
}) {
  const [attempt, setAttempt] = useState('');
  const [notice, setNotice] = useState('');
  const inputId = useId();
  const Heading = compact ? (headingLevel === 4 ? 'h4' : 'h3') : 'h2';
  return (
    <section className={compact ? 'quiz section' : 'card quiz'}>
      <p className="eyebrow">EXPERIMENTE ANTES DE CONFERIR</p>
      <div className="section-title">
        <Heading>Transforme a ideia em música</Heading>
        <Hint label="Rascunho do exercício">
          Este rascunho fica apenas nesta página. Registre uma tentativa antes de conferir a
          explicação. Pode ser uma dúvida ou o que você conseguiu ouvir.
        </Hint>
      </div>
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
      <p className="hint">Compare sua execução com o professor.</p>
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
