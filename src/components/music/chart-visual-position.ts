import { idlePosition, type PlaybackPosition, type PlaybackSnapshot } from './chart-transport';

/** Values visible outside the lyric fill; retain identity between meaningful frame changes. */
export interface VisualPlaybackPosition extends PlaybackPosition {
  seconds: number;
}

export const idleVisualPosition: VisualPlaybackPosition = { ...idlePosition, seconds: 0 };

/** Bars, metronome cursor and readout consume the same frame as the lyric clock. */
export function visualPlaybackPosition(
  previous: VisualPlaybackPosition,
  snapshot: PlaybackSnapshot | null,
): VisualPlaybackPosition {
  if (!snapshot || snapshot.status === 'idle') return idleVisualPosition;
  const next: VisualPlaybackPosition = snapshot.waitingForAudio
    ? { ...previous, status: snapshot.status }
    : {
        status: snapshot.status,
        bar: snapshot.bar,
        tick: snapshot.tick,
        seconds: Math.floor(snapshot.scoreSeconds + 1e-7),
      };
  return previous.status === next.status &&
    previous.bar === next.bar &&
    previous.tick === next.tick &&
    previous.seconds === next.seconds
    ? previous
    : next;
}
