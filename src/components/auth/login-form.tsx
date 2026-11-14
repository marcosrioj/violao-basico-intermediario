'use client';
import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, LoaderCircle } from 'lucide-react';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/client';
import { siteUrl } from '@/lib/env';
import { safeRedirect } from '@/lib/validation';
import { authCallbackUrl } from '@/lib/auth-redirects';
const emailSchema = z.string().trim().email('Informe um e-mail válido.').max(254);
const passwordSchema = z
  .string()
  .min(10, 'Use pelo menos 10 caracteres.')
  .max(128, 'Use no máximo 128 caracteres.');
type Mode = 'signin' | 'signup' | 'recovery';
export function LoginForm({
  configured,
  next,
  initialError,
}: {
  configured: boolean;
  next: string;
  initialError?: string;
}) {
  const [mode, setMode] = useState<Mode>('signin');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError || '');
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const switchMode = (value: Mode) => {
    setMode(value);
    setError('');
    setMessage('');
    setFieldErrors({});
  };
  const google = async () => {
    if (!configured || busy) return;
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const { error: oauthError } = await createClient().auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: authCallbackUrl(siteUrl()) },
      });
      if (oauthError) throw oauthError;
    } catch {
      setError('Não foi possível entrar com o Google. Tente novamente ou use seu e-mail.');
      setBusy(false);
    }
  };
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!configured || busy) return;
    const form = new FormData(event.currentTarget);
    const email = emailSchema.safeParse(form.get('email'));
    const password =
      mode === 'signup'
        ? passwordSchema.safeParse(form.get('password'))
        : z
            .string()
            .min(1, 'Informe sua senha.')
            .max(128)
            .safeParse(form.get('password') || '');
    const displayName = z
      .string()
      .trim()
      .min(1, 'Informe seu nome.')
      .max(100, 'Use no máximo 100 caracteres.')
      .safeParse(form.get('displayName'));
    const fields: Record<string, string> = {};
    if (!email.success) fields.email = email.error.issues[0].message;
    if (mode !== 'recovery' && !password.success)
      fields.password = password.error.issues[0].message;
    if (mode === 'signup' && !displayName.success)
      fields.displayName = displayName.error.issues[0].message;
    setFieldErrors(fields);
    setError('');
    setMessage('');
    if (Object.keys(fields).length || !email.success) return;
    setBusy(true);
    try {
      const supabase = createClient();
      if (mode === 'recovery') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.data, {
          redirectTo: authCallbackUrl(siteUrl(), '/redefinir-senha'),
        });
        if (resetError) throw resetError;
        setMessage(
          'Se este e-mail estiver cadastrado, você receberá um link para criar uma nova senha. Confira também a pasta de spam.',
        );
      } else if (mode === 'signup' && password.success && displayName.success) {
        const { error: signupError } = await supabase.auth.signUp({
          email: email.data,
          password: password.data,
          options: {
            data: { display_name: displayName.data },
            emailRedirectTo: authCallbackUrl(siteUrl()),
          },
        });
        if (signupError) throw signupError;
        setMessage(
          'Confira seu e-mail para confirmar o cadastro e continuar. Se já tiver uma conta, use Entrar ou recupere sua senha.',
        );
      } else if (mode === 'signin' && password.success) {
        const { error: loginError } = await supabase.auth.signInWithPassword({
          email: email.data,
          password: password.data,
        });
        if (loginError) throw loginError;
        window.location.assign(safeRedirect(next));
        return;
      }
    } catch {
      setError(
        mode === 'signin'
          ? 'Não foi possível entrar. Confira o e-mail, a senha e a confirmação do cadastro.'
          : 'Não foi possível enviar o e-mail agora. Aguarde alguns minutos e tente novamente ou entre com o Google.',
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <p className="eyebrow">SEU ESPAÇO DE APRENDIZADO</p>
      <h1>
        {mode === 'signup'
          ? 'Vamos começar?'
          : mode === 'recovery'
            ? 'Recupere seu acesso'
            : 'Que bom ter você aqui.'}
      </h1>
      <p className="muted">
        {mode === 'recovery'
          ? 'Enviaremos um link para você criar uma nova senha.'
          : 'Entre para continuar suas aulas e guardar o que aprendeu.'}
      </p>
      {!configured && (
        <div className="notice" role="status">
          O acesso às contas ainda está em preparação. Você já pode{' '}
          <Link className="inline-link" href="/demonstracao">
            conhecer uma aula
          </Link>{' '}
          e usar o{' '}
          <Link className="inline-link" href="/laboratorio">
            laboratório musical
          </Link>
          .
        </div>
      )}
      {mode !== 'recovery' && (
        <>
          <button
            className="button secondary"
            style={{ width: '100%' }}
            onClick={google}
            disabled={!configured || busy}
          >
            <span aria-hidden="true" style={{ fontSize: 18, fontWeight: 700 }}>
              G
            </span>{' '}
            Continuar com Google
          </button>
          <div className="form-divider">ou use seu e-mail</div>
          <div className="auth-tabs" aria-label="Tipo de acesso">
            <button
              type="button"
              aria-pressed={mode === 'signin'}
              className={mode === 'signin' ? 'active' : ''}
              onClick={() => switchMode('signin')}
              disabled={busy}
            >
              Entrar
            </button>
            <button
              type="button"
              aria-pressed={mode === 'signup'}
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => switchMode('signup')}
              disabled={busy}
            >
              Criar conta
            </button>
          </div>
        </>
      )}
      <form className="auth-form" onSubmit={submit} noValidate aria-busy={busy}>
        {mode === 'signup' && (
          <label htmlFor="displayName">
            Como podemos chamar você?
            <input
              id="displayName"
              name="displayName"
              autoComplete="name"
              maxLength={100}
              required
              disabled={!configured || busy}
              aria-invalid={Boolean(fieldErrors.displayName)}
              aria-describedby={fieldErrors.displayName ? 'name-error' : undefined}
            />
            {fieldErrors.displayName && (
              <small id="name-error" role="alert">
                {fieldErrors.displayName}
              </small>
            )}
          </label>
        )}
        <label htmlFor="email">
          Seu e-mail
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="voce@exemplo.com"
            maxLength={254}
            required
            disabled={!configured || busy}
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          />
          {fieldErrors.email && (
            <small id="email-error" role="alert">
              {fieldErrors.email}
            </small>
          )}
        </label>
        {mode !== 'recovery' && (
          <label htmlFor="password">
            {mode === 'signup' ? 'Crie uma senha' : 'Sua senha'}
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              minLength={mode === 'signup' ? 10 : 1}
              maxLength={128}
              required
              disabled={!configured || busy}
              aria-invalid={Boolean(fieldErrors.password)}
              aria-describedby={
                fieldErrors.password
                  ? 'password-error'
                  : mode === 'signup'
                    ? 'password-help'
                    : undefined
              }
            />
            {mode === 'signup' && (
              <small id="password-help" className="muted">
                Pelo menos 10 caracteres. Você pode usar uma frase.
              </small>
            )}
            {fieldErrors.password && (
              <small id="password-error" role="alert">
                {fieldErrors.password}
              </small>
            )}
          </label>
        )}
        {mode === 'signin' && (
          <button
            type="button"
            className="text-link"
            style={{ border: 0, background: 'none', padding: 0, justifySelf: 'end' }}
            disabled={busy}
            onClick={() => switchMode('recovery')}
          >
            Esqueci minha senha
          </button>
        )}
        <button className="button" type="submit" disabled={!configured || busy}>
          {busy ? (
            <>
              <LoaderCircle size={17} /> Aguarde…
            </>
          ) : (
            <>
              {mode === 'signup'
                ? 'Criar minha conta'
                : mode === 'recovery'
                  ? 'Enviar link de recuperação'
                  : 'Entrar no meu espaço'}
              <ArrowRight size={17} />
            </>
          )}
        </button>
        {mode === 'recovery' && (
          <button
            type="button"
            className="button secondary"
            onClick={() => switchMode('signin')}
            disabled={busy}
          >
            Voltar para entrar
          </button>
        )}
      </form>
      {error && (
        <div className="notice error" role="alert">
          {error}
        </div>
      )}
      {message && (
        <div className="notice" role="status">
          {message}
        </div>
      )}
      {mode === 'signup' && (
        <p className="muted" style={{ fontSize: 11, marginTop: 18 }}>
          Sua conta começa como aluno. O acesso do professor é habilitado pela coordenação do curso.
        </p>
      )}
    </>
  );
}
