import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { TheoryExercise } from '@/components/course/theory-exercise';
import { ResearchSources } from '@/components/course/learning-content';
import { HashReveal } from '@/components/course/hash-reveal';
import { Metronome } from '@/components/music/metronome';
import {
  getTechniqueStudy,
  getStudyLessonIds,
  techniqueSources,
  techniqueStudies,
} from '@/content/curriculum';
import { lessons } from '@/content/course';
import { requireCourseProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function TechniqueStudyPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireCourseProfile();
  const { id } = await params;
  const study = getTechniqueStudy(id);
  if (!study) notFound();
  const relatedIds = new Set(getStudyLessonIds(study.id));
  const related = lessons.filter((lesson) => relatedIds.has(lesson.id));
  const siblings = techniqueStudies.filter((item) => item.moduleId === study.moduleId);
  const index = siblings.findIndex((item) => item.id === study.id);
  return (
    <Shell active="/curso" courseAccess teacher={profile.role === 'teacher'}>
      <HashReveal />
      <Link href={`/tecnica#${study.moduleId}`} className="back-link">
        <ArrowLeft size={16} /> {study.moduleTitle}
      </Link>
      <PageHeading
        eyebrow={`${study.moduleId} · ESTUDO ${index + 1} DE ${siblings.length}`}
        title={study.title}
        description={study.goal}
      />
      <nav className="lesson-jumps" aria-label="Neste estudo">
        <a href="#compreender">Compreender</a>
        <a href="#experimentar">Experimentar</a>
        <a href="#recuperar">Recordar</a>
        <a href="#aplicar">Aplicar na música</a>
      </nav>
      <div className="lesson-layout">
        <div className="lesson-content stack learning-reading">
          <section className="card" id="compreender">
            <h2>Uma ideia, um som, uma ação</h2>
            <details className="section">
              <summary>O que preparar antes</summary>
              <ul>
                {study.prerequisites.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </details>
            <div className="section">
              {study.explanation.map((paragraph, i) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>
            <div className="learning-example section">
              <p className="eyebrow">EXEMPLO AUTORAL</p>
              <h3>{study.workedExample.title}</h3>
              <p>{study.workedExample.text}</p>
            </div>
            {study.workedExample.tab && (
              <pre
                className="learning-tab"
                tabIndex={0}
                role="region"
                aria-label="Tablatura do exemplo"
              >
                <code>{study.workedExample.tab}</code>
              </pre>
            )}
          </section>
          <CollapsibleCard id="experimentar" title="Agora, no seu violão">
            <ol className="steps">
              {study.steps.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
            <div className="section">
              <h3>Se precisar de apoio</h3>
              <p>{study.easier}</p>
            </div>
            <div className="section">
              <h3>Quando estiver estável</h3>
              <p>{study.harder}</p>
            </div>
          </CollapsibleCard>
          <CollapsibleCard title="Escute o resultado e ajuste">
            {study.mistakes.map((mistake, i) => (
              <div className="section" key={i}>
                <h3>{mistake.symptom}</h3>
                <p>{mistake.adjustment}</p>
              </div>
            ))}
            <h3 className="section">Critérios para observar</h3>
            <ul>
              {study.checks.map((check, i) => (
                <li key={i}>{check}</li>
              ))}
            </ul>
          </CollapsibleCard>
          <div id="recuperar">
            <TheoryExercise exercise={study.retrieval.question} answer={study.retrieval.answer} />
          </div>
          <CollapsibleCard title="Volte ao estudo em outro dia">
            <ol className="steps">
              {study.spacing.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
            <p className="hint">
              Registre sua tentativa no diário de uma das aulas de aplicação. Inclua o código{' '}
              {study.id.toUpperCase()}, o apoio usado e o próximo ajuste.
            </p>
          </CollapsibleCard>
          <section className="card" id="aplicar">
            <p className="eyebrow">TÉCNICA DENTRO DA MÚSICA</p>
            <h2>Retorne ao repertório</h2>
            <div className="review-list">
              {related.map((lesson) => (
                <Link key={lesson.id} href={`/aulas/${lesson.id}#aprofundar`}>
                  <span>
                    {lesson.display_id} · {lesson.title}
                  </span>
                  <ArrowRight size={16} />
                </Link>
              ))}
            </div>
          </section>
          <ResearchSources
            sources={techniqueSources.filter((source) => study.sourceIds.includes(source.id))}
          />
        </div>
        <aside className="lesson-aside">
          <Metronome key={study.id} initialMeter={study.id === 't7-e2' ? '6/8' : '4/4'} />
          <section className="card">
            <h2>Ouça e confira</h2>
            <p>Explore notas, intervalos e acordes no laboratório, depois repita no instrumento.</p>
            <Link className="button secondary section" href="/laboratorio">
              Abrir laboratório <ArrowRight size={16} />
            </Link>
          </section>
          <section className="card">
            <h2>Leve o estudo com você</h2>
            <p>A apostila reúne os estudos técnicos e as aulas do repertório.</p>
            <a className="resource-link" href="/api/materials/aluno" download>
              Baixar apostila do aluno
            </a>
          </section>
        </aside>
      </div>
      <nav className="lesson-nav" aria-label="Estudos deste eixo">
        {index > 0 ? (
          <Link className="button secondary" href={`/tecnica/${siblings[index - 1].id}`}>
            <ArrowLeft size={16} /> Estudo anterior
          </Link>
        ) : (
          <Link className="button secondary" href={`/tecnica#${study.moduleId}`}>
            Ver o eixo
          </Link>
        )}
        {index + 1 < siblings.length && (
          <Link className="button" href={`/tecnica/${siblings[index + 1].id}`}>
            Próximo estudo <ArrowRight size={16} />
          </Link>
        )}
      </nav>
    </Shell>
  );
}
