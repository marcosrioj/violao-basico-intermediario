import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { AuthFrame } from '@/components/auth/frame';
import { LoginForm } from '@/components/auth/login-form';
import { getCurrentProfile } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/env';
import { safeRedirect } from '@/lib/validation';
export const metadata: Metadata = { title: 'Entrar · Violão Vivo' };
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; erro?: string }>;
}) {
  const params = await searchParams;
  const profile = await getCurrentProfile();
  const destination = safeRedirect(
    params.next || null,
    profile?.role === 'teacher' ? '/professor' : '/painel',
  );
  if (profile) redirect(destination);
  const initialError =
    params.erro === 'link'
      ? 'Este link não pôde ser confirmado. Ele pode ter expirado ou já ter sido usado. Solicite um novo link.'
      : params.erro
        ? 'Não foi possível confirmar seu acesso. Tente entrar novamente.'
        : undefined;
  return (
    <AuthFrame>
      <LoginForm
        configured={isSupabaseConfigured()}
        next={destination}
        initialError={initialError}
      />
    </AuthFrame>
  );
}
