import { Shell, PageHeading } from '@/components/shell';
import { LearningLab } from '@/components/music/learning-lab';
import { requireCourseProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export default async function Laboratory() {
  const profile = await requireCourseProfile();
  return (
    <Shell active="/laboratorio" courseAccess teacher={profile.role === 'teacher'}>
      <PageHeading
        eyebrow="APRENDER FAZENDO"
        title="Seu laboratório musical"
        description="Dê som à teoria. Experimente, escute e leve a descoberta para o violão."
      />
      <LearningLab />
    </Shell>
  );
}
