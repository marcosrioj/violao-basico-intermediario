import { Shell, PageHeading } from '@/components/shell';
import { Metronome } from '@/components/music/metronome';
import { Fretboard } from '@/components/music/fretboard';
import { EarTraining, TuningReference } from '@/components/music/ear-training';
import { ChordDiagram } from '@/components/music/chord-diagram';
import { requireCourseProfile } from '@/lib/auth';
import { Hint } from '@/components/ui/hint';

export const dynamic = 'force-dynamic';
export default async function Laboratory() {
  const profile = await requireCourseProfile();
  return (
    <Shell active="/laboratorio" courseAccess teacher={profile.role === 'teacher'}>
      <PageHeading
        eyebrow="APRENDER FAZENDO"
        title="Seu laboratório musical"
        description="Dê som à teoria. Experimente, escute e leve a descoberta para o violão."
      />
      <div className="two-columns">
        <Metronome />
        <TuningReference />
      </div>
      <Fretboard />
      <div className="two-columns section">
        <EarTraining />
        <section className="card">
          <p className="eyebrow">OS PRIMEIROS ACORDES</p>
          <div className="section-title">
            <h2>Três formas, muitas possibilidades</h2>
            <Hint label="Ouvir os diagramas de acordes">
              Toque no nome de um acorde para ouvir sua sonoridade de referência.
            </Hint>
          </div>
          <div className="chord-grid compact">
            {['D', 'G', 'Em'].map((name) => (
              <ChordDiagram name={name} key={name} />
            ))}
          </div>
          <p className="hint">Números nos círculos: dedos 1 a 4. ×: não tocar. ○: corda solta.</p>
        </section>
      </div>
    </Shell>
  );
}
