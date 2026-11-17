import type { ChartBar, ChartSection, SongVersion } from '@/content/types';

export interface ChartDisplayBar {
  bar: ChartBar;
  /** Zero-based position inside the original section; independent of repeats. */
  barIndex: number;
  /** Zero-based position in the selected playback sequence. */
  playbackIndex: number;
}

export interface ChartGroup {
  key: string;
  sectionId: string;
  title: string;
  passage: number;
  passages: number;
  bars: ChartDisplayBar[];
}

/** Keep each occurrence visible while sharing the original section and bar data. */
export function buildChartGroups(chart: SongVersion, selected = 'all'): ChartGroup[] {
  const sections = new Map(chart.sections.map((section) => [section.id, section]));
  let playbackIndex = 0;
  const group = (
    section: ChartSection,
    key: string,
    passage: number,
    passages: number,
  ): ChartGroup => ({
    key,
    sectionId: section.id,
    title: section.title,
    passage,
    passages,
    bars: section.bars.map((bar, barIndex) => ({ bar, barIndex, playbackIndex: playbackIndex++ })),
  });

  if (selected !== 'all') {
    const section = sections.get(selected);
    return section ? [group(section, `selected-${section.id}`, 1, 1)] : [];
  }

  const totals = new Map<string, number>();
  for (const part of chart.order)
    totals.set(part.section, (totals.get(part.section) ?? 0) + part.repeat);
  const passages = new Map<string, number>();
  const groups: ChartGroup[] = [];
  chart.order.forEach((part, orderIndex) => {
    const section = sections.get(part.section);
    if (!section) return;
    for (let repeatIndex = 0; repeatIndex < part.repeat; repeatIndex++) {
      const passage = (passages.get(section.id) ?? 0) + 1;
      passages.set(section.id, passage);
      groups.push(
        group(
          section,
          `${orderIndex}-${repeatIndex}-${section.id}`,
          passage,
          totals.get(section.id)!,
        ),
      );
    }
  });
  return groups;
}

function barSignature(bar: ChartBar, chart: SongVersion) {
  const meter = bar.meter ?? chart.meter;
  const [numerator, denominator] = meter.split('/').map(Number);
  const compound = denominator === 8 && numerator >= 6 && numerator % 3 === 0;
  const meterPulses = compound ? numerator / 3 : numerator;
  const pulses = bar.beats_per_bar ?? (bar.meter ? meterPulses : chart.beats_per_bar);
  return { meter, pulses, compound };
}

/** A row never crosses a meter change; CSS may wrap its complete bars on small screens. */
export function buildChartRows(
  bars: ChartDisplayBar[],
  chart: SongVersion,
  maxBars = 4,
): ChartDisplayBar[][] {
  if (!Number.isInteger(maxBars) || maxBars < 1)
    throw new RangeError('Quantidade de compassos inválida.');
  const rows: ChartDisplayBar[][] = [];
  let previousSignature = '';
  for (const display of bars) {
    const { meter, pulses } = barSignature(display.bar, chart);
    const signature = `${meter}:${pulses}`;
    const row = rows.at(-1);
    if (!row || row.length === maxBars || signature !== previousSignature) rows.push([display]);
    else row.push(display);
    previousSignature = signature;
  }
  return rows;
}

export interface ChartBarDescription {
  meter: string;
  pulses: number;
  ticks: { label: string; strong: boolean }[];
  events: { chord: string; beats: number; start: number; span: number }[];
}

/** Place chords on an integer grid without rounding their musical durations. */
export function describeChartBar(bar: ChartBar, chart: SongVersion): ChartBarDescription {
  const { meter, pulses, compound } = barSignature(bar, chart);
  const baseDivision = compound ? 3 : 1;
  const durations = [pulses, ...bar.events.map((event) => event.beats)];
  // Tab spacing is an estimated timeline, not a written rhythmic subdivision.
  // Keep its pulse grid readable without quantizing the notes to a different time.
  const division = bar.tablature
    ? baseDivision
    : Array.from({ length: 48 }, (_, index) => index + 1).find(
        (candidate) =>
          candidate % baseDivision === 0 &&
          durations.every(
            (beats) => Math.abs(beats * candidate - Math.round(beats * candidate)) < 1e-8,
          ),
      );
  if (division === undefined) throw new RangeError('Subdivisão musical não suportada.');
  const ticks = Array.from({ length: Math.round(pulses * division) }, (_, index) => {
    const withinPulse = index % division;
    const label =
      withinPulse === 0
        ? String(Math.floor(index / division) + 1)
        : division === 2
          ? 'e'
          : division === 3
            ? ['la', 'li'][withinPulse - 1]
            : '·';
    return { label, strong: withinPulse === 0 };
  });
  let start = 1;
  const events = bar.events.map((event) => {
    const span = Math.round(event.beats * division);
    const item = { ...event, start, span };
    start += span;
    return item;
  });
  return { meter, pulses, ticks, events };
}
