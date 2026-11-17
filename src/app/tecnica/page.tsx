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
        description="Escolha um assunto para consultar ou retomar na aula."
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
      <div className="stack section">
        {techniqueModules.map((module) => (
          <CollapsibleCard
            id={module.id}
            key={module.id}
            title={`${module.id} · ${module.title}`}
            name="technique-index"
          >
            <details>
              <summary>Objetivo e preparação</summary>
              <p>{module.goal}</p>
              <p>{module.introduction}</p>
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
                    <details>
                      <summary>Objetivo do estudo</summary>
                      <p>{study.goal}</p>
                      {introduction && <p>{introduction.focus}</p>}
                    </details>
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
            <details>
              <summary>Módulos relacionados</summary>
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
            </details>
          </CollapsibleCard>
        ))}
      </div>
    </Shell>
  );
}
