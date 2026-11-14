'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AUDIO_STOP_EVENT, playSoundSteps, stopAudio, type SoundStep } from './audio';
export function useAudioPreview() {
  const [playing,setPlaying] = useState(false), [error,setError] = useState('');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownsAudio = useRef(false), mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    const onStop = () => {
      ownsAudio.current = false;
      if (timer.current) clearTimeout(timer.current);
      if (mounted.current) setPlaying(false);
    };
    window.addEventListener(AUDIO_STOP_EVENT,onStop);
    return () => {
      mounted.current = false; window.removeEventListener(AUDIO_STOP_EVENT,onStop);
      if (timer.current) clearTimeout(timer.current);
      if (ownsAudio.current) stopAudio();
    };
  },[]);
  const play = useCallback(async (steps: SoundStep[]) => {
    setError('');
    try {
      const duration = await playSoundSteps(steps);
      if (!mounted.current || document.hidden) { stopAudio(); return; }
      ownsAudio.current = true; setPlaying(true);
      timer.current = setTimeout(() => {
        ownsAudio.current = false; if (mounted.current) setPlaying(false);
      },(duration+0.1)*1000);
    } catch (cause) {
      if (cause instanceof DOMException && cause.name === 'AbortError') return;
      if (mounted.current) setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar o áudio.');
    }
  },[]);
  return { play, stop: stopAudio, playing, error };
}
