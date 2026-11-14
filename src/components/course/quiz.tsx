'use client';
import { useState } from 'react';
import type { ReactNode } from 'react';
export function Quiz({ question, answer }: { question: ReactNode; answer: ReactNode }) {
  const [attempt, setAttempt] = useState('');
  return (
    <section className="card quiz">
      <p className="eyebrow">PARE, PENSE E EXPERIMENTE</p>
      <h2>O que você percebeu?</h2>
      <div>{question}</div>
      <label className="sr-only" htmlFor="quiz-answer">
        Sua resposta, somente para estudo
      </label>
      <textarea
        id="quiz-answer"
        value={attempt}
        onChange={(e) => setAttempt(e.target.value)}
        placeholder="Explique com suas palavras antes de conferir…"
      />
      <p className="hint">Sua resposta é um rascunho para estudo e não é salva.</p>
      <details>
        <summary>Conferir explicação</summary>
        <div className="answer-panel">{answer}</div>
      </details>
    </section>
  );
}
