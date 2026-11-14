import { Shell, PageHeading } from '@/components/shell';
import { Metronome } from '@/components/music/metronome';
import { Fretboard } from '@/components/music/fretboard';
import { EarTraining, TuningReference } from '@/components/music/ear-training';
import { ChordDiagram } from '@/components/music/chord-diagram';
export default function Laboratory() {
  return (
    <Shell active="/laboratorio">
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
          <h2>Três formas, muitas possibilidades</h2>
          <div className="chord-grid compact">
            {['D', 'G', 'Em'].map((name) => (
              <ChordDiagram name={name} key={name} />
            ))}
          </div>
          <p className="hint">
            Números nos círculos: dedos 1 a 4. ×: não tocar. ○: corda solta. Toque no nome para
            ouvir.
          </p>
        </section>
      </div>
    </Shell>
  );
}
