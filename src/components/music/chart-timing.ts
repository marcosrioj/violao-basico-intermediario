import type { ChartBar } from '@/content/types';
/** Absolute targets prevent callback latency from accumulating between bars. */
export function scheduleChartBar(bar: ChartBar, startAt: number, bpm: number) {
  if (!Number.isFinite(bpm) || bpm <= 0) throw new RangeError('Andamento inválido.');
  let nextAt = startAt;
  const events = bar.events.map((event) => {
    const duration = event.beats * 60 / bpm;
    const scheduled = { chord: event.chord, at: nextAt, duration };
    nextAt += duration;
    return scheduled;
  });
  return { events, endAt: nextAt };
}
