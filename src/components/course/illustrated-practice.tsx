'use client';

import { useId, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { PracticeVisual } from './practice-visual';
import type { IllustratedStep } from './practice-visual-types';

export function IllustratedPractice({
  steps,
  instructions,
}: {
  steps: IllustratedStep[];
  instructions: ReactNode[];
}) {
  const [index, setIndex] = useState(0);
  const id = useId();
  const step = steps[index];
  if (!step) return null;
  return (
    <section className="illustrated-practice" aria-label="Prática ilustrada da aula">
      <div className="illustrated-practice-heading">
        <div>
          <p className="eyebrow">VEJA, EXPERIMENTE, REPITA</p>
          <h3>Uma instrução por vez</h3>
        </div>
        <span className="visual-step-count" role="status" aria-atomic="true">
          Passo {index + 1} de {steps.length}
        </span>
      </div>
      <nav className="visual-step-picker" aria-label="Escolher passo da prática">
        {steps.map((item, i) => (
          <button
            key={i}
            type="button"
            aria-pressed={i === index}
            aria-controls={`${id}-panel`}
            onClick={() => setIndex(i)}
          >
            <span>{i + 1}</span>
            {item.visual.title}
          </button>
        ))}
      </nav>
      <div id={`${id}-panel`} className="visual-step-panel">
        <PracticeVisual visual={step.visual} />
        <div className="visual-instruction">
          <span className="eyebrow">AGORA, FAÇA</span>
          <div>{step.instruction}</div>
        </div>
      </div>
      <div className="visual-step-navigation">
        <button
          type="button"
          className="button secondary"
          onClick={() => setIndex((n) => n - 1)}
          disabled={index === 0}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Anterior
        </button>
        <button
          type="button"
          className="button"
          onClick={() => setIndex((n) => n + 1)}
          disabled={index === steps.length - 1}
        >
          Próximo passo
          <ArrowRight size={17} aria-hidden="true" />
        </button>
      </div>
      <details className="visual-all-instructions">
        <summary>Ler as {steps.length} instruções juntas</summary>
        <ol className="steps">
          {steps.map((item, i) => (
            <li key={i}>{instructions[i] ?? item.instruction}</li>
          ))}
        </ol>
      </details>
    </section>
  );
}
