'use client';
import { useEffect, useRef, useState } from 'react';
import { chords } from '@/content/chords';
import { chordFamilies, matchesChord, rootNames } from '@/content/chord-library';
import { ChordDiagram } from './chord-diagram';
import { soundChord } from './audio';
import { Hint } from '@/components/ui/hint';

export function ChordLibrary() {
  const [query, setQuery] = useState('');
  const [root, setRoot] = useState('');
  const voice = useRef<(() => void) | null>(null);
  function stop() {
    voice.current?.();
    voice.current = null;
  }
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) {
        voice.current?.();
        voice.current = null;
      }
    };
    document.addEventListener('visibilitychange', hidden);
    return () => {
      voice.current?.();
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);
  const groups = chordFamilies
    .map((family) => ({
      ...family,
      names: family.names.filter((name) => matchesChord(name, root, query)),
    }))
    .filter((family) => family.names.length);
  const count = groups.reduce((total, family) => total + family.names.length, 0);
  return (
    <section
      className="card lab-workshop section chord-library"
      aria-labelledby="chord-library-title"
    >
      <div className="section-title">
        <h2 id="chord-library-title">Ouça os acordes do curso</h2>
        <Hint label="Explorar os acordes">
          Abra um grupo para ver os diagramas. Filtre pela nota base ou busque uma cifra, como
          Dsus4, ou um nome, como Ré. Toque no nome do acorde para ouvir; outra escolha encerra o
          som anterior. O áudio é uma referência sintética.
        </Hint>
      </div>
      <p>
        Uma nota é um som; um acorde reúne notas. C = Dó, D = Ré, E = Mi, F = Fá, G = Sol, A = Lá e
        B = Si. # eleva um semitom; b abaixa um semitom.
      </p>
      <div className="filter-bar">
        <label>
          Buscar acorde
          <input
            type="search"
            placeholder="D, Dsus4, Bm reduzido, Ré…"
            value={query}
            onChange={(e) => {
              stop();
              setQuery(e.target.value);
            }}
          />
        </label>
        <label>
          Nota base
          <select
            value={root}
            onChange={(e) => {
              stop();
              setRoot(e.target.value);
            }}
          >
            <option value="">Todas as notas</option>
            {Object.entries(rootNames).map(([note, name]) => (
              <option key={note} value={note}>
                {note} · {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="control-row">
        <p role="status" aria-live="polite">
          {count} de {Object.keys(chords).length} acordes e posições
        </p>
        {(root || query) && (
          <button
            className="button small secondary"
            onClick={() => {
              stop();
              setRoot('');
              setQuery('');
            }}
          >
            Limpar filtros
          </button>
        )}
        <button className="button small secondary" onClick={stop}>
          Parar som
        </button>
      </div>
      <p className="hint">
        × não tocar · ○ corda solta · dedos: 1 indicador, 2 médio, 3 anelar, 4 mínimo. Leia as
        cordas da 6ª à 1ª. As notas abaixo do desenho seguem essa mesma ordem.
      </p>
      <div className="chord-library-groups">
        {groups.map((family) => (
          <details
            key={`${family.id}-${root}-${query}`}
            open={Boolean(root || query) || family.id === 'start'}
          >
            <summary>
              {family.title} <span className="badge">{family.names.length}</span>
            </summary>
            <p>{family.description}</p>
            <div className="chord-grid">
              {family.names.map((name) => (
                <ChordDiagram
                  key={name}
                  name={name}
                  onPlay={() => {
                    stop();
                    voice.current = soundChord(chords[name].frets);
                  }}
                />
              ))}
            </div>
          </details>
        ))}
      </div>
      {!count && (
        <p className="empty">Nenhum acorde encontrado. Limpe os filtros ou tente outra cifra.</p>
      )}
      <p>
        Monte uma forma no violão e toque uma corda de cada vez. Compare o som com a referência;
        depois tente montar o acorde sem consultar o desenho.
      </p>
    </section>
  );
}
