import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { requireProfile } from '@/lib/auth';
import { courseModules, lessons } from '@/content/course';
import { teachingGuide } from '@/content/teacher';
import { ResearchSources } from '@/components/course/learning-content';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { HashReveal } from '@/components/course/hash-reveal';

export const dynamic = 'force-dynamic';

export default async function TeachingPage() {
  await requireProfile('teacher');
  return (
    <Shell active="/professor" teacher>
      <HashReveal />
      <Link href="/professor" className="back-link">
        <ArrowLeft size={16} /> Voltar às turmas
      </Link>
      <PageHeading
        eyebrow="ORIENTAÇÃO DOCENTE"
        title="Guia do professor"
        description="Escolha uma aula, prepare o encontro e acompanhe a execução."
      />
      <nav className="learning-paths" aria-label="Recursos para lecionar">
        <a className="button secondary" href="#avaliar">
          Consultar critérios de avaliação
        </a>
        <a className="button secondary" href="/api/materials/professor" download>
          Baixar manual do professor
        </a>
      </nav>
      <CollapsibleCard
        title="Planos das aulas"
        className="section"
        id="planos"
        name="teaching-guide"
        defaultOpen
      >
        <div className="stack section">
          {courseModules.map((module) => (
            <CollapsibleCard
              key={module.n}
              title={`Módulo ${module.n} · ${module.title}`}
              name="teaching-modules"
            >
              <p>{module.goal}</p>
              <div className="review-list">
                {lessons
                  .filter((lesson) => lesson.module === module.n)
                  .map((lesson) => (
                    <Link key={lesson.id} href={`/aulas/${lesson.id}#plano-professor`}>
                      <span>
                        {lesson.display_id} · {lesson.title}
                      </span>
                      <ArrowRight size={16} />
                    </Link>
                  ))}
              </div>
            </CollapsibleCard>
          ))}
        </div>
      </CollapsibleCard>
      <CollapsibleCard
        title="Princípios de ensino"
        className="section"
        id="principios"
        name="teaching-guide"
      >
        <p>{teachingGuide.introduction}</p>
        <div className="stack learning-reading">
          {teachingGuide.teachingPrinciples.map((principle) => (
            <CollapsibleCard key={principle.title} title={principle.title}>
              <p>{principle.text}</p>
            </CollapsibleCard>
          ))}
        </div>
      </CollapsibleCard>
      <CollapsibleCard
        title="Avaliar a execução"
        className="section"
        id="avaliar"
        name="teaching-guide"
      >
        <p>
          Registre o trecho, o andamento, o apoio utilizado e uma evidência observável. Use os
          descritores para conversar sobre a aprendizagem e retome a tarefa em outro dia.
        </p>
        <div
          className="table-scroll section"
          tabIndex={0}
          role="region"
          aria-label="Rubrica de aprendizagem"
        >
          <table>
            <thead>
              <tr>
                <th scope="col">Dimensão</th>
                <th scope="col">Iniciando</th>
                <th scope="col">Em desenvolvimento</th>
                <th scope="col">Consistente na tarefa</th>
              </tr>
            </thead>
            <tbody>
              {teachingGuide.assessment.map((item) => (
                <tr key={item.dimension}>
                  <th scope="row">{item.dimension}</th>
                  <td>{item.beginning}</td>
                  <td>{item.developing}</td>
                  <td>{item.secure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CollapsibleCard>
      <ResearchSources sources={teachingGuide.sources} />
    </Shell>
  );
}
