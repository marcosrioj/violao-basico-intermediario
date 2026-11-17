import type { CSSProperties } from 'react';
import { ArrowRight } from 'lucide-react';
import { chords } from '@/content/chords';
import type { PracticeDiagram, PracticeVisual as Visual } from './practice-visual-types';

function Fingering({ name }: { name: string }) {
  const chord = chords[name];
  if (!chord) return <strong>{name}</strong>;
  const pressed = chord.frets.filter((f): f is number => f !== null && f > 0);
  const start = Math.max(...pressed) > 5 ? Math.min(...pressed) : 1;
  const description = chord.frets
    .map(
      (f, i) =>
        `${6 - i}ª corda: ${f === null ? 'não tocar' : f === 0 ? 'solta' : `casa ${f}, dedo ${chord.fingers[i] ?? 'indicado'}`}`,
    )
    .join('; ');
  return (
    <div className="visual-chord">
      <strong>{chord.display_name ?? name}</strong>
      <svg viewBox="0 0 160 176" role="img" aria-label={`${name}. ${description}`}>
        <text x="8" y="55" className="visual-svg-small">
          {start}ª
        </text>
        {Array.from({ length: 6 }, (_, i) => (
          <g key={i}>
            <line
              x1={36 + i * 20}
              x2={36 + i * 20}
              y1="38"
              y2="138"
              stroke="currentColor"
              strokeWidth={1.8 - i * 0.2}
            />
            <line
              x1="36"
              x2="136"
              y1={38 + i * 20}
              y2={38 + i * 20}
              stroke="currentColor"
              strokeWidth={i === 0 && start === 1 ? 4 : 1}
            />
            <text x={36 + i * 20} y="161" textAnchor="middle" className="visual-svg-small">
              {6 - i}
            </text>
          </g>
        ))}
        {chord.barres.map(([f, from, to], i) => (
          <line
            key={i}
            x1={36 + from * 20}
            x2={36 + to * 20}
            y1={48 + (f - start) * 20}
            y2={48 + (f - start) * 20}
            stroke="var(--color-primary)"
            strokeWidth="16"
            strokeLinecap="round"
          />
        ))}
        {chord.frets.map((f, i) => (
          <g key={i}>
            {f === null || f === 0 ? (
              <text x={36 + i * 20} y="26" textAnchor="middle" fontSize="21">
                {f === null ? '×' : '○'}
              </text>
            ) : (
              <>
                <circle
                  cx={36 + i * 20}
                  cy={48 + (f - start) * 20}
                  r="9"
                  fill="var(--color-primary)"
                />
                <text
                  x={36 + i * 20}
                  y={52 + (f - start) * 20}
                  textAnchor="middle"
                  fontSize="14"
                  fontWeight="700"
                  fill="var(--color-on-primary)"
                >
                  {chord.fingers[i]}
                </text>
              </>
            )}
          </g>
        ))}
      </svg>
      <span className="visual-bass">Comece na {chord.bass_string}ª corda</span>
    </div>
  );
}

function Fretboard({ points }: Extract<PracticeDiagram, { kind: 'fretboard' }>) {
  const end = Math.max(3, ...points.map((p) => p.fret));
  const start = Math.min(1, ...points.map((p) => p.fret));
  const width = 100 + (end - start + 1) * 68;
  const x = (fret: number) => 100 + (fret - start) * 68;
  const description = points
    .map((p) => `${p.note}: ${p.string}ª corda, ${p.fret === 0 ? 'solta' : `casa ${p.fret}`}`)
    .join('; ');
  return (
    <div
      className="visual-scroll"
      role="region"
      tabIndex={0}
      aria-label="Mapa de notas; role para ver todas as casas"
    >
      <svg
        className="visual-fretboard"
        style={{ minWidth: Math.max(340, width) }}
        viewBox={`0 0 ${width} 260`}
        role="img"
        aria-label={description}
      >
        {Array.from({ length: end - start + 1 }, (_, i) => (
          <g key={i}>
            <text x={x(i + start)} y="25" textAnchor="middle" className="visual-svg-small">
              {i + start === 0 ? 'solta' : `casa ${i + start}`}
            </text>
            <line
              x1={x(i + start) + 33}
              x2={x(i + start) + 33}
              y1="44"
              y2="227"
              stroke="var(--color-border-strong)"
            />
          </g>
        ))}
        {['E', 'B', 'G', 'D', 'A', 'E'].map((note, i) => (
          <g key={i}>
            <text x="8" y={58 + i * 34} className="visual-svg-small">
              {i + 1}ª · {note}
            </text>
            <line
              x1="67"
              x2={width - 10}
              y1={54 + i * 34}
              y2={54 + i * 34}
              stroke="currentColor"
              strokeWidth={1 + i * 0.25}
            />
          </g>
        ))}
        {points.map((point, i) => (
          <g key={i}>
            <circle
              cx={x(point.fret)}
              cy={54 + (point.string - 1) * 34}
              r="15"
              fill="var(--color-primary)"
            />
            <text
              x={x(point.fret)}
              y={59 + (point.string - 1) * 34}
              textAnchor="middle"
              fontSize="13"
              fontWeight="700"
              fill="var(--color-on-primary)"
            >
              {point.note}
            </text>
          </g>
        ))}
        <text x="8" y="254" className="visual-svg-small">
          1ª = mais aguda · 6ª = mais grave
        </text>
      </svg>
    </div>
  );
}

function Instrument({ focus }: Extract<PracticeDiagram, { kind: 'instrument' }>) {
  const support = focus === 'support';
  return (
    <svg
      className="visual-instrument"
      viewBox="0 0 560 310"
      role="img"
      aria-label={
        support
          ? 'Instrumento apoiado na perna e junto ao corpo; ombros soltos, braço do violão levemente elevado. A mão que monta o acorde não sustenta o instrumento.'
          : 'Vista do tampo. Encoste levemente a lateral da mão nas cordas junto ao rastilho, na direção da boca. O polegar toca a corda grave.'
      }
    >
      {support && (
        <g fill="none" stroke="var(--color-border-strong)" strokeWidth="13" strokeLinecap="round">
          <circle cx="205" cy="49" r="29" fill="var(--color-surface-selected)" strokeWidth="2" />
          <path d="M202 85 Q158 112 175 204 L284 215 L306 283 M184 200 L151 275 M212 96 Q248 105 265 135" />
        </g>
      )}
      <g transform={support ? 'translate(88 111) rotate(-16 130 50)' : 'translate(50 65)'}>
        <path
          d="M124 5 C92 -22 42 -12 38 29 C35 50 51 57 34 76 C8 112 40 157 83 154 C120 153 139 130 132 103 C127 85 135 75 146 61 C165 38 151 17 124 5Z"
          fill="var(--color-cream)"
          stroke="var(--color-warning-text)"
          strokeWidth="2"
        />
        <rect
          x="115"
          y="39"
          width="212"
          height="31"
          rx="3"
          fill="var(--color-warning-surface)"
          stroke="var(--color-warning-text)"
          strokeWidth="2"
        />
        <rect
          x="327"
          y="34"
          width="51"
          height="41"
          rx="8"
          fill="var(--color-cream)"
          stroke="var(--color-warning-text)"
          strokeWidth="2"
        />
        <circle cx="98" cy="55" r="24" fill="var(--color-inverse)" />
        {[337, 352, 367].map((x) => (
          <g key={x} stroke="var(--color-warning-text)" strokeWidth="2" fill="var(--color-cream)">
            <path d={`M${x} 34 v-8 M${x} 75 v8`} />
            <rect x={x - 4} y="19" width="8" height="7" rx="2" />
            <rect x={x - 4} y="83" width="8" height="7" rx="2" />
          </g>
        ))}
        <circle cx="98" cy="55" r="28" fill="none" stroke="var(--color-warning-text)" />
        <rect x="49" y="32" width="12" height="48" rx="3" fill="var(--color-warning-text)" />
        <line x1="58" y1="34" x2="58" y2="76" stroke="var(--color-surface)" strokeWidth="3" />
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={i}
            x1="58"
            y1={43 + i * 4.5}
            x2="365"
            y2={43 + i * 4.5}
            stroke="var(--color-border-strong)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 9 }, (_, i) => (
          <line
            key={i}
            x1={142 + i * 20}
            x2={142 + i * 20}
            y1="39"
            y2="70"
            stroke="var(--color-warning-text)"
          />
        ))}
        {!support && (
          <>
            <path
              d="M35 4 Q51 -5 63 7 L74 47 Q78 61 65 65 Q56 65 53 53 L42 35"
              fill="var(--color-surface-selected)"
              stroke="var(--color-primary)"
              strokeWidth="3"
            />
            <circle
              cx="65"
              cy="47"
              r="18"
              fill="none"
              stroke="var(--color-accent)"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          </>
        )}
      </g>
      <g fill="none" stroke="var(--color-accent)" strokeWidth="2">
        {support ? (
          <>
            <path d="M74 50 H125 L171 104" />
            <path d="M390 222 H340 L277 175" />
            <path d="M53 251 H96 L161 216" />
          </>
        ) : (
          <>
            <path d="M34 48 H96 L113 76" />
            <path d="M245 239 V216 L148 148" />
            <path d="M47 238 V180 L108 141" />
          </>
        )}
      </g>
      <g className="visual-svg-label">
        <text x="20" y="39">
          {support ? 'Ombros soltos' : 'Contato leve'}
        </text>
        <text x={support ? 352 : 190} y={support ? 247 : 263}>
          {support ? 'Braço elevado' : 'Boca do violão'}
        </text>
        <text x="20" y={support ? 278 : 263}>
          {support ? 'Apoio na perna' : 'Rastilho'}
        </text>
      </g>
    </svg>
  );
}

function Diagram({ diagram }: { diagram: PracticeDiagram }) {
  switch (diagram.kind) {
    case 'chords':
      return (
        <div className="visual-chords">
          {diagram.names.map((name, i) => (
            <Fingering key={`${name}-${i}`} name={name} />
          ))}
        </div>
      );
    case 'fretboard':
      return <Fretboard {...diagram} />;
    case 'instrument':
      return (
        <div
          className="visual-scroll"
          role="region"
          tabIndex={0}
          aria-label="Ilustração do violão; role para ver o desenho inteiro"
        >
          <Instrument {...diagram} />
        </div>
      );
    case 'rhythm':
      return (
        <div className="visual-rhythm">
          {diagram.groups.map((group, i) => (
            <div className="visual-rhythm-group" key={i}>
              <p className="visual-group-label">{group.label}</p>
              <div
                className="visual-pulses"
                style={{ '--cells': group.cells.length } as CSSProperties}
              >
                {group.cells.map((cell, j) => (
                  <div className="visual-pulse" key={j}>
                    <span>{cell.count}</span>
                    <strong>{cell.action}</strong>
                    {cell.detail && <small>{cell.detail}</small>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    case 'sequence':
    case 'dynamics':
      return (
        <ol className={`visual-sequence ${diagram.kind === 'dynamics' ? 'visual-dynamics' : ''}`}>
          {diagram.items.map((item, i) => (
            <li key={i}>
              <span className="visual-sequence-number">{String(i + 1).padStart(2, '0')}</span>
              {'level' in item && (
                <div className="visual-level" aria-hidden="true">
                  <span style={{ height: `${item.level * 20}%` }} />
                </div>
              )}
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
              {i < diagram.items.length - 1 && <ArrowRight size={18} aria-hidden="true" />}
            </li>
          ))}
        </ol>
      );
    case 'bars':
      return (
        <div className="visual-bars">
          {diagram.bars.map((bar, i) => (
            <div className="visual-bar" key={i}>
              <div className="visual-bar-label">
                <strong>{bar.label}</strong>
                <span>{bar.meter}</span>
              </div>
              <div
                className="visual-bar-grid"
                style={{ gridTemplateColumns: `repeat(${bar.ticks.length}, minmax(0, 1fr))` }}
              >
                {bar.events.map((event, j) => (
                  <strong
                    key={`e${j}`}
                    style={{ gridColumn: `${event.start} / span ${event.span}` }}
                    aria-label={`${event.chord}, ${event.beats} ${event.beats === 1 ? 'pulso' : 'pulsos'}`}
                  >
                    {event.chord}
                  </strong>
                ))}
                {bar.ticks.map((tick, j) => (
                  <span
                    key={`t${j}`}
                    className={tick.strong ? 'strong' : ''}
                    style={{ gridRow: 2, gridColumn: j + 1 }}
                  >
                    {tick.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
  }
}

/** No editorial imports: safe to reuse with the selected data in a teacher slide. */
export function PracticeVisual({ visual }: { visual: Visual }) {
  return (
    <figure className="practice-visual">
      <div className="visual-heading">
        <span className="eyebrow">OBSERVE NO DESENHO</span>
        <strong>{visual.title}</strong>
      </div>
      <div className="visual-canvas">
        <Diagram diagram={visual.diagram} />
      </div>
      <figcaption>{visual.caption}</figcaption>
    </figure>
  );
}
