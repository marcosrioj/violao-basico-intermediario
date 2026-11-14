'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="center-page">
      <h1>Uma pausa inesperada.</h1>
      <p>Não foi possível carregar esta página. Seus registros salvos continuam na sua conta.</p>
      <button className="button" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
