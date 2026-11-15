'use client';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Play, Pause, Square, Metronome, Minus, Plus } from 'lucide-react';
import type { ChartBar, SongVersion } from '@/content/types';
import { chords } from '@/content/chords';
import { soundChord, audioContext, playTone } from './audio';
import { ChartTransport, idlePosition, type LoopRange } from './chart-transport';
import { buildChartGroups, type ChartGroup } from './chart-layout';
import { ChartSection } from './chart-section';
import {
  defaultPlaybackBpm,
  formatBpm,
  referenceBpm,
  tempoUnitLabel,
  type TempoResearch,
} from '@/content/tempo';
import { TempoReference } from './tempo-reference';
import { Hint } from '@/components/ui/hint';
import { chartLyricsKey, projectLyricCues, totalChartBeats } from './chart-lyrics';
import { useChartLyrics } from './chart-lyrics-storage';
import { ChartPlaybackReadout } from './chart-playback-readout';
import { createLyricsClock } from './chart-lyrics-clock';
import type { LessonLyrics } from '@/content/song-lyrics-types';
import type { LyricCue } from './chart-lyrics';
import { withLyricSyllables } from './lyric-syllables';

const noLyrics: LyricCue[] = [];

function previewFirstChord(bar: ChartBar) {
  const chord = chords[bar.events[0]?.chord];
  if (chord) soundChord(chord.frets);
}

export function ChartPlayer({
  chart,
  initialBpm,
  tempo,
  songId,
  lyricsContent,
}: {
  chart: SongVersion;
  initialBpm: number;
  tempo?: TempoResearch;
  songId: string;
  lyricsContent?: LessonLyrics;
}) {
  const defaultBpm = defaultPlaybackBpm(initialBpm, tempo);
  const researchedBpm = tempo ? referenceBpm(tempo) : null;
  const [section, setSection] = useState('all');
  const [bpm, setBpm] = useState(defaultBpm);
  const [showLyrics, setShowLyrics] = useState(true);
  const [metronome, setMetronome] = useState(false);
  const [repeatGroup, setRepeatGroup] = useState<string | null>(null);
  const [playhead, setPlayhead] = useState(idlePosition);
  const [barsPerRow, setBarsPerRow] = useState(4);
  const arrangement = useRef<HTMLDivElement>(null);
  const tempoId = useId();
  const transport = useRef<ChartTransport | null>(null);
  const settings = useRef({ metronome: false, range: null as LoopRange | null });
  const pendingStart = useRef<number | null>(null);
  const playing = playhead.status === 'playing';
  const groups = useMemo(() => buildChartGroups(chart, section), [chart, section]);
  const bars = useMemo(() => groups.flatMap((group) => group.bars.map(({ bar }) => bar)), [groups]);
  const fullBars = useMemo(
    () => buildChartGroups(chart).flatMap((group) => group.bars.map(({ bar }) => bar)),
    [chart],
  );
  const totalBeats = totalChartBeats(fullBars);
  const storageKey = useMemo(() => chartLyricsKey(chart, songId), [chart, songId]);
  const lyrics = useChartLyrics(storageKey, totalBeats, lyricsContent?.cues ?? noLyrics);
  const syllabicLyrics = useMemo(() => withLyricSyllables(lyrics.cues), [lyrics.cues]);
  const projectedLyrics = useMemo(
    () => projectLyricCues(chart, groups, syllabicLyrics),
    [chart, groups, syllabicLyrics],
  );
  const readPosition = useCallback(() => transport.current?.snapshot() ?? null, []);
  const lyricsClock = useMemo(
    () => createLyricsClock(projectedLyrics, bpm),
    [projectedLyrics, bpm],
  );
  const referenceGroups = useMemo(
    () => chart.sections.flatMap((part) => buildChartGroups(chart, part.id)),
    [chart],
  );
  const stopPlayback = useCallback(() => {
    pendingStart.current = null;
    lyricsClock.reset();
    transport.current?.stop();
  }, [lyricsClock]);
  const startAt = useCallback(
    (bar: number) => {
      const range = settings.current.range;
      if (range && (bar < range.startBar || bar >= range.endBar)) {
        settings.current.range = null;
        setRepeatGroup(null);
        transport.current?.setLoopRange(null);
      }
      lyricsClock.reset();
      void audioContext().resume();
      transport.current?.play(bar);
    },
    [lyricsClock],
  );
  function clearPassageRepeat() {
    settings.current.range = null;
    setRepeatGroup(null);
    transport.current?.setLoopRange(null);
  }
  function startReference(_bar: number, sectionId: string) {
    void audioContext().resume();
    const currentGroup = groups.find((group) => group.sectionId === sectionId);
    if (currentGroup) startAt(currentGroup.bars[0].playbackIndex);
    else {
      stopPlayback();
      clearPassageRepeat();
      pendingStart.current = 0;
      setSection(sectionId);
    }
  }
  const toggleGroupRepeat = useCallback(
    (group: ChartGroup, enabled: boolean) => {
      if (!enabled) {
        settings.current.range = null;
        setRepeatGroup(null);
        transport.current?.setLoopRange(null);
        return;
      }
      const active =
        groups.find((part) => part.key === group.key) ??
        groups.find((part) => part.sectionId === group.sectionId);
      if (active) {
        const range = {
          startBar: active.bars[0].playbackIndex,
          endBar: active.bars.at(-1)!.playbackIndex + 1,
        };
        settings.current.range = range;
        setRepeatGroup(active.key);
        transport.current?.setLoopRange(range);
      } else {
        stopPlayback();
        settings.current.range = { startBar: 0, endBar: group.bars.length };
        setRepeatGroup(`selected-${group.sectionId}`);
        if (playing) pendingStart.current = 0;
        setSection(group.sectionId);
      }
    },
    [groups, playing, stopPlayback],
  );
  function changeBpm(value: number) {
    stopPlayback();
    setBpm(Math.min(180, Math.max(30, value)));
  }
  function togglePlayback() {
    if (playing) transport.current?.pause();
    else {
      if (playhead.status === 'idle') lyricsClock.reset();
      void audioContext().resume();
      transport.current?.play();
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
          chords[name] ? soundChord(chords[name].frets, duration, at) : () => {},
        click: (frequency, volume, at) => playTone(frequency, 0.045, at, volume),
      },
      setPlayhead,
    );
    transport.current = player;
    player.setLoopRange(settings.current.range);
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
  useEffect(
    () => lyricsClock.follow(playing, readPosition),
    [playing, playhead.status, lyricsClock, readPosition],
  );
  useEffect(() => {
    const element = arrangement.current?.parentElement;
    if (!element) return;
    // Match the chart's container breakpoints so phrases stay beside their bars on phones.
    const observer = new ResizeObserver(([entry]) => {
      const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      setBarsPerRow(
        entry.contentRect.width >= 56 * rem ? 4 : entry.contentRect.width >= 30 * rem ? 2 : 1,
      );
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <CollapsibleCard className="chart-player" id="tocar" title="Cifra de acompanhamento">
      <div className="section-title">
        <div className="label-with-hint">
          <p className="eyebrow">TOQUE JUNTO</p>
          <Hint label="Controles da cifra">
            <p>
              Pausar guarda o ponto dentro do compasso; Continuar retoma dali. Parar volta ao
              início.
            </p>
            <p>
              Metrônomo e repetição podem mudar enquanto os acordes tocam. Ajustar o andamento ou o
              seletor de trecho volta ao início.
            </p>
            <p>O áudio é sintético. Toque em um compasso para ouvir seu primeiro acorde.</p>
          </Hint>
        </div>
        <span className="badge">
          {chart.key} · {chart.meter}
        </span>
      </div>
      <p>{chart.adaptations}</p>
      <div className="player-controls">
        <label className="chart-section-control">
          Trecho
          <select
            value={section}
            onChange={(e) => {
              stopPlayback();
              clearPassageRepeat();
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
        <div className="chart-tempo-control">
          <label htmlFor={tempoId}>Andamento · {formatBpm(bpm)} BPM</label>
          <small className="muted">
            por {tempoUnitLabel(chart.meter === '6/8' ? 'dotted-quarter' : 'quarter')}
          </small>
          <div className="chart-tempo-adjust">
            <button
              type="button"
              className="button secondary icon"
              aria-label="Diminuir andamento em 1 BPM"
              disabled={bpm <= 30}
              onClick={() => changeBpm(bpm - 1)}
            >
              <Minus size={18} aria-hidden="true" />
            </button>
            <input
              id={tempoId}
              aria-label="Andamento da cifra"
              type="range"
              min="30"
              max="180"
              step="any"
              aria-valuetext={`${formatBpm(bpm)} BPM`}
              value={bpm}
              onChange={(e) => {
                changeBpm(Number(e.target.value));
              }}
            />
            <button
              type="button"
              className="button secondary icon"
              aria-label="Aumentar andamento em 1 BPM"
              disabled={bpm >= 180}
              onClick={() => changeBpm(bpm + 1)}
            >
              <Plus size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={showLyrics}
            onChange={(event) => setShowLyrics(event.target.checked)}
          />
          Mostrar letra
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
        <div className="chart-transport-actions">
          <button className="button" onClick={togglePlayback}>
            {playing ? (
              <Pause size={16} aria-hidden="true" />
            ) : (
              <Play size={16} aria-hidden="true" />
            )}{' '}
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
      </div>
      <p className="hint" role="status">
        {playhead.status === 'paused' ? 'Pausado' : playing ? 'Reproduzindo.' : 'Pronto para tocar'}
        {repeatGroup &&
          ` · Repetição: ${groups.find((group) => group.key === repeatGroup)?.title ?? 'trecho selecionado'}`}
      </p>
      <ChartPlaybackReadout
        status={playhead.status}
        readPosition={readPosition}
        duration={(totalChartBeats(bars) * 60) / bpm}
        bars={bars.length}
      />
      {tempo && researchedBpm !== null && (
        <div className="chart-tempo">
          <div className="control-row">
            <button
              type="button"
              className="button small secondary"
              aria-pressed={bpm === researchedBpm}
              onClick={() => changeBpm(researchedBpm)}
            >
              Usar referência · {formatBpm(researchedBpm)} BPM
            </button>
            <TempoReference tempo={tempo} />
          </div>
        </div>
      )}
      <p className="hint">
        {chart.counting ??
          'Cada bloco é um compasso; o número abaixo do acorde indica sua duração em pulsos.'}{' '}
        {chart.meter === '6/8'
          ? 'Neste arranjo, cada pulso é uma semínima pontuada (três colcheias).'
          : ''}{' '}
      </p>
      <div className="chart-reading-guide label-with-hint">
        <h3>{section === 'all' ? 'Arranjo completo' : 'Trecho selecionado'}</h3>
        <Hint label="Leitura e repetição dos trechos">
          <p>
            Leia da esquerda para a direita. Cada cartão mantém um compasso inteiro; a grade se
            adapta à largura da tela.
          </p>
          <p>
            Marque Repetir em uma passagem para praticá-la em ciclo. Se ela ainda estiver à frente,
            a música continua até chegar ali; use Tocar daqui para ir direto a ela. Sem reprodução
            em andamento, Ouvir acordes começa no trecho marcado.
          </p>
          <p>Uma passagem repete por vez. Desmarque para continuar aos próximos trechos.</p>
        </Hint>
      </div>
      <div
        className="chart-arrangement"
        ref={arrangement}
        role="region"
        aria-label={section === 'all' ? 'Arranjo completo por trechos' : 'Trecho para praticar'}
      >
        {groups.map((group, index) => (
          <ChartSection
            key={group.key}
            group={group}
            chart={chart}
            bpm={bpm}
            maxBars={barsPerRow}
            lyrics={projectedLyrics}
            lyricsClock={showLyrics ? lyricsClock : undefined}
            position={playhead.bar}
            activeTick={
              metronome && group.bars.some((bar) => bar.playbackIndex === playhead.bar)
                ? playhead.tick
                : -1
            }
            sequence={section === 'all' ? index + 1 : undefined}
            onPreview={previewFirstChord}
            onStart={startAt}
            repeating={repeatGroup === group.key}
            onRepeat={toggleGroupRepeat}
            paused={playhead.status === 'paused'}
          />
        ))}
      </div>
      {showLyrics && lyricsContent && (
        <details className="section chart-full-lyrics">
          <summary>Letra completa fornecida</summary>
          <p className="hint">
            Texto integral, incluindo repetições e falas que podem não fazer parte do arranjo
            abreviado desta aula.
          </p>
          <div className="chart-provided-lyrics">
            {lyricsContent.providedLines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </details>
      )}
      <details className="section chart-reference">
        <summary>Mapa dos trechos e compassos</summary>
        <Hint label="Mapa de referências">
          Cada trecho aparece uma vez. As referências da aula levam ao compasso correspondente; os
          controles iniciam ou repetem a primeira passagem disponível.
        </Hint>
        <div className="chart-arrangement">
          {referenceGroups.map((group) => (
            <ChartSection
              key={group.sectionId}
              group={group}
              chart={chart}
              bpm={bpm}
              maxBars={barsPerRow}
              reference
              onStart={startReference}
              repeating={groups.some(
                (part) => part.key === repeatGroup && part.sectionId === group.sectionId,
              )}
              onRepeat={toggleGroupRepeat}
            />
          ))}
        </div>
      </details>
    </CollapsibleCard>
  );
}
