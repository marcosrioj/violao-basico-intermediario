'use client';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import Link from '@/components/ui/page-link';
import { ArrowRight, Check } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { CourseModule, Lesson } from '@/content/types';
import type { Progress } from '@/lib/contracts';
import { useApi, Notice } from '@/components/ui';
type CatalogLesson = Pick<
  Lesson,
  'id' | 'title' | 'goal' | 'song' | 'module' | 'display_id' | 'local_n'
> & {
  techniques: { id: string; title: string; stage: 'introducao' | 'retomada' }[];
};

function searchable(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('_', ' ')
    .toLocaleLowerCase('pt-BR');
}

export function Catalog({
  modules,
  lessons,
}: {
  modules: CourseModule[];
  lessons: CatalogLesson[];
}) {
  const search = useSearchParams();
  const router = useRouter();
  const query = search.get('q') ?? '';
  const selectedModule = search.get('modulo') ?? 'all';
  const {
    data: progress,
    error: progressError,
    loading: progressLoading,
  } = useApi<Progress[]>('/api/progress');
  const completedIds = new Set(
    progress?.filter((item) => item.status === 'completed').map((item) => item.lesson_id),
  );
  const recentLessonId = progress
    ?.filter(
      (item) => item.status === 'in_progress' && lessons.some((l) => l.id === item.lesson_id),
    )
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]?.lesson_id;
  const nextLesson =
    lessons.find((lesson) => lesson.id === recentLessonId) ??
    lessons.find((lesson) => !completedIds.has(lesson.id));
  const completedCount = lessons.filter((lesson) => completedIds.has(lesson.id)).length;
  function filter(key: string, value: string) {
    const params = new URLSearchParams(search);
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    router.replace(`/curso?${params.toString()}`, { scroll: false });
  }
  const filtered = lessons.filter(
    (l) =>
      (selectedModule === 'all' || l.module === Number(selectedModule)) &&
      searchable(
        `${l.title} ${l.song} ${l.goal} ${l.display_id} ${l.techniques.map((study) => study.title).join(' ')}`,
      ).includes(searchable(query)),
  );
  return (
    <>
      <Notice error message={progressError} />
      <section className="card learning-reading" aria-labelledby="next-lesson-title">
        <p className="eyebrow">CONTINUAR</p>
        <h2 id="next-lesson-title">
          {progressLoading || progressError
            ? 'Repertório e técnica na mesma aula'
            : nextLesson
              ? nextLesson.title
              : 'Trilha concluída. Continue praticando.'}
        </h2>
        {progressLoading ? (
          <p role="status">Carregando seu progresso…</p>
        ) : progressError ? (
          <p>Você pode abrir qualquer aula abaixo enquanto o progresso está indisponível.</p>
        ) : (
          <>
            <p>
              {completedCount} de {lessons.length} aulas concluídas
              {nextLesson && (
                <span className="learning-link-description">
                  Módulo {nextLesson.module} · Aula {nextLesson.local_n}
                </span>
              )}
            </p>
            <div className="learning-paths">
              {nextLesson ? (
                <Link className="button" href={`/aulas/${nextLesson.id}`}>
                  {recentLessonId
                    ? 'Continuar minha aula'
                    : completedCount > 0
                      ? 'Ir para a próxima aula'
                      : 'Começar minha primeira aula'}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              ) : (
                <a className="button" href="#modulos">
                  Escolher uma aula para revisar <ArrowRight size={16} aria-hidden="true" />
                </a>
              )}
            </div>
          </>
        )}
      </section>
      <section className="section" aria-label="Encontrar uma aula ou técnica">
        <div className="filter-bar">
          <label>
            Buscar por aula, música ou técnica
            <input
              type="search"
              value={query}
              onChange={(e) => filter('q', e.target.value)}
              placeholder="Pestana, vibrato, nome da música…"
            />
          </label>
          <label>
            Módulo
            <select value={selectedModule} onChange={(e) => filter('modulo', e.target.value)}>
              <option value="all">Todos os módulos</option>
              {modules.map((m) => (
                <option value={m.n} key={m.n}>
                  Módulo {m.n}
                </option>
              ))}
            </select>
          </label>
        </div>
        {Boolean(query || selectedModule !== 'all') && (
          <button
            type="button"
            className="button secondary small"
            onClick={() => router.replace('/curso', { scroll: false })}
          >
            Limpar filtros
          </button>
        )}
      </section>
      <p className="search-count" id="modulos" role="status" aria-atomic="true">
        {filtered.length} aulas {query || selectedModule !== 'all' ? 'encontradas' : 'na trilha'}
      </p>
      {modules
        .filter((m) => filtered.some((l) => l.module === m.n))
        .map((m) => (
          <CollapsibleCard
            className="course-module"
            defaultOpen={Boolean(query || selectedModule !== 'all')}
            key={m.n}
            id={`modulo-${m.n}`}
            title={m.title}
            name={query || selectedModule !== 'all' ? undefined : 'course-modules'}
            leading={<span className="module-number">{String(m.n).padStart(2, '0')}</span>}
          >
            <p className="module-goal">{m.goal}</p>
            {filtered
              .filter((l) => l.module === m.n)
              .map((l) => {
                const completed = completedIds.has(l.id);
                const introductions = l.techniques.filter((study) => study.stage === 'introducao');
                const reviews = l.techniques.filter((study) => study.stage === 'retomada');
                return (
                  <article className="catalog-lesson" key={l.id}>
                    <Link className="lesson-row" href={`/aulas/${l.id}`}>
                      <span className="lesson-number">
                        {completed ? <Check size={16} aria-label="Aula concluída" /> : l.local_n}
                      </span>
                      <div>
                        <h3>
                          Aula {l.local_n} · {l.title}
                        </h3>
                      </div>
                      <ArrowRight className="row-arrow" size={17} aria-hidden="true" />
                    </Link>
                    <details className="catalog-lesson-details">
                      <summary>Objetivo e técnicas</summary>
                      <p>{l.goal}</p>
                      {introductions.length > 0 && (
                        <p>
                          <strong>Técnica nesta etapa:</strong>{' '}
                          {introductions.map((study) => study.title).join(' · ')}
                        </p>
                      )}
                      {reviews.length > 0 && (
                        <p>
                          <strong>Retomar e aplicar:</strong>{' '}
                          {reviews.map((study) => study.title).join(' · ')}
                        </p>
                      )}
                    </details>
                  </article>
                );
              })}
          </CollapsibleCard>
        ))}
      {filtered.length === 0 && (
        <div className="empty">Nenhuma aula com esse filtro. Experimente outro termo.</div>
      )}
    </>
  );
}
