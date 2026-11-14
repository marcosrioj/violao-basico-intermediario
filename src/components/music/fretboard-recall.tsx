'use client';

import { useEffect, useRef, useState } from 'react';
import { Hint } from '@/components/ui/hint';
import { frequency, playTone } from './audio';
import { fretboardQuestions, pitchName, positionMidi } from './fretboard-recall-model';

export function FretboardRecall() {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [correct, setCorrect] = useState(0);
  const voice = useRef<(() => void) | null>(null);
  useEffect(() => {
    const stop = () => {
      voice.current?.();
      voice.current = null;
    };
    const hidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);
  const question = fretboardQuestions[index];
  function advance() {
    voice.current?.();
    setIndex(index + 1);
    setPicked(null);
    setAttempted(false);
    setRevealed(false);
  }
  if (!question)
    return (
      <section className="card lab-workshop">
        <p className="eyebrow">LEVE PARA O INSTRUMENTO</p>
        <h2>Seis posições praticadas</h2>
        <p>
          {correct} de 6 encontradas na primeira tentativa, sem revelar. Esse resultado descreve
          esta rodada.
        </p>
        <p>
          Agora encontre D na 2ª corda e G na 1ª corda do seu violão sem olhar o mapa. Volte em
          outro dia e confira o que lembra.
        </p>
        <button
          className="button"
          onClick={() => {
            setIndex(0);
            setCorrect(0);
          }}
        >
          Praticar novamente
        </button>
      </section>
    );
  const solved = revealed || picked === question.fret;
  const open = pitchName(positionMidi(question.string, 0));
  return (
    <section className="card lab-workshop">
      <div className="section-title">
        <div>
          <p className="eyebrow">LOCALIZAR · {index + 1} DE 6</p>
          <h2>
            Encontre {question.note} na {question.string}ª corda
          </h2>
        </div>
        <Hint label="Praticar notas sem o mapa">
          Escolha uma casa antes de revelar. Cada botão toca a posição escolhida. Você pode tentar
          outra vez; o resumo conta apenas a primeira tentativa sem ajuda. A rodada fica nesta
          oficina e recomeça ao sair.
        </Hint>
      </div>
      <p>
        A corda solta é {open}. Cada casa sobe um semitom. Entre E–F e B–C há apenas um semitom.
      </p>
      <div
        className="lab-fret-choices"
        role="group"
        aria-label={`Casas da ${question.string}ª corda`}
      >
        {Array.from({ length: 6 }, (_, fret) => (
          <button
            type="button"
            className="choice"
            key={fret}
            aria-pressed={picked === fret}
            disabled={solved}
            onClick={() => {
              voice.current?.();
              voice.current = playTone(frequency(positionMidi(question.string, fret)), 0.7);
              setPicked(fret);
              if (!attempted && fret === question.fret) setCorrect(correct + 1);
              setAttempted(true);
            }}
          >
            {fret === 0 ? 'Solta' : `Casa ${fret}`}
          </button>
        ))}
      </div>
      <div role="status" className="lab-feedback">
        {solved ? (
          <p>
            {revealed ? 'Posição revelada' : 'Você encontrou'}: {question.note}, {question.string}ª
            corda, casa {question.fret}. Partindo de {open}, avance {question.fret} semitons.
          </p>
        ) : picked !== null ? (
          <p>
            Essa posição é {pitchName(positionMidi(question.string, picked))}. Conte as casas a
            partir da corda solta e tente novamente.
          </p>
        ) : (
          <p>Escolha uma posição para conferir pelo som.</p>
        )}
      </div>
      <div className="control-row">
        {!solved && (
          <button
            className="button secondary"
            onClick={() => {
              setRevealed(true);
              setAttempted(true);
            }}
          >
            Revelar posição
          </button>
        )}
        {solved && (
          <button
            className="button secondary"
            onClick={() => {
              voice.current?.();
              voice.current = playTone(
                frequency(positionMidi(question.string, question.fret)),
                0.7,
              );
            }}
          >
            Ouvir {question.note}
          </button>
        )}
        <button className="button" disabled={!solved} onClick={advance}>
          {index === 5 ? 'Ver resumo' : 'Próxima posição'}
        </button>
      </div>
    </section>
  );
}
