'use client';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { useState } from 'react';
import type { ReactNode } from 'react';
import { Hint } from '@/components/ui/hint';
export function Quiz({
  question,
  answer,
  compact = false,
}: {
  question: ReactNode;
  answer: ReactNode;
  compact?: boolean;
}) {
  const [attempt, setAttempt] = useState('');
  const content = (
    <>
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
    </>
  );
  return compact ? (
    <details className="quiz">
      <summary>O que você percebeu?</summary>
      {content}
    </details>
  ) : (
    <CollapsibleCard className="quiz" title="O que você percebeu?">
      {content}
    </CollapsibleCard>
  );
}
