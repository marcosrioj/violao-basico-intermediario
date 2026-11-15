import { CollapsibleCard } from '@/components/ui/collapsible-card';
export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { requireCourseProfile } from '@/lib/auth';
import { getLesson } from '@/content/course';
import {
  getTeacherLesson,
  getTeacherEnrichment,
  teachingSources,
  weeklyPlan,
  finalPlan,
} from '@/content/teacher';
import { getLessonEnrichment } from '@/content/curriculum';
import { TeacherDeepening } from '@/components/course/learning-content';
import Link from 'next/link';
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
  return (
    <LessonView
      lesson={lesson}
      teacher={teacher}
      teacherPlan={
        plan ? (
          <CollapsibleCard id="plano-professor" title="Condução do encontro">
            <p className="eyebrow">ÁREA DO PROFESSOR</p>
            <LessonPresentation
              key={lesson.id}
              lesson={lesson}
              enrichment={getLessonEnrichment(lesson.id)}
            />
            {enrichedPlan && <TeacherDeepening content={enrichedPlan} sources={teachingSources} />}
            <Link className="resource-link section" href="/professor/metodologia">
              Consultar princípios de ensino e rubrica
            </Link>
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
                          <RichText text={activity.title} lesson={lesson} field={`schedule-${i}`} />
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
          </CollapsibleCard>
        ) : undefined
      }
    />
  );
}
