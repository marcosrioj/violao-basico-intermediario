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
  getTechniqueStudyIntroduction,
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
  const introduction = getTechniqueStudyIntroduction(study.id);
  const firstLesson = lessons.find((lesson) => lesson.id === introduction?.lessonId);
  return (
    <Shell active="/curso" courseAccess teacher={profile.role === 'teacher'}>
      <HashReveal />
      <Link href={`/tecnica#${study.moduleId}`} className="back-link">
        <ArrowLeft size={16} aria-hidden="true" /> Índice de técnicas · {study.moduleTitle}
      </Link>
      <PageHeading
        eyebrow={`${study.moduleId} · ESTUDO ${index + 1} DE ${siblings.length}`}
        title={study.title}
        description={study.goal}
      />
      {firstLesson && introduction && (
        <section className="card learning-reading" aria-labelledby="study-in-course">
          <p className="eyebrow">ESTE ESTUDO FAZ PARTE DA SUA TRILHA</p>
          <h2 id="study-in-course">
            Módulo {firstLesson.module}, aula {firstLesson.local_n} · {firstLesson.title}
          </h2>
          <p>{introduction.focus}</p>
          <div className="learning-paths">
            <Link className="button" href={`/aulas/${firstLesson.id}#estudo-${study.id}`}>
              Aprender dentro da aula <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <p>O conteúdo completo também está abaixo para consulta e revisão.</p>
        </section>
      )}
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
            <h2>Pratique este estudo nas aulas</h2>
            <div className="review-list">
              {related.map((lesson) => (
                <Link key={lesson.id} href={`/aulas/${lesson.id}#estudo-${study.id}`}>
                  <span>
                    {lesson.display_id} · {lesson.title}
                  </span>
                  <ArrowRight size={16} aria-hidden="true" />
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
              Abrir laboratório <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </section>
          <section className="card">
            <h2>Leve o estudo com você</h2>
            <p>A apostila acompanha a trilha, com os estudos técnicos integrados às aulas.</p>
            <a className="resource-link" href="/api/materials/aluno" download>
              Baixar apostila do aluno
            </a>
          </section>
        </aside>
      </div>
      <nav className="lesson-nav" aria-label="Estudos deste eixo">
        {index > 0 ? (
          <Link className="button secondary" href={`/tecnica/${siblings[index - 1].id}`}>
            <ArrowLeft size={16} aria-hidden="true" /> Estudo anterior
          </Link>
        ) : (
          <Link className="button secondary" href={`/tecnica#${study.moduleId}`}>
            Ver o eixo
          </Link>
        )}
        {index + 1 < siblings.length && (
          <Link className="button secondary" href={`/tecnica/${siblings[index + 1].id}`}>
            Próximo estudo <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
      </nav>
    </Shell>
  );
}
