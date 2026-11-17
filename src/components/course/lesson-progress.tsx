'use client';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import type { Lesson } from '@/content/types';
import type { Progress } from '@/lib/contracts';
import { apiFetch } from '@/lib/api-client';
import { Notice } from '@/components/ui';
import { Hint } from '@/components/ui/hint';
export function LessonProgress({
  lesson,
  demo = false,
  checkLabels,
}: {
  lesson: Lesson;
  demo?: boolean;
  checkLabels?: ReactNode[];
}) {
  const [checked, setChecked] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [status, setStatus] = useState<'in_progress' | 'completed'>('in_progress');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(demo);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const objectives = useRef<HTMLDetailsElement>(null);
  const objectivesId = useId();
  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    apiFetch<Progress[]>(`/api/progress?lessonId=${lesson.id}`, { signal: controller.signal })
      .then((data) => {
        if (controller.signal.aborted) return;
        const current = data.find((p) => p.lesson_id === lesson.id);
        if (current) {
          setNotes(current.notes);
          setConfidence(current.confidence);
          setStatus(current.status);
          if (current.status === 'completed') setChecked(lesson.checks.map((_, i) => String(i)));
        }
        setLoaded(true);
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      });
    return () => controller.abort();
  }, [demo, lesson, loadAttempt]);
  async function save(next: 'in_progress' | 'completed') {
    if (busy || !loaded) return;
    if (next === 'completed' && checked.length !== lesson.checks.length) {
      if (objectives.current) {
        objectives.current.open = true;
        objectives.current.querySelector<HTMLInputElement>('input:not(:checked)')?.focus();
      }
      return;
    }
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiFetch('/api/progress', {
        method: 'PUT',
        body: JSON.stringify({ lessonId: lesson.id, status: next, notes, confidence }),
      });
      setStatus(next);
      setMessage(
        next === 'completed'
          ? 'Aula concluída! Continue praticando e retome quando precisar.'
          : 'Aula marcada como não concluída.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      id="meu-progresso"
      className="card lesson-completion"
      aria-labelledby="completion-title"
    >
      <div className="completion-actions">
        <div>
          <h2 id="completion-title">
            {status === 'completed' ? 'Aula concluída' : 'Seu progresso'}
          </h2>
          <p className="hint" id={`${objectivesId}-help`}>
            {status === 'completed'
              ? 'Você pode retomar a prática quando precisar.'
              : `${checked.length} de ${lesson.checks.length} objetivos conferidos. Confira os objetivos para concluir.`}
          </p>
        </div>
      </div>
      <details
        ref={objectives}
        id={objectivesId}
        className="completion-objectives"
        suppressHydrationWarning
      >
        <summary>Conferir objetivos e anotar meu próximo ajuste</summary>
        <div className="section-title">
          <p className="eyebrow">SEU PRÓXIMO PASSO</p>
          <Hint label="Registrar o progresso">
            Marque os objetivos que conseguiu realizar para concluir a aula. Sua conclusão registra
            o estudo; a validação da execução vem do professor. Ele pode acompanhar estes registros.
          </Hint>
        </div>
        <p className="hint">Confira cada objetivo tocando no instrumento.</p>
        <ul className="check-list">
          {lesson.checks.map((check, i) => (
            <li key={i}>
              <label>
                <input
                  type="checkbox"
                  disabled={!loaded || busy}
                  checked={checked.includes(String(i))}
                  onChange={(e) =>
                    setChecked((c) =>
                      e.target.checked ? [...c, String(i)] : c.filter((v) => v !== String(i)),
                    )
                  }
                />
                <span>{checkLabels?.[i] ?? check}</span>
              </label>
            </li>
          ))}
        </ul>
        <label>
          Meu próximo ajuste
          <textarea
            disabled={!loaded || busy}
            value={notes}
            maxLength={2000}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex.: deixar a troca de D para G mais fluida."
          />
        </label>
        <label className="section">
          Como está sua confiança?
          <select
            disabled={!loaded || busy}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
          >
            {[
              'Preciso de ajuda',
              'Ainda está difícil',
              'Estou avançando',
              'Quase confortável',
              'Consigo repetir com segurança',
            ].map((x, i) => (
              <option key={x} value={i + 1}>
                {i + 1} · {x}
              </option>
            ))}
          </select>
        </label>
      </details>
      <div className="completion-actions section">
        {!demo && (
          <button
            type="button"
            disabled={busy || !loaded}
            className={status === 'completed' ? 'button secondary' : 'button'}
            aria-controls={objectivesId}
            aria-describedby={`${objectivesId}-help`}
            onClick={() => save(status === 'completed' ? 'in_progress' : 'completed')}
          >
            {!loaded
              ? error
                ? 'Progresso indisponível'
                : 'Carregando progresso…'
              : busy
                ? 'Salvando…'
                : status === 'completed'
                  ? 'Marcar como não concluída'
                  : 'Concluir aula'}
          </button>
        )}
      </div>
      <Notice message={error} error />
      <Notice message={message} />
      {!loaded && error && (
        <button
          type="button"
          className="button secondary"
          onClick={() => {
            setError('');
            setLoadAttempt((attempt) => attempt + 1);
          }}
        >
          Tentar carregar novamente
        </button>
      )}

      {demo && (
        <p className="hint">
          Esta é uma prévia. <Link href="/entrar">Entre na sua conta</Link> para salvar o progresso.
        </p>
      )}
    </section>
  );
}

export function PracticeLog({
  lessonId,
  initialBpm,
  demo = false,
}: {
  lessonId: string;
  initialBpm: number;
  demo?: boolean;
}) {
  const [minutes, setMinutes] = useState(15);
  const [bpm, setBpm] = useState(initialBpm);
  const [notes, setNotes] = useState('');
  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const started = useRef(0);
  const timerDisplay = useRef<HTMLDivElement>(null);
  const accumulated = useRef(0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const attempt = useRef<{ content: string; id: string } | null>(null);
  useEffect(() => {
    if (!running) return;
    started.current = Date.now();
    const timer = setInterval(
      () => setElapsed(accumulated.current + Math.floor((Date.now() - started.current) / 1000)),
      500,
    );
    const panels: HTMLDetailsElement[] = [];
    let parent = timerDisplay.current?.parentElement;
    while (parent) {
      if (parent instanceof HTMLDetailsElement) panels.push(parent);
      parent = parent.parentElement;
    }
    const pauseHiddenTimer = () => {
      if (!started.current || !panels.some((panel) => !panel.open)) return;
      accumulated.current += Math.floor((Date.now() - started.current) / 1000);
      started.current = 0;
      setElapsed(accumulated.current);
      setMinutes(Math.max(1, Math.min(240, Math.round(accumulated.current / 60))));
      setRunning(false);
    };
    panels.forEach((panel) => panel.addEventListener('toggle', pauseHiddenTimer));
    return () => {
      clearInterval(timer);
      panels.forEach((panel) => panel.removeEventListener('toggle', pauseHiddenTimer));
    };
  }, [running]);
  function toggle() {
    if (running) {
      accumulated.current += Math.floor((Date.now() - started.current) / 1000);
      setElapsed(accumulated.current);
      setMinutes(Math.max(1, Math.min(240, Math.round(accumulated.current / 60))));
    }
    setRunning(!running);
  }
  async function save() {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const content = JSON.stringify({ lessonId, minutes, bpm, notes });
      if (attempt.current?.content !== content)
        attempt.current = { content, id: crypto.randomUUID() };
      await apiFetch('/api/practice', {
        method: 'POST',
        body: JSON.stringify({ ...JSON.parse(content), id: attempt.current.id }),
      });
      attempt.current = null;
      setMessage('Prática registrada no seu diário.');
      setNotes('');
      accumulated.current = 0;
      setElapsed(0);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao registrar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <CollapsibleCard id="diario-pratica" title="Diário de prática">
      <div className="section-title">
        <p className="eyebrow">UM MOMENTO PARA TOCAR</p>
        <Hint label="Usar o diário e o cronômetro">
          Inicie o cronômetro e pause antes de registrar. Você também pode informar os minutos
          manualmente. No diário, arredonde o BPM para o inteiro mais próximo: 37,3 vira 37. Isso
          não altera o andamento do player. As anotações ficam visíveis ao professor da turma.
        </Hint>
      </div>
      <div ref={timerDisplay} className="bpm-readout" style={{ fontSize: 36 }}>
        {Math.floor(elapsed / 60)
          .toString()
          .padStart(2, '0')}
        :{(elapsed % 60).toString().padStart(2, '0')}
      </div>
      <button className="button secondary" onClick={toggle}>
        {running ? 'Pausar cronômetro' : 'Iniciar cronômetro'}
      </button>
      <div className="control-row">
        <label>
          Minutos
          <input
            type="number"
            min="1"
            max="240"
            value={minutes}
            onChange={(e) => setMinutes(Number(e.target.value))}
          />
        </label>
        <label>
          BPM aproximado (inteiro)
          <input
            type="number"
            min="30"
            max="240"
            step="1"
            value={bpm}
            onChange={(e) => setBpm(Number(e.target.value))}
          />
        </label>
      </div>
      <label>
        O que melhorou?
        <textarea
          maxLength={2000}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Registre uma conquista e algo para retomar."
        />
      </label>
      <Notice message={error} error />
      <Notice message={message} />
      <button
        className="button section"
        disabled={
          demo ||
          busy ||
          running ||
          !Number.isInteger(minutes) ||
          minutes < 1 ||
          minutes > 240 ||
          !Number.isInteger(bpm) ||
          bpm < 30 ||
          bpm > 240
        }
        onClick={save}
      >
        {busy ? 'Salvando…' : 'Registrar prática'}
      </button>
      {demo && <p className="hint">Abra a aula na trilha para guardar seu diário.</p>}
      <p className="hint">Tempo de prática é um registro, não uma medida de domínio.</p>
    </CollapsibleCard>
  );
}
