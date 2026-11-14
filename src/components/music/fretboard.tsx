'use client';
import { useState } from 'react';
import { frequency, openMidi, playTone } from './audio';
const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export function Fretboard() {
  const [root, setRoot] = useState(0);
  const [mode, setMode] = useState('major');
  const [selected, setSelected] = useState('Toque em uma nota para ouvi-la.');
  const intervals =
    mode === 'major'
      ? [0, 2, 4, 5, 7, 9, 11]
      : mode === 'minor'
        ? [0, 2, 3, 5, 7, 8, 10]
        : [0, 2, 4, 7, 9];
  return (
    <section className="card">
      <div className="section-title">
        <div>
          <p className="eyebrow">TEORIA QUE VOCÊ PODE OUVIR</p>
          <h2>Explore o braço</h2>
        </div>
        <span className="badge">Escalas</span>
      </div>
      <div className="control-row">
        <label>
          Tônica
          <select value={root} onChange={(e) => setRoot(Number(e.target.value))}>
            {names.map((n, i) => (
              <option value={i} key={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Escala
          <select value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="major">Maior</option>
            <option value="minor">Menor natural</option>
            <option value="pentatonic">Pentatônica maior</option>
          </select>
        </label>
      </div>
      <div className="scale-notes">
        {intervals.map((n, i) => (
          <span key={n}>
            {i + 1}
            <strong>{names[(n + root) % 12]}</strong>
          </span>
        ))}
      </div>
      <div className="fretboard-scroll">
        <div className="fretboard">
          {[...openMidi].reverse().map((midi, string) => (
            <div className="fretboard-string" key={midi}>
              <span>{string + 1}ª</span>
              {Array.from({ length: 13 }, (_, fret) => {
                const pitch = (midi + fret) % 12;
                const visible = intervals.includes((pitch - root + 12) % 12);
                return (
                  <button
                    key={fret}
                    className={`${visible ? 'in-scale' : ''} ${pitch === root ? 'root-note' : ''}`}
                    aria-label={`${string + 1}ª corda, ${fret === 0 ? 'solta' : `casa ${fret}`}, ${names[pitch]}`}
                    onClick={() => {
                      playTone(frequency(midi + fret));
                      setSelected(
                        `${names[pitch]} · ${string + 1}ª corda · ${fret === 0 ? 'solta' : `casa ${fret}`}`,
                      );
                    }}
                  >
                    {visible ? names[pitch] : <span className="fret-dot">·</span>}
                  </button>
                );
              })}
            </div>
          ))}
          <div className="fret-numbers">
            <span />
            {Array.from({ length: 13 }, (_, i) => (
              <span key={i}>{i}</span>
            ))}
          </div>
        </div>
      </div>
      <p className="hint" aria-live="polite">
        {selected} A tônica está destacada em terracota; a 1ª corda está em cima.
      </p>
    </section>
  );
}
