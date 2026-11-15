import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { HashReveal } from '@/components/course/hash-reveal';
import {
  techniqueModules,
  practicePrinciples,
  practiceIntroduction,
  getTechniqueStudyIntroduction,
  getStudyLessonIds,
} from '@/content/curriculum';
import { lessons } from '@/content/course';
import { requireCourseProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function TechniquePage() {
  const profile = await requireCourseProfile();
  return (
    <Shell active="/curso" courseAccess teacher={profile.role === 'teacher'}>
      <HashReveal />
      <Link href="/curso" className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Voltar à trilha de aprendizado
      </Link>
      <PageHeading
        eyebrow="CONSULTA POR ASSUNTO"
        title="Índice de técnicas"
        description="Os mesmos 27 estudos que acompanham as 39 aulas, organizados em nove eixos. Encontre um assunto e abra a aula em que ele começa."
      />
      <CollapsibleCard title="Como organizar sua prática" className="learning-reading">
        <p>{practiceIntroduction}</p>
        {practicePrinciples.map((principle) => (
          <div className="section" key={principle.title}>
            <h3>{principle.title}</h3>
            <p>{principle.text}</p>
          </div>
        ))}
        <p className="hint section">
          Comece pelo estudo indicado na sua aula. Os pré-requisitos ajudam a escolher um desafio
          adequado; os eixos acompanham os 13 módulos do curso.
        </p>
      </CollapsibleCard>
      <details className="section">
        <summary>Ir direto a um eixo técnico</summary>
        <nav className="learning-paths" aria-label="Ir a um eixo técnico">
          {techniqueModules.map((module) => (
            <a className="button secondary" href={`#${module.id}`} key={module.id}>
              {module.title}
            </a>
          ))}
        </nav>
      </details>
      <div className="stack section">
        {techniqueModules.map((module) => (
          <CollapsibleCard
            id={module.id}
            key={module.id}
            title={`${module.id} · ${module.title}`}
            description={module.goal}
          >
            <p className="learning-module-intro">{module.introduction}</p>
            <details>
              <summary>Antes de começar</summary>
              <ul>
                {module.prerequisites.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </details>
            <div className="stack section">
              {module.studies.map((study) => {
                const introduction = getTechniqueStudyIntroduction(study.id);
                const lesson = lessons.find((item) => item.id === introduction?.lessonId);
                return (
                  <article key={study.id}>
                    <h3>{study.title}</h3>
                    <p>{study.goal}</p>
                    {introduction && <p className="hint">Nesta etapa: {introduction.focus}</p>}
                    <div className="learning-paths">
                      {lesson && (
                        <Link
                          className="button secondary"
                          href={`/aulas/${lesson.id}#estudo-${study.id}`}
                        >
                          Estudar no módulo {lesson.module}, aula {lesson.local_n}
                          <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                      )}
                      <Link className="text-link" href={`/tecnica/${study.id}`}>
                        Consultar estudo completo <ArrowRight size={15} aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="learning-paths">
              {Array.from(
                new Set(
                  module.studies.flatMap((study) =>
                    getStudyLessonIds(study.id).flatMap((id) => {
                      const lesson = lessons.find((item) => item.id === id);
                      return lesson ? [lesson.module] : [];
                    }),
                  ),
                ),
              )
                .sort((a, b) => a - b)
                .map((number) => (
                  <Link className="text-link" key={number} href={`/curso?modulo=${number}`}>
                    Ver o módulo {number} <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                ))}
            </div>
          </CollapsibleCard>
        ))}
      </div>
    </Shell>
  );
}
