'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Plus, Users } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import type { Classroom, Page, Profile } from '@/lib/contracts';
import { Empty, Notice } from '@/components/ui';
import { Hint } from '@/components/ui/hint';
import {
  AccountPanel,
  messageOf,
  Pagination,
  ResourceState,
  useResource,
  type LessonOption,
} from './shared';
import { Agenda } from './student-dashboard';

export function Invitation({ code }: { code?: string }) {
  const [message, setMessage] = useState('');
  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setMessage('Código copiado.');
    } catch {
      setMessage('Selecione o código e copie para compartilhá-lo.');
    }
  }
  if (!code) return null;
  return (
    <div>
      <small className="muted">Código de matrícula</small>
      <div className="dashboard-invite-row">
        <code className="membership-code">{code}</code>
        <button type="button" className="button secondary small" onClick={copy}>
          Copiar código
        </button>
        <Hint label="Compartilhar o código de matrícula">
          Envie este código diretamente ao aluno, pelo canal combinado. O curso será liberado quando
          ele confirmar a matrícula no próprio painel.
        </Hint>
      </div>
      {message && <small role="status">{message}</small>}
    </div>
  );
}
export function TeacherDashboard({
  profile,
  lessons,
}: {
  profile: Profile;
  lessons: LessonOption[];
}) {
  const [page, setPage] = useState(1);
  const resource = useResource<Page<Classroom>>(`/api/classes?page=${page}`);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  async function create(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      await apiFetch<Classroom>('/api/classes', { method: 'POST', body: JSON.stringify({ name }) });
      setName('');
      setPage(1);
      resource.reload();
      setMessage(
        'Turma criada. Envie o código diretamente aos alunos para que confirmem a matrícula.',
      );
    } catch (error) {
      setError(messageOf(error));
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="dashboard-surface">
      <AccountPanel profile={profile} />
      <div className="two-columns">
        <section className="card">
          <div className="section-title">
            <h2>Suas turmas</h2>
            <Hint label="Criar uma turma">
              Crie uma turma e envie seu código aos alunos. Cada aluno confirma a matrícula para
              liberar o curso.
            </Hint>
          </div>
          <form onSubmit={create}>
            <div className="control-row">
              <label htmlFor="class-name">
                Nome da nova turma
                <input
                  id="class-name"
                  required
                  minLength={3}
                  maxLength={100}
                  placeholder="Ex.: Violão · Sábados pela manhã"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
              <button className="button" disabled={busy}>
                <Plus size={16} />
                {busy ? 'Criando…' : 'Criar turma'}
              </button>
            </div>
          </form>
          <Notice error message={error} />
          <Notice message={message} />
          <ResourceState {...resource} retry={resource.reload}>
            {resource.data && (
              <>
                {resource.data.items.length ? (
                  <div className="dashboard-classes">
                    {resource.data.items.map((item) => (
                      <article className="dashboard-class" key={item.id}>
                        <div className="actions-between">
                          <h3>{item.name}</h3>
                          <Users size={20} />
                        </div>
                        <Invitation code={item.invite_code} />
                        <Link className="button secondary" href={`/professor/turmas/${item.id}`}>
                          Acompanhar turma
                          <ArrowRight size={16} />
                        </Link>
                      </article>
                    ))}
                  </div>
                ) : (
                  <Empty>
                    Crie a primeira turma para reunir seus alunos e organizar os encontros.
                  </Empty>
                )}
                <Pagination
                  page={page}
                  hasMore={resource.data.hasMore}
                  onChange={setPage}
                  label="turmas do professor"
                />
              </>
            )}
          </ResourceState>
        </section>
        <div className="stack">
          <Agenda profile={profile} lessons={lessons} />
          <section className="card">
            <p className="eyebrow">PREPARAÇÃO DO ENCONTRO</p>
            <div className="section-title">
              <h2>Ensine com um plano.</h2>
              <Hint label="Encontrar o plano do professor">
                Cada aula reúne o objetivo, a sequência de 60 minutos, os pontos de observação e o
                material do aluno. Na turma, registre sua devolutiva e organize a próxima semana.
              </Hint>
            </div>
            <Link className="button secondary" href="/curso">
              Explorar os 13 módulos
              <ArrowRight size={16} />
            </Link>
            <div className="review-list">
              {[lessons[0], lessons[12], lessons[24]].map((item) => (
                <Link key={item.id} href={`/aulas/${item.id}#plano-professor`}>
                  <span>
                    {item.display_id}
                    <br />
                    {item.title}
                  </span>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
