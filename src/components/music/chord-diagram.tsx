'use client';
import { useEffect, useRef } from 'react';
import { Volume2 } from 'lucide-react';
import { chords } from '@/content/chords';
import { soundChord } from './audio';
export function ChordDiagram({ name }: { name: string }) {
  const chord = chords[name];
  const voice = useRef<(() => void) | null>(null);
  useEffect(() => {
    const stop = () => {
      voice.current?.();
      voice.current = null;
    };
    const stopHidden = () => {
      if (document.hidden) stop();
    };
    document.addEventListener('visibilitychange', stopHidden);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', stopHidden);
    };
  }, [name]);
  if (!chord) return <span className="badge">{name}</span>;
  const fretted = chord.frets.filter((x): x is number => x !== null && x > 0);
  const start = Math.max(...fretted) > 5 ? Math.min(...fretted) : 1;
  return (
    <article className="chord-card">
      <button
        type="button"
        onClick={() => {
          voice.current?.();
          voice.current = soundChord(chord.frets);
        }}
        className="chord-title"
        aria-label={`Ouvir acorde ${name}`}
      >
        <strong>{chord.display_name ?? name}</strong>
        <Volume2 size={16} aria-hidden="true" />
      </button>
      <svg
        viewBox="0 0 150 155"
        role="img"
        aria-label={`${name}. Cordas da sexta à primeira: ${chord.frets.map((f) => (f === null ? 'não tocar' : f === 0 ? 'solta' : `casa ${f}`)).join(', ')}`}
      >
        <text x="8" y="48" className="fret-label">
          {start}ª
        </text>
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={`s${i}`}
            x1={32 + i * 18}
            x2={32 + i * 18}
            y1="30"
            y2="130"
            stroke="currentColor"
            strokeWidth={i < 3 ? 1.5 : 1}
          />
        ))}
        {Array.from({ length: 6 }, (_, i) => (
          <line
            key={`f${i}`}
            x1="32"
            x2="122"
            y1={30 + i * 20}
            y2={30 + i * 20}
            stroke="currentColor"
            strokeWidth={i === 0 && start === 1 ? 4 : 1}
          />
        ))}
        {chord.barres.map(([f, from, to], i) => (
          <line
            key={`b${i}`}
            x1={32 + from * 18}
            x2={32 + to * 18}
            y1={40 + (f - start) * 20}
            y2={40 + (f - start) * 20}
            stroke="var(--green)"
            strokeWidth="12"
            strokeLinecap="round"
          />
        ))}
        {chord.frets.map((f, i) => (
          <g key={i}>
            {f === 0 || f === null ? (
              <text x={32 + i * 18} y="21" textAnchor="middle" fontSize="15">
                {f === null ? '×' : '○'}
              </text>
            ) : (
              <>
                <circle cx={32 + i * 18} cy={40 + (f - start) * 20} r="7.6" fill="var(--green)" />
                <text
                  x={32 + i * 18}
                  y={44 + (f - start) * 20}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                >
                  {chord.fingers[i] ?? ''}
                </text>
              </>
            )}
            <text x={32 + i * 18} y="147" textAnchor="middle" fontSize="9">
              {6 - i}
            </text>
          </g>
        ))}
      </svg>
      <small>{chord.notes.join(' · ')}</small>
      <p>{chord.tip}</p>
    </article>
  );
}
