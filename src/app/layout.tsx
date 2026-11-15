import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import '@/components/music/chart-player.css';
import '@/components/ui/collapsible-card.css';
import '@/components/course/learning-content.css';
export const metadata: Metadata = {
  title: { default: 'Violão Vivo — Música com propósito', template: '%s | Violão Vivo' },
  description:
    'Violão Vivo: 13 módulos, 39 aulas, nove eixos técnicos e 27 estudos guiados. Repertório, prática interativa e acompanhamento do professor.',
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
