import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { AppError } from '@/lib/errors';
import type { Profile, Role } from '@/lib/contracts';
export async function authContext() {
  if (!isSupabaseConfigured())
    throw new AppError(503, 'SETUP_REQUIRED', 'A autenticação ainda precisa ser configurada.');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user)
    throw new AppError(401, 'UNAUTHENTICATED', 'Entre na sua conta para continuar.');
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id,display_name,role,timezone')
    .eq('id', data.user.id)
    .single();
  if (profileError || !profile)
    throw new AppError(
      403,
      'PROFILE_UNAVAILABLE',
      'Seu perfil não está disponível. Entre em contato com o professor.',
    );
  return { supabase, user: data.user, profile: profile as Profile };
}
export type AuthContext = Awaited<ReturnType<typeof authContext>>;
export function requireRole(context: AuthContext, role: Role) {
  if (context.profile.role !== role)
    throw new AppError(403, 'FORBIDDEN', 'Esta ação não está disponível para sua conta.');
}
export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    return (await authContext()).profile;
  } catch (error) {
    if (error instanceof AppError && [401, 503].includes(error.status)) return null;
    throw error;
  }
}
export async function requireProfile(role?: Role): Promise<Profile> {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/entrar');
  if (role && profile.role !== role) redirect('/painel');
  return profile;
}
