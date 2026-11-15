import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { StudyLinks } from '@/components/course/learning-content';
import { HashReveal } from '@/components/course/hash-reveal';
import { techniqueModules, practicePrinciples, practiceIntroduction } from '@/content/curriculum';
import { requireCourseProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function TechniquePage() {
  const profile = await requireCourseProfile();
  return (
    <Shell active="/curso" courseAccess teacher={profile.role === 'teacher'}>
      <HashReveal />
      <Link href="/curso" className="back-link">
        <ArrowLeft size={16} /> Voltar aos 13 módulos
      </Link>
      <PageHeading
        eyebrow="FORMAÇÃO MUSICAL"
        title="A técnica encontra a música"
        description="Nove eixos e 27 estudos para compreender o instrumento, refinar o som e aplicar cada descoberta ao repertório."
      />
      <section className="card learning-reading">
        <h2>Seu caminho de prática</h2>
        <p>{practiceIntroduction}</p>
        <details className="section">
          <summary>Como organizar o estudo</summary>
          {practicePrinciples.map((principle) => (
            <div className="section" key={principle.title}>
              <h3>{principle.title}</h3>
              <p>{principle.text}</p>
            </div>
          ))}
        </details>
        <p className="hint section">
          Comece pelo estudo indicado na sua aula. Os pré-requisitos ajudam a escolher um desafio
          adequado; os eixos acompanham os 13 módulos do curso.
        </p>
      </section>
      <nav className="learning-paths" aria-label="Ir a um eixo técnico">
        {techniqueModules.map((module) => (
          <a className="button secondary" href={`#${module.id}`} key={module.id}>
            {module.id} · {module.title}
          </a>
        ))}
      </nav>
      <div className="stack">
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
            <StudyLinks studies={module.studies} />
            <div className="learning-paths">
              {module.relatedModules.map((number) => (
                <Link className="text-link" key={number} href={`/curso?modulo=${number}`}>
                  Aplicar no módulo {number} <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          </CollapsibleCard>
        ))}
      </div>
    </Shell>
  );
}
