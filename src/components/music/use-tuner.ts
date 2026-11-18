'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from './tuner-engine';
import {
  effectiveSignalFloor,
  estimateNoiseFloor,
  measureSignal,
  signalDb,
  signalLevel,
  trackPitch,
  tunerFftSize,
  TUNER_SENSITIVITY_PROFILES,
  type NoiseCalibration,
  type SignalMeasurement,
  type TunerSensitivity,
  type TunerSignal,
} from './tuner-signal';

export type TunerStatus = 'idle' | 'requesting' | 'listening' | 'error';
export type TunerReading = {
  frequency: number;
  clarity: number;
  rms: number;
  /** Monotonic timestamp; a held reading never receives a new timestamp. */
  at: number;
};

type TunerInput = { deviceId: string; label: string };
type CaptureSession = {
  context: AudioContext;
  stream?: MediaStream;
  analyser?: AnalyserNode;
  nodes: AudioNode[];
  timer?: ReturnType<typeof setTimeout>;
  detach: (() => void)[];
};

const POLL_MS = 72;
const CALIBRATION_SETTLE_MS = 250;
const CALIBRATION_SAMPLE_MS = 2000;

function disposeCapture(session: CaptureSession | null) {
  if (!session) return;
  if (session.timer) clearTimeout(session.timer);
  session.detach.forEach((detach) => detach());
  session.nodes.forEach((node) => node.disconnect());
  session.stream?.getTracks().forEach((track) => track.stop());
  if (session.context.state !== 'closed') void session.context.close().catch(() => {});
}

function microphoneError(cause: unknown) {
  const name = cause instanceof Error ? cause.name : '';
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'O acesso ao microfone foi bloqueado. Permita o microfone nas configurações deste site no navegador e tente novamente.';
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Nenhum microfone foi encontrado. Conecte um microfone ou uma interface de áudio e tente novamente.';
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Não foi possível abrir o microfone. Verifique a conexão e feche outros aplicativos que estejam usando a entrada de áudio.';
    case 'OverconstrainedError':
      return 'A entrada selecionada não está disponível. Escolha outra entrada de áudio e tente novamente.';
    case 'AbortError':
      return 'A abertura do microfone foi interrompida. Confira a entrada de áudio e tente novamente.';
    default:
      return 'Não foi possível iniciar o afinador. Confira as permissões e a entrada de áudio e tente novamente.';
  }
}

/** Audio stays in this tab: no recording, uploads, or microphone monitoring. */
export function useTuner(sensitivity: TunerSensitivity = 'balanced') {
  const [status, setStatus] = useState<TunerStatus>('idle');
  const [reading, setReading] = useState<TunerReading | null>(null);
  const [level, setLevel] = useState(0);
  const [clipped, setClipped] = useState(false);
  const [devices, setDevices] = useState<TunerInput[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [inputName, setInputName] = useState('Microfone padrão');
  const [error, setError] = useState('');
  const [signal, setSignal] = useState<TunerSignal>('quiet');
  const [inputDb, setInputDb] = useState<number | null>(null);
  const [noiseFloorDb, setNoiseFloorDb] = useState<number | null>(null);
  const [noiseCalibration, setNoiseCalibration] = useState<NoiseCalibration>('idle');
  const [processingWarning, setProcessingWarning] = useState('');
  const mounted = useRef(false);
  const generation = useRef(0);
  const session = useRef<CaptureSession | null>(null);
  const permitted = useRef(false);
  const enumeration = useRef(0);
  const history = useRef<number[]>([]);
  const profile = useRef(TUNER_SENSITIVITY_PROFILES[sensitivity]);
  const noiseFloor = useRef<number | null>(null);
  const calibration = useRef<{ startedAt: number; frames: SignalMeasurement[] } | null>(null);

  useEffect(() => {
    const nextProfile = TUNER_SENSITIVITY_PROFILES[sensitivity];
    if (profile.current !== nextProfile) {
      history.current = [];
      profile.current = nextProfile;
    }
  }, [sensitivity]);

  const release = useCallback(() => {
    generation.current++;
    enumeration.current++;
    const previous = session.current;
    session.current = null;
    disposeCapture(previous);
    history.current = [];
    noiseFloor.current = null;
    calibration.current = null;
  }, []);

  const resetReading = useCallback(() => {
    history.current = [];
    if (mounted.current) {
      setReading(null);
      setSignal(calibration.current ? 'calibrating' : 'quiet');
    }
  }, []);

  const clearNoiseCalibration = useCallback(() => {
    calibration.current = null;
    noiseFloor.current = null;
    if (!mounted.current) return;
    setNoiseCalibration('idle');
    setNoiseFloorDb(null);
    resetReading();
  }, [resetReading]);

  const calibrateNoise = useCallback(() => {
    if (
      !mounted.current ||
      !session.current?.analyser ||
      session.current.context.state !== 'running'
    )
      return;
    noiseFloor.current = null;
    calibration.current = { startedAt: performance.now(), frames: [] };
    resetReading();
    setNoiseFloorDb(null);
    setNoiseCalibration('sampling');
    setSignal('calibrating');
  }, [resetReading]);

  const stop = useCallback(() => {
    release();
    if (!mounted.current) return;
    setStatus('idle');
    setReading(null);
    setLevel(0);
    setClipped(false);
    setError('');
    setSignal('quiet');
    setInputDb(null);
    setNoiseFloorDb(null);
    setNoiseCalibration('idle');
    setProcessingWarning('');
  }, [release]);

  const fail = useCallback(
    (message: string) => {
      release();
      if (!mounted.current) return;
      setStatus('error');
      setReading(null);
      setLevel(0);
      setClipped(false);
      setError(message);
      setSignal('quiet');
      setInputDb(null);
      setNoiseFloorDb(null);
      setNoiseCalibration('idle');
      setProcessingWarning('');
    },
    [release],
  );

  const refreshDevices = useCallback(async () => {
    if (!permitted.current || !navigator.mediaDevices?.enumerateDevices) return;
    const request = ++enumeration.current;
    try {
      const available = await navigator.mediaDevices.enumerateDevices();
      if (!mounted.current || request !== enumeration.current) return;
      setDevices(
        available
          .filter((device) => device.kind === 'audioinput' && device.deviceId !== 'default')
          .map((device, index) => ({
            deviceId: device.deviceId,
            label: device.label || `Entrada de áudio ${index + 1}`,
          })),
      );
    } catch {
      // Some browsers allow capture but do not expose input selection.
    }
  }, []);

  const start = useCallback(
    async (requestedDevice = deviceId) => {
      stop();
      if (!mounted.current || document.hidden) return;
      if (!window.isSecureContext) {
        fail(
          'O microfone precisa de uma conexão HTTPS. Abra o site em uma conexão segura para usar o afinador.',
        );
        return;
      }
      const Context =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Context || !navigator.mediaDevices?.getUserMedia) {
        fail(
          'Este navegador não oferece acesso ao microfone para o afinador. Use um navegador atualizado ou ouça as notas de referência.',
        );
        return;
      }
      const run = generation.current;
      const isCurrent = () => mounted.current && generation.current === run && !document.hidden;
      setStatus('requesting');
      setDeviceId(requestedDevice);
      try {
        // Creation and resume happen before the first await, within the user's gesture.
        const context = new Context({ latencyHint: 'interactive' });
        const current: CaptureSession = { context, nodes: [], detach: [] };
        session.current = current;
        // Handle rejection immediately, even if a browser throws while opening capture.
        const resume = context.resume().then(
          () => true,
          () => false,
        );
        const capture = navigator.mediaDevices
          .getUserMedia({
            audio: {
              ...(requestedDevice ? { deviceId: { exact: requestedDevice } } : {}),
              channelCount: { ideal: 1 },
              echoCancellation: false,
              noiseSuppression: false,
              autoGainControl: false,
            },
            video: false,
          })
          .then((stream) => {
            // Permission prompts cannot be cancelled; release a late grant immediately.
            if (!isCurrent()) {
              stream.getTracks().forEach((track) => track.stop());
              return null;
            }
            current.stream = stream;
            return stream;
          });
        const [resumed, stream] = await Promise.all([resume, capture]);
        if (!isCurrent() || !stream) return;
        if (!resumed || context.state !== 'running') {
          fail('O navegador suspendeu o áudio. Ative o afinador novamente para retomar a escuta.');
          return;
        }
        const track = stream.getAudioTracks()[0];
        if (!track || track.readyState === 'ended') {
          fail(
            'A entrada de áudio foi desconectada. Reconecte o microfone e ative o afinador novamente.',
          );
          return;
        }
        permitted.current = true;
        setInputName(track.label || 'Microfone padrão');
        const settings = track.getSettings();
        setProcessingWarning(
          settings.echoCancellation || settings.noiseSuppression || settings.autoGainControl
            ? 'Esta entrada mantém processamento automático de áudio, que pode alterar a leitura de notas fracas. Se possível, use outra entrada ou uma interface de áudio.'
            : '',
        );
        void refreshDevices();
        const source = context.createMediaStreamSource(stream);
        current.nodes.push(source);
        const rawAnalyser = context.createAnalyser();
        current.nodes.push(rawAnalyser);
        rawAnalyser.fftSize = tunerFftSize(context.sampleRate);
        rawAnalyser.smoothingTimeConstant = 0;
        const highpass = context.createBiquadFilter();
        current.nodes.push(highpass);
        highpass.type = 'highpass';
        highpass.frequency.value = 30;
        // Web Audio expresses low/high-pass Q in dB, unlike the linear textbook Q.
        highpass.Q.value = 20 * Math.log10(Math.SQRT1_2);
        const lowpass = context.createBiquadFilter();
        current.nodes.push(lowpass);
        lowpass.type = 'lowpass';
        lowpass.frequency.value = 2000;
        lowpass.Q.value = 20 * Math.log10(Math.SQRT1_2);
        const analyser = context.createAnalyser();
        current.nodes.push(analyser);
        analyser.fftSize = tunerFftSize(context.sampleRate);
        analyser.smoothingTimeConstant = 0;
        source.connect(rawAnalyser);
        source.connect(highpass);
        highpass.connect(lowpass);
        lowpass.connect(analyser);
        // Deliberately do not connect to destination: there is no audible feedback loop.
        current.analyser = analyser;
        const samples = new Float32Array(analyser.fftSize);
        const rawSamples = new Float32Array(rawAnalyser.fftSize);
        let previousRms = 0;
        const interrupted = () => {
          if (!isCurrent()) return;
          if (context.state !== 'running') {
            fail(
              'A escuta foi interrompida pelo navegador ou por outro aplicativo. Ative o afinador novamente para continuar.',
            );
          }
        };
        const ended = () => {
          if (isCurrent()) {
            fail(
              'O microfone foi desconectado ou sua permissão foi removida. Confira a entrada de áudio e tente novamente.',
            );
          }
        };
        context.addEventListener('statechange', interrupted);
        track.addEventListener('ended', ended);
        current.detach.push(
          () => context.removeEventListener('statechange', interrupted),
          () => track.removeEventListener('ended', ended),
        );
        setStatus('listening');
        const poll = () => {
          if (!isCurrent()) return;
          try {
            analyser.getFloatTimeDomainData(samples);
            rawAnalyser.getFloatTimeDomainData(rawSamples);
            const now = performance.now();
            const raw = measureSignal(rawSamples);
            const { rms } = measureSignal(samples);
            const activeProfile = profile.current;
            const gate = effectiveSignalFloor(activeProfile, noiseFloor.current);
            const attack = rms > activeProfile.minRms * 4 && rms > previousRms * 3;
            previousRms = rms;
            setClipped(raw.clipped);
            setInputDb(signalDb(raw.rms));
            setLevel(signalLevel(raw.rms));
            const measurement = calibration.current;
            let nextSignal: TunerSignal;
            let estimate = null;
            if (measurement) {
              const elapsed = now - measurement.startedAt;
              // Discard the opening window, then invalidate interrupted or overloaded input.
              if (elapsed >= CALIBRATION_SETTLE_MS)
                measurement.frames.push({ rms, clipped: track.muted || raw.clipped });
              if (elapsed >= CALIBRATION_SETTLE_MS + CALIBRATION_SAMPLE_MS) {
                const measuredFloor = estimateNoiseFloor(measurement.frames);
                calibration.current = null;
                noiseFloor.current = measuredFloor;
                setNoiseFloorDb(measuredFloor === null ? null : signalDb(measuredFloor));
                setNoiseCalibration(measuredFloor === null ? 'rejected' : 'ready');
              }
              nextSignal = calibration.current ? 'calibrating' : 'quiet';
            } else if (track.muted) {
              nextSignal = 'muted';
            } else if (raw.clipped) {
              nextSignal = 'clipped';
            } else if (rms < gate) {
              nextSignal = noiseFloor.current !== null ? 'below-noise' : 'quiet';
            } else if (attack) {
              nextSignal = 'unstable';
            } else {
              estimate = detectPitch(samples, context.sampleRate, {
                minRms: gate,
                minClarity: activeProfile.minClarity,
              });
              nextSignal = 'unstable';
            }
            const frequency = trackPitch(
              history.current,
              estimate?.frequency ?? null,
              activeProfile,
            );
            if (estimate && frequency !== null) {
              setReading({ frequency, clarity: estimate.clarity, rms, at: now });
              nextSignal = 'tracking';
            } else {
              // Do not hold a green reading when the current signal stops agreeing with it.
              setReading(null);
            }
            setSignal(nextSignal);
            current.timer = setTimeout(poll, POLL_MS);
          } catch {
            if (isCurrent())
              fail(
                'A leitura do microfone foi interrompida. Ative o afinador novamente para tentar outra vez.',
              );
          }
        };
        poll();
      } catch (cause) {
        if (isCurrent()) fail(microphoneError(cause));
      }
    },
    [deviceId, fail, refreshDevices, stop],
  );

  const selectDevice = useCallback(
    (id: string) => {
      stop();
      setDeviceId(id);
    },
    [stop],
  );

  useEffect(() => {
    mounted.current = true;
    const hide = () => {
      if (document.hidden) stop();
    };
    const devicesChanged = () => {
      clearNoiseCalibration();
      void refreshDevices();
    };
    document.addEventListener('visibilitychange', hide);
    window.addEventListener('pagehide', stop);
    navigator.mediaDevices?.addEventListener('devicechange', devicesChanged);
    return () => {
      mounted.current = false;
      release();
      document.removeEventListener('visibilitychange', hide);
      window.removeEventListener('pagehide', stop);
      navigator.mediaDevices?.removeEventListener('devicechange', devicesChanged);
    };
  }, [clearNoiseCalibration, refreshDevices, release, stop]);

  return {
    status,
    reading,
    level,
    clipped,
    devices,
    deviceId,
    inputName,
    error,
    signal,
    inputDb,
    noiseFloorDb,
    noiseCalibration,
    processingWarning,
    start,
    stop,
    selectDevice,
    resetReading,
    calibrateNoise,
    clearNoiseCalibration,
  };
}
