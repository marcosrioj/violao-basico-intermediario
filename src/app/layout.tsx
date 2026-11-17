import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import './globals.css';
import '@/components/music/chart-player.css';
import '@/components/ui/collapsible-card.css';
import '@/components/course/learning-content.css';
import '@/components/course/practice-visual.css';
import '@/components/course/learning-surface.css';
export const metadata: Metadata = {
  title: { default: 'Violão Vivo — Música com propósito', template: '%s | Violão Vivo' },
  description:
    'Violão Vivo: 13 módulos e 39 aulas com repertório e 27 estudos técnicos integrados. Prática interativa e acompanhamento do professor.',
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
