import { CollapsibleCard } from '@/components/ui/collapsible-card';
export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { requireCourseProfile } from '@/lib/auth';
import { getLesson, getChart } from '@/content/course';
import { getLessonVisualSteps } from '@/content/lesson-visuals';
import { getTeacherDemoVisual } from '@/content/teacher-visuals';
import { getTechniqueVisuals } from '@/content/technique-visuals';
import {
  getTeacherLesson,
  getTeacherEnrichment,
  teachingSources,
  getTeacherCue,
} from '@/content/teacher';
import { getLessonEnrichment, getLessonTechniqueEntries } from '@/content/curriculum';
import { TeacherDeepening } from '@/components/course/learning-content';
import Link from '@/components/ui/page-link';
import { LessonView } from '@/components/course/lesson-view';
import { RichText } from '@/components/course/rich-text';
import { LessonPresentation } from '@/components/course/lesson-presentation';
import { TeacherMeeting } from '@/components/course/teacher-meeting';

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireCourseProfile();
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();
  const teacher = profile.role === 'teacher';
  const plan = teacher ? getTeacherLesson(lesson.id) : undefined;
  const enrichedPlan = teacher ? getTeacherEnrichment(lesson.id) : undefined;
  const cue = teacher ? getTeacherCue(lesson.id) : undefined;
  const techniques = teacher ? getLessonTechniqueEntries(lesson.id) : [];
  return (
    <LessonView
      lesson={lesson}
      teacher={teacher}
      teacherPlan={
        plan ? (
          <CollapsibleCard id="plano-professor" title="Condução do encontro">
            {cue && (
              <TeacherMeeting
                cue={cue}
                goal={lesson.goal}
                visual={getTeacherDemoVisual(lesson, getChart(lesson))}
              />
            )}
            <LessonPresentation
              key={lesson.id}
              lesson={lesson}
              enrichment={getLessonEnrichment(lesson.id)}
              illustratedSteps={getLessonVisualSteps(lesson, getChart(lesson))}
              techniques={techniques.map(({ study, stage, focus }) => ({
                study: {
                  id: study.id,
                  title: study.title,
                  workedExample: study.workedExample,
                  steps: study.steps,
                  checks: study.checks,
                  retrieval: study.retrieval,
                },
                stage,
                focus,
                visuals: getTechniqueVisuals(study.id),
              }))}
            />

            <details className="section">
              <summary>Preparação e referências completas</summary>
              {enrichedPlan && (
                <TeacherDeepening content={enrichedPlan} sources={teachingSources} />
              )}
              <Link
                purpose="reference"
                className="resource-link section"
                href="/professor/metodologia"
              >
                Consultar princípios de ensino e rubrica
              </Link>
              <details className="section">
                <summary>Foco técnico deste encontro</summary>
                <p>
                  Distribua os estudos dentro do plano de 60 minutos. Demonstre o foco indicado,
                  observe uma tentativa e leve o movimento ao repertório.
                </p>
                <ul>
                  {techniques.map(({ study, stage, focus }) => (
                    <li key={study.id}>
                      <a href={`#estudo-${study.id}`}>
                        {stage === 'introducao' ? 'Começar' : 'Retomar'}: {study.title}
                      </a>
                      <p>{focus}</p>
                    </li>
                  ))}
                </ul>
              </details>
              <h3 className="section">Orientação do plano original</h3>
              <p>
                <RichText text={plan.teacher} lesson={lesson} field="teacher" />
              </p>
              <details className="section">
                <summary>
                  Plano original completo · páginas originais {plan.teacherPages.join(', ')}
                </summary>
                <div className="source-text">
                  <RichText text={plan.teacherText} lesson={lesson} field="teacherText" />
                </div>
              </details>
            </details>
          </CollapsibleCard>
        ) : undefined
      }
    />
  );
}
