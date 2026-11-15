'use client';

import { useEffect, useState } from 'react';
import type { PlaybackPosition, PlaybackSnapshot } from './chart-transport';

export function formatPlaybackTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds + 1e-7));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function ChartPlaybackReadout({
  status,
  readPosition,
  duration,
  bars,
}: {
  status: PlaybackPosition['status'];
  readPosition: () => PlaybackSnapshot | null;
  duration: number;
  bars: number;
}) {
  const [position, setPosition] = useState({ seconds: 0, bar: 0 });
  useEffect(() => {
    let frame = 0;
    function update() {
      const snapshot = readPosition();
      const next = {
        seconds: Math.floor(snapshot?.scoreSeconds ?? 0),
        bar: (snapshot?.bar ?? -1) + 1,
      };
      setPosition((previous) =>
        previous.seconds === next.seconds && previous.bar === next.bar ? previous : next,
      );
      if (status === 'playing') frame = requestAnimationFrame(update);
    }
    frame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(frame);
  }, [status, readPosition, duration, bars]);
  return (
    <div className="chart-playback-readout" aria-live="off">
      <span>
        Posição <strong>{formatPlaybackTime(position.seconds)}</strong> /{' '}
        {formatPlaybackTime(duration)}
      </span>
      <span>
        Compasso {position.bar} de {bars}
      </span>
      <progress
        value={Math.min(duration, position.seconds)}
        max={duration || 1}
        aria-label="Posição no acompanhamento"
      />
    </div>
  );
}
