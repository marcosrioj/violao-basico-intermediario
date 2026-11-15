'use client';

import { useId, useState, type ChangeEvent } from 'react';
import { validateLyricCues, type LyricCue, type LyricSyllable } from './chart-lyrics';
import type { PlaybackSnapshot } from './chart-transport';
import { estimateLyricSyllables } from './lyric-syllables';

interface DraftCue {
  text: string;
  startBeat?: number;
  endBeat?: number;
  syllables?: LyricSyllable[];
}

export function ChartLyricsEditor({
  cues,
  storageKey,
  totalBeats,
  bpm,
  canMark,
  readPosition,
  onPrepare,
  onPause,
  onSave,
  notice,
  baseAvailable = false,
  customized = false,
}: {
  cues: LyricCue[];
  storageKey: string;
  totalBeats: number;
  bpm: number;
  canMark: boolean;
  readPosition: () => PlaybackSnapshot | null;
  onPrepare: () => void;
  onPause: () => void;
  onSave: (cues: LyricCue[]) => boolean;
  notice: string;
  baseAvailable?: boolean;
  customized?: boolean;
}) {
  const id = useId();
  const [text, setText] = useState('');
  const [draft, setDraft] = useState<DraftCue[]>([]);
  const [selected, setSelected] = useState(0);
  const [selectedSyllable, setSelectedSyllable] = useState(0);
  const [division, setDivision] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const current = draft[selected];
  const currentSyllable = current?.syllables?.[selectedSyllable];
  function clearFeedback() {
    setMessage('');
    setError('');
  }
  function update(field: 'startBeat' | 'endBeat', value: number | undefined) {
    setDraft((items) =>
      items.map((item, index) =>
        index === selected ? { ...item, [field]: value, syllables: undefined } : item,
      ),
    );
    clearFeedback();
  }
  function updateText(value: string) {
    const next = draft.map((cue, index) =>
      index === selected ? { ...cue, text: value, syllables: undefined } : cue,
    );
    setDivision(null);
    setDraft(next);
    // Keep a separately edited full-text draft intact until the user prepares it.
    if (
      text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .join('\n') ===
      draft
        .map((cue) => cue.text.trim())
        .filter(Boolean)
        .join('\n')
    )
      setText(next.map((cue) => cue.text).join('\n'));
    clearFeedback();
  }
  function preparePhrases() {
    clearFeedback();
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    if (lines.length > 1000) {
      setError('Use até 1.000 frases por arranjo.');
      return;
    }
    const sameCount = lines.length === draft.length;
    const used = new Set<number>();
    setDraft(
      lines.map((line, index) => {
        const previousIndex = sameCount
          ? index
          : draft.findIndex((cue, candidate) => !used.has(candidate) && cue.text.trim() === line);
        if (previousIndex < 0) return { text: line };
        used.add(previousIndex);
        return {
          ...draft[previousIndex],
          text: line,
          syllables:
            draft[previousIndex].text === line ? draft[previousIndex].syllables : undefined,
        };
      }),
    );
    setSelected(0);
    setSelectedSyllable(0);
    setDivision(null);
    setMessage(
      !draft.length
        ? 'Frases preparadas. Marque os tempos antes de salvar.'
        : sameCount
          ? 'Textos atualizados e tempos preservados. Confira a sincronização antes de salvar.'
          : 'A quantidade de frases mudou. Tempos de frases iguais foram preservados; marque as novas e revise a ordem antes de salvar.',
    );
  }
  function mark(field: 'startBeat' | 'endBeat') {
    clearFeedback();
    const position = readPosition();
    if (!canMark || !position || position.status === 'idle') {
      setError('Inicie o arranjo completo sem repetição de estudo para marcar a frase.');
      return;
    }
    const beat = Math.min(totalBeats, (position.scoreSeconds * bpm) / 60);
    if (field === 'endBeat' && (current?.startBeat === undefined || beat <= current.startBeat)) {
      setError('Marque o fim depois do início da frase.');
      return;
    }
    update(field, Math.round(beat * 10000) / 10000);
    setMessage(field === 'startBeat' ? 'Entrada marcada.' : 'Saída marcada.');
  }
  function save() {
    clearFeedback();
    try {
      const checked = validateLyricCues(draft, totalBeats);
      if (!checked.length) throw new Error('Prepare ao menos uma frase antes de salvar.');
      const persisted = onSave(checked);
      setMessage(
        persisted ? 'Letra sincronizada salva neste navegador.' : 'Letra aplicada nesta sessão.',
      );
      setError('');
    } catch (problem) {
      setError(problem instanceof Error ? problem.message : 'Confira os tempos de cada frase.');
    }
  }
  function prepareSyllables() {
    clearFeedback();
    try {
      const checked = validateLyricCues(
        [{ text: current.text, startBeat: current.startBeat, endBeat: current.endBeat }],
        totalBeats,
      )[0];
      const parts = division?.split('|');
      if (parts && (parts.join('') !== checked.text || parts.some((part) => !part.trim())))
        throw new Error(
          'Use | somente para separar sílabas, preservando todas as letras e espaços da frase.',
        );
      let syllables = estimateLyricSyllables(checked);
      if (parts) {
        let offset = 0;
        const span = checked.endBeat - checked.startBeat;
        // Explicitly an initial preview; replace each estimate with the measured vocal marks.
        const weights = parts.map((_, index) => (index === parts.length - 1 ? 2 : 1));
        const sum = weights.reduce((a, b) => a + b, 0);
        let beat = checked.startBeat;
        syllables = parts.map((part, index) => {
          const from = offset;
          offset += part.length;
          const startBeat = beat;
          beat =
            index === parts.length - 1 ? checked.endBeat : beat + (span * weights[index]) / sum;
          return { from, to: offset, startBeat, endBeat: beat, timing: 'estimated' };
        });
      }
      setDraft((items) =>
        items.map((cue, index) => (index === selected ? { ...cue, syllables } : cue)),
      );
      setSelectedSyllable(0);
      setDivision(null);
      setMessage(
        'Divisão preparada com tempos estimados. Marque a entrada e a saída de cada sílaba para conferir o canto.',
      );
    } catch (problem) {
      setError(
        problem instanceof Error ? problem.message : 'Marque o início e o fim da frase primeiro.',
      );
    }
  }
  function updateSyllable(field: 'startBeat' | 'endBeat', value: number) {
    clearFeedback();
    setDraft((items) =>
      items.map((cue, index) =>
        index === selected
          ? {
              ...cue,
              syllables: cue.syllables?.map((part, partIndex) =>
                partIndex === selectedSyllable
                  ? { ...part, [field]: value, timing: 'manual' }
                  : part,
              ),
            }
          : cue,
      ),
    );
  }
  function markSyllable(field: 'startBeat' | 'endBeat') {
    const position = readPosition();
    if (!canMark || !position || position.status === 'idle' || position.waitingForAudio) return;
    updateSyllable(field, Math.round(((position.scoreSeconds * bpm) / 60) * 10000) / 10000);
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    clearFeedback();
    try {
      if (file.size > 500_000) throw new Error('Escolha uma cópia de até 500 KB.');
      const imported: unknown = JSON.parse(await file.text());
      if (!imported || typeof imported !== 'object' || Array.isArray(imported))
        throw new Error('Escolha uma cópia de sincronização exportada pelo player.');
      const fileData = imported as Record<string, unknown>;
      if (fileData.format !== 1)
        throw new Error('O formato da cópia não é compatível. Exporte uma nova cópia pelo player.');
      if (fileData.chart !== storageKey)
        throw new Error('Esta cópia pertence a outro arranjo. Use a mesma música e versão.');
      const checked = validateLyricCues(fileData.cues, totalBeats);
      setDraft(checked);
      setText(checked.map((cue) => cue.text).join('\n'));
      setSelected(0);
      setSelectedSyllable(0);
      setDivision(null);
      setError('');
      setMessage('Cópia carregada para revisão. Salve para aplicar à cifra.');
    } catch (problem) {
      setMessage('');
      setError(
        problem instanceof SyntaxError
          ? 'O arquivo não contém uma cópia válida. Exporte novamente a sincronização pelo player.'
          : problem instanceof Error
            ? problem.message
            : 'Não foi possível importar a cópia.',
      );
    }
  }
  function exportFile() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify({ format: 1, chart: storageKey, cues }, null, 2)], {
        type: 'application/json',
      }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = 'letra-sincronizada.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <details className="chart-lyrics-editor section">
      <summary>
        {cues.length ? 'Editar letra e sincronização' : 'Adicionar letra e sincronizar'}
      </summary>
      <div className="stack">
        <p>
          Cole o texto que você quer acompanhar, com uma frase por linha. Ouça o arranjo e marque a
          entrada e a saída de cada frase. Em “Ajustar sílabas”, confira a divisão e marque os
          tempos individuais, incluindo as vogais que ficam sustentadas.
        </p>
        <p className="hint">
          As marcações acompanham os acordes da aula, inclusive ao mudar o BPM. Cada passagem tem
          seu próprio texto. A letra fica apenas neste navegador, disponível nas aulas desta mesma
          versão; exporte uma cópia para usar em outro dispositivo.
        </p>
        <label htmlFor={`${id}-text`}>Sua letra · uma frase por linha</label>
        <textarea
          id={`${id}-text`}
          rows={5}
          value={text}
          maxLength={60_000}
          onChange={(event) => {
            setText(event.target.value);
            clearFeedback();
          }}
          placeholder="Cole aqui o texto que você vai sincronizar."
        />
        <div className="control-row">
          <button
            type="button"
            className="button secondary"
            disabled={!text.trim()}
            onClick={preparePhrases}
          >
            Preparar frases
          </button>
          {cues.length > 0 && (
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setDraft(cues.map((cue) => ({ ...cue })));
                setText(cues.map((cue) => cue.text).join('\n'));
                setSelected(0);
                setSelectedSyllable(0);
                setDivision(null);
                setError('');
                setMessage('Marcações salvas carregadas para edição.');
              }}
            >
              Carregar marcações salvas
            </button>
          )}
        </div>
        {current && (
          <div className="chart-lyrics-timing stack">
            <label htmlFor={`${id}-phrase`}>Frase para marcar</label>
            <select
              id={`${id}-phrase`}
              value={selected}
              onChange={(event) => {
                setSelected(Number(event.target.value));
                setSelectedSyllable(0);
                setDivision(null);
                clearFeedback();
              }}
            >
              {draft.map((cue, index) => (
                <option value={index} key={index}>
                  {index + 1}. {cue.text}
                </option>
              ))}
            </select>
            <label htmlFor={`${id}-phrase-text`}>
              Texto desta frase · mantém os tempos marcados
            </label>
            <input
              id={`${id}-phrase-text`}
              type="text"
              value={current.text}
              maxLength={6000}
              onChange={(event) => updateText(event.target.value)}
            />
            <div className="control-row">
              <button type="button" className="button secondary" onClick={onPrepare}>
                Ouvir do início para marcar
              </button>
              <button type="button" className="button secondary" onClick={onPause}>
                Pausar / continuar marcação
              </button>
            </div>
            <div className="chart-lyrics-markers">
              <button
                type="button"
                className="button"
                disabled={!canMark}
                onClick={() => mark('startBeat')}
              >
                Marcar entrada
              </button>
              <button
                type="button"
                className="button"
                disabled={!canMark || current.startBeat === undefined}
                onClick={() => mark('endBeat')}
              >
                Marcar saída
              </button>
              <button
                type="button"
                className="button secondary"
                disabled={selected >= draft.length - 1}
                onClick={() => {
                  setSelected((index) => index + 1);
                  clearFeedback();
                }}
              >
                Próxima frase
              </button>
            </div>
            <div className="chart-lyrics-fields">
              {(['startBeat', 'endBeat'] as const).map((field) => (
                <div key={field}>
                  <label htmlFor={`${id}-${field}`}>
                    {field === 'startBeat' ? 'Entrada' : 'Saída'} · pulso desde o início
                  </label>
                  <input
                    id={`${id}-${field}`}
                    type="number"
                    min={0}
                    max={totalBeats}
                    step="any"
                    value={current[field] ?? ''}
                    onChange={(event) =>
                      update(
                        field,
                        event.target.value === '' ? undefined : Number(event.target.value),
                      )
                    }
                  />
                  <span className="control-row">
                    <button
                      type="button"
                      className="button small secondary"
                      disabled={current[field] === undefined || current[field]! < 0.1}
                      aria-label={`Antecipar ${field === 'startBeat' ? 'entrada' : 'saída'} em 0,1 pulso`}
                      onClick={() =>
                        update(field, Math.round((current[field]! - 0.1) * 10000) / 10000)
                      }
                    >
                      −0,1 pulso
                    </button>
                    <button
                      type="button"
                      className="button small secondary"
                      disabled={current[field] === undefined || current[field]! + 0.1 > totalBeats}
                      aria-label={`Atrasar ${field === 'startBeat' ? 'entrada' : 'saída'} em 0,1 pulso`}
                      onClick={() =>
                        update(field, Math.round((current[field]! + 0.1) * 10000) / 10000)
                      }
                    >
                      +0,1 pulso
                    </button>
                  </span>
                </div>
              ))}
            </div>
            <p className="hint">
              O início do arranjo é o pulso 0. Valores decimais permitem ajustes finos; deixe espaço
              entre a saída de uma frase e a entrada da próxima para as pausas. Em 6/8, conte dois
              pulsos por compasso.
            </p>
            {selected === draft.length - 1 && (
              <button
                type="button"
                className="button secondary"
                disabled={current.startBeat === undefined || current.startBeat >= totalBeats}
                onClick={() => update('endBeat', totalBeats)}
              >
                Terminar a última frase junto com o arranjo
              </button>
            )}
            <details className="section">
              <summary>Ajustar sílabas e sustentações</summary>
              <div className="stack">
                <label htmlFor={`${id}-division`}>Divisão da frase · use | entre as sílabas</label>
                <input
                  id={`${id}-division`}
                  value={
                    division ??
                    current.syllables
                      ?.map((part) => current.text.slice(part.from, part.to))
                      .join('|') ??
                    current.text
                  }
                  onChange={(event) => setDivision(event.target.value)}
                />
                <button type="button" className="button secondary" onClick={prepareSyllables}>
                  Preparar divisão silábica
                </button>
                <p className="hint">
                  As divisões e durações iniciais são estimadas. Ajuste a entrada e a saída para
                  acompanhar a voz; deixe intervalos para pausas. Alterar os tempos da frase
                  reinicia a divisão.
                </p>
                {current.syllables && (
                  <>
                    <label htmlFor={`${id}-syllable`}>Sílaba para ajustar</label>
                    <select
                      id={`${id}-syllable`}
                      value={selectedSyllable}
                      onChange={(event) => {
                        setSelectedSyllable(Number(event.target.value));
                        clearFeedback();
                      }}
                    >
                      {current.syllables.map((part, index) => (
                        <option key={index} value={index}>
                          {index + 1}. {current.text.slice(part.from, part.to).trim()}
                        </option>
                      ))}
                    </select>
                    {currentSyllable && (
                      <>
                        <div className="chart-lyrics-fields">
                          {(['startBeat', 'endBeat'] as const).map((field) => (
                            <div key={field}>
                              <label htmlFor={`${id}-syllable-${field}`}>
                                {field === 'startBeat' ? 'Entrada' : 'Saída'} da sílaba · pulso
                              </label>
                              <input
                                id={`${id}-syllable-${field}`}
                                type="number"
                                step="any"
                                min={current.startBeat}
                                max={current.endBeat}
                                value={
                                  Number.isFinite(currentSyllable[field])
                                    ? currentSyllable[field]
                                    : ''
                                }
                                onChange={(event) =>
                                  updateSyllable(
                                    field,
                                    event.target.value === '' ? NaN : Number(event.target.value),
                                  )
                                }
                              />
                              <button
                                type="button"
                                className="button secondary"
                                disabled={!canMark}
                                onClick={() => markSyllable(field)}
                              >
                                Marcar {field === 'startBeat' ? 'entrada' : 'saída'} desta sílaba
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className="button secondary"
                          disabled={selectedSyllable >= current.syllables.length - 1}
                          onClick={() => setSelectedSyllable((index) => index + 1)}
                        >
                          Próxima sílaba
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
            </details>
            <button type="button" className="button" onClick={save}>
              Salvar sincronização
            </button>
          </div>
        )}
        <div className="chart-lyrics-files">
          <label>
            Importar uma cópia da sincronização
            <input type="file" accept=".json,application/json" onChange={importFile} />
          </label>
          <button
            type="button"
            className="button secondary"
            disabled={!cues.length}
            onClick={exportFile}
          >
            Exportar sincronização
          </button>
          {cues.length > 0 && customized && (
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setDraft(cues.map((cue) => ({ ...cue })));
                setText(cues.map((cue) => cue.text).join('\n'));
                setSelected(0);
                setSelectedSyllable(0);
                setDivision(null);
                clearFeedback();
                const persisted = onSave([]);
                setMessage(
                  persisted
                    ? baseAvailable
                      ? 'Letra do curso restaurada. Suas marcações anteriores ficaram em edição.'
                      : 'Letra removida da cifra. A cópia anterior está em edição; use Salvar sincronização para restaurá-la.'
                    : 'Letra retirada apenas desta sessão. O navegador não permitiu remover a cópia salva; ela pode reaparecer ao recarregar. A cópia anterior está em edição.',
                );
              }}
            >
              {baseAvailable ? 'Restaurar letra do curso' : 'Remover letra salva'}
            </button>
          )}
        </div>
        {notice && <p className="hint">{notice}</p>}
        {message && <p role="status">{message}</p>}
        {error && (
          <p role="alert" className="notice error">
            {error}
          </p>
        )}
      </div>
    </details>
  );
}
