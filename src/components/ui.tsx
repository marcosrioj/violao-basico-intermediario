'use client';
import { useEffect, useState } from 'react';
export { apiFetch as api } from '@/lib/api-client';
import { apiFetch as api } from '@/lib/api-client';
export function useApi<T>(path: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    api<T>(path, { signal: controller.signal })
      .then((value) => {
        setData(value);
        setError('');
      })
      .catch((err) => {
        if (!controller.signal.aborted) setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [path, version]);
  return { data, error, loading, reload: () => setVersion((x) => x + 1) };
}
export function Notice({ message, error = false }: { message: string; error?: boolean }) {
  return message ? (
    <p className={error ? 'notice error' : 'notice'} role={error ? 'alert' : 'status'}>
      {message}
    </p>
  ) : null;
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <span className="spinner" />
      Carregando seu espaço…
    </div>
  );
}
export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}
