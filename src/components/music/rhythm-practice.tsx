'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Square } from 'lucide-react';
import { Hint } from '@/components/ui/hint';
import { audioContext, playTone } from './audio';
import { analyzePulseTaps, RHYTHM_TAP_COUNT, type PulseFeedback } from './rhythm-practice-analysis';
import './rhythm-practice.css';

type Phase = 'idle' | 'listening' | 'ready' | 'tapping' | 'result';

export function RhythmPractice() {
  const [bpm, setBpm] = useState(60);
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<PulseFeedback | null>(null);
  const [notice, setNotice] = useState('');
  const phaseRef = useRef<Phase>('idle');
  const taps = useRef<number[]>([]);
  const voices = useRef<(() => void)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generation = useRef(0);
  const changePhase = (next: Phase) => {
    phaseRef.current = next;
    setPhase(next);
  };
  const cancel = useCallback(() => {
    generation.current++;
    voices.current.forEach((stop) => stop());
    voices.current = [];
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
  }, []);
  function reset(message = '') {
    cancel();
    taps.current = [];
    setCount(0);
    setResult(null);
    setNotice(message);
    changePhase('idle');
  }
  useEffect(() => {
    const hidden = () => {
      if (!document.hidden) return;
      cancel();
      phaseRef.current = 'idle';
      setPhase('idle');
      taps.current = [];
      setCount(0);
      setResult(null);
      setNotice('Treino interrompido. Ouça o modelo novamente quando voltar.');
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      cancel();
      document.removeEventListener('visibilitychange', hidden);
    };
  }, [cancel]);

  async function listen() {
    reset();
    changePhase('listening');
    const current = generation.current;
    try {
      const ctx = audioContext();
      await ctx.resume();
      if (current !== generation.current) return;
      const start = ctx.currentTime + 0.08;
      for (let index = 0; index < RHYTHM_TAP_COUNT; index++) {
        voices.current.push(
          playTone(index % 4 === 0 ? 1000 : 700, 0.06, start + (index * 60) / bpm, 0.09),
        );
      }
      // Two complete 4/4 bars. No click or moving marker during the recall attempt.
      timer.current = setTimeout(
        () => {
          timer.current = null;
          voices.current = [];
          changePhase('ready');
        },
        (start - ctx.currentTime + (RHYTHM_TAP_COUNT * 60) / bpm) * 1000,
      );
    } catch {
      reset('Não foi possível iniciar o áudio. Tente ouvir o modelo novamente.');
    }
  }
  function tap() {
    if (phaseRef.current !== 'ready' && phaseRef.current !== 'tapping') return;
    const next = [...taps.current, performance.now()];
    taps.current = next;
    setCount(next.length);
    if (next.length === RHYTHM_TAP_COUNT) {
      setResult(analyzePulseTaps(next, bpm));
      changePhase('result');
    } else changePhase('tapping');
  }
  const accepting = phase === 'ready' || phase === 'tapping';
  const active = phase === 'listening' || accepting;
  return (
    <section className="card rhythm-practice">
      <div className="section-title">
        <div>
          <p className="eyebrow">OUÇA · GUARDE · REPITA</p>
          <h2>O pulso continua com você</h2>
        </div>
        <Hint label="Treinar o pulso de memória">
          Ouvir modelo toca oito pulsos. Depois, dê oito toques no botão, usando toque, clique,
          Espaço ou Enter. O primeiro toque inicia a medição; não é preciso reagir imediatamente.
          Não há microfone nem análise do violão. O resultado considera os intervalos entre seus
          toques e pode variar com o dispositivo. Nada deste exercício é gravado na sua conta.
        </Hint>
      </div>
      <p>
        Ouça dois compassos em 4/4. Guarde o pulso e repita sem o clique. Conte 1, 2, 3, 4 duas
        vezes.
      </p>
      <div className="control-row rhythm-practice-controls">
        <label>
          Andamento do modelo
          <select
            value={bpm}
            onChange={(event) => {
              reset();
              setBpm(Number(event.target.value));
            }}
          >
            {[60, 70, 80, 90, 100].map((value) => (
              <option key={value} value={value}>
                {value} BPM
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="button"
          onClick={() => void listen()}
          disabled={phase === 'listening'}
        >
          <Play size={18} aria-hidden="true" />
          {phase === 'idle' ? 'Ouvir modelo' : 'Ouvir modelo novamente'}
        </button>
        <button
          type="button"
          className="button secondary"
          disabled={!active}
          onClick={() => reset('Treino interrompido. Você pode começar novamente.')}
        >
          <Square size={18} aria-hidden="true" />
          Parar treino
        </button>
      </div>
      <p className="rhythm-practice-state" role="status">
        {phase === 'idle'
          ? notice || 'Comece ouvindo o modelo.'
          : phase === 'listening'
            ? 'Escute os oito pulsos. Depois será sua vez.'
            : phase === 'ready'
              ? 'Sua vez. O primeiro toque começa a tentativa.'
              : phase === 'tapping'
                ? `${count} de ${RHYTHM_TAP_COUNT} toques`
                : 'Tentativa completa. Confira o retorno abaixo.'}
      </p>
      <button
        type="button"
        className="rhythm-tap-pad"
        disabled={!accepting}
        onClick={tap}
        onKeyDown={(event) => {
          if (event.key !== ' ' && event.key !== 'Enter') return;
          event.preventDefault();
          if (!event.repeat) tap();
        }}
        aria-label="Marcar pulso"
      >
        <strong>
          {accepting
            ? 'Toque o pulso'
            : phase === 'result'
              ? 'Oito toques completos'
              : 'Sua vez após o modelo'}
        </strong>
        <span aria-hidden="true">
          {count} / {RHYTHM_TAP_COUNT}
        </span>
      </button>
      {phase === 'result' && (
        <div
          className="rhythm-practice-feedback"
          role="region"
          aria-label="Resultado do treino rítmico"
        >
          {result ? (
            <>
              <h3>
                {result.interrupted
                  ? 'Vamos fazer outra tentativa'
                  : result.regular
                    ? 'Seus toques ficaram regulares'
                    : 'Os intervalos variaram'}
              </h3>
              <p>
                {result.interrupted
                  ? 'Houve um intervalo muito curto ou uma pausa longa. Ouça novamente e faça os oito toques seguidos.'
                  : result.regular
                    ? 'Você manteve distâncias parecidas entre os toques. Agora compare a velocidade com o modelo.'
                    : 'Conte em voz alta e procure manter a mesma distância entre um toque e outro. Experimente de novo antes de acelerar.'}
              </p>
              {!result.interrupted && (
                <>
                  <div className="rhythm-practice-metrics">
                    <p>
                      <span>Modelo</span>
                      <strong>{bpm} BPM</strong>
                    </p>
                    <p>
                      <span>Seus toques, em média</span>
                      <strong>{Math.round(result.averageBpm)} BPM</strong>
                    </p>
                  </div>
                  <p>
                    {result.tempo === 'faster'
                      ? 'Sua média ficou mais rápida que o modelo. Deixe mais espaço entre os toques.'
                      : result.tempo === 'slower'
                        ? 'Sua média ficou mais lenta que o modelo. Experimente aproximar um pouco os toques.'
                        : 'Sua média ficou próxima do modelo. Repita em outro momento para conferir se o pulso permanece.'}
                  </p>
                </>
              )}
              <Hint label="Entender o retorno do ritmo">
                Comparamos sete intervalos entre oito toques. “Próxima” usa uma margem de 10% na
                duração média; “regulares” indica variação relativa de até 12%. São referências
                práticas do exercício, não notas, certificações ou limites validados de habilidade.
                Um resultado regular pode estar mais rápido ou mais lento que o modelo.
              </Hint>
            </>
          ) : (
            <p>Não foi possível comparar os intervalos. Faça uma nova tentativa.</p>
          )}
          <button
            type="button"
            className="button secondary"
            onClick={() => {
              cancel();
              taps.current = [];
              setCount(0);
              setResult(null);
              changePhase('ready');
            }}
          >
            <RotateCcw size={17} aria-hidden="true" />
            Tentar de memória novamente
          </button>
          <p>
            <strong>Leve ao violão:</strong> toque um acorde por pulso durante dois compassos.
            Depois, peça ao professor para observar a regularidade das trocas.
          </p>
        </div>
      )}
    </section>
  );
}
