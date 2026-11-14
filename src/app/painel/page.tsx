export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { Shell, PageHeading } from '@/components/shell';
import { StudentDashboard } from '@/components/dashboard/student-dashboard';
import { requireProfile } from '@/lib/auth';
import { lessons } from '@/content/course';
export default async function DashboardPage() {
  const profile = await requireProfile();
  if (profile.role === 'teacher') redirect('/professor');
  const lessonOptions = lessons.map(({ id, display_id, title, goal, module }) => ({
    id,
    display_id,
    title,
    goal,
    module,
  }));
  return (
    <Shell active="/painel">
      <PageHeading
        eyebrow="MEU ESPAÇO"
        title={`Olá, ${profile.display_name.split(' ')[0]}. Vamos tocar?`}
        description="Sua trilha, seus encontros e os pequenos avanços que fazem a diferença."
      />
      <StudentDashboard profile={profile} lessons={lessonOptions} />
    </Shell>
  );
}
