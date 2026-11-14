import { memo, useId, type CSSProperties } from 'react';
import { Play, Repeat2 } from 'lucide-react';
import type { ChartBar, SongVersion } from '@/content/types';
import { buildChartRows, describeChartBar, type ChartGroup } from './chart-layout';

function barReference(sectionId: string, index: number) {
  return `${sectionId}${/\d$/.test(sectionId) ? '.' : ''}${index + 1}`;
}

function ChordName({ value }: { value: string }) {
  const bass = value.indexOf('/');
  if (bass < 0) return value;
  return (
    <>
      {value.slice(0, bass)}
      <wbr />
      {value.slice(bass)}
    </>
  );
}

/** The arrangement, isolated practice and reference map share the same musical layout. */
export const ChartSection = memo(function ChartSection({
  group,
  chart,
  position = -1,
  activeTick = -1,
  sequence,
  reference = false,
  onPreview,
  onStart,
  paused = false,
  repeating = false,
  onRepeat,
}: {
  group: ChartGroup;
  chart: SongVersion;
  position?: number;
  activeTick?: number;
  sequence?: number;
  reference?: boolean;
  onPreview?: (bar: ChartBar) => void;
  onStart?: (playbackIndex: number, sectionId: string) => void;
  paused?: boolean;
  repeating?: boolean;
  onRepeat?: (group: ChartGroup, enabled: boolean) => void;
}) {
  const heading = useId();
  const rows = buildChartRows(group.bars, chart);
  return (
    <section
      className={`chart-section${repeating ? ' is-repeating' : ''}`}
      aria-labelledby={!reference && group.passages > 1 ? `${heading} ${heading}-passage` : heading}
      id={reference ? `section-${group.sectionId}` : undefined}
    >
      <header className="chart-section-heading">
        {sequence !== undefined && (
          <span className="chart-sequence" aria-hidden="true">
            {String(sequence).padStart(2, '0')}
          </span>
        )}
        <div>
          <h3 id={heading}>{group.title}</h3>
          <p>
            {group.sectionId} · {group.bars.length}{' '}
            {group.bars.length === 1 ? 'compasso' : 'compassos'}
            {!reference && group.passages > 1 && (
              <span id={`${heading}-passage`}>
                {' '}
                · Passagem {group.passage} de {group.passages}
              </span>
            )}
          </p>
        </div>
        <div className="chart-section-actions">
          {onStart && group.bars.length > 0 && (
            <button
              type="button"
              className="button small secondary chart-start"
              aria-label={`Tocar daqui: ${group.title}${!reference && group.passages > 1 ? `, passagem ${group.passage}` : ''}`}
              onClick={() => onStart(group.bars[0].playbackIndex, group.sectionId)}
            >
              <Play size={14} aria-hidden="true" /> Tocar daqui
            </button>
          )}
          {onRepeat && group.bars.length > 0 && (
            <label className="checkbox-label chart-repeat">
              <input
                type="checkbox"
                checked={repeating}
                aria-label={`Repetir trecho: ${group.title}${!reference && group.passages > 1 ? `, passagem ${group.passage}` : ''}`}
                onChange={(event) => onRepeat(group, event.target.checked)}
              />
              <Repeat2 size={16} aria-hidden="true" /> Repetir
            </label>
          )}
        </div>
      </header>
      <div className="chart-rows">
        {rows.map((row) => {
          const first = row[0];
          const last = row[row.length - 1];
          const meter = describeChartBar(first.bar, chart).meter;
          return (
            <div className="chart-row" key={first.barIndex}>
              <p className="chart-row-label">
                <span>
                  {row.length === 1 ? 'Compasso' : 'Compassos'}{' '}
                  {barReference(group.sectionId, first.barIndex)}
                  {row.length > 1 && `–${barReference(group.sectionId, last.barIndex)}`}
                </span>
                <span className="chart-meter">{meter}</span>
              </p>
              <div className="chart-bars">
                {row.map(({ bar, barIndex, playbackIndex }) => {
                  const rhythm = describeChartBar(bar, chart);
                  const current = !reference && position === playbackIndex;
                  const label = barReference(group.sectionId, barIndex);
                  const description = `Compasso ${label}, ${rhythm.meter}: ${bar.events
                    .map(
                      (event) =>
                        `${event.chord}, ${event.beats.toLocaleString('pt-BR')} ${event.beats === 1 ? 'pulso' : 'pulsos'}`,
                    )
                    .join('; ')}`;
                  const content = (
                    <>
                      <span className="chart-bar-heading">
                        <span>{label}</span>
                        {current && (
                          <span className="chart-playing">{paused ? 'Pausado' : 'Tocando'}</span>
                        )}
                      </span>
                      <span
                        className="chart-pulses"
                        style={{ '--chart-ticks': rhythm.ticks.length } as CSSProperties}
                        aria-hidden="true"
                      >
                        {rhythm.events.map((event, index) => (
                          <span
                            className="chart-event"
                            style={{ gridColumn: `${event.start} / span ${event.span}` }}
                            key={index}
                          >
                            <strong>
                              <ChordName value={event.chord} />
                            </strong>
                            <span className="chart-duration">
                              {event.beats.toLocaleString('pt-BR')}{' '}
                              {event.beats === 1 ? 'pulso' : 'pulsos'}
                            </span>
                          </span>
                        ))}
                        {rhythm.ticks.map((tick, index) => (
                          <span
                            className={`chart-tick${tick.strong ? ' strong' : ''}${current && activeTick === index ? ' active' : ''}`}
                            style={{ gridColumn: index + 1 }}
                            key={`tick-${index}`}
                          >
                            {tick.label}
                          </span>
                        ))}
                      </span>
                    </>
                  );
                  return onPreview ? (
                    <button
                      type="button"
                      className={`chart-bar${current ? ' current' : ''}`}
                      aria-label={`${description}. Ouvir primeiro acorde.`}
                      aria-current={current ? 'step' : undefined}
                      onClick={() => onPreview(bar)}
                      key={barIndex}
                    >
                      {content}
                    </button>
                  ) : (
                    <div
                      className="chart-bar"
                      id={reference ? `bar-${group.sectionId}-${barIndex}` : undefined}
                      key={barIndex}
                      role="group"
                      aria-label={description}
                    >
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
