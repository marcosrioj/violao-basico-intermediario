import { TheoryReading } from '@/components/course/theory-reading';
import { CollapsibleCard } from '@/components/ui/collapsible-card';
import { requireCourseProfile } from '@/lib/auth';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ExternalLink } from 'lucide-react';
import { Shell, PageHeading } from '@/components/shell';
import { RichText } from '@/components/course/rich-text';
import { HashReveal } from '@/components/course/hash-reveal';
import { TheoryExercise } from '@/components/course/theory-exercise';
import { TheoryLab } from '@/components/theory-lab';
import { getDemoTheory } from '@/content/demo';
import { Hint } from '@/components/ui/hint';

export const dynamic = 'force-dynamic';

export default async function DemoTheoryPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireCourseProfile();
  const { id } = await params;
  const content = getDemoTheory(id);
  if (!content) notFound();
  const { reference, occurrences } = content;
  const rich = (text: string, field: string) => (
    <RichText text={text} theoryId={reference.id} field={field} demo />
  );
  return (
    <Shell active="/curso" courseAccess teacher={profile.role === 'teacher'}>
      <HashReveal />
      <Link className="back-link" href="/demonstracao">
        <ArrowLeft size={15} /> Voltar à aula demonstrativa
      </Link>
      <div className="banner">
        Esta consulta acompanha a primeira aula do curso.{' '}
        <Link href="/curso">Ver a trilha completa.</Link>
      </div>
      <PageHeading
        eyebrow={'CONSULTA MUSICAL · TEORIA ' + reference.id}
        title={reference.title}
        description="Leia uma ideia, experimente no instrumento e volte à sua primeira música."
      />
      <div className="stack">
        <TheoryReading reference={reference} demo />
        <CollapsibleCard title="Experimentar com som" name="theory-activities">
          <TheoryLab referenceId={reference.id} />
        </CollapsibleCard>
        <CollapsibleCard title="Conferir a aprendizagem" name="theory-activities">
          <TheoryExercise
            compact
            exercise={rich(reference.exercise, 'exercise')}
            answer={rich(reference.answer, 'answer')}
          />
        </CollapsibleCard>
        <CollapsibleCard id="retornar" title="Voltar à música" name="theory-activities">
          <div className="section-title">
            <p>Escolha o ponto de estudo para retomar.</p>
            <Hint label="Voltar à aula demonstrativa">
              Cada link volta à menção exata desta teoria na aula demonstrativa.
            </Hint>
          </div>
          <div className="review-list">
            {occurrences.map((item) => (
              <Link key={item.anchor} href={item.href}>
                {item.label}
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </CollapsibleCard>
        <CollapsibleCard title="Fontes" name="theory-activities">
          {reference.sources.map((source) =>
            source.url ? (
              <a
                className="resource-link"
                key={source.url}
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                {source.title}
                <ExternalLink size={15} />
              </a>
            ) : (
              <p key={source.title}>{source.title}</p>
            ),
          )}
        </CollapsibleCard>
      </div>
    </Shell>
  );
}
