import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import '@/components/music/chart-player.css';
import '@/components/ui/collapsible-card.css';
export const metadata: Metadata = {
  title: { default: 'Violão Vivo — Música com propósito', template: '%s | Violão Vivo' },
  description:
    'Do primeiro acorde à liberdade de adorar. Curso de violão do básico ao intermediário, com 13 módulos, prática interativa e acompanhamento do professor.',
};
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
