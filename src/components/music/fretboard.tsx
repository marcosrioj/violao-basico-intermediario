'use client';
import { useState } from 'react';
import { frequency, openMidi, playTone } from './audio';
import { scaleNotes, scaleRoots, type ScaleKind } from './scales';
const names = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
export function Fretboard() {
  const [root, setRoot] = useState(0);
  const [mode, setMode] = useState<ScaleKind>('major');
  const [selected, setSelected] = useState('Toque em uma nota para ouvi-la.');
  const scale = scaleNotes(root, mode);
  const notesByPitch = new Map(scale.map((note) => [note.pitch, note.name]));
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
            {scaleRoots.map((n, i) => (
              <option value={i} key={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
        <label>
          Escala
          <select value={mode} onChange={(e) => setMode(e.target.value as ScaleKind)}>
            <option value="major">Maior</option>
            <option value="minor">Menor natural</option>
            <option value="pentatonic">Pentatônica maior</option>
          </select>
        </label>
      </div>
      <div className="scale-notes">
        {scale.map((note) => (
          <span key={note.degree}>
            {note.degree}
            <strong>{note.name}</strong>
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
                const visible = notesByPitch.has(pitch);
                const name = notesByPitch.get(pitch) ?? names[pitch];
                return (
                  <button
                    key={fret}
                    className={`${visible ? 'in-scale' : ''} ${pitch === root ? 'root-note' : ''}`}
                    aria-label={`${string + 1}ª corda, ${fret === 0 ? 'solta' : `casa ${fret}`}, ${name}`}
                    onClick={() => {
                      playTone(frequency(midi + fret));
                      setSelected(
                        `${name} · ${string + 1}ª corda · ${fret === 0 ? 'solta' : `casa ${fret}`}`,
                      );
                    }}
                  >
                    {visible ? name : <span className="fret-dot">·</span>}
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
