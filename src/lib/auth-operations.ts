import { AppError } from '@/lib/errors';

type SessionAuth = {
  signOut(options: { scope: 'local' | 'global' }): Promise<{ error: unknown }>;
};
type PasswordAuth = SessionAuth & {
  updateUser(attributes: { password: string }): Promise<{ error: unknown }>;
};
export type PasswordResetOutcome = 'done' | 'revocation-pending';

export async function logoutCurrentSession(auth: SessionAuth) {
  try {
    const { error } = await auth.signOut({ scope: 'local' });
    if (!error) return { signedOut: true };
  } catch {
    // Preserve the public error contract without leaking provider details.
  }
  throw new AppError(503, 'SIGNOUT_FAILED', 'Não foi possível sair. Tente novamente.');
}

export async function revokeAllSessions(auth: SessionAuth): Promise<PasswordResetOutcome> {
  try {
    const { error } = await auth.signOut({ scope: 'global' });
    return error ? 'revocation-pending' : 'done';
  } catch {
    return 'revocation-pending';
  }
}

export async function updatePasswordAndRevokeSessions(
  auth: PasswordAuth,
  password: string,
): Promise<PasswordResetOutcome> {
  const { error } = await auth.updateUser({ password });
  if (error) throw error;
  // A revocation failure must not cause an already successful password update
  // to be repeated. Retries call revokeAllSessions without keeping the password.
  return revokeAllSessions(auth);
}
