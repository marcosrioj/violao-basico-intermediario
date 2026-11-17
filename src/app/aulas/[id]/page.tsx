import { CollapsibleCard } from '@/components/ui/collapsible-card';
export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { requireCourseProfile } from '@/lib/auth';
import { getLesson, getChart } from '@/content/course';
import { getLessonVisualSteps } from '@/content/lesson-visuals';
import { getTechniqueVisuals } from '@/content/technique-visuals';
import {
  getTeacherLesson,
  getTeacherEnrichment,
  teachingSources,
  weeklyPlan,
  finalPlan,
} from '@/content/teacher';
import { getLessonEnrichment, getLessonTechniqueEntries } from '@/content/curriculum';
import { TeacherDeepening } from '@/components/course/learning-content';
import Link from '@/components/ui/page-link';
import { LessonView } from '@/components/course/lesson-view';
import { RichText } from '@/components/course/rich-text';
import { LessonPresentation } from '@/components/course/lesson-presentation';

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireCourseProfile();
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();
  const teacher = profile.role === 'teacher';
  const plan = teacher ? getTeacherLesson(lesson.id) : undefined;
  const enrichedPlan = teacher ? getTeacherEnrichment(lesson.id) : undefined;
  const schedule = lesson.n === 39 ? finalPlan : weeklyPlan;
  const techniques = teacher ? getLessonTechniqueEntries(lesson.id) : [];
  return (
    <LessonView
      lesson={lesson}
      teacher={teacher}
      teacherPlan={
        plan ? (
          <CollapsibleCard id="plano-professor" title="Condução do encontro">
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
            {enrichedPlan && <TeacherDeepening content={enrichedPlan} sources={teachingSources} />}
            <Link
              purpose="reference"
              className="resource-link section"
              href="/professor/metodologia"
            >
              Consultar princípios de ensino e rubrica
            </Link>
            <details className="section">
              <summary>Planos e referências completos</summary>
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
              <details className="section">
                <summary>Roteiro original de referência · 60 minutos</summary>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th scope="col">Duração</th>
                        <th scope="col">Atividade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map((activity, i) => (
                        <tr key={activity.title}>
                          <td>{activity.minutes} min</td>
                          <td>
                            <RichText
                              text={activity.title}
                              lesson={lesson}
                              field={`schedule-${i}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr>
                        <th scope="row">60 min</th>
                        <td>Tempo total planejado</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                <p className="hint">
                  Adapte o apoio à execução observada. Reserve tempo para a forma inteira da música.
                </p>
              </details>
            </details>
          </CollapsibleCard>
        ) : undefined
      }
    />
  );
}
