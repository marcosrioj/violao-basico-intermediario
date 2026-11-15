export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { requireCourseProfile } from '@/lib/auth';
import { Shell, PageHeading } from '@/components/shell';
import { courseModules, lessons } from '@/content/course';
import { Catalog } from '@/components/course/catalog';
import { techniqueModules } from '@/content/curriculum';
export default async function CoursePage() {
  const profile = await requireCourseProfile();
  return (
    <Shell active="/curso" courseAccess teacher={profile.role === 'teacher'}>
      <PageHeading
        eyebrow="SEU CAMINHO MUSICAL"
        title="Uma música de cada vez"
        description="13 módulos e 39 aulas conectados a nove eixos técnicos. Aprenda uma ideia, experimente no violão e leve a descoberta para sua música."
      />
      <nav className="learning-paths" aria-label="Caminhos de estudo">
        <a className="button" href="#repertorio">
          Aulas de repertório
        </a>
        <Link className="button secondary" href="/tecnica">
          27 estudos de técnica <ArrowRight size={16} />
        </Link>
        {profile.role === 'teacher' && (
          <Link className="button secondary" href="/professor/metodologia">
            Guia para lecionar
          </Link>
        )}
      </nav>
      <div id="repertorio">
        <Suspense fallback={<p>Carregando trilha…</p>}>
          <Catalog modules={courseModules} lessons={lessons} />
        </Suspense>
      </div>
      <section className="section" aria-labelledby="technique-title">
        <p className="eyebrow">COMPREENDER E REFINAR</p>
        <h2 id="technique-title">A técnica que acompanha cada etapa</h2>
        <p>
          Abra o eixo indicado na sua aula. Cada estudo oferece explicação, exemplo, prática gradual
          e critérios para conferir a execução.
        </p>
        <div className="learning-module-list section">
          {techniqueModules.map((module) => (
            <Link className="card" href={`/tecnica#${module.id}`} key={module.id}>
              <p className="eyebrow">
                {module.id} · {module.studies.length} ESTUDOS
              </p>
              <h3>{module.title}</h3>
              <p>{module.goal}</p>
              <span className="text-link">
                Explorar o eixo <ArrowRight size={16} />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </Shell>
  );
}
