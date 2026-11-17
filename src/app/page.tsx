import { HomePage } from '@/components/home-page';
import { getPublicViewer } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  return <HomePage viewer={await getPublicViewer()} />;
}
