'use client';
import { Hint } from '@/components/ui/hint';
import { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { CalendarPlus, MessageSquare, ArrowLeft } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import type { ClassroomDetail, Profile } from '@/lib/contracts';
import { Empty, Notice } from '@/components/ui';
import {
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
import { Invitation } from './teacher-dashboard';
import { TeacherPractice } from './teacher-practice';
const subscribeTimezone = () => () => {};
function localInstant(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw new Error('Informe uma data e hora válidas.');
  if (parsed.getTime() <= Date.now()) throw new Error('Escolha uma data futura para o encontro.');
  const [date, time] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() + 1 !== month ||
    parsed.getDate() !== day ||
    parsed.getHours() !== hour ||
    parsed.getMinutes() !== minute
  )
    throw new Error('Este horário não existe no fuso do dispositivo. Escolha outro horário.');
  return parsed.toISOString();
}
export function ClassroomDashboard({
  classId,
  profile,
  lessons,
}: {
  classId: string;
  profile: Profile;
  lessons: LessonOption[];
}) {
  const [page, setPage] = useState(1);
  const resource = useResource<ClassroomDetail>(`/api/classes/${classId}?page=${page}`);
  const [studentId, setStudentId] = useState('');
  const [feedbackLesson, setFeedbackLesson] = useState(lessons[0].id);
  const [body, setBody] = useState('');
  const [validated, setValidated] = useState(false);
  const [meetingLesson, setMeetingLesson] = useState(lessons[0].id);
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [confirmation, setConfirmation] = useState<{
    kind: 'member' | 'session';
    id: string;
    name: string;
  } | null>(null);
  const deviceTimezone = useSyncExternalStore(
    subscribeTimezone,
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    () => 'fuso deste dispositivo',
  );
  const data = resource.data;
  const selectedStudent = data?.members.some((item) => item.student_id === studentId)
    ? studentId
    : data?.members[0]?.student_id || '';
  async function feedback(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedStudent) return;
    setBusy('feedback');
    setError('');
    setMessage('');
    try {
      await apiFetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({
          classId,
          studentId: selectedStudent,
          lessonId: feedbackLesson,
          body,
          validated,
        }),
      });
      setBody('');
      setValidated(false);
      setMessage('Devolutiva enviada. O aluno pode consultá-la na própria conta.');
      resource.reload();
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setBusy('');
    }
  }
  async function schedule(event: React.FormEvent) {
    event.preventDefault();
    setBusy('session');
    setError('');
    setMessage('');
    try {
      const instant = localInstant(startsAt);
      await apiFetch('/api/sessions', {
        method: 'POST',
        body: JSON.stringify({
          classId,
          lessonId: meetingLesson,
          title,
          startsAt: instant,
          meetingUrl: meetingUrl.trim() || null,
        }),
      });
      setTitle('');
      setStartsAt('');
      setMeetingUrl('');
      setMessage('Encontro agendado e disponível para os alunos da turma.');
      resource.reload();
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setBusy('');
    }
  }
  async function remove() {
    if (!confirmation) return;
    setBusy('delete');
    setError('');
    setMessage('');
    try {
      await apiFetch(
        confirmation.kind === 'member'
          ? `/api/classes/${classId}?studentId=${confirmation.id}`
          : `/api/sessions?id=${confirmation.id}`,
        { method: 'DELETE' },
      );
      setMessage(
        confirmation.kind === 'member'
          ? 'Matrícula removida. O progresso pessoal do aluno foi preservado.'
          : 'Encontro cancelado.',
      );
      setConfirmation(null);
      resource.reload();
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setBusy('');
    }
  }
  return (
    <div className="dashboard-surface">
      <Link href="/professor" className="back-link">
        <ArrowLeft size={14} />
        Voltar às turmas
      </Link>
      <Notice error message={error} />
      <Notice message={message} />
      {confirmation && (
        <div className="dashboard-confirm" role="alert">
          <h3>
            {confirmation.kind === 'member' ? 'Remover matrícula' : 'Cancelar encontro'}:{' '}
            {confirmation.name}?
          </h3>
          <p>
            {confirmation.kind === 'member'
              ? 'As devolutivas dessa matrícula serão removidas. O aluno mantém o diário e o progresso pessoal, mas deixa de acessar os encontros da turma.'
              : 'O encontro deixará de aparecer na agenda dos alunos.'}
          </p>
          <div className="dashboard-alert-actions">
            <button className="button" disabled={!!busy} onClick={remove}>
              {busy === 'delete' ? 'Confirmando…' : 'Confirmar'}
            </button>
            <button
              className="button secondary"
              disabled={!!busy}
              onClick={() => setConfirmation(null)}
            >
              Manter como está
            </button>
          </div>
        </div>
      )}
      <ResourceState {...resource} retry={resource.reload}>
        {data && (
          <>
            <section className="card">
              <div className="actions-between">
                <div>
                  <p className="eyebrow">SUA TURMA</p>
                  <h2 className="dashboard-summary-title">{data.classroom.name}</h2>
                </div>
                <Invitation code={data.classroom.invite_code} />
              </div>
            </section>
            <div className="stack dashboard-section-gap">
              <section className="card">
                <div className="section-title">
                  <h2>Alunos e progresso</h2>
                  <Hint label="Acompanhar o progresso">
                    Acompanhe a prática, observe a execução e escolha o próximo passo. A conclusão é
                    informada pelo aluno. Sua avaliação de execução fica registrada na devolutiva.
                  </Hint>
                </div>
                {data.members.length ? (
                  data.members.map((member) => {
                    const entries = data.progress.filter(
                      (item) => item.student_id === member.student_id,
                    );
                    const completed = entries.filter((item) => item.status === 'completed').length;
                    return (
                      <article className="dashboard-student-card" key={member.student_id}>
                        <div className="actions-between">
                          <h3>{member.profile?.display_name || 'Aluno'}</h3>
                          <button
                            className="text-button"
                            disabled={!!busy}
                            onClick={() =>
                              setConfirmation({
                                kind: 'member',
                                id: member.student_id,
                                name: member.profile?.display_name || 'Aluno',
                              })
                            }
                          >
                            Remover matrícula
                          </button>
                        </div>
                        <small className="muted">
                          Matriculado em {formatDate(member.joined_at, profile.timezone)}
                        </small>
                        <div
                          className="progress-track"
                          role="progressbar"
                          aria-label={`Progresso de ${member.profile?.display_name || 'aluno'}`}
                          aria-valuenow={completed}
                          aria-valuemin={0}
                          aria-valuemax={lessons.length}
                        >
                          <span style={{ width: `${(completed / lessons.length) * 100}%` }} />
                        </div>
                        <small>
                          {completed} de {lessons.length} aulas concluídas
                        </small>
                        <details>
                          <summary>Ver estudos e observações ({entries.length})</summary>
                          {entries.length ? (
                            <div className="stack">
                              {[...entries]
                                .sort(
                                  (a, b) =>
                                    lessons.findIndex((item) => item.id === a.lesson_id) -
                                    lessons.findIndex((item) => item.id === b.lesson_id),
                                )
                                .map((entry) => (
                                  <div key={entry.lesson_id}>
                                    <Link
                                      className="inline-link dashboard-lesson-link"
                                      href={`/aulas/${entry.lesson_id}#plano-professor`}
                                    >
                                      {lessonName(lessons, entry.lesson_id)}
                                    </Link>
                                    <p className="dashboard-form-note">
                                      {entry.status === 'completed'
                                        ? 'Concluída pelo aluno'
                                        : 'Em prática'}{' '}
                                      · Confiança: {entry.confidence}/5
                                    </p>
                                    {entry.notes && (
                                      <p className="dashboard-preserve">{entry.notes}</p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          ) : (
                            <Empty>O aluno ainda não registrou estudos.</Empty>
                          )}
                        </details>
                        <TeacherPractice
                          classId={classId}
                          studentId={member.student_id}
                          timezone={profile.timezone}
                          lessons={lessons}
                        />
                        <button
                          className="button secondary small dashboard-section-gap"
                          onClick={() => {
                            setStudentId(member.student_id);
                            const form = document.getElementById('feedback-form');
                            if (form instanceof HTMLDetailsElement) form.open = true;
                            form?.scrollIntoView({
                              behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
                                .matches
                                ? 'auto'
                                : 'smooth',
                              block: 'start',
                            });
                          }}
                        >
                          Preparar devolutiva
                        </button>
                      </article>
                    );
                  })
                ) : (
                  <Empty>
                    Nenhum aluno nesta turma ainda. Compartilhe o código para que cada aluno entre
                    com a própria conta.
                  </Empty>
                )}
                <Pagination page={page} hasMore={data.hasMore} onChange={setPage} label="alunos" />
              </section>
              <details className="card" id="feedback-form">
                <summary>Enviar devolutiva</summary>
                <div className="section-title">
                  <Hint label="Selecionar o aluno da devolutiva">
                    O formulário mostra os alunos da página atual. Para selecionar outros alunos,
                    avance a paginação da lista da turma.
                  </Hint>
                </div>
                {data.members.length ? (
                  <form className="stack" onSubmit={feedback} aria-busy={busy === 'feedback'}>
                    <label htmlFor="feedback-student">
                      Aluno desta página
                      <select
                        id="feedback-student"
                        value={selectedStudent}
                        onChange={(event) => setStudentId(event.target.value)}
                        required
                      >
                        {data.members.map((member) => (
                          <option key={member.student_id} value={member.student_id}>
                            {member.profile?.display_name || 'Aluno'}
                          </option>
                        ))}
                      </select>
                    </label>
                    <LessonSelect
                      id="feedback-lesson"
                      lessons={lessons}
                      value={feedbackLesson}
                      onChange={setFeedbackLesson}
                    />
                    <Link
                      className="inline-link dashboard-lesson-link"
                      href={`/aulas/${feedbackLesson}#plano-professor`}
                    >
                      Consultar plano desta aula
                    </Link>
                    <label htmlFor="feedback-body">
                      O que funcionou e o próximo ajuste
                      <textarea
                        id="feedback-body"
                        required
                        minLength={3}
                        maxLength={4000}
                        value={body}
                        onChange={(event) => setBody(event.target.value)}
                        placeholder="O pulso se manteve no refrão. Na próxima prática, concentre-se na troca de acordes do verso."
                      />
                    </label>
                    <label className="checkbox-label" htmlFor="feedback-validated">
                      <input
                        id="feedback-validated"
                        type="checkbox"
                        checked={validated}
                        onChange={(event) => setValidated(event.target.checked)}
                      />
                      Validei a execução desta aula
                    </label>
                    <button className="button" disabled={!!busy}>
                      <MessageSquare size={16} />
                      {busy === 'feedback' ? 'Enviando…' : 'Enviar devolutiva'}
                    </button>
                  </form>
                ) : (
                  <Empty>
                    Depois da primeira matrícula, você poderá enviar orientações individuais.
                  </Empty>
                )}
              </details>
            </div>
            <div className="stack">
              <details className="card">
                <summary>Agendar encontro</summary>
                <div className="section-title">
                  <span className="badge">60 minutos</span>
                </div>
                <form className="stack" onSubmit={schedule} aria-busy={busy === 'session'}>
                  <label htmlFor="meeting-title">
                    Título
                    <input
                      id="meeting-title"
                      required
                      minLength={3}
                      maxLength={140}
                      placeholder="Encontro semanal · Primeiras trocas"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                    />
                  </label>
                  <LessonSelect
                    id="meeting-lesson"
                    lessons={lessons}
                    value={meetingLesson}
                    onChange={setMeetingLesson}
                  />
                  <Link
                    className="inline-link dashboard-lesson-link"
                    href={`/aulas/${meetingLesson}#plano-professor`}
                  >
                    Preparar esta aula com o plano do professor
                  </Link>
                  <div>
                    <div className="label-with-hint">
                      <label htmlFor="meeting-start">Data e hora em {deviceTimezone}</label>
                      <Hint label="Fuso horário do encontro">
                        Digite o horário do dispositivo. A agenda converte para o fuso de cada
                        pessoa; o seu perfil usa {profile.timezone}.
                      </Hint>
                    </div>
                    <input
                      id="meeting-start"
                      type="datetime-local"
                      required
                      value={startsAt}
                      onChange={(event) => setStartsAt(event.target.value)}
                    />
                  </div>
                  <label htmlFor="meeting-url">
                    Link de encontro on-line (opcional)
                    <input
                      id="meeting-url"
                      type="url"
                      pattern="https://.*"
                      maxLength={1000}
                      placeholder="https://meet.google.com/…"
                      value={meetingUrl}
                      onChange={(event) => setMeetingUrl(event.target.value)}
                    />
                  </label>
                  <button className="button" disabled={!!busy}>
                    <CalendarPlus size={16} />
                    {busy === 'session' ? 'Agendando…' : 'Agendar encontro'}
                  </button>
                </form>
              </details>
              <section className="card">
                <div className="section-title">
                  <h2>Agenda da turma</h2>
                  <Hint label="Encontros exibidos">
                    Até 20 próximos encontros desta turma. A agenda geral também está na área do
                    professor.
                  </Hint>
                </div>
                <SessionEntries
                  items={data.sessions}
                  lessons={lessons}
                  timezone={profile.timezone}
                  onCancel={(id) => {
                    const session = data.sessions.find((item) => item.id === id);
                    if (session) setConfirmation({ kind: 'session', id, name: session.title });
                  }}
                />
              </section>
            </div>
            <details className="card">
              <summary>Devolutivas recentes</summary>
              <div className="section-title">
                <Hint label="Devolutivas exibidas">
                  As 20 devolutivas mais recentes para os alunos desta página.
                </Hint>
              </div>
              <FeedbackEntries
                items={data.feedback}
                lessons={lessons}
                timezone={profile.timezone}
                studentNames={Object.fromEntries(
                  data.members.map((member) => [
                    member.student_id,
                    member.profile?.display_name || 'Aluno',
                  ]),
                )}
              />
            </details>
          </>
        )}
      </ResourceState>
    </div>
  );
}
