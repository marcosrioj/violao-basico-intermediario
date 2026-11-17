import Link from '@/components/ui/page-link';
export default function NotFound() {
  return (
    <main className="center-page">
      <p className="eyebrow">404 · FORA DO COMPASSO</p>
      <h1>Esta página não foi encontrada.</h1>
      <Link className="button" href="/curso">
        Voltar à trilha
      </Link>
    </main>
  );
}
