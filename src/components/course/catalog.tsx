'use client';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import Link from 'next/link';
import { ArrowRight, Check } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { CourseModule, Lesson } from '@/content/types';
import type { Progress } from '@/lib/contracts';
import { useApi, Notice } from '@/components/ui';
export function Catalog({ modules, lessons }: { modules: CourseModule[]; lessons: Lesson[] }) {
  const search = useSearchParams();
  const router = useRouter();
  const query = search.get('q') ?? '';
  const selectedModule = search.get('modulo') ?? 'all';
  const { data: progress, error: progressError } = useApi<Progress[]>('/api/progress');
  function filter(key: string, value: string) {
    const params = new URLSearchParams(search);
    if (value && value !== 'all') params.set(key, value);
    else params.delete(key);
    router.replace(`/curso?${params.toString()}`, { scroll: false });
  }
  const filtered = lessons.filter(
    (l) =>
      (selectedModule === 'all' || l.module === Number(selectedModule)) &&
      `${l.title} ${l.song} ${l.goal} ${l.display_id}`
        .toLocaleLowerCase('pt-BR')
        .includes(query.toLocaleLowerCase('pt-BR')),
  );
  return (
    <>
      <Notice error message={progressError} />
      <div className="filter-bar">
        <label>
          Buscar uma aula
          <input
            type="search"
            value={query}
            onChange={(e) => filter('q', e.target.value)}
            placeholder="Acordes, ritmo, música…"
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
      <p className="search-count">
        {filtered.length} aulas encontradas · 1 encontro semanal de 60 minutos
      </p>
      {modules
        .filter((m) => filtered.some((l) => l.module === m.n))
        .map((m) => (
          <CollapsibleCard
            className="course-module"
            key={m.n}
            id={`modulo-${m.n}`}
            title={m.title}
            description={m.goal}
            leading={<span className="module-number">{String(m.n).padStart(2, '0')}</span>}
          >
            {filtered
              .filter((l) => l.module === m.n)
              .map((l) => {
                const completed =
                  progress?.find((p) => p.lesson_id === l.id)?.status === 'completed';
                return (
                  <Link className="lesson-row" href={`/aulas/${l.id}`} key={l.id}>
                    <span className="lesson-number">
                      {completed ? <Check size={16} /> : l.local_n}
                    </span>
                    <div>
                      <h3>
                        Aula {l.local_n} · {l.title}
                      </h3>
                      <p>{l.goal}</p>
                    </div>
                    <ArrowRight className="row-arrow" size={17} />
                  </Link>
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
