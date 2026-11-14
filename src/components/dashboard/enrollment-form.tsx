'use client';

import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, KeyRound, LoaderCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api-client';
import { joinInput } from '@/lib/validation';

export function EnrollmentForm({ onConfirmed }: { onConfirmed?: () => void }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || confirmed) return;
    setError('');
    const result = joinInput.safeParse({ code });
    if (!result.success) {
      setError('Digite os 12 caracteres do código enviado pelo seu professor.');
      input.current?.focus();
      return;
    }
    setBusy(true);
    try {
      await apiFetch<{ classId: string }>('/api/classes/join', {
        method: 'POST',
        body: JSON.stringify(result.data),
      });
      setCode('');
      setConfirmed(true);
      onConfirmed?.();
      router.refresh();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Não foi possível confirmar. Tente novamente.',
      );
      input.current?.focus();
    } finally {
      setBusy(false);
    }
  }

  if (confirmed)
    return (
      <div className="enrollment-success">
        <p role="status">
          <CheckCircle2 aria-hidden="true" size={22} /> Matrícula confirmada. Seu curso está
          liberado.
        </p>
        <Link className="button" href="/curso">
          Abrir minha trilha <ArrowRight aria-hidden="true" size={18} />
        </Link>
        {onConfirmed && (
          <button className="button secondary" type="button" onClick={() => setConfirmed(false)}>
            Confirmar outra turma
          </button>
        )}
      </div>
    );

  return (
    <form className="enrollment-form" onSubmit={submit} noValidate aria-busy={busy}>
      <label htmlFor="enrollment-code">Código de matrícula</label>
      <p id="enrollment-help" className="hint">
        Use o código de 12 caracteres recebido do professor fora do aplicativo.
      </p>
      <input
        ref={input}
        id="enrollment-code"
        name="code"
        autoCapitalize="characters"
        autoComplete="off"
        spellCheck={false}
        maxLength={12}
        required
        readOnly={busy}
        value={code}
        placeholder="Ex.: A1B2C3D4E5F6"
        aria-invalid={Boolean(error)}
        aria-describedby={`enrollment-help${error ? ' enrollment-error' : ''}`}
        onChange={(event) => {
          setCode(event.target.value.trim().toUpperCase());
          setError('');
        }}
      />
      {error && (
        <p className="notice error" id="enrollment-error" role="alert">
          {error}
        </p>
      )}
      <button className="button" disabled={busy} type="submit">
        {busy ? (
          <LoaderCircle className="spinner-icon" aria-hidden="true" size={18} />
        ) : (
          <KeyRound aria-hidden="true" size={18} />
        )}
        {busy ? 'Confirmando matrícula…' : 'Confirmar minha matrícula'}
      </button>
    </form>
  );
}
