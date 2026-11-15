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
        title="Ensinar a ouvir, tocar e aprender"
        description={teachingGuide.introduction}
      />
      <nav className="lesson-jumps" aria-label="Guia docente">
        <a href="#principios">Princípios</a>
        <a href="#avaliar">Avaliação</a>
        <a href="#planos">Planos das aulas</a>
      </nav>
      <div className="stack learning-reading" id="principios">
        {teachingGuide.teachingPrinciples.map((principle) => (
          <CollapsibleCard key={principle.title} title={principle.title}>
            <p>{principle.text}</p>
          </CollapsibleCard>
        ))}
      </div>
      <section className="card section" id="avaliar">
        <p className="eyebrow">EVIDÊNCIAS DA EXECUÇÃO</p>
        <h2>Uma rubrica para orientar a próxima tentativa</h2>
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
      </section>
      <section className="section" id="planos">
        <p className="eyebrow">39 ENCONTROS CONECTADOS</p>
        <h2>Prepare a aula do seu módulo</h2>
        <div className="stack section">
          {courseModules.map((module) => (
            <CollapsibleCard
              key={module.n}
              title={`Módulo ${module.n} · ${module.title}`}
              description={module.goal}
            >
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
      </section>
      <a className="button section" href="/api/materials/professor" download>
        Baixar manual do professor
      </a>
      <ResearchSources sources={teachingGuide.sources} />
    </Shell>
  );
}
