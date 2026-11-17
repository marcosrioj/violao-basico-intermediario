import { CollapsibleCard } from '@/components/ui/collapsible-card';
import Link from 'next/link';
import { ArrowRight, BookOpen, Download, GraduationCap } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { RichText } from '@/components/course/rich-text';
import { HashReveal } from '@/components/course/hash-reveal';
import { studentGuides, theoryReferences } from '@/content/course';
import type { GuidePage } from '@/content/types';
import { requireCourseProfile } from '@/lib/auth';
import { Hint } from '@/components/ui/hint';
import pdfManifest from '@/content/pdf-manifest.json';
import { practicePrinciples, techniqueModules } from '@/content/curriculum';

export const dynamic = 'force-dynamic';
function GuideSection({
  guides,
  legacyStartPage,
}: {
  guides: GuidePage[];
  legacyStartPage: number;
}) {
  return (
    <div className="stack">
      {guides.map((guide) => (
        <details id={guide.id} key={guide.id}>
          <summary>
            {guide.title}{' '}
            <span className="badge">
              PDF p. {legacyStartPage + guide.page - 1} · original p. {guide.page}
            </span>
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
  const profile = await requireCourseProfile();
  const teacher = profile.role === 'teacher';
  const teacherGuides = teacher ? (await import('@/content/teacher')).teacherGuides : [];
  return (
    <Shell active="/materiais" courseAccess teacher={teacher}>
      <HashReveal />
      <PageHeading
        eyebrow="CONSULTE, EXPERIMENTE, VOLTE À MÚSICA"
        title="Biblioteca"
        description="Baixe as apostilas ou escolha um assunto para consultar."
      />
      <section className="material-list section" aria-label="Apostilas para baixar">
        <article className="card material-item">
          <span className="round-icon">
            <BookOpen aria-hidden="true" />
          </span>
          <div>
            <p className="eyebrow">MATERIAL COMPLETO · {pdfManifest.student.pages} PÁGINAS</p>
            <h2>Apostila do aluno</h2>
            <p>
              Aulas com técnica e repertório na mesma sequência, exemplos, diagramas, cifras e
              roteiros de prática.
            </p>
          </div>
          <a className="button secondary" href="/api/materials/aluno" download>
            <Download size={17} aria-hidden="true" /> Baixar PDF
          </a>
        </article>
        {teacher && (
          <article className="card material-item">
            <span className="round-icon">
              <GraduationCap aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">MATERIAL COMPLETO · {pdfManifest.teacher.pages} PÁGINAS</p>
              <h2>Manual do professor</h2>
              <p>
                39 planos de 60 minutos, diagnóstico, demonstrações, adaptações e avaliação da
                execução.
              </p>
            </div>
            <a className="button secondary" href="/api/materials/professor" download>
              <Download size={17} aria-hidden="true" /> Baixar PDF
            </a>
          </article>
        )}
      </section>
      <nav className="learning-paths" aria-label="Consultar os estudos e preparar aulas">
        <Link className="button secondary" href="/tecnica">
          Consultar o índice de técnicas
        </Link>
        <a className="button secondary" href="#theory-index">
          Consultar teoria musical
        </a>
        {teacher && (
          <Link className="button secondary" href="/professor/metodologia">
            Guia para lecionar
          </Link>
        )}
      </nav>
      <CollapsibleCard title="Como estudar" className="section learning-reading" name="library">
        {practicePrinciples.map((principle) => (
          <details key={principle.title} className="section">
            <summary>{principle.title}</summary>
            <p>{principle.text}</p>
          </details>
        ))}
      </CollapsibleCard>
      <CollapsibleCard id="technical-library" title="Técnicas" className="section" name="library">
        <div className="learning-module-list section">
          {techniqueModules.map((module) => (
            <Link className="card" href={`/tecnica#${module.id}`} key={module.id}>
              <p className="eyebrow">{module.id}</p>
              <h3>{module.title}</h3>
              <p>{module.goal}</p>
              <span className="text-link">
                Abrir estudos <ArrowRight size={16} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </CollapsibleCard>
      <CollapsibleCard id="theory-index" title="Teoria musical" className="section" name="library">
        <div className="theory-grid">
          {theoryReferences.map((reference) => (
            <Link className="card" href={`/teoria/${reference.id}`} key={reference.id}>
              <p className="eyebrow">TEORIA {reference.id}</p>
              <h3>{reference.title}</h3>
              <p>{reference.lead}</p>
              <span className="text-link">
                Explorar a consulta <ArrowRight size={15} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </CollapsibleCard>
      <CollapsibleCard title="Guias do aluno" className="section" name="library">
        <div className="section-title">
          <div>
            <p className="eyebrow">ANTES, DURANTE E DEPOIS DA AULA</p>
            <h3 id="student-guides">Textos de consulta</h3>
          </div>
          <Hint label="Consultar os materiais do aluno">
            Os textos completos estão abaixo. As páginas de cada aula estão na trilha; os diagramas
            e a diagramação original também estão no PDF.
          </Hint>
        </div>
        <GuideSection
          guides={studentGuides}
          legacyStartPage={pdfManifest.student.legacyStartPage}
        />
      </CollapsibleCard>
      {teacher && (
        <CollapsibleCard title="Guias do professor" className="section" name="library">
          <div className="section-title">
            <div>
              <p className="eyebrow">PARA QUEM ENSINA</p>
              <h3 id="teacher-guides">Orientação docente</h3>
            </div>
            <Hint label="Encontrar os materiais do professor">
              Os 39 planos específicos acompanham as aulas. Aqui estão a orientação docente, a
              rubrica, os mapas e as consultas complementares.
            </Hint>
            <Link className="text-link" href="/professor">
              Minhas turmas <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
          <GuideSection
            guides={teacherGuides}
            legacyStartPage={pdfManifest.teacher.legacyStartPage}
          />
        </CollapsibleCard>
      )}
    </Shell>
  );
}
