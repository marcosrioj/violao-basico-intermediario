'use client';

import { useId, useMemo, useRef, useState, type CSSProperties, type FormEvent } from 'react';
import { ChartPlayer } from './chart-player';
import { RhythmPractice } from './rhythm-practice';
import { parsePastedChart, PastedChartError } from './pasted-chart';

const example = `Intro:
| C | Am | F | G |

[Verso]
C               Am
Um novo som vai começar
F               G
Meu violão vai acompanhar

[Refrão x2]
| C G | Am F |
`;

type ImportedChart = ReturnType<typeof parsePastedChart>;

export function RhythmWorkshop() {
  const [mode, setMode] = useState<'pulse' | 'chart'>('pulse');
  const [text, setText] = useState('');
  const [title, setTitle] = useState('');
  const [meter, setMeter] = useState<'4/4' | '3/4' | '6/8'>('4/4');
  const [bpm, setBpm] = useState('80');
  const [capo, setCapo] = useState('');
  const [loaded, setLoaded] = useState<{
    result: ImportedChart;
    bpm: number;
    title: string;
    revision: number;
  } | null>(null);
  const [issues, setIssues] = useState<{ line: number; message: string }[]>([]);
  const errorSummary = useRef<HTMLDivElement>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const textInput = useRef<HTMLTextAreaElement>(null);
  const lineNumbers = useRef<HTMLPreElement>(null);
  const id = useId();
  const lineCount = (text || example).split('\n').length;
  const numberedLines = useMemo(
    () => Array.from({ length: lineCount }, (_, index) => index + 1).join('\n'),
    [lineCount],
  );

  function syncLineNumbers(scrollTop: number) {
    if (lineNumbers.current) lineNumbers.current.style.transform = `translateY(-${scrollTop}px)`;
  }

  function focusLine(line: number) {
    const field = textInput.current;
    if (!field) return;
    const lines = field.value.split('\n');
    const index = Math.max(0, Math.min(line - 1, lines.length - 1));
    const start = lines.slice(0, index).reduce((count, value) => count + value.length + 1, 0);
    field.focus();
    field.setSelectionRange(start, start + lines[index].length);
    const lineHeight = parseFloat(getComputedStyle(field).lineHeight);
    field.scrollTop = index * lineHeight - (field.clientHeight - lineHeight) / 2;
    field.scrollLeft = 0;
    syncLineNumbers(field.scrollTop);
  }

  function load(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      const result = parsePastedChart(text, {
        meter,
        title: title.trim() || 'Minha música',
        ...(capo !== '' ? { capo: Number(capo) } : {}),
      });
      setLoaded((previous) => ({
        result,
        bpm: Number(bpm),
        title: title.trim() || 'Minha música',
        revision: (previous?.revision ?? 0) + 1,
      }));
      setIssues([]);
      requestAnimationFrame(() => resultHeading.current?.focus());
    } catch (error) {
      setIssues(
        error instanceof PastedChartError
          ? error.issues
          : [
              {
                line: 0,
                message: 'Não foi possível ler esta cifra. Confira o texto e tente novamente.',
              },
            ],
      );
      requestAnimationFrame(() => errorSummary.current?.focus());
    }
  }

  return (
    <div className="lab-workshop">
      <div className="control-row" role="group" aria-label="Como seguir o ritmo">
        <button
          type="button"
          className="button secondary"
          aria-pressed={mode === 'pulse'}
          onClick={() => setMode('pulse')}
        >
          Treinar o pulso
        </button>
        <button
          type="button"
          className="button secondary"
          aria-pressed={mode === 'chart'}
          onClick={() => setMode('chart')}
        >
          Tocar uma cifra
        </button>
      </div>
      {mode === 'pulse' ? (
        <RhythmPractice />
      ) : (
        <>
          <form className="card lab-chart-import" onSubmit={load}>
            <div>
              <p className="eyebrow">SUA MÚSICA NO VIOLÃO</p>
              <h2>Carregar uma cifra</h2>
              <p>
                Cole os acordes, a letra ou uma tablatura de seis cordas e monte seu acompanhamento.
              </p>
            </div>
            <p className="notice" id={`${id}-interpretation`}>
              <strong>Acompanhamento gerado automaticamente.</strong> A interpretação dinâmica pode
              apresentar inconsistências nos acordes, tempos, repetições e alinhamento da letra.
              Confira o resultado antes de tocar.
            </p>
            {issues.length > 0 && (
              <div className="notice error" role="alert" tabIndex={-1} ref={errorSummary}>
                <strong>Confira a cifra antes de carregar.</strong>
                <ul>
                  {issues.slice(0, 12).map((issue, index) => (
                    <li key={index}>
                      <a
                        href={`#${id}-text`}
                        onClick={(event) => {
                          event.preventDefault();
                          focusLine(issue.line);
                        }}
                      >
                        {issue.line > 0 ? `Linha ${issue.line}: ` : ''}
                        {issue.message}
                      </a>
                    </li>
                  ))}
                </ul>
                {issues.length > 12 && (
                  <p>Corrija estas linhas e carregue novamente para conferir as demais.</p>
                )}
              </div>
            )}
            <label>
              Nome da música (opcional)
              <input
                value={title}
                maxLength={100}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Minha música"
              />
            </label>
            <label htmlFor={`${id}-text`}>Cifra da música</label>
            <div
              className="lab-chart-editor"
              style={
                {
                  '--line-number-width': `calc(${Math.max(2, String(lineCount).length)}ch + 24px)`,
                } as CSSProperties
              }
            >
              <div className="lab-chart-gutter" aria-hidden="true">
                <pre ref={lineNumbers}>{numberedLines}</pre>
              </div>
              <textarea
                ref={textInput}
                id={`${id}-text`}
                className="lab-chart-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                onScroll={(event) => syncLineNumbers(event.currentTarget.scrollTop)}
                rows={10}
                maxLength={50000}
                required
                wrap="off"
                spellCheck={false}
                autoCapitalize="off"
                aria-invalid={issues.length > 0}
                aria-describedby={`${id}-format ${id}-interpretation${issues.length ? ` ${id}-error` : ''}`}
                placeholder={example}
              />
            </div>
            {issues.length > 0 && (
              <p className="lab-chart-error" id={`${id}-error`}>
                {issues[0].line > 0 ? `Linha ${issues[0].line}: ` : ''}
                {issues[0].message}
              </p>
            )}
            <p className="hint" id={`${id}-format`}>
              Mantenha os espaços dos acordes acima da letra. Sem barras, cada acorde ocupa um
              compasso. Com barras, os acordes dividem o compasso igualmente:{' '}
              <code>| C G | Am F |</code>.
            </p>
            <details>
              <summary>Como escrever trechos, tablaturas e repetições</summary>
              <p>
                Use títulos como <code>[Verso]</code>, <code>Primeira Parte:</code> e{' '}
                <code>Refrão x2:</code>. Para outra passagem, escreva o trecho novamente na ordem em
                que deve tocar.
              </p>
              <p>
                Os títulos podem ter qualquer nome, entre colchetes ou terminado em dois-pontos,
                como <code>Dedilhado Intro:</code>. Os acordes podem vir na mesma linha, como{' '}
                <code>Intro: G D/F# Em</code>, ou abaixo. Cole as seis cordas da tablatura juntas,
                da mais aguda à mais grave. O capotraste é lido do texto ou escolhido abaixo.
                Escolha a fórmula de compasso e o andamento abaixo. As durações entre acordes, notas
                da tablatura e sílabas são estimadas a partir dos espaços; não reproduzem
                automaticamente o tempo de uma gravação.
              </p>
            </details>
            <div className="control-row">
              <label>
                Compasso
                <select
                  value={meter}
                  onChange={(event) => setMeter(event.target.value as typeof meter)}
                >
                  <option value="4/4">4/4 · quatro pulsos</option>
                  <option value="3/4">3/4 · três pulsos</option>
                  <option value="6/8">6/8 · dois pulsos compostos</option>
                </select>
              </label>
              <label>
                Capotraste
                <select value={capo} onChange={(event) => setCapo(event.target.value)}>
                  <option value="">Ler da cifra</option>
                  <option value="0">Sem capotraste</option>
                  {Array.from({ length: 12 }, (_, index) => (
                    <option key={index + 1} value={index + 1}>
                      {index + 1}ª casa
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Andamento inicial (BPM)
                <input
                  type="number"
                  min={30}
                  max={180}
                  step={1}
                  required
                  value={bpm}
                  onChange={(event) => setBpm(event.target.value)}
                />
              </label>
            </div>
            <div className="control-row">
              <button className="button" type="submit">
                {loaded ? 'Atualizar acompanhamento' : 'Carregar acompanhamento'}
              </button>
              {!text.trim() && (
                <button type="button" className="button secondary" onClick={() => setText(example)}>
                  Usar exemplo
                </button>
              )}
            </div>
            <p className="hint">
              O texto fica apenas nesta página. Ao sair ou recarregar, cole a cifra novamente.
            </p>
          </form>
          {loaded && (
            <section className="lab-chart-result" aria-label="Acompanhamento da cifra colada">
              <h2 ref={resultHeading} tabIndex={-1}>
                {loaded.title}
              </h2>
              <p role="status">
                {loaded.result.barCount} compassos carregados. Use Tocar daqui no trecho em que
                deseja começar.
              </p>
              {loaded.result.warnings.length > 0 && (
                <details className="section">
                  <summary>
                    Conferir interpretação da cifra ({loaded.result.warnings.length})
                  </summary>
                  <ul>
                    {loaded.result.warnings.map((warning, index) => (
                      <li key={index}>
                        {warning.line > 0 ? `Linha ${warning.line}: ` : ''}
                        {warning.message}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <ChartPlayer
                key={loaded.revision}
                chart={loaded.result.chart}
                initialBpm={loaded.bpm}
                songId={`lab-import-${loaded.revision}`}
                lyricsContent={loaded.result.lyricsContent}
                returnLabel="Voltar ao laboratório"
                allowCustomChords
                defaultOpen
              />
            </section>
          )}
        </>
      )}
    </div>
  );
}
