'use client';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { EnrollmentForm } from './enrollment-form';
import { ArrowRight, BookOpen, CheckCircle2, Clock3, Plus } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import type {
  Classroom,
  Feedback,
  LessonSession,
  Page,
  Practice,
  Profile,
  Progress,
} from '@/lib/contracts';
import { Empty, Notice } from '@/components/ui';
import { Hint } from '@/components/ui/hint';
import {
  AccountPanel,
  FeedbackEntries,
  formatDate,
  LessonSelect,
  lessonName,
  messageOf,
  Pagination,
  ResourceState,
  SessionEntries,
  useResource,
  type LessonOption,
} from './shared';

function PracticeDiary({ lessons, profile }: { lessons: LessonOption[]; profile: Profile }) {
  const [page, setPage] = useState(1);
  const resource = useResource<Page<Practice>>(`/api/practice?page=${page}`);
  const [lessonId, setLessonId] = useState(lessons[0].id);
  const [minutes, setMinutes] = useState(15);
  const [bpm, setBpm] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const attempt = useRef<{ content: string; id: string } | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    const content = JSON.stringify({
      lessonId,
      minutes,
      bpm: bpm === '' ? null : Number(bpm),
      notes,
    });
    if (attempt.current?.content !== content)
      attempt.current = { content, id: crypto.randomUUID() };
    try {
      await apiFetch('/api/practice', {
        method: 'POST',
        body: JSON.stringify({ ...JSON.parse(content), id: attempt.current.id }),
      });
      attempt.current = null;
      setNotes('');
      setMessage('Prática salva no seu diário.');
      setPage(1);
      resource.reload();
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <CollapsibleCard title="Diário de prática">
      <div className="section-title">
        <Hint label="Registrar uma prática">
          Escolha a aula, informe os minutos e anote o que tocou. O BPM é opcional e deve ser um
          inteiro aproximado: por exemplo, 37,3 vira 37.
        </Hint>
      </div>
      <details className="dashboard-section-gap">
        <summary>Registrar uma prática</summary>
        <form className="stack" onSubmit={submit} aria-busy={busy}>
          <LessonSelect
            id="practice-lesson"
            lessons={lessons}
            value={lessonId}
            onChange={setLessonId}
          />
          <div className="control-row">
            <label htmlFor="practice-minutes">
              Minutos praticados
              <input
                id="practice-minutes"
                type="number"
                min={1}
                max={240}
                required
                value={minutes}
                onChange={(event) => setMinutes(Number(event.target.value))}
              />
            </label>
            <label htmlFor="practice-bpm">
              BPM inteiro (opcional)
              <input
                id="practice-bpm"
                type="number"
                min={30}
                max={240}
                step={1}
                value={bpm}
                onChange={(event) => setBpm(event.target.value)}
                placeholder="Ex.: 60"
              />
            </label>
          </div>
          <label htmlFor="practice-notes">
            Como foi? Qual é o próximo ajuste?
            <textarea
              id="practice-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              maxLength={2000}
              placeholder="A troca G → D ficou mais fluida. Vou manter o pulso na próxima prática."
            />
          </label>
          <button className="button" disabled={busy}>
            <Plus size={16} />
            {busy ? 'Salvando…' : 'Salvar prática'}
          </button>
        </form>
        <Notice error message={error} />
        <Notice message={message} />
      </details>
      <ResourceState {...resource} retry={resource.reload}>
        {resource.data && (
          <>
            {resource.data.items.length ? (
              resource.data.items.map((item) => (
                <article className="practice-entry" key={item.id}>
                  <h3>
                    <Link href={`/aulas/${item.lesson_id}`}>
                      {lessonName(lessons, item.lesson_id)}
                    </Link>
                  </h3>
                  <p>
                    {item.minutes} min{item.bpm ? ` · ${item.bpm} BPM` : ''}
                  </p>
                  {item.notes && <p className="dashboard-preserve">{item.notes}</p>}
                  <small>{formatDate(item.practiced_at, profile.timezone)}</small>
                </article>
              ))
            ) : (
              <Empty>
                Seu diário começa na primeira prática. Não precisa ser uma execução perfeita.
              </Empty>
            )}
            <Pagination
              label="diário de prática"
              page={page}
              hasMore={resource.data.hasMore}
              onChange={setPage}
            />
          </>
        )}
      </ResourceState>
    </CollapsibleCard>
  );
}
function StudentClasses({ profile, changed }: { profile: Profile; changed: () => void }) {
  const [page, setPage] = useState(1);
  const resource = useResource<Page<Classroom>>(`/api/classes?page=${page}`);
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [leaving, setLeaving] = useState<Classroom | null>(null);
  async function leave() {
    if (!leaving) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiFetch(`/api/classes/${leaving.id}?studentId=${profile.id}`, { method: 'DELETE' });
      setLeaving(null);
      setMessage(
        'Matrícula removida. Seu histórico foi preservado. O curso exige ao menos uma turma.',
      );
      resource.reload();
      changed();
      router.refresh();
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <CollapsibleCard title="Minhas turmas">
      <details>
        <summary>Tenho um código para outra turma</summary>
        <EnrollmentForm
          onConfirmed={() => {
            setPage(1);
            resource.reload();
            changed();
          }}
        />
      </details>
      <Notice error message={error} />
      <Notice message={message} />
      {leaving && (
        <div className="dashboard-confirm" role="alert">
          <h3>Sair de {leaving.name}?</h3>
          <p>
            Você perde acesso aos encontros e as devolutivas dessa matrícula serão removidas. Seu
            progresso e diário ficam preservados. Se esta for sua última turma, o curso será
            bloqueado até uma nova matrícula.
          </p>
          <div className="dashboard-alert-actions">
            <button className="button" disabled={busy} onClick={leave}>
              Confirmar saída
            </button>
            <button className="button secondary" disabled={busy} onClick={() => setLeaving(null)}>
              Continuar na turma
            </button>
          </div>
        </div>
      )}
      <ResourceState {...resource} retry={resource.reload}>
        {resource.data && (
          <>
            {resource.data.items.length ? (
              resource.data.items.map((item) => (
                <div className="practice-entry actions-between" key={item.id}>
                  <h3>{item.name}</h3>
                  <button
                    className="text-button"
                    disabled={busy}
                    onClick={() => {
                      setLeaving(item);
                      setError('');
                    }}
                  >
                    Sair da turma
                  </button>
                </div>
              ))
            ) : (
              <Empty>Você ainda não participa de uma turma. Peça o código ao seu professor.</Empty>
            )}
            <Pagination
              label="turmas"
              page={page}
              hasMore={resource.data.hasMore}
              onChange={setPage}
            />
          </>
        )}
      </ResourceState>
    </CollapsibleCard>
  );
}
export function Agenda({ profile, lessons }: { profile: Profile; lessons: LessonOption[] }) {
  const [page, setPage] = useState(1);
  const resource = useResource<Page<LessonSession>>(`/api/sessions?page=${page}`);
  return (
    <CollapsibleCard title="Próximos encontros">
      <ResourceState {...resource} retry={resource.reload}>
        {resource.data && (
          <>
            <SessionEntries
              items={resource.data.items}
              lessons={lessons}
              timezone={profile.timezone}
            />
            <Pagination
              label="agenda"
              page={page}
              hasMore={resource.data.hasMore}
              onChange={setPage}
            />
          </>
        )}
      </ResourceState>
    </CollapsibleCard>
  );
}
export function FeedbackHistory({
  profile,
  lessons,
}: {
  profile: Profile;
  lessons: LessonOption[];
}) {
  const [page, setPage] = useState(1);
  const resource = useResource<Page<Feedback>>(`/api/feedback?page=${page}`);
  return (
    <CollapsibleCard title="Devolutivas do professor">
      <div className="section-title">
        <Hint label="Entender a validação do professor">
          A validação registra a execução observada pelo professor, separadamente das aulas que você
          marcou como concluídas.
        </Hint>
      </div>
      <ResourceState {...resource} retry={resource.reload}>
        {resource.data && (
          <>
            <FeedbackEntries
              items={resource.data.items}
              lessons={lessons}
              timezone={profile.timezone}
            />
            <Pagination
              label="devolutivas"
              page={page}
              hasMore={resource.data.hasMore}
              onChange={setPage}
            />
          </>
        )}
      </ResourceState>
    </CollapsibleCard>
  );
}
export function StudentDashboard({
  profile,
  lessons,
}: {
  profile: Profile;
  lessons: LessonOption[];
}) {
  const progress = useResource<Progress[]>('/api/progress');
  const [membershipVersion, setMembershipVersion] = useState(0);
  const completed = progress.data?.filter((item) => item.status === 'completed') || [];
  const active = progress.data?.filter((item) => item.status === 'in_progress') || [];
  const next =
    lessons.find((lesson) => active.some((item) => item.lesson_id === lesson.id)) ||
    lessons.find((lesson) => !completed.some((item) => item.lesson_id === lesson.id));
  return (
    <div className="dashboard-surface">
      <ResourceState {...progress} retry={progress.reload}>
        {progress.data && (
          <>
            {next ? (
              <section className="next-lesson">
                <p className="eyebrow">SEU PRÓXIMO PASSO · {next.display_id}</p>
                <h2>{next.title}</h2>
                <p>{next.goal}</p>
                <Link className="button cream" href={`/aulas/${next.id}`}>
                  Continuar aprendendo
                  <ArrowRight size={16} />
                </Link>
              </section>
            ) : (
              <section className="next-lesson">
                <p className="eyebrow">39 AULAS, MUITAS POSSIBILIDADES</p>
                <h2>Sua trilha está completa.</h2>
                <p>
                  Volte às músicas que mais gosta, reveja os pontos difíceis e combine o próximo
                  desafio com seu professor.
                </p>
                <Link className="button cream" href="/curso">
                  Revisitar o curso
                  <ArrowRight size={16} />
                </Link>
              </section>
            )}
            <details className="dashboard-section-gap">
              <summary>Meu progresso</summary>
              <div className="dashboard-stats">
                <div className="dashboard-stat">
                  <CheckCircle2 size={19} />
                  <strong>
                    {completed.length}
                    <small> / {lessons.length}</small>
                  </strong>
                  <span>Aulas concluídas por você</span>
                </div>
                <div className="dashboard-stat">
                  <BookOpen size={19} />
                  <strong>{Math.round((completed.length / lessons.length) * 100)}%</strong>
                  <span>Da sua trilha percorrida</span>
                </div>
                <div className="dashboard-stat">
                  <Clock3 size={19} />
                  <strong>{active.length}</strong>
                  <span>Aulas em prática</span>
                </div>
              </div>
              <div
                className="progress-track"
                role="progressbar"
                aria-label="Progresso declarado no curso"
                aria-valuenow={completed.length}
                aria-valuemin={0}
                aria-valuemax={lessons.length}
              >
                <span style={{ width: `${(completed.length / lessons.length) * 100}%` }} />
              </div>
            </details>
            {completed.length > 0 && (
              <details className="dashboard-section-gap">
                <summary>Aulas que você concluiu ({completed.length})</summary>
                <div className="review-list">
                  {lessons
                    .filter((lesson) => completed.some((item) => item.lesson_id === lesson.id))
                    .map((lesson) => (
                      <Link href={`/aulas/${lesson.id}`} key={lesson.id}>
                        <span>{lessonName(lessons, lesson.id)}</span>
                        <CheckCircle2 size={16} />
                      </Link>
                    ))}
                </div>
              </details>
            )}
          </>
        )}
      </ResourceState>
      <div className="stack dashboard-section-gap">
        <div className="stack">
          <StudentClasses
            profile={profile}
            changed={() => setMembershipVersion((value) => value + 1)}
          />
          <Agenda key={`agenda-${membershipVersion}`} profile={profile} lessons={lessons} />
          <FeedbackHistory
            key={`feedback-${membershipVersion}`}
            profile={profile}
            lessons={lessons}
          />
        </div>
        <PracticeDiary profile={profile} lessons={lessons} />
      </div>
      <details className="section">
        <summary>Minha conta</summary>
        <AccountPanel profile={profile} />
      </details>
    </div>
  );
}
