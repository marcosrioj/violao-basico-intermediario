'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Check, Lightbulb, RotateCcw } from 'lucide-react';
import './music.css';
import { Hint } from '@/components/ui/hint';
export interface QuizProps {
  question: ReactNode;
  options: ReactNode[];
  correctIndex: number;
  explanation: ReactNode;
  onResult?: (correct: boolean) => void;
}
export function Quiz({ question, options, correctIndex, explanation, onResult }: QuizProps) {
  const id = useId(),
    [selected, setSelected] = useState<number | null>(null),
    [submitted, setSubmitted] = useState(false);
  const correct = selected === correctIndex,
    feedback = useRef<HTMLDivElement>(null),
    firstOption = useRef<HTMLInputElement>(null),
    previous = useRef(false);
  useEffect(() => {
    if (submitted) feedback.current?.focus();
    else if (previous.current) firstOption.current?.focus();
    previous.current = submitted;
  }, [submitted]);
  return (
    <div className="music-quiz">
      <div className="music-lab-heading-title">
        <span className="music-eyebrow">
          <Lightbulb size={16} aria-hidden="true" /> PENSE ANTES DE CONFERIR
        </span>
        <Hint label="Responder e conferir o exercício">
          Escolha uma alternativa e acione Conferir resposta. A explicação aparece depois; use
          Tentar novamente para liberar as opções e refazer o exercício.
        </Hint>
      </div>
      <fieldset aria-describedby={submitted ? id + '-feedback' : undefined}>
        <legend>{question}</legend>
        <div className="music-quiz-options">
          {options.map((option, index) => (
            <label
              key={index}
              className={
                'music-quiz-option' +
                (selected === index ? ' is-selected' : '') +
                (submitted && index === correctIndex ? ' is-correct' : '') +
                (submitted && selected === index && !correct ? ' is-incorrect' : '')
              }
            >
              <input
                ref={index === 0 ? firstOption : undefined}
                type="radio"
                name={id}
                value={index}
                checked={selected === index}
                disabled={submitted}
                onChange={() => setSelected(index)}
              />
              <span className="music-option-letter" aria-hidden="true">
                {String.fromCharCode(65 + index)}
              </span>
              <span>
                {option}
                {submitted && index === correctIndex && (
                  <span className="music-answer-tag">
                    <Check size={14} aria-hidden="true" /> Resposta correta
                  </span>
                )}
              </span>
            </label>
          ))}
        </div>
      </fieldset>
      {!submitted ? (
        <button
          type="button"
          className="music-button music-button-primary"
          disabled={selected === null}
          onClick={() => {
            if (selected === null) return;
            setSubmitted(true);
            onResult?.(correct);
          }}
        >
          Conferir resposta <Check size={16} aria-hidden="true" />
        </button>
      ) : (
        <div
          ref={feedback}
          tabIndex={-1}
          id={id + '-feedback'}
          className={'music-feedback ' + (correct ? 'is-correct' : 'is-review')}
          role="status"
        >
          <strong>{correct ? 'Você fez a conexão.' : 'Vamos revisar essa conexão.'}</strong>
          <div>{explanation}</div>
          <button
            type="button"
            className="music-button music-button-quiet"
            onClick={() => {
              setSelected(null);
              setSubmitted(false);
            }}
          >
            <RotateCcw size={15} aria-hidden="true" /> Tentar novamente
          </button>
        </div>
      )}
    </div>
  );
}
