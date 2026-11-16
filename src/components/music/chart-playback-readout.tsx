'use client';

import type { VisualPlaybackPosition } from './chart-visual-position';

export function formatPlaybackTime(seconds: number) {
  const total = Math.max(0, Math.floor(seconds + 1e-7));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

export function ChartPlaybackReadout({
  position,
  duration,
  bars,
}: {
  position: VisualPlaybackPosition;
  duration: number;
  bars: number;
}) {
  return (
    <div className="chart-playback-readout" aria-live="off">
      <span>
        Posição <strong>{formatPlaybackTime(position.seconds)}</strong> /{' '}
        {formatPlaybackTime(duration)}
      </span>
      <span>
        Compasso {position.bar + 1} de {bars}
      </span>
      <progress
        value={Math.min(duration, position.seconds)}
        max={duration || 1}
        aria-label="Posição no acompanhamento"
      />
    </div>
  );
}
