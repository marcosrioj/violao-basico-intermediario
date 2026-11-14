'use client';
import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { LoaderCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Hint } from '@/components/ui/hint';
import {
  revokeAllSessions,
  updatePasswordAndRevokeSessions,
  type PasswordResetOutcome,
} from '@/lib/auth-operations';
export function ResetPasswordForm({ configured }: { configured: boolean }) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'missing' | PasswordResetOutcome>(
    configured ? 'loading' : 'missing',
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!configured) return;
    let active = true;
    createClient()
      .auth.getUser()
      .then(({ data, error: authError }) => {
        if (active) setStatus(data.user && !authError ? 'ready' : 'missing');
      })
      .catch(() => {
        if (active) setStatus('missing');
      });
    return () => {
      active = false;
    };
  }, [configured]);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || status !== 'ready') return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const confirmation = String(form.get('confirmation') || '');
    setError('');
    if (password.length < 10 || password.length > 128) {
      setError('Use uma senha entre 10 e 128 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    setBusy(true);
    try {
      const supabase = createClient();
      setStatus(await updatePasswordAndRevokeSessions(supabase.auth, password));
    } catch {
      setError(
        'Não foi possível atualizar a senha. Peça um novo link de recuperação e tente novamente.',
      );
    } finally {
      setBusy(false);
    }
  };
  const retryRevocation = async () => {
    if (busy || status !== 'revocation-pending') return;
    setBusy(true);
    try {
      setStatus(await revokeAllSessions(createClient().auth));
    } catch {
      setStatus('revocation-pending');
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <p className="eyebrow">ACESSO À SUA CONTA</p>
      <h1>Uma nova senha.</h1>
      {status === 'loading' && (
        <div className="notice" role="status">
          <LoaderCircle size={17} /> Verificando seu link…
        </div>
      )}
      {status === 'missing' && (
        <div className="notice" role="status">
          {configured
            ? 'Abra o link recebido por e-mail para redefinir sua senha. Se ele expirou, solicite um novo em “Esqueci minha senha”.'
            : 'O acesso às contas ainda está em preparação.'}
          <p>
            <Link className="inline-link" href="/entrar">
              Ir para a página de acesso
            </Link>
          </p>
        </div>
      )}
      {status === 'ready' && (
        <form className="auth-form" onSubmit={submit} aria-busy={busy}>
          <label htmlFor="new-password">
            Nova senha
            <input
              id="new-password"
              name="password"
              type="password"
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              required
              disabled={busy}
              aria-describedby="reset-help"
            />
          </label>
          <small id="reset-help" className="muted">
            Entre 10 e 128 caracteres. Você pode usar uma frase.
          </small>
          <label htmlFor="confirmation">
            Repita a nova senha
            <input
              id="confirmation"
              name="confirmation"
              type="password"
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              required
              disabled={busy}
            />
          </label>
          <div className="control-with-hint">
            <button className="button" type="submit" disabled={busy}>
              {busy ? 'Salvando…' : 'Salvar nova senha'}
            </button>
            <Hint label="Depois de alterar a senha">
              Após a alteração, entre novamente com sua nova senha.
            </Hint>
          </div>
        </form>
      )}
      {status === 'done' && (
        <div className="notice" role="status">
          Senha atualizada.{' '}
          <Link className="inline-link" href="/entrar">
            Entre novamente para continuar.
          </Link>
        </div>
      )}
      {status === 'revocation-pending' && (
        <div className="notice" role="alert" aria-busy={busy}>
          <p>
            Sua senha já foi atualizada. Não foi possível confirmar o encerramento das sessões.
            Tente novamente; sua senha não será alterada outra vez.
          </p>
          <button className="button" type="button" disabled={busy} onClick={retryRevocation}>
            {busy ? 'Encerrando sessões…' : 'Tentar encerrar sessões novamente'}
          </button>
        </div>
      )}
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
    </>
  );
}
