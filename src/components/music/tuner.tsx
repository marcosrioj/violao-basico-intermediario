'use client';

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  AudioLines,
  Check,
  CircleHelp,
  Mic,
  MicOff,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Square,
  Volume2,
} from 'lucide-react';
import Link from '@/components/ui/page-link';
import { useTuner } from './use-tuner';
import { centsBetween, frequencyForMidi, nearestMidi } from './tuner-engine';
import {
  closestTunerString,
  DEFAULT_TUNER_SETTINGS,
  DEFAULT_TUNER_SNAPSHOT,
  parseTunerSettings,
  TUNER_STORAGE_KEY,
  tunerNote,
  tunerNoteLabel,
  TUNINGS,
  type TunerSettings,
} from './tuner-settings';
import './tuner.css';

const formatHz = (value: number) =>
  value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const subscribeSettings = (callback: () => void) => {
  window.addEventListener('storage', callback);
  return () => window.removeEventListener('storage', callback);
};
const readSettings = () => {
  try {
    return localStorage.getItem(TUNER_STORAGE_KEY) ?? DEFAULT_TUNER_SNAPSHOT;
  } catch {
    return DEFAULT_TUNER_SNAPSHOT;
  }
};

function TunerDisplay({
  frequency,
  readingAt,
  targetMidi,
  targetLabel,
  concertA,
  tolerance,
  listening,
  requesting,
  clipped,
  level,
  previewing,
}: {
  frequency: number | null;
  readingAt: number | null;
  targetMidi: number | null;
  targetLabel: string;
  concertA: number;
  tolerance: number;
  listening: boolean;
  requesting: boolean;
  clipped: boolean;
  level: number;
  previewing: boolean;
}) {
  const detectedMidi = frequency ? nearestMidi(frequency, concertA) : null;
  const note = detectedMidi !== null ? tunerNote(detectedMidi) : null;
  const targetHz = targetMidi !== null ? frequencyForMidi(targetMidi, concertA) : null;
  const cents = frequency && targetHz ? centsBetween(frequency, targetHz) : null;
  const withinRange = cents !== null && Math.abs(cents) <= tolerance && !clipped;
  const confirmationKey = withinRange ? `${targetMidi}:${concertA}:${tolerance}` : null;
  const [confirmation, setConfirmation] = useState({ key: confirmationKey, since: readingAt });
  if (confirmation.key !== confirmationKey) {
    setConfirmation({ key: confirmationKey, since: readingAt });
  }
  // Count fresh measurements, never wall-clock time spent holding a stale note.
  const inTune =
    confirmationKey !== null &&
    confirmation.key === confirmationKey &&
    readingAt !== null &&
    confirmation.since !== null &&
    readingAt - confirmation.since >= 650;
  const farFromTarget = cents !== null && Math.abs(cents) >= 600;
  let status = 'Pronto para afinar';
  let instruction = 'Ative o microfone e toque uma corda por vez.';
  if (previewing) {
    status = 'Ouça a referência';
    instruction = 'Compare de ouvido. Ative o microfone quando o som terminar.';
  } else if (requesting) {
    status = 'Autorize o microfone';
    instruction = 'Confirme a permissão no navegador para começar.';
  } else if (listening) {
    if (clipped) {
      status = 'Sinal muito forte';
      instruction = 'Afaste o microfone ou reduza o ganho da entrada.';
    } else if (frequency === null) {
      status = level < 0.08 ? 'Toque uma corda' : 'Buscando uma nota estável';
      instruction =
        level < 0.08
          ? 'Deixe a corda soar e aproxime o microfone, se necessário.'
          : 'Abafe as outras cordas e toque com suavidade.';
    } else if (targetMidi === null) {
      status = 'Nota fora das cordas-alvo';
      instruction = 'Selecione a corda ou use o modo cromático.';
    } else if (farFromTarget) {
      status = 'Confira a corda e a oitava';
      instruction = 'A nota está distante do alvo. Confira a corda antes de ajustar.';
    } else if (inTune) {
      status = 'Afinada';
      instruction = `Leitura estável dentro de ±${tolerance} cent${tolerance > 1 ? 's' : ''}.`;
    } else if (withinRange) {
      status = 'Mantenha a nota';
      instruction = 'Aguarde a confirmação de uma leitura estável.';
    } else if (cents !== null) {
      status = cents < 0 ? 'Suba a afinação' : 'Baixe a afinação';
      instruction = 'Ajuste a tarraxa aos poucos e toque novamente.';
    }
  }
  const showReading = frequency !== null && !clipped;
  const roundedCents = cents === null ? null : Math.round(cents * 10) / 10;
  const position = Math.max(0, Math.min(100, 50 + (cents ?? 0)));
  const StatusIcon = inTune
    ? Check
    : cents !== null && !farFromTarget
      ? cents < 0
        ? ArrowUp
        : ArrowDown
      : AudioLines;
  return (
    <div className="tuner-display" data-tuned={inTune} data-reading={showReading}>
      <div className="tuner-display-top">
        <span>
          <span className="tuner-live-dot" data-active={listening} />
          {listening ? 'ESCUTANDO' : requesting ? 'AGUARDANDO PERMISSÃO' : 'MICROFONE DESLIGADO'}
        </span>
        <span>Lá4 · {formatHz(concertA)} Hz</span>
      </div>
      <div className="tuner-note-area">
        <div
          className="tuner-note"
          aria-label={
            showReading && note
              ? `Nota detectada: ${note.name}, oitava ${note.octave}`
              : 'Nenhuma nota detectada'
          }
        >
          {showReading && note ? (
            <>
              {note.letter}
              <sub>{note.octave}</sub>
            </>
          ) : (
            '—'
          )}
        </div>
        <p className="tuner-note-name">
          {showReading && note
            ? `${note.name} · ${formatHz(frequency!)} Hz`
            : 'Uma corda. Um ajuste de cada vez.'}
        </p>
        <p className="tuner-target">
          {targetLabel}
          {targetHz !== null ? ` · ${formatHz(targetHz)} Hz` : ''}
        </p>
      </div>
      <div className="tuner-meter" aria-hidden="true">
        <div className="tuner-meter-track">
          <span className="tuner-tolerance" style={{ width: `${tolerance * 2}%` }} />
          {Array.from({ length: 21 }, (_, index) => (
            <i
              key={index}
              className={index % 5 === 0 ? 'major' : ''}
              style={{ left: `${index * 5}%` }}
            />
          ))}
          <span className="tuner-meter-center" />
          {showReading && cents !== null && (
            <span className="tuner-needle" style={{ left: `${position}%` }} />
          )}
        </div>
        <div className="tuner-meter-labels">
          <span>−50</span>
          <span>−25</span>
          <span>0</span>
          <span>+25</span>
          <span>+50</span>
        </div>
      </div>
      <div className="tuner-cents">
        {showReading && roundedCents !== null
          ? `${roundedCents > 0 ? '+' : roundedCents < 0 ? '−' : ''}${Math.abs(roundedCents).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}`
          : '—'}
        <span>cents</span>
      </div>
      <div className="tuner-guidance" role="status" aria-live="polite" aria-atomic="true">
        <span className="sr-only">
          {showReading && note
            ? `Nota detectada: ${note.name}, oitava ${note.octave}. ${targetMidi !== null ? `Alvo: ${tunerNote(targetMidi).name}, oitava ${tunerNote(targetMidi).octave}.` : ''}`
            : ''}
        </span>
        <strong>
          <StatusIcon size={22} aria-hidden="true" />
          {status}
        </strong>
        <p>{instruction}</p>
      </div>
      <div className="tuner-signal">
        <span>Sinal de entrada</span>
        <div aria-hidden="true">
          <span style={{ transform: `scaleX(${level})` }} />
        </div>
        <span>
          {!listening ? 'Inativo' : clipped ? 'Alto demais' : level < 0.08 ? 'Baixo' : 'Presente'}
        </span>
      </div>
    </div>
  );
}

export function Tuner() {
  const saved = useSyncExternalStore(subscribeSettings, readSettings, () => DEFAULT_TUNER_SNAPSHOT);
  const [sessionSettings, setSessionSettings] = useState<TunerSettings | null>(null);
  const settings = sessionSettings ?? parseTunerSettings(saved);
  const { tuning, concertA, capo, tolerance, mode } = settings;
  const capture = useTuner();
  const { stop, resetReading } = capture;
  const [lockedString, setLockedString] = useState<number | null>(null);
  const [previewMidi, setPreviewMidi] = useState<number | null>(null);
  const [soundError, setSoundError] = useState('');
  const [calibrationError, setCalibrationError] = useState('');
  const preview = useRef<{ context: AudioContext; timer?: ReturnType<typeof setTimeout> } | null>(
    null,
  );
  const previewGeneration = useRef(0);
  const activeTuning = TUNINGS.find((item) => item.id === tuning) ?? TUNINGS[0];
  const targets = activeTuning.notes.map((midi) => midi + capo);
  const measured = capture.reading?.frequency ?? null;
  const measuredMidi = measured ? 69 + 12 * Math.log2(measured / concertA) : null;
  const detectedString = measuredMidi !== null ? closestTunerString(measuredMidi, targets) : null;
  const selectedString =
    lockedString !== null && lockedString < targets.length ? lockedString : null;
  const targetIndex = selectedString ?? detectedString;
  const targetMidi =
    mode === 'chromatic'
      ? measured
        ? nearestMidi(measured, concertA)
        : null
      : targetIndex !== null
        ? targets[targetIndex]
        : null;
  const referenceMidi = mode === 'chromatic' ? (targetMidi ?? 69) : targets[targetIndex ?? 0];
  const targetLabel =
    targetMidi !== null
      ? `Alvo: ${mode === 'strings' && targetIndex !== null ? `${targets.length - targetIndex}ª corda · ` : ''}${tunerNoteLabel(targetMidi)}`
      : mode === 'chromatic'
        ? 'Alvo: nota cromática mais próxima'
        : 'Alvo: detecção automática da corda';

  const stopPreview = useCallback(() => {
    previewGeneration.current++;
    if (preview.current) {
      clearTimeout(preview.current.timer);
      void preview.current.context.close().catch(() => {});
      preview.current = null;
    }
    setPreviewMidi(null);
  }, []);
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) stopPreview();
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', stopPreview);
    return () => {
      stopPreview();
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', stopPreview);
    };
  }, [stopPreview]);

  function updateSettings(patch: Partial<TunerSettings>) {
    const next = { ...settings, ...patch };
    stopPreview();
    resetReading();
    setLockedString(null);
    setSessionSettings(next);
    setCalibrationError('');
    try {
      localStorage.setItem(TUNER_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* Settings still work for this session. */
    }
  }
  async function playReference() {
    stopPreview();
    stop();
    setSoundError('');
    const generation = previewGeneration.current;
    try {
      const context = new AudioContext();
      preview.current = { context };
      setPreviewMidi(referenceMidi);
      await context.resume();
      if (generation !== previewGeneration.current || document.hidden) return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequencyForMidi(referenceMidi, concertA);
      gain.gain.setValueAtTime(0, context.currentTime);
      gain.gain.linearRampToValueAtTime(0.18, context.currentTime + 0.04);
      gain.gain.setValueAtTime(0.18, context.currentTime + 1.8);
      gain.gain.linearRampToValueAtTime(0, context.currentTime + 2.2);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 2.25);
      preview.current!.timer = setTimeout(stopPreview, 2350);
    } catch {
      if (generation !== previewGeneration.current) return;
      stopPreview();
      setSoundError(
        'Não foi possível tocar a referência. Tente novamente e confira a saída de áudio.',
      );
    }
  }
  const active = capture.status === 'listening' || capture.status === 'requesting';
  return (
    <section className="tuner" aria-labelledby="tuner-heading">
      <header className="tuner-heading">
        <div>
          <p className="eyebrow">ANTES DA PRIMEIRA NOTA</p>
          <h2 id="tuner-heading">Seu violão, no tom certo.</h2>
          <p>Afine pelo microfone ou compare com uma referência sonora.</p>
        </div>
        <span className="tuner-local">
          <ShieldCheck size={17} aria-hidden="true" />
          Áudio só no dispositivo
        </span>
      </header>
      <div className="tuner-toolbar">
        <div className="tuner-mode" role="group" aria-label="Modo do afinador">
          <button
            type="button"
            aria-pressed={mode === 'strings'}
            onClick={() => updateSettings({ mode: 'strings' })}
          >
            Cordas do violão
          </button>
          <button
            type="button"
            aria-pressed={mode === 'chromatic'}
            onClick={() => updateSettings({ mode: 'chromatic' })}
          >
            Cromático
          </button>
        </div>
        {mode === 'strings' ? (
          <label>
            Afinação
            <select
              value={tuning}
              onChange={(event) => updateSettings({ tuning: event.target.value })}
            >
              {TUNINGS.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="tuner-chromatic-hint">
            Reconhece a nota mais próxima, incluindo sustenidos e bemóis.
          </p>
        )}
      </div>
      {((capo > 0 && mode === 'strings') || concertA !== 440 || tolerance === 1) && (
        <p className="tuner-active-settings">
          {mode === 'strings' && capo > 0 ? `Capotraste na casa ${capo} · ` : ''}Lá4 ={' '}
          {formatHz(concertA)} Hz · tolerância ±{tolerance} cent{tolerance > 1 ? 's' : ''}
        </p>
      )}
      <div className="tuner-workbench">
        <div className="tuner-main">
          <div className="tuner-capture-controls">
            <button
              className="button tuner-start"
              type="button"
              onClick={() => {
                stopPreview();
                setSoundError('');
                if (active) stop();
                else void capture.start();
              }}
            >
              {active ? (
                <Square size={18} aria-hidden="true" />
              ) : (
                <Mic size={18} aria-hidden="true" />
              )}
              {capture.status === 'requesting'
                ? 'Cancelar solicitação'
                : active
                  ? 'Parar microfone'
                  : 'Ativar microfone'}
            </button>
            <p>
              <ShieldCheck size={16} aria-hidden="true" />O som é analisado aqui, sem gravação nem
              envio.
            </p>
          </div>
          {capture.error && (
            <p className="tuner-error" role="alert">
              <MicOff size={18} aria-hidden="true" />
              {capture.error}
            </p>
          )}
          <TunerDisplay
            key={`${mode}:${tuning}:${selectedString}:${capo}:${concertA}:${tolerance}`}
            frequency={measured}
            readingAt={capture.reading?.at ?? null}
            targetMidi={targetMidi}
            targetLabel={targetLabel}
            concertA={concertA}
            tolerance={tolerance}
            listening={capture.status === 'listening'}
            requesting={capture.status === 'requesting'}
            clipped={capture.clipped}
            level={capture.level}
            previewing={previewMidi !== null}
          />
        </div>
        <aside className="tuner-side" aria-label="Corda-alvo e referência sonora">
          {mode === 'strings' ? (
            <>
              <div className="tuner-strings-heading">
                <h3>Escolha sua corda</h3>
                <button
                  type="button"
                  className="tuner-auto"
                  aria-pressed={selectedString === null}
                  onClick={() => {
                    stopPreview();
                    resetReading();
                    setLockedString(null);
                  }}
                >
                  Automático
                </button>
              </div>
              <p className="tuner-helper">Toque para fixar o alvo. Da mais grave à mais aguda.</p>
              <div
                className="tuner-strings"
                role="group"
                aria-label="Fixar uma corda para afinar"
                style={{ '--string-count': targets.length } as CSSProperties}
              >
                {targets.map((midi, index) => {
                  const note = tunerNote(midi);
                  return (
                    <button
                      type="button"
                      key={`${index}:${midi}`}
                      className="tuner-string"
                      aria-pressed={selectedString === index}
                      data-detected={targetIndex === index && measured !== null}
                      aria-label={`${targets.length - index}ª corda, ${note.name}, oitava ${note.octave}. Fixar alvo.`}
                      onClick={() => {
                        stopPreview();
                        resetReading();
                        setLockedString(index);
                      }}
                    >
                      <span className="tuner-string-number">{targets.length - index}ª</span>
                      <span
                        className="tuner-string-line"
                        aria-hidden="true"
                        style={{ height: `${Math.max(1, 3.5 - index * 0.4)}px` }}
                      />
                      <strong>
                        {note.letter}
                        <sub>{note.octave}</sub>
                      </strong>
                      <span className="tuner-string-name">{note.name}</span>
                      {selectedString === index && <Check size={15} aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
              <p className="tuner-selection">
                {selectedString !== null
                  ? `${targets.length - selectedString}ª corda fixada · ${tunerNoteLabel(targets[selectedString])}`
                  : 'O alvo acompanha a corda que você tocar.'}
              </p>
            </>
          ) : (
            <div className="tuner-chromatic-info">
              <AudioLines size={32} aria-hidden="true" />
              <h3>Ouça todas as notas</h3>
              <p>Toque uma nota por vez. O alvo acompanha a nota mais próxima de seu som.</p>
              <p>Para manter um alvo enquanto ajusta a tarraxa, use “Cordas do violão”.</p>
            </div>
          )}
          <div className="tuner-reference">
            <h3>Afine também de ouvido</h3>
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                if (previewMidi !== null) stopPreview();
                else void playReference();
              }}
            >
              {previewMidi !== null ? (
                <Square size={17} aria-hidden="true" />
              ) : (
                <Volume2 size={18} aria-hidden="true" />
              )}
              {previewMidi !== null ? 'Parar referência' : `Ouvir ${tunerNoteLabel(referenceMidi)}`}
            </button>
            <p>A referência desliga o microfone para não interferir na leitura.</p>
            {soundError && (
              <p className="tuner-error" role="alert">
                {soundError}
              </p>
            )}
          </div>
        </aside>
      </div>
      <div className="tuner-bottom">
        <details className="tuner-settings">
          <summary>
            <SlidersHorizontal size={18} aria-hidden="true" />
            Ajustes do afinador<span>Lá4, tolerância e entrada</span>
          </summary>
          <div className="tuner-settings-grid">
            <label>
              Lá4 de referência (Hz)
              <input
                key={concertA}
                type="number"
                min="400"
                max="480"
                step="0.1"
                defaultValue={concertA}
                aria-invalid={!!calibrationError}
                aria-describedby="tuner-calibration-help"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') event.currentTarget.blur();
                }}
                onBlur={(event) => {
                  const value = Number(event.target.value);
                  if (
                    !event.target.value.trim() ||
                    !Number.isFinite(value) ||
                    value < 400 ||
                    value > 480
                  ) {
                    setCalibrationError(
                      'Use um valor entre 400 e 480 Hz. A referência anterior foi mantida.',
                    );
                    event.target.value = String(concertA);
                  } else updateSettings({ concertA: Math.round(value * 10) / 10 });
                }}
              />
              <span id="tuner-calibration-help">
                {calibrationError || 'Padrão: 440 Hz. Combine com os outros músicos.'}
              </span>
            </label>
            <label>
              Tolerância de confirmação
              <select
                value={tolerance}
                onChange={(event) =>
                  updateSettings({ tolerance: Number(event.target.value) as 1 | 3 })
                }
              >
                <option value="3">Normal · ±3 cents</option>
                <option value="1">Fina · ±1 cent</option>
              </select>
              <span>Define a faixa de confirmação; não a precisão do microfone.</span>
            </label>
            <label>
              Capotraste
              <select
                value={capo}
                disabled={mode === 'chromatic'}
                onChange={(event) => updateSettings({ capo: Number(event.target.value) })}
              >
                {Array.from({ length: 8 }, (_, index) => (
                  <option key={index} value={index}>
                    {index === 0 ? 'Sem capotraste' : `Casa ${index}`}
                  </option>
                ))}
              </select>
              <span>
                Use com o capotraste já colocado na casa selecionada. Sem ele, escolha “Sem
                capotraste”.
              </span>
            </label>
            <label>
              Microfone ou interface
              <select
                value={capture.deviceId}
                disabled={capture.devices.length === 0 || capture.status === 'requesting'}
                onChange={(event) => {
                  stopPreview();
                  capture.selectDevice(event.target.value);
                }}
              >
                <option value="">Entrada padrão do sistema</option>
                {capture.devices
                  .filter((device) => device.deviceId !== 'default')
                  .map((device) => (
                    <option value={device.deviceId} key={device.deviceId}>
                      {device.label}
                    </option>
                  ))}
              </select>
              <span>
                {capture.devices.length
                  ? capture.inputName
                  : 'As entradas aparecem após autorizar o microfone.'}{' '}
                Trocar a entrada interrompe a escuta.
              </span>
            </label>
          </div>
          <div className="tuner-settings-footer">
            <p>Os ajustes ficam salvos neste navegador, quando disponível.</p>
            <button
              type="button"
              className="button secondary"
              onClick={() => updateSettings(DEFAULT_TUNER_SETTINGS)}
            >
              <RotateCcw size={16} aria-hidden="true" />
              Restaurar padrão
            </button>
          </div>
        </details>
        <details className="tuner-help">
          <summary>
            <CircleHelp size={18} aria-hidden="true" />
            Como conseguir uma boa leitura
          </summary>
          <ol>
            <li>
              Toque uma corda solta com suavidade e abafe as demais. Não use harmônicos para esta
              conferência.
            </li>
            <li>
              Espere o ataque inicial passar. Confira a letra e a oitava antes de mexer na tarraxa.
            </li>
            <li>
              Faça movimentos pequenos. Ao passar do ponto, desça um pouco e volte à nota aumentando
              a tensão.
            </li>
            <li>
              Confira todas as cordas outra vez depois de mudar de afinação ou colocar o capotraste.
            </li>
          </ol>
          <p>
            Um cent é 1/100 de semitom. O medidor mostra de −50 a +50 cents; o número continua
            mostrando o desvio completo em relação ao alvo.
          </p>
          <p>
            O microfone precisa de HTTPS ou localhost e de sua permissão. Ele desliga ao trocar de
            oficina ou ocultar esta página. Ruído, cordas simultâneas e o equipamento podem afetar a
            leitura.
          </p>
          <p>
            Afinação usa temperamento igual. Esta ferramenta não mede a regulagem de entonação do
            instrumento e não substitui um afinador dedicado em ambientes ruidosos. A faixa de
            detecção vai de 45 a 1.400 Hz.
          </p>
          <p className="tuner-sources">
            Saiba mais:{' '}
            <Link href="https://www.boss.info/GLOBAL/products/tu-3/" purpose="reference">
              BOSS TU-3 ↗
            </Link>{' '}
            ·{' '}
            <Link
              href="https://blog.taylorguitars.com/how-to-tune-an-acoustic-guitar-for-beginners"
              purpose="reference"
            >
              Orientações Taylor ↗
            </Link>
          </p>
        </details>
      </div>
    </section>
  );
}
