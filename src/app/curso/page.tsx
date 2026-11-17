export const dynamic = 'force-dynamic';
import { Suspense } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { requireCourseProfile } from '@/lib/auth';
import { Shell, PageHeading } from '@/components/shell';
import { courseModules, lessons } from '@/content/course';
import { Catalog } from '@/components/course/catalog';
import { getLessonTechniqueEntries } from '@/content/curriculum';
export default async function CoursePage() {
  const profile = await requireCourseProfile();
  const catalogLessons = lessons.map((lesson) => ({
    id: lesson.id,
    title: lesson.title,
    goal: lesson.goal,
    song: lesson.song,
    module: lesson.module,
    display_id: lesson.display_id,
    local_n: lesson.local_n,
    techniques: getLessonTechniqueEntries(lesson.id).map(({ study, stage }) => ({
      id: study.id,
      title: study.title,
      stage,
    })),
  }));
  return (
    <Shell active="/curso" courseAccess teacher={profile.role === 'teacher'}>
      <PageHeading
        eyebrow="SEU CAMINHO MUSICAL"
        title="Uma música de cada vez"
        description="Continue sua aula ou escolha um módulo."
      />
      <div id="repertorio">
        <Suspense fallback={<p>Carregando trilha…</p>}>
          <Catalog modules={courseModules} lessons={catalogLessons} />
        </Suspense>
      </div>
      <details className="section learning-reading">
        <summary>Consultas e organização do curso</summary>
        <p>13 módulos · 39 encontros de 60 minutos · 27 estudos técnicos integrados.</p>
        <p>
          As técnicas aparecem nas aulas acima e voltam em novos contextos. O índice por assunto
          reúne os mesmos 27 estudos para uma consulta rápida.
        </p>
        <nav className="learning-paths" aria-label="Consultas complementares">
          <Link className="text-link" href="/tecnica">
            Índice de técnicas <ArrowRight size={16} aria-hidden="true" />
          </Link>
          {profile.role === 'teacher' && (
            <Link className="text-link" href="/professor/metodologia">
              Guia para lecionar <ArrowRight size={16} aria-hidden="true" />
            </Link>
          )}
        </nav>
      </details>
    </Shell>
  );
}
