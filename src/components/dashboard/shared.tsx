'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LogOut, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { Empty, Loading, Notice } from '@/components/ui';
import type { Profile, LessonSession, Feedback } from '@/lib/contracts';
import './dashboard.css';

export interface LessonOption {
  id: string;
  display_id: string;
  title: string;
  goal: string;
  module: number;
}
export function messageOf(error: unknown) {
  return error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.';
}
export function lessonName(lessons: LessonOption[], id: string) {
  const lesson = lessons.find((item) => item.id === id);
  return lesson ? `${lesson.display_id} · ${lesson.title}` : id;
}
export function formatDate(value: string, timezone: string, withTime = false) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'medium',
      ...(withTime ? { timeStyle: 'short' as const } : {}),
      timeZone: timezone,
    }).format(new Date(value));
  } catch {
    return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium', timeZone: 'UTC' }).format(
      new Date(value),
    );
  }
}
export function useResource<T>(path: string) {
  const [revision, setRevision] = useState(0);
  const key = `${path}:${revision}`;
  const [result, setResult] = useState<{ key: string; data: T | null; error: string }>({
    key: '',
    data: null,
    error: '',
  });
  useEffect(() => {
    const controller = new AbortController();
    apiFetch<T>(path, { signal: controller.signal })
      .then((data) => {
        if (!controller.signal.aborted) setResult({ key, data, error: '' });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setResult({ key, data: null, error: messageOf(error) });
      });
    return () => controller.abort();
  }, [path, key]);
  return {
    data: result.key === key ? result.data : null,
    error: result.key === key ? result.error : '',
    loading: result.key !== key,
    reload: () => setRevision((value) => value + 1),
  };
}
export function ResourceState({
  loading,
  error,
  retry,
  children,
}: {
  loading: boolean;
  error: string;
  retry: () => void;
  children: React.ReactNode;
}) {
  if (loading) return <Loading />;
  if (error)
    return (
      <div>
        <Notice message={error} error />
        <button className="button secondary small" onClick={retry}>
          <RefreshCw size={14} />
          Tentar novamente
        </button>
      </div>
    );
  return children;
}
export function Pagination({
  page,
  hasMore,
  onChange,
  label,
}: {
  page: number;
  hasMore: boolean;
  onChange: (page: number) => void;
  label: string;
}) {
  if (page === 1 && !hasMore) return null;
  return (
    <nav className="pagination" aria-label={`Paginação: ${label}`}>
      <button
        className="button secondary small"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        <ArrowLeft size={14} />
        Anterior
      </button>
      <span aria-live="polite">Página {page}</span>
      <button
        className="button secondary small"
        disabled={!hasMore}
        onClick={() => onChange(page + 1)}
      >
        Próxima
        <ArrowRight size={14} />
      </button>
    </nav>
  );
}
export function LessonSelect({
  lessons,
  id,
  value,
  onChange,
}: {
  lessons: LessonOption[];
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label htmlFor={id}>
      Aula
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} required>
        {lessons.map((lesson) => (
          <option key={lesson.id} value={lesson.id}>
            {lesson.display_id} · {lesson.title}
          </option>
        ))}
      </select>
    </label>
  );
}
export function AccountPanel({ profile }: { profile: Profile }) {
  const router = useRouter();
  const [name, setName] = useState(profile.display_name);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function logout() {
    setBusy(true);
    setError('');
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', body: '{}' });
      router.replace('/entrar');
      router.refresh();
    } catch (error) {
      setError(messageOf(error));
      setBusy(false);
    }
  }
  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiFetch('/api/me', {
        method: 'PATCH',
        body: JSON.stringify({ displayName: name, timezone }),
      });
      setMessage('Perfil atualizado. Os horários usam o fuso escolhido.');
      router.refresh();
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="dashboard-account">
      <div className="profile-strip">
        <span className="avatar">{profile.display_name.charAt(0).toUpperCase()}</span>
        <div>
          <strong>{profile.display_name}</strong>
          <p className="muted">
            {profile.role === 'teacher' ? 'Professor' : 'Aluno'} · {profile.timezone}
          </p>
        </div>
        <button className="button secondary small" onClick={logout} disabled={busy}>
          <LogOut size={14} />
          Sair
        </button>
      </div>
      <details>
        <summary>Meu nome e fuso horário</summary>
        <form onSubmit={save}>
          <div className="control-row">
            <label htmlFor="profile-name">
              Nome
              <input
                id="profile-name"
                required
                maxLength={100}
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
            </label>
            <label htmlFor="profile-timezone">
              Fuso horário IANA
              <input
                id="profile-timezone"
                list="timezones"
                required
                maxLength={80}
                value={timezone}
                onChange={(event) => setTimezone(event.target.value)}
                placeholder="America/Sao_Paulo"
              />
              <datalist id="timezones">
                <option value="America/Sao_Paulo" />
                <option value="America/Vancouver" />
                <option value="America/Manaus" />
                <option value="Europe/Lisbon" />
                <option value="UTC" />
              </datalist>
            </label>
            <button className="button" disabled={busy}>
              {busy ? 'Aguarde…' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      </details>
      <Notice message={error} error />
      <Notice message={message} />
    </section>
  );
}
export function SessionEntries({
  items,
  lessons,
  timezone,
  onCancel,
}: {
  items: LessonSession[];
  lessons: LessonOption[];
  timezone: string;
  onCancel?: (id: string) => void;
}) {
  if (!items.length)
    return <Empty>Nenhum encontro agendado. Os próximos encontros aparecerão aqui.</Empty>;
  return (
    <div>
      {items.map((item) => (
        <article className="practice-entry" key={item.id}>
          <div className="actions-between">
            <h3>{item.title}</h3>
            {onCancel && (
              <button className="text-button" onClick={() => onCancel(item.id)}>
                Cancelar
              </button>
            )}
          </div>
          <p>
            <time dateTime={item.starts_at}>{formatDate(item.starts_at, timezone, true)}</time>{' '}
            <small>({timezone})</small>
          </p>
          <Link className="inline-link dashboard-lesson-link" href={`/aulas/${item.lesson_id}`}>
            {lessonName(lessons, item.lesson_id)}
          </Link>
          {item.meeting_url && (
            <a
              className="button secondary small dashboard-meeting"
              href={item.meeting_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir encontro ↗
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
export function FeedbackEntries({
  items,
  lessons,
  timezone,
  studentNames,
}: {
  items: Feedback[];
  lessons: LessonOption[];
  timezone: string;
  studentNames?: Record<string, string>;
}) {
  if (!items.length)
    return <Empty>As orientações do professor aparecerão aqui após a primeira devolutiva.</Empty>;
  return (
    <div>
      {items.map((item) => (
        <article className="feedback-entry" key={item.id}>
          <div className="actions-between">
            <h3>{studentNames?.[item.student_id] || lessonName(lessons, item.lesson_id)}</h3>
            {item.validated && <span className="badge">Execução validada</span>}
          </div>
          {studentNames && (
            <Link
              className="inline-link dashboard-lesson-link"
              href={`/aulas/${item.lesson_id}#plano-professor`}
            >
              {lessonName(lessons, item.lesson_id)}
            </Link>
          )}
          <p className="dashboard-preserve">{item.body}</p>
          <small>{formatDate(item.created_at, timezone)}</small>
        </article>
      ))}
    </div>
  );
}
