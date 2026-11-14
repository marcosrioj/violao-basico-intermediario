export const dynamic = 'force-dynamic';
import { Shell, PageHeading } from '@/components/shell';
import { TeacherDashboard } from '@/components/dashboard/teacher-dashboard';
import { requireProfile } from '@/lib/auth';
import { lessons } from '@/content/course';
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
        title="Cada aluno tem seu ritmo."
        description="Prepare os encontros, acompanhe as turmas e transforme observações em próximos passos."
      />
      <TeacherDashboard profile={profile} lessons={lessonOptions} />
    </Shell>
  );
}
