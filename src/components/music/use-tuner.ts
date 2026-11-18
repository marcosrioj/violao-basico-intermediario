'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { detectPitch } from './tuner-engine';

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
  source?: MediaStreamAudioSourceNode;
  analyser?: AnalyserNode;
  timer?: ReturnType<typeof setTimeout>;
  detach: (() => void)[];
};

const POLL_MS = 72;
const STALE_MS = 250;

function disposeCapture(session: CaptureSession | null) {
  if (!session) return;
  if (session.timer) clearTimeout(session.timer);
  session.detach.forEach((detach) => detach());
  session.source?.disconnect();
  session.analyser?.disconnect();
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
export function useTuner() {
  const [status, setStatus] = useState<TunerStatus>('idle');
  const [reading, setReading] = useState<TunerReading | null>(null);
  const [level, setLevel] = useState(0);
  const [clipped, setClipped] = useState(false);
  const [devices, setDevices] = useState<TunerInput[]>([]);
  const [deviceId, setDeviceId] = useState('');
  const [inputName, setInputName] = useState('Microfone padrão');
  const [error, setError] = useState('');
  const mounted = useRef(false);
  const generation = useRef(0);
  const session = useRef<CaptureSession | null>(null);
  const permitted = useRef(false);
  const enumeration = useRef(0);
  const history = useRef<number[]>([]);
  const lastValid = useRef(0);

  const release = useCallback(() => {
    generation.current++;
    enumeration.current++;
    const previous = session.current;
    session.current = null;
    disposeCapture(previous);
    history.current = [];
    lastValid.current = 0;
  }, []);

  const resetReading = useCallback(() => {
    history.current = [];
    lastValid.current = 0;
    if (mounted.current) setReading(null);
  }, []);

  const stop = useCallback(() => {
    release();
    if (!mounted.current) return;
    setStatus('idle');
    setReading(null);
    setLevel(0);
    setClipped(false);
    setError('');
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
        const current: CaptureSession = { context, detach: [] };
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
        void refreshDevices();
        const analyser = context.createAnalyser();
        analyser.fftSize = 8192;
        analyser.smoothingTimeConstant = 0;
        const source = context.createMediaStreamSource(stream);
        source.connect(analyser);
        // Deliberately do not connect to destination: there is no audible feedback loop.
        current.source = source;
        current.analyser = analyser;
        const samples = new Float32Array(analyser.fftSize);
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
            const now = performance.now();
            let sum = 0;
            let squareSum = 0;
            let clippedSamples = 0;
            for (const sample of samples) {
              sum += sample;
              squareSum += sample * sample;
              if (Math.abs(sample) >= 0.985) clippedSamples++;
            }
            const mean = sum / samples.length;
            const rms = Math.sqrt(Math.max(0, squareSum / samples.length - mean * mean));
            const overload = clippedSamples / samples.length > 0.005;
            const attack = rms > 0.015 && rms > previousRms * 3;
            previousRms = rms;
            setClipped(overload);
            // Logarithmic input meter, roughly -60 to -6 dBFS. It is not a dB SPL meter.
            setLevel(
              Math.max(0, Math.min(1, (20 * Math.log10(Math.max(rms, 0.000001)) + 60) / 54)),
            );
            const estimate =
              overload || attack || track.muted ? null : detectPitch(samples, context.sampleRate);
            if (estimate) {
              const recent = history.current;
              const previous = recent.at(-1);
              if (previous && Math.abs(1200 * Math.log2(estimate.frequency / previous)) > 70) {
                recent.length = 0;
                setReading(null);
              }
              recent.push(estimate.frequency);
              if (recent.length > 3) recent.shift();
              if (recent.length === 3) {
                const frequency = [...recent].sort((a, b) => a - b)[1];
                lastValid.current = now;
                setReading({ frequency, clarity: estimate.clarity, rms, at: now });
              }
            } else {
              history.current = [];
            }
            if (overload || attack || track.muted || now - lastValid.current >= STALE_MS) {
              setReading(null);
            }
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
    const devicesChanged = () => void refreshDevices();
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
  }, [refreshDevices, release, stop]);

  return {
    status,
    reading,
    level,
    clipped,
    devices,
    deviceId,
    inputName,
    error,
    start,
    stop,
    selectDevice,
    resetReading,
  };
}
