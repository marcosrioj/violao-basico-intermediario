import type { ChartBar, SongVersion } from '@/content/types';
import { describeChartBar } from './chart-layout';
/** Absolute targets prevent callback latency from accumulating between bars. */
export function scheduleChartBar(bar: ChartBar, startAt: number, bpm: number) {
  if (!Number.isFinite(bpm) || bpm <= 0) throw new RangeError('Andamento inválido.');
  let nextAt = startAt;
  const events = bar.events.map((event) => {
    const duration = (event.beats * 60) / bpm;
    const scheduled = { chord: event.chord, at: nextAt, duration };
    nextAt += duration;
    return scheduled;
  });
  return { events, endAt: nextAt };
}

/** Use the visible counting grid and the chord clock for every metronome click. */
export function scheduleChartMetronome(
  bar: ChartBar,
  chart: SongVersion,
  startAt: number,
  bpm: number,
) {
  const { endAt } = scheduleChartBar(bar, startAt, bpm);
  const rhythm = describeChartBar(bar, chart);
  const tickDuration = (60 / bpm) * (rhythm.pulses / rhythm.ticks.length);
  const ticks = rhythm.ticks.map((tick, tickIndex) => ({
    at: startAt + tickIndex * tickDuration,
    tickIndex,
    frequency: tickIndex === 0 ? 1200 : tick.strong ? 800 : 550,
    volume: tickIndex === 0 ? 0.12 : tick.strong ? 0.08 : 0.035,
  }));
  return { ticks, endAt };
}
