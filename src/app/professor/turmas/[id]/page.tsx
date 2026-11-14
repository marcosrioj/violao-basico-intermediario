export const dynamic = 'force-dynamic';
import { notFound } from 'next/navigation';
import { Shell, PageHeading } from '@/components/shell';
import { ClassroomDashboard } from '@/components/dashboard/classroom-dashboard';
import { requireProfile } from '@/lib/auth';
import { lessons } from '@/content/course';
export default async function ClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile('teacher');
  const { id } = await params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
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
        eyebrow="ACOMPANHAMENTO"
        title="A música se aprende juntos."
        description="Um encontro por semana, pequenas descobertas todos os dias."
      />
      <ClassroomDashboard classId={id} profile={profile} lessons={lessonOptions} />
    </Shell>
  );
}
