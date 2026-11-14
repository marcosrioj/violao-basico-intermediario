'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { playTone, frequency, audioContext } from './audio';
import { Hint } from '@/components/ui/hint';
import {
  createEarSession,
  earChoices,
  earIntervals,
  summarizeEarSession,
  type EarLevel,
  type EarQuestion,
} from './lab-ear';
import './ear-training.css';

export function EarTraining() {
  const [level, setLevel] = useState<EarLevel>('foundations');
  const [questions, setQuestions] = useState<EarQuestion[]>([]);
  const [answers, setAnswers] = useState<number[]>([]);
  const [review, setReview] = useState<EarQuestion[] | null>(null);
  const [index, setIndex] = useState(0);
  const [choice, setChoice] = useState<number | null>(null);
  const [heard, setHeard] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioError, setAudioError] = useState('');
  const voices = useRef<(() => void)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const deck = review ?? questions;
  const question = deck[index];
  const finished = deck.length > 0 && index >= deck.length;
  const summary = summarizeEarSession(questions, answers);
  const stop = useCallback(() => {
    generation.current++;
    voices.current.forEach((cancel) => cancel());
    voices.current = [];
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPlaying(false);
  }, []);
  useEffect(() => {
    const stopHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', stopHidden);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', stopHidden);
    };
  }, [stop]);
  async function listen(semitones: number, root: number, attempt = false) {
    stop();
    const current = generation.current;
    setAudioError('');
    try {
      const ctx = audioContext();
      await ctx.resume();
      if (current !== generation.current || document.hidden) return;
      const start = ctx.currentTime + 0.03;
      voices.current = [
        playTone(frequency(root), 0.6, start),
        playTone(frequency(root + semitones), 0.9, start + 0.75),
      ];
      setPlaying(true);
      timer.current = setTimeout(() => {
        if (current !== generation.current || document.hidden) return;
        voices.current = [];
        timer.current = null;
        if (attempt) setHeard(true);
        setPlaying(false);
      }, 1750);
    } catch {
      setAudioError('Não foi possível tocar o áudio. Tente ouvir novamente.');
    }
  }
  function reset(nextLevel: EarLevel) {
    stop();
    setLevel(nextLevel);
    setQuestions([]);
    setAnswers([]);
    setReview(null);
    setIndex(0);
    setChoice(null);
    setHeard(false);
    setAudioError('');
  }
  function start() {
    stop();
    setQuestions(createEarSession(level));
    setAnswers([]);
    setReview(null);
    setIndex(0);
    setChoice(null);
    setHeard(false);
    setAudioError('');
  }
  return (
    <section className="card ear-training">
      <p className="eyebrow">ESCUTAR · RECONHECER · COMPARAR</p>
      <div className="section-title">
        <h2>Qual é o intervalo?</h2>
        <Hint label="Praticar a escuta em seis perguntas">
          Escolha uma etapa, escute os exemplos e inicie uma rodada. Ouvir o desafio repete sempre o
          mesmo par até você avançar. A nota inicial muda entre perguntas. Só a primeira resposta de
          cada pergunta conta no resumo; revisar não altera esse resultado. Nada é gravado no seu
          histórico do curso. Use volume confortável.
        </Hint>
      </div>
      <p>
        Compare a distância entre duas notas, mesmo quando a primeira muda. Ouça, tente nomear e
        confira a diferença.
      </p>
      <label className="ear-level">
        Etapa de escuta
        <select value={level} onChange={(event) => reset(event.target.value as EarLevel)}>
          <option value="foundations">1 · Terça maior, quinta e oitava</option>
          <option value="thirds">2 · Terça menor ou maior</option>
        </select>
      </label>
      {questions.length === 0 && (
        <>
          <h3>Primeiro, conheça os sons</h3>
          <div className="choice-row" role="group" aria-label="Exemplos de intervalos">
            {earChoices[level].map((value) => (
              <button
                className="choice"
                type="button"
                key={value}
                onClick={() => void listen(value, 55)}
              >
                Ouvir {earIntervals[value].label.toLowerCase()}
              </button>
            ))}
          </div>
          <p className="hint">
            Depois, procure reconhecer a mesma distância a partir de outras notas.
          </p>
          <button className="button" type="button" onClick={start}>
            Iniciar 6 perguntas
          </button>
        </>
      )}
      {question && (
        <>
          <p className="ear-progress" role="status">
            {review ? 'Revisão' : 'Pergunta'} {index + 1} de {deck.length}
          </p>
          <div className="control-row">
            <button
              className="button"
              type="button"
              onClick={() => void listen(question.semitones, question.root, true)}
            >
              {heard ? 'Ouvir novamente' : 'Ouvir desafio'}
            </button>
          </div>
          <div className="choice-row" role="group" aria-label="Escolha o intervalo ouvido">
            {earChoices[level].map((value) => (
              <button
                className="choice"
                type="button"
                key={value}
                disabled={!heard || playing || choice !== null}
                aria-pressed={choice === value}
                onClick={() => {
                  stop();
                  setChoice(value);
                  if (!review) setAnswers((previous) => [...previous, value]);
                }}
              >
                {earIntervals[value].label}
              </button>
            ))}
          </div>
          {choice !== null && (
            <div className="ear-feedback" role="status">
              <p>
                <strong>
                  {choice === question.semitones
                    ? 'Você reconheceu a distância.'
                    : `Você marcou ${earIntervals[choice].label.toLowerCase()}.`}{' '}
                  O desafio é {earIntervals[question.semitones].label.toLowerCase()}.
                </strong>
              </p>
              <p>{earIntervals[question.semitones].explanation}</p>
              {choice !== question.semitones && (
                <div className="control-row" role="group" aria-label="Comparar os dois intervalos">
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => void listen(choice, question.root)}
                  >
                    Ouvir sua escolha
                  </button>
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => void listen(question.semitones, question.root)}
                  >
                    Ouvir resposta correta
                  </button>
                </div>
              )}
              <button
                type="button"
                className="button"
                onClick={() => {
                  stop();
                  setIndex((previous) => previous + 1);
                  setChoice(null);
                  setHeard(false);
                }}
              >
                {index + 1 === deck.length ? 'Ver resumo' : 'Próxima pergunta'}
              </button>
            </div>
          )}
        </>
      )}
      {finished && (
        <div className="ear-feedback" role="status">
          <h3>{review ? 'Revisão concluída' : 'Sua rodada de escuta'}</h3>
          <p>
            <strong>
              {summary.correct} de {questions.length}
            </strong>{' '}
            na primeira tentativa.{' '}
            {review
              ? 'A revisão manteve esse registro inicial.'
              : 'O resultado descreve esta rodada, não sua habilidade no instrumento.'}
          </p>
          <p>
            {summary.mistakes.length
              ? 'Compare os sons que confundiu e tente reconhecê-los novamente em outro dia.'
              : 'Em outro dia, tente reconhecer essas distâncias antes de ouvir os exemplos.'}
          </p>
          <div className="control-row">
            {summary.mistakes.length > 0 && (
              <button
                className="button secondary"
                type="button"
                onClick={() => {
                  stop();
                  setReview(summary.mistakes);
                  setIndex(0);
                  setChoice(null);
                  setHeard(false);
                }}
              >
                Revisar os intervalos que confundi
              </button>
            )}
            <button className="button" type="button" onClick={start}>
              Nova rodada
            </button>
          </div>
          <p className="hint">
            Leve ao violão: toque uma nota e a mesma nota 12 casas acima na mesma corda. Ouça a
            oitava e explique o que se conserva e o que muda.
          </p>
        </div>
      )}
      <div className="control-row ear-audio-controls">
        <button className="button secondary" type="button" disabled={!playing} onClick={stop}>
          Parar áudio
        </button>
        {questions.length > 0 && !finished && (
          <button className="button secondary" type="button" onClick={() => reset(level)}>
            Encerrar rodada
          </button>
        )}
      </div>
      {audioError && <p role="alert">{audioError}</p>}
    </section>
  );
}
export function TuningReference() {
  const voice = useRef<(() => void) | null>(null);
  useEffect(() => {
    const stop = () => {
      voice.current?.();
      voice.current = null;
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
            onClick={() => {
              voice.current?.();
              voice.current = playTone(frequency([40, 45, 50, 55, 59, 64][i]), 2);
            }}
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
