export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import { requireProfile } from '@/lib/auth';
import { Shell, PageHeading } from '@/components/shell';
import { courseModules, lessons } from '@/content/course';
import { Catalog } from '@/components/course/catalog';
export default async function CoursePage() {
  const profile = await requireProfile();
  return (
    <Shell active="/curso" teacher={profile.role === 'teacher'}>
      <PageHeading
        eyebrow="SEU CAMINHO MUSICAL"
        title="Uma música de cada vez"
        description="13 módulos para construir sua base, ganhar confiança e tocar com mais liberdade. Retome uma aula sempre que precisar."
      />
      <Suspense fallback={<p>Carregando trilha…</p>}>
        <Catalog modules={courseModules} lessons={lessons} />
      </Suspense>
    </Shell>
  );
}
