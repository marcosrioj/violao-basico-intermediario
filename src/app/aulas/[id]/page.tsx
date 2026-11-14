export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { requireProfile } from '@/lib/auth';
import { getLesson } from '@/content/course';
import { getTeacherLesson, weeklyPlan, finalPlan } from '@/content/teacher';
import { LessonView } from '@/components/course/lesson-view';
import { RichText } from '@/components/course/rich-text';

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await params;
  const lesson = getLesson(id);
  if (!lesson) notFound();
  const teacher = profile.role === 'teacher';
  const plan = teacher ? getTeacherLesson(lesson.id) : undefined;
  const schedule = lesson.n === 39 ? finalPlan : weeklyPlan;
  return (
    <LessonView
      lesson={lesson}
      teacher={teacher}
      teacherPlan={
        plan ? (
          <section className="card" id="plano-professor">
            <p className="eyebrow">ÁREA DO PROFESSOR</p>
            <h2>Condução do encontro</h2>
            <p>
              <RichText text={plan.teacher} lesson={lesson} field="teacher" />
            </p>
            <details className="section">
              <summary>Plano completo · páginas {plan.teacherPages.join(', ')}</summary>
              <div className="source-text">
                <RichText text={plan.teacherText} lesson={lesson} field="teacherText" />
              </div>
            </details>
            <details className="section">
              <summary>Roteiro de 60 minutos</summary>
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
          </section>
        ) : undefined
      }
    />
  );
}
