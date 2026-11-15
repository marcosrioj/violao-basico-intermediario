'use client';
import { useEffect, useRef, useState } from 'react';
import { Play, Square } from 'lucide-react';
import { audioContext, playTone } from './audio';
import { Hint } from '@/components/ui/hint';
export function Metronome({
  initialMeter = '4/4',
}: {
  initialMeter?: '2/4' | '3/4' | '4/4' | '6/8';
}) {
  const [bpm, setBpm] = useState(60);
  const [meter, setMeter] = useState<string>(initialMeter);
  const [running, setRunning] = useState(false);
  const [beat, setBeat] = useState(-1);
  const tick = useRef(0);
  const compound = meter === '6/8';
  const pulses = compound ? 2 : Number(meter[0]);
  const subdivisions = compound ? 3 : 1;
  useEffect(() => {
    if (!running) return;
    const ctx = audioContext();
    let next = ctx.currentTime + 0.1;
    tick.current = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const voices: (() => void)[] = [];
    const interval = setInterval(() => {
      while (next < ctx.currentTime + 0.1) {
        const count = Math.floor(tick.current / subdivisions) % pulses;
        const strong = tick.current % subdivisions === 0;
        voices.push(
          playTone(strong ? (count === 0 ? 1200 : 800) : 550, 0.045, next, strong ? 0.12 : 0.035),
        );
        if (strong)
          timers.push(
            setTimeout(() => setBeat(count), Math.max(0, (next - ctx.currentTime) * 1000)),
          );
        next += 60 / bpm / subdivisions;
        tick.current++;
      }
    }, 25);
    const pause = () => {
      if (document.hidden) setRunning(false);
    };
    document.addEventListener('visibilitychange', pause);
    return () => {
      clearInterval(interval);
      timers.forEach(clearTimeout);
      voices.forEach((stop) => stop());
      document.removeEventListener('visibilitychange', pause);
    };
  }, [running, bpm, pulses, subdivisions]);
  return (
    <section className="card instrument">
      <div className="section-title">
        <div>
          <p className="eyebrow">PULSO CONSTANTE</p>
          <h2>Metrônomo</h2>
        </div>
        <Hint label="Ajustar o metrônomo">
          Ajuste o andamento pela barra ou pelas setas do teclado. Escolha o compasso e use
          Iniciar/Parar para controlar o clique. Ao sair desta aba, o som é interrompido.
        </Hint>
      </div>
      <div className="bpm-readout">
        {bpm}
        <span>BPM</span>
      </div>
      <label htmlFor="metronome-bpm">Andamento do metrônomo</label>
      <input
        id="metronome-bpm"
        type="range"
        min="30"
        max="180"
        value={bpm}
        aria-valuetext={`${bpm} BPM por ${compound ? 'semínima pontuada' : 'semínima'}`}
        onChange={(e) => setBpm(Number(e.target.value))}
      />
      <div className="beats" aria-label={`Pulso ${running ? beat + 1 : 0} de ${pulses}`}>
        {Array.from({ length: pulses }, (_, i) => (
          <span key={i} className={running && beat === i ? 'beat lit' : 'beat'}>
            {i + 1}
          </span>
        ))}
      </div>
      <div className="control-row metronome-controls">
        <label>
          Compasso
          <select value={meter} onChange={(e) => setMeter(e.target.value)}>
            <option value="4/4">4/4 · 4 pulsos</option>
            <option value="3/4">3/4 · 3 pulsos</option>
            <option value="2/4">2/4 · 2 pulsos</option>
            <option value="6/8">6/8 · 2 pulsos</option>
          </select>
        </label>
        <button
          type="button"
          className="button"
          onClick={() => {
            void audioContext().resume();
            setRunning(!running);
          }}
        >
          {running ? (
            <Square size={16} aria-hidden="true" />
          ) : (
            <Play size={16} aria-hidden="true" />
          )}{' '}
          {running ? 'Parar' : 'Iniciar'}
        </button>
      </div>
      <p className="hint">
        {compound
          ? 'Conte 1 la li, 2 la li. O BPM corresponde à semínima pontuada; cada pulso tem três colcheias.'
          : 'Conte em voz alta antes de tocar.'}{' '}
        Aumente o andamento quando conseguir manter o som limpo e o pulso estável.
      </p>
    </section>
  );
}
