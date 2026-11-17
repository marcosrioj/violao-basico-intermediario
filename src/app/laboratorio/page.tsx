import { Shell, PageHeading } from '@/components/shell';
import { LearningLab } from '@/components/music/learning-lab';
import { getCurrentProfile, getProfileCourseAccess } from '@/lib/auth';
import Link from 'next/link';

export const dynamic = 'force-dynamic';
export default async function Laboratory() {
  // Authentication only personalizes navigation; the instruments remain public
  // even when an account, enrollment lookup or Supabase is unavailable.
  const profile = await getCurrentProfile().catch(() => null);
  const access = profile ? await getProfileCourseAccess(profile).catch(() => null) : null;
  return (
    <Shell
      active="/laboratorio"
      courseAccess={access?.allowed ?? false}
      teacher={profile?.role === 'teacher'}
    >
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
        <Link className="button secondary section" href={access?.allowed ? '/tecnica' : '/entrar'}>
          {access?.allowed
            ? 'Consultar índice de técnicas'
            : 'Entrar para acessar os estudos do curso'}
        </Link>
      </section>
    </Shell>
  );
}
