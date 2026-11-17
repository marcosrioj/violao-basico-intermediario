import { Shell, PageHeading } from '@/components/shell';
import { LearningLab } from '@/components/music/learning-lab';
import { getPublicViewer } from '@/lib/auth';
import Link from '@/components/ui/page-link';

export const dynamic = 'force-dynamic';
export default async function Laboratory() {
  // Authentication only personalizes navigation; the instruments remain public
  // even when an account, enrollment lookup or Supabase is unavailable.
  const viewer = await getPublicViewer();
  return (
    <Shell
      active="/laboratorio"
      courseAccess={viewer.courseAccess}
      teacher={viewer.profile?.role === 'teacher'}
    >
      <PageHeading
        eyebrow="APRENDER FAZENDO"
        title="Seu laboratório musical"
        description="Dê som à teoria. Experimente, escute e leve a descoberta para o violão."
      />
      <LearningLab />
      <Link
        className="button secondary section"
        href={
          viewer.courseAccess ? '/tecnica' : viewer.status === 'anonymous' ? '/entrar' : '/painel'
        }
      >
        {viewer.courseAccess
          ? 'Consultar índice de técnicas'
          : viewer.status === 'unavailable'
            ? 'Verificar meu acesso ao curso'
            : viewer.profile
              ? 'Confirmar matrícula para acessar os estudos'
              : 'Entrar para acessar os estudos do curso'}
      </Link>
      <details className="section">
        <summary>Encontrar um estudo no curso</summary>
        <p>
          Pratique leitura, palhetada, articulações, expressão e harmonia com exemplos graduais
          ligados às músicas das aulas.
        </p>
      </details>
    </Shell>
  );
}
