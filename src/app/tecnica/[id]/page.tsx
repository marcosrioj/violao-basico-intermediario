import Link from '@/components/ui/page-link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { TechniqueStudyContent } from '@/components/course/learning-content';
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
      <nav className="learning-paths" aria-label="Praticar este estudo">
        {firstLesson && introduction && (
          <Link className="button" href={`/aulas/${firstLesson.id}#estudo-${study.id}`}>
            Estudar na aula {firstLesson.display_id} <ArrowRight size={16} aria-hidden="true" />
          </Link>
        )}
        <a className="button secondary" href="#metronomo-estudo">
          Usar metrônomo
        </a>
      </nav>
      <div className="lesson-focused stack">
        <section className="card">
          <TechniqueStudyContent study={study} sources={techniqueSources} standalone />
        </section>
        <div id="metronomo-estudo">
          <Metronome key={study.id} initialMeter={study.id === 't7-e2' ? '6/8' : '4/4'} />
        </div>
        <CollapsibleCard id="aplicar" title="Aulas de aplicação">
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
        </CollapsibleCard>
        <section aria-label="Ferramentas e materiais">
          <Link purpose="reference" className="resource-link" href="/laboratorio">
            Abrir laboratório
          </Link>
          <a className="resource-link" href="/api/materials/aluno" download>
            Baixar apostila do aluno
          </a>
          <p className="hint">
            Registre sua tentativa no diário da aula, incluindo {study.id.toUpperCase()}, o apoio
            usado e o próximo ajuste.
          </p>
        </section>
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
