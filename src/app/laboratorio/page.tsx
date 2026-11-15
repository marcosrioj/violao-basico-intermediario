import { Shell, PageHeading } from '@/components/shell';
import { LearningLab } from '@/components/music/learning-lab';
import { requireCourseProfile } from '@/lib/auth';
import Link from 'next/link';

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
      <section className="card section">
        <p className="eyebrow">APLICAR COM UM OBJETIVO</p>
        <h2>Encontre um estudo para sua técnica</h2>
        <p>
          Pratique leitura, palhetada, articulações, expressão e harmonia com exemplos graduais
          ligados às músicas das aulas.
        </p>
        <Link className="button secondary section" href="/tecnica">
          Consultar índice de técnicas
        </Link>
      </section>
    </Shell>
  );
}
