'use client';
import { useEffect, useMemo, useState } from 'react';
import { Play, Square, Repeat2 } from 'lucide-react';
import type { SongVersion } from '@/content/types';
import { chords } from '@/content/course';
import { soundChord, audioContext } from './audio';
export function ChartPlayer({ chart, initialBpm }: { chart: SongVersion; initialBpm: number }) {
  const [section, setSection] = useState('all');
  const [bpm, setBpm] = useState(initialBpm);
  const [loop, setLoop] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(-1);
  const bars = useMemo(() => {
    if (section !== 'all')
      return (
        chart.sections
          .find((s) => s.id === section)
          ?.bars.map((bar, i) => ({ ...bar, label: section, number: i + 1 })) ?? []
      );
    return chart.order.flatMap((part) =>
      Array.from(
        { length: part.repeat },
        () =>
          chart.sections
            .find((s) => s.id === part.section)
            ?.bars.map((bar, i) => ({ ...bar, label: part.section, number: i + 1 })) ?? [],
      ).flat(),
    );
  }, [chart, section]);
  useEffect(() => {
    if (!playing) return;
    let stopped = false;
    let timeout: ReturnType<typeof setTimeout>;
    let index = 0;
    const pending: ReturnType<typeof setTimeout>[] = [];
    const voices: (() => void)[] = [];
    function advance() {
      if (stopped) return;
      if (index >= bars.length) {
        if (!loop) {
          setPlaying(false);
          setPosition(-1);
          return;
        }
        index = 0;
      }
      const bar = bars[index];
      setPosition(index);
      let offset = 0;
      const beatMs = 60000 / bpm;
      bar.events.forEach((event) => {
        const delay = offset * beatMs;
        pending.push(
          setTimeout(() => {
            if (!stopped && chords[event.chord])
              voices.push(
                soundChord(chords[event.chord].frets, Math.min((event.beats * beatMs) / 1000, 2)),
              );
          }, delay),
        );
        offset += event.beats;
      });
      index++;
      timeout = setTimeout(advance, offset * beatMs);
    }
    advance();
    const stopHidden = () => {
      if (document.hidden) setPlaying(false);
    };
    document.addEventListener('visibilitychange', stopHidden);
    return () => {
      stopped = true;
      clearTimeout(timeout);
      pending.forEach(clearTimeout);
      voices.forEach((stop) => stop());
      document.removeEventListener('visibilitychange', stopHidden);
    };
  }, [playing, bars, bpm, loop]);
  return (
    <section className="card chart-player">
      <div className="section-title">
        <div>
          <p className="eyebrow">TOQUE JUNTO</p>
          <h2>Cifra de acompanhamento</h2>
        </div>
        <span className="badge">
          {chart.key} · {chart.meter}
        </span>
      </div>
      <p>{chart.adaptations}</p>
      <div className="player-controls">
        <label>
          Trecho
          <select
            value={section}
            onChange={(e) => {
              setPlaying(false);
              setPosition(-1);
              setSection(e.target.value);
            }}
          >
            <option value="all">Arranjo completo</option>
            {chart.sections.map((s) => (
              <option value={s.id} key={s.id}>
                {s.title}
              </option>
            ))}
          </select>
        </label>
        <label>
          Andamento · {bpm} BPM
          <input
            aria-label="Andamento da cifra"
            type="range"
            min="30"
            max="180"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
          />
        </label>
        <label className="checkbox-label">
          <input type="checkbox" checked={loop} onChange={(e) => setLoop(e.target.checked)} />
          <Repeat2 size={16} />
          Repetir
        </label>
        <button
          className="button"
          onClick={() => {
            void audioContext().resume();
            setPlaying(!playing);
          }}
        >
          {playing ? <Square size={16} /> : <Play size={16} />}{' '}
          {playing ? 'Parar' : 'Ouvir acordes'}
        </button>
      </div>
      <p className="hint">
        {chart.counting ??
          'Cada bloco é um compasso; o número abaixo do acorde indica sua duração em pulsos.'}{' '}
        {chart.meter === '6/8'
          ? 'Neste arranjo, cada pulso é uma semínima pontuada (três colcheias).'
          : ''}{' '}
        Áudio sintético para referência harmônica.
      </p>
      <div className="chart-bars">
        {bars.map((bar, i) => (
          <button
            aria-label={`Compasso ${i + 1}: ${bar.events.map((e) => `${e.chord}, ${e.beats} pulsos`).join('; ')}`}
            className={position === i ? 'chart-bar current' : 'chart-bar'}
            key={`${bar.label}-${i}`}
            onClick={() => {
              const chord = chords[bar.events[0]?.chord];
              if (chord) soundChord(chord.frets);
            }}
          >
            <small>
              {bar.label} · {bar.number}
              {bar.meter ? ` · ${bar.meter}` : ''}
            </small>
            <div>
              {bar.events.map((e, j) => (
                <span key={j}>
                  <strong>{e.chord}</strong>
                  <em>
                    {e.beats} {e.beats === 1 ? 'pulso' : 'pulsos'}
                  </em>
                </span>
              ))}
            </div>
          </button>
        ))}
      </div>
      <details className="section">
        <summary>Mapa dos trechos e compassos</summary>
        {chart.sections.map((s) => (
          <section key={s.id} id={`section-${s.id}`}>
            <h3>
              {s.title} · {s.id}
            </h3>
            <div className="chart-bars">
              {s.bars.map((bar, i) => (
                <div className="chart-bar" id={`bar-${s.id}-${i}`} key={i}>
                  <small>
                    {s.id}
                    {/\d$/.test(s.id) ? '.' : ''}
                    {i + 1}
                  </small>
                  <div>
                    {bar.events.map((event, j) => (
                      <span key={j}>
                        <strong>{event.chord}</strong>
                        <em>{event.beats} pulsos</em>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </details>
    </section>
  );
}
