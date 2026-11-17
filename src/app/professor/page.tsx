export const dynamic = 'force-dynamic';
import { Shell, PageHeading } from '@/components/shell';
import { TeacherDashboard } from '@/components/dashboard/teacher-dashboard';
import { requireProfile } from '@/lib/auth';
import { lessons } from '@/content/course';
import Link from 'next/link';
export default async function TeacherPage() {
  const profile = await requireProfile('teacher');
  const lessonOptions = lessons.map(({ id, display_id, title, goal, module }) => ({
    id,
    display_id,
    title,
    goal,
    module,
  }));
  return (
    <Shell active="/professor" teacher>
      <PageHeading
        eyebrow="ÁREA DO PROFESSOR"
        title="Minhas turmas"
        description="Prepare aulas e acompanhe seus alunos."
      />
      <div className="learning-paths">
        <Link className="button" href="/professor/metodologia">
          Preparar e lecionar
        </Link>
        <a className="button secondary" href="/api/materials/professor" download>
          Manual do professor
        </a>
      </div>
      <TeacherDashboard profile={profile} lessons={lessonOptions} />
    </Shell>
  );
}
