'use client';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Hint } from '@/components/ui/hint';
export function Quiz({ question, answer }: { question: ReactNode; answer: ReactNode }) {
  const [attempt, setAttempt] = useState('');
  return (
    <CollapsibleCard className="quiz" title="O que você percebeu?">
      <div className="section-title">
        <p className="eyebrow">PARE, PENSE E EXPERIMENTE</p>
        <Hint label="Resposta de estudo">
          Sua resposta é um rascunho para estudo e não é salva.
        </Hint>
      </div>
      <div>{question}</div>
      <label htmlFor="quiz-answer">Seu rascunho</label>
      <textarea
        id="quiz-answer"
        value={attempt}
        onChange={(e) => setAttempt(e.target.value)}
        placeholder="Explique com suas palavras antes de conferir…"
      />
      <details>
        <summary>Conferir explicação</summary>
        <div className="answer-panel">{answer}</div>
      </details>
    </CollapsibleCard>
  );
}
