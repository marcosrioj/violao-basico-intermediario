'use client';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
  useEffect(() => {
    if (demo) return;
    const controller = new AbortController();
    apiFetch<Progress[]>(`/api/progress?lessonId=${lesson.id}`, { signal: controller.signal })
      .then((data) => {
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
  }, [demo, lesson]);
  async function save(next: 'in_progress' | 'completed') {
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
          : 'Seu registro foi salvo.',
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao salvar.');
    } finally {
      setBusy(false);
    }
  }
  return (
    <CollapsibleCard
      id="meu-progresso"
      title={status === 'completed' ? 'Aula concluída' : 'Como foi sua prática?'}
    >
      <div className="section-title">
        <p className="eyebrow">SEU PRÓXIMO PASSO</p>
        <Hint label="Registrar o progresso">
          Marque os objetivos que conseguiu realizar para concluir a aula. Sua conclusão registra o
          estudo; a validação da execução vem do professor. Ele pode acompanhar estes registros.
        </Hint>
      </div>
      <p className="hint">Confira cada objetivo tocando no instrumento.</p>
      <ul className="check-list">
        {lesson.checks.map((check, i) => (
          <li key={i}>
            <label>
              <input
                type="checkbox"
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
          value={notes}
          maxLength={2000}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ex.: deixar a troca de D para G mais fluida."
        />
      </label>
      <label className="section">
        Como está sua confiança?
        <select value={confidence} onChange={(e) => setConfidence(Number(e.target.value))}>
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
      <Notice message={error} error />
      <Notice message={message} />
      {demo ? (
        <>
          <p className="hint">
            Esta é uma prévia. Abra a aula na trilha para salvar seu progresso.
          </p>
          <Link className="button" href="/entrar">
            Criar minha conta
          </Link>
        </>
      ) : (
        <div className="stack section">
          <button
            disabled={busy || !loaded || checked.length !== lesson.checks.length}
            className="button"
            onClick={() => save('completed')}
          >
            {busy ? 'Salvando…' : 'Concluir aula'}
          </button>
          <button
            disabled={busy || !loaded}
            className="button secondary"
            onClick={() => save('in_progress')}
          >
            Salvar e continuar praticando
          </button>
        </div>
      )}
    </CollapsibleCard>
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
    return () => clearInterval(timer);
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
    <CollapsibleCard title="Diário de prática">
      <div className="section-title">
        <p className="eyebrow">UM MOMENTO PARA TOCAR</p>
        <Hint label="Usar o diário e o cronômetro">
          Inicie o cronômetro e pause antes de registrar. Você também pode informar os minutos
          manualmente. No diário, arredonde o BPM para o inteiro mais próximo: 37,3 vira 37. Isso
          não altera o andamento do player. As anotações ficam visíveis ao professor da turma.
        </Hint>
      </div>
      <div className="bpm-readout" style={{ fontSize: 36 }}>
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
