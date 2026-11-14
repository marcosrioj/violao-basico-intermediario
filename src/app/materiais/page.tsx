import Link from 'next/link';
import { ArrowRight, BookOpen, Download, GraduationCap } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { RichText } from '@/components/course/rich-text';
import { HashReveal } from '@/components/course/hash-reveal';
import { studentGuides, theoryReferences } from '@/content/course';
import type { GuidePage } from '@/content/types';
import { requireProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';
function GuideSection({ guides }: { guides: GuidePage[] }) {
  return (
    <div className="stack">
      {guides.map((guide) => (
        <details id={guide.id} key={guide.id}>
          <summary>
            {guide.title} <span className="badge">Página {guide.page}</span>
          </summary>
          <div className="source-text">
            <RichText text={guide.text} field={guide.id} />
          </div>
        </details>
      ))}
    </div>
  );
}
export default async function MaterialsPage() {
  const profile = await requireProfile();
  const teacher = profile.role === 'teacher';
  const teacherGuides = teacher ? (await import('@/content/teacher')).teacherGuides : [];
  return (
    <Shell active="/materiais" teacher={teacher}>
      <HashReveal />
      <PageHeading
        eyebrow="CONSULTE, EXPERIMENTE, VOLTE À MÚSICA"
        title="Sua biblioteca musical"
        description="O material completo do curso, as consultas de teoria e os guias para acompanhar cada etapa."
      />
      <section className="material-list section" aria-label="Apostilas para baixar">
        <article className="card material-item">
          <span className="round-icon">
            <BookOpen />
          </span>
          <div>
            <p className="eyebrow">EDIÇÃO 5 · 130 PÁGINAS</p>
            <h2>Apostila do aluno</h2>
            <p>Preparação, diagramas, cifras didáticas, teoria e registros de prática.</p>
          </div>
          <a className="button secondary" href="/api/materials/aluno" download>
            <Download size={17} /> Baixar PDF
          </a>
        </article>
        {teacher && (
          <article className="card material-item">
            <span className="round-icon">
              <GraduationCap />
            </span>
            <div>
              <p className="eyebrow">EDIÇÃO 5 · 73 PÁGINAS</p>
              <h2>Manual do professor</h2>
              <p>Planos de 60 minutos, demonstrações, avaliação e devolutivas.</p>
            </div>
            <a className="button secondary" href="/api/materials/professor" download>
              <Download size={17} /> Baixar PDF
            </a>
          </article>
        )}
      </section>
      <section className="section" aria-labelledby="theory-index">
        <div className="section-title">
          <div>
            <p className="eyebrow">TEORIA COM SOM E SENTIDO</p>
            <h2 id="theory-index">Encontre a ideia que precisa</h2>
          </div>
        </div>
        <div className="theory-grid">
          {theoryReferences.map((reference) => (
            <Link className="card" href={`/teoria/${reference.id}`} key={reference.id}>
              <p className="eyebrow">TEORIA {reference.id}</p>
              <h3>{reference.title}</h3>
              <p>{reference.lead}</p>
              <span className="text-link">
                Explorar a consulta <ArrowRight size={15} />
              </span>
            </Link>
          ))}
        </div>
      </section>
      <section className="section" aria-labelledby="student-guides">
        <div className="section-title">
          <div>
            <p className="eyebrow">ANTES, DURANTE E DEPOIS DA AULA</p>
            <h2 id="student-guides">Guias do aluno</h2>
          </div>
        </div>
        <p className="hint">
          Consulte os textos completos abaixo. As páginas de cada aula estão na trilha; os diagramas
          e a diagramação original também estão no PDF.
        </p>
        <GuideSection guides={studentGuides} />
      </section>
      {teacher && (
        <section className="section" aria-labelledby="teacher-guides">
          <div className="section-title">
            <div>
              <p className="eyebrow">PARA QUEM ENSINA</p>
              <h2 id="teacher-guides">Orientação e recursos docentes</h2>
            </div>
            <Link className="text-link" href="/professor">
              Minhas turmas <ArrowRight size={16} />
            </Link>
          </div>
          <p className="hint">
            Os 39 planos específicos acompanham as aulas. Aqui estão a orientação docente, a
            rubrica, os mapas e as consultas complementares.
          </p>
          <GuideSection guides={teacherGuides} />
        </section>
      )}
    </Shell>
  );
}
