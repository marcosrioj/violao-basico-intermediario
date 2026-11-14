'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, Square, Repeat2, Metronome } from 'lucide-react';
import type { ChartBar, SongVersion } from '@/content/types';
import { chords } from '@/content/chords';
import { soundChord, audioContext, playTone } from './audio';
import { ChartTransport, idlePosition } from './chart-transport';
import { buildChartGroups } from './chart-layout';
import { ChartSection } from './chart-section';
import { formatBpm, referenceBpm, tempoUnitLabel, type TempoResearch } from '@/content/tempo';
import { TempoReference } from './tempo-reference';

function previewFirstChord(bar: ChartBar) {
  const chord = chords[bar.events[0]?.chord];
  if (chord) soundChord(chord.frets);
}

export function ChartPlayer({
  chart,
  initialBpm,
  tempo,
}: {
  chart: SongVersion;
  initialBpm: number;
  tempo?: TempoResearch;
}) {
  const [section, setSection] = useState('all');
  const [bpm, setBpm] = useState(initialBpm);
  const [loop, setLoop] = useState(false);
  const [metronome, setMetronome] = useState(false);
  const [playhead, setPlayhead] = useState(idlePosition);
  const transport = useRef<ChartTransport | null>(null);
  const settings = useRef({ loop: false, metronome: false });
  const pendingStart = useRef<number | null>(null);
  const playing = playhead.status === 'playing';
  const researchedBpm = tempo ? referenceBpm(tempo) : null;
  const groups = useMemo(() => buildChartGroups(chart, section), [chart, section]);
  const bars = useMemo(() => groups.flatMap((group) => group.bars.map(({ bar }) => bar)), [groups]);
  const referenceGroups = useMemo(
    () => chart.sections.flatMap((part) => buildChartGroups(chart, part.id)),
    [chart],
  );
  function stopPlayback() {
    pendingStart.current = null;
    transport.current?.stop();
  }
  const startAt = useCallback((bar: number) => {
    void audioContext().resume();
    transport.current?.play(bar);
  }, []);
  function startReference(_bar: number, sectionId: string) {
    void audioContext().resume();
    const currentGroup = groups.find((group) => group.sectionId === sectionId);
    if (currentGroup) startAt(currentGroup.bars[0].playbackIndex);
    else {
      stopPlayback();
      pendingStart.current = 0;
      setSection(sectionId);
    }
  }
  useEffect(() => {
    const player = new ChartTransport(
      bars,
      chart,
      bpm,
      {
        now: () => audioContext().currentTime,
        chord: (name, duration, at) =>
          chords[name] ? soundChord(chords[name].frets, Math.max(0.04, duration), at) : () => {},
        click: (frequency, volume, at) => playTone(frequency, 0.045, at, volume),
      },
      setPlayhead,
    );
    transport.current = player;
    player.setLoop(settings.current.loop);
    player.setMetronome(settings.current.metronome);
    if (pendingStart.current !== null) {
      const from = pendingStart.current;
      pendingStart.current = null;
      void audioContext().resume();
      player.play(from);
    }
    const pauseHidden = () => {
      if (document.hidden) player.pause();
    };
    document.addEventListener('visibilitychange', pauseHidden);
    return () => {
      player.dispose();
      document.removeEventListener('visibilitychange', pauseHidden);
      transport.current = null;
    };
  }, [bars, chart, bpm]);
  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => transport.current?.tick(), 25);
    return () => clearInterval(timer);
  }, [playing]);
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
              stopPlayback();
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
          Andamento · {formatBpm(bpm)} BPM
          <span className="hint">
            {' '}
            por {tempoUnitLabel(chart.meter === '6/8' ? 'dotted-quarter' : 'quarter')}
          </span>
          <input
            aria-label="Andamento da cifra"
            type="range"
            min="30"
            max="180"
            step="any"
            aria-valuetext={`${formatBpm(bpm)} BPM`}
            value={bpm}
            onChange={(e) => {
              stopPlayback();
              setBpm(Number(e.target.value));
            }}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={loop}
            onChange={(e) => {
              settings.current.loop = e.target.checked;
              transport.current?.setLoop(e.target.checked);
              setLoop(e.target.checked);
            }}
          />
          <Repeat2 size={16} aria-hidden="true" />
          Repetir
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={metronome}
            onChange={(e) => {
              settings.current.metronome = e.target.checked;
              transport.current?.setMetronome(e.target.checked);
              setMetronome(e.target.checked);
            }}
          />
          <Metronome size={16} aria-hidden="true" />
          Metrônomo
        </label>
        <button
          className="button"
          onClick={() => {
            if (playing) transport.current?.pause();
            else {
              void audioContext().resume();
              transport.current?.play();
            }
          }}
        >
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}{' '}
          {playing ? 'Pausar' : playhead.status === 'paused' ? 'Continuar' : 'Ouvir acordes'}
        </button>
        <button
          className="button secondary"
          disabled={playhead.status === 'idle'}
          onClick={stopPlayback}
        >
          <Square size={16} aria-hidden="true" /> Parar
        </button>
      </div>
      <p className="hint" role="status">
        {playhead.status === 'paused'
          ? 'Pausado. Continue do ponto em que parou.'
          : playing
            ? 'Reproduzindo.'
            : 'Pronto para tocar.'}
      </p>
      {tempo && (
        <div className="chart-tempo">
          <div className="control-row" role="group" aria-label="Escolher andamento">
            <button
              type="button"
              className="button small secondary"
              aria-pressed={bpm === initialBpm}
              onClick={() => {
                stopPlayback();
                setBpm(initialBpm);
              }}
            >
              Estudo da aula · {formatBpm(initialBpm)} BPM
            </button>
            {researchedBpm !== null && (
              <button
                type="button"
                className="button small secondary"
                aria-pressed={bpm === researchedBpm}
                onClick={() => {
                  stopPlayback();
                  setBpm(researchedBpm);
                }}
              >
                Usar {tempo.status === 'estimated' ? 'estimativa' : 'referência'} ·{' '}
                {formatBpm(researchedBpm)} BPM
              </button>
            )}
          </div>
          <TempoReference tempo={tempo} />
        </div>
      )}
      <p className="hint">
        Ative ou desative Repetir e Metrônomo enquanto toca, sem interromper os acordes. Pausar
        guarda sua posição; Continuar retoma dali. O primeiro tempo do metrônomo tem um acento mais
        forte.
      </p>
      <p className="hint">
        {chart.counting ??
          'Cada bloco é um compasso; o número abaixo do acorde indica sua duração em pulsos.'}{' '}
        {chart.meter === '6/8'
          ? 'Neste arranjo, cada pulso é uma semínima pontuada (três colcheias).'
          : ''}{' '}
        Áudio sintético para referência harmônica.
      </p>
      <p className="hint chart-reading-guide">
        Leia cada trecho da esquerda para a direita. Cada cartão mantém um compasso inteiro; a
        contagem abaixo mostra os pulsos e suas subdivisões. As linhas agrupam até quatro compassos
        e se dividem em duas ou uma coluna quando há menos espaço. Mudanças de compasso começam uma
        nova linha.
      </p>
      <div
        className="chart-arrangement"
        role="region"
        aria-label={section === 'all' ? 'Arranjo completo por trechos' : 'Trecho para praticar'}
      >
        {groups.map((group, index) => (
          <ChartSection
            key={group.key}
            group={group}
            chart={chart}
            position={playhead.bar}
            activeTick={
              metronome && group.bars.some((bar) => bar.playbackIndex === playhead.bar)
                ? playhead.tick
                : -1
            }
            sequence={section === 'all' ? index + 1 : undefined}
            onPreview={previewFirstChord}
            onStart={startAt}
            paused={playhead.status === 'paused'}
          />
        ))}
      </div>
      <details className="section chart-reference">
        <summary>Mapa dos trechos e compassos</summary>
        <p className="hint">
          Cada trecho aparece uma vez neste mapa. As referências da aula levam ao compasso
          correspondente.
        </p>
        <div className="chart-arrangement">
          {referenceGroups.map((group) => (
            <ChartSection
              key={group.sectionId}
              group={group}
              chart={chart}
              reference
              onStart={startReference}
            />
          ))}
        </div>
      </details>
    </section>
  );
}
