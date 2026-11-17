'use client';
import { Hint } from '@/components/ui/hint';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Presentation, X } from 'lucide-react';
import type { Lesson } from '@/content/types';
import type { LessonEnrichment } from '@/content/curriculum-types';
import type { IllustratedStep } from './practice-visual-types';
import { PracticeVisual } from './practice-visual';
import {
  buildLessonPresentation,
  presentationIndex,
  visibleSlideBlocks,
  type PresentationMove,
  type TechniquePresentationEntry,
} from '@/lib/lesson-presentation';
import './lesson-presentation.css';

/** Render only after the server authorizes the teacher and resolves this lesson. */
export function LessonPresentation({
  lesson,
  enrichment,
  techniques = [],
  illustratedSteps = [],
}: {
  lesson: Lesson;
  enrichment?: LessonEnrichment;
  techniques?: TechniquePresentationEntry[];
  illustratedSteps?: IllustratedStep[];
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const slides = buildLessonPresentation(lesson, enrichment, techniques, illustratedSteps);
  const slide = slides[index];

  useEffect(() => {
    if (open) viewport.current?.focus();
    else if (wasOpen.current) trigger.current?.focus();
    wasOpen.current = open;
  }, [open]);

  function move(to: PresentationMove) {
    const target = presentationIndex(index, to, slides.length);
    if (target === index) return;
    setIndex(target);
    setAnswerRevealed(false);
    viewport.current?.scrollTo({ top: 0, behavior: 'instant' });
  }

  function close() {
    setOpen(false);
    setAnswerRevealed(false);
  }

  function keyboard(event: KeyboardEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      target.closest('input, select, textarea, [contenteditable="true"]')
    )
      return;
    const shortcuts: Record<string, PresentationMove> = {
      ArrowLeft: 'previous',
      ArrowRight: 'next',
      Home: 'first',
      End: 'last',
    };
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (event.key in shortcuts) {
      event.preventDefault();
      move(shortcuts[event.key]);
    }
  }

  return (
    <section className="lesson-slides" aria-labelledby={`${id}-heading`}>
      <header className="lesson-slides-header">
        <div>
          <p className="eyebrow">CONDUÇÃO DA AULA</p>
          <h3 id={`${id}-heading`}>Apresente uma ideia por vez</h3>
        </div>
        <Hint label="Usar a apresentação">
          Etapas para conduzir o encontro no seu ritmo. Com o foco na apresentação, use ← e → para
          navegar, Home/End para ir ao início/fim e Esc para encerrar. Role o conteúdo quando
          precisar. Nenhuma etapa avança sozinha.
        </Hint>
        {!open && (
          <button
            ref={trigger}
            type="button"
            className="button"
            aria-expanded={false}
            aria-controls={`${id}-deck`}
            onClick={() => setOpen(true)}
          >
            <Presentation size={18} aria-hidden="true" /> Iniciar apresentação
          </button>
        )}
      </header>

      <p className="lesson-slides-status" role="status" aria-atomic="true">
        {open ? `Etapa ${index + 1} de ${slides.length}: ${slide.label}.` : ''}
      </p>

      {open && (
        <div id={`${id}-deck`} className="lesson-slides-deck" onKeyDown={keyboard}>
          <div className="lesson-slides-toolbar">
            <label htmlFor={`${id}-index`}>
              Ir para a etapa
              <select
                id={`${id}-index`}
                value={index}
                onChange={(event) => move(Number(event.target.value))}
              >
                {slides.map((item, position) => (
                  <option key={item.id} value={position}>
                    {position + 1}. {item.label}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="button secondary" onClick={close}>
              <X size={17} aria-hidden="true" /> Encerrar apresentação
            </button>
          </div>

          <div
            ref={viewport}
            className="lesson-slides-viewport"
            tabIndex={0}
            role="region"
            aria-label={`Apresentação de ${lesson.display_id}`}
            aria-keyshortcuts="ArrowLeft ArrowRight Home End Escape"
          >
            <article className="lesson-slides-page" aria-labelledby={`${id}-title`}>
              <p className="lesson-slides-kicker">
                {lesson.display_id} <span aria-hidden="true">·</span> {slide.label}
              </p>
              <h4 id={`${id}-title`}>{slide.title}</h4>
              <div className="lesson-slides-content">
                {visibleSlideBlocks(slide, answerRevealed).map((block) => (
                  <div
                    key={block.id}
                    id={block.id === 'answer' ? `${id}-answer` : undefined}
                    className={
                      block.id === 'answer' ? 'lesson-slides-answer' : 'lesson-slides-block'
                    }
                  >
                    {block.label && <p className="lesson-slides-label">{block.label}</p>}
                    {block.kind === 'text' ? (
                      <p>{block.text}</p>
                    ) : block.kind === 'tab' ? (
                      <pre
                        className="learning-tab"
                        tabIndex={0}
                        role="region"
                        aria-label="Tablatura do exemplo"
                      >
                        <code>{block.text}</code>
                      </pre>
                    ) : block.kind === 'visual' ? (
                      <PracticeVisual visual={block.visual} />
                    ) : (
                      <ol>
                        {block.items.map((item, position) => (
                          <li key={`${block.id}-${position}`}>{item}</li>
                        ))}
                      </ol>
                    )}
                  </div>
                ))}
                {slide.answer !== undefined && (
                  <button
                    type="button"
                    className="button secondary"
                    aria-expanded={answerRevealed}
                    aria-controls={`${id}-answer`}
                    onClick={() => setAnswerRevealed((current) => !current)}
                  >
                    {answerRevealed ? (
                      <EyeOff size={17} aria-hidden="true" />
                    ) : (
                      <Eye size={17} aria-hidden="true" />
                    )}
                    {answerRevealed ? 'Ocultar resposta' : 'Mostrar resposta'}
                  </button>
                )}
              </div>
            </article>
          </div>

          <div className="lesson-slides-progress">
            <span id={`${id}-progress-label`}>
              Etapa {index + 1} de {slides.length}
            </span>
            <progress
              max={slides.length}
              value={index + 1}
              aria-labelledby={`${id}-progress-label`}
            />
          </div>
          <nav className="lesson-slides-navigation" aria-label="Navegar pela apresentação">
            <button
              type="button"
              className="button secondary"
              disabled={index === 0}
              onClick={() => move('previous')}
            >
              <ArrowLeft size={17} aria-hidden="true" /> Anterior
            </button>
            <button
              type="button"
              className="button"
              disabled={index === slides.length - 1}
              onClick={() => move('next')}
            >
              Próxima <ArrowRight size={17} aria-hidden="true" />
            </button>
          </nav>
        </div>
      )}
    </section>
  );
}
