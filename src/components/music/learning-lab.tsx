'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Ear, Hand, Guitar, SlidersHorizontal } from 'lucide-react';
import { EarTraining, TuningReference } from './ear-training';
import { RhythmWorkshop } from './rhythm-workshop';
import { Fretboard } from './fretboard';
import { FretboardRecall } from './fretboard-recall';
import { Metronome } from './metronome';
import { ChordLibrary } from './chord-library';
import { Hint } from '@/components/ui/hint';
import './learning-lab.css';

const workshops = [
  {
    id: 'rhythm',
    label: 'Seguir o ritmo',
    description: 'Treine o pulso ou toque uma cifra.',
    icon: Hand,
    apply:
      'Conte quatro pulsos em voz alta. Depois toque D no primeiro pulso de cada compasso, mantendo a contagem nos demais.',
    href: '/aulas/m1-a1#tocar',
    lesson: 'Aplicar na primeira aula',
    theory: '/materiais#student-p113',
  },
  {
    id: 'ear',
    label: 'Treinar a escuta',
    description: 'Compare a distância entre notas.',
    icon: Ear,
    apply:
      'Toque a 4ª corda solta (D) e depois a 3ª corda, casa 2 (A). Ouça a quinta justa e procure o mesmo intervalo em outra região do braço.',
    href: '/aulas/m6-a1',
    lesson: 'Relacionar notas e acordes',
    theory: '/teoria/R2',
  },
  {
    id: 'notes',
    label: 'Encontrar notas',
    description: 'Lembre antes de abrir o mapa.',
    icon: Guitar,
    apply:
      'Monte D e procure a nota D entre as cordas que soam. Toque uma corda de cada vez e depois o acorde; perceba a nota dentro da sonoridade.',
    href: '/aulas/m1-a1#acordes',
    lesson: 'Encontrar a nota no acorde D',
    theory: '/teoria/R1',
  },
  {
    id: 'tools',
    label: 'Praticar livremente',
    description: 'Afinação, pulso e acordes.',
    icon: SlidersHorizontal,
    apply:
      'Escolha um trecho curto da sua aula. Toque lentamente, observe uma dificuldade e registre o próximo ajuste no diário.',
    href: '/curso',
    lesson: 'Escolher uma aula',
    theory: '/materiais#student-p113',
  },
] as const;

export function LearningLab() {
  const [active, setActive] = useState<(typeof workshops)[number]['id']>('rhythm');
  const current = workshops.find((workshop) => workshop.id === active)!;
  return (
    <div className="learning-lab">
      <div className="section-title">
        <h2>O que você quer praticar?</h2>
        <Hint label="Escolher uma oficina">
          As oficinas são independentes. Trocar encerra o áudio e reinicia a rodada; os resultados
          desta sessão não são gravados na conta nem concluem aulas. Escolha um objetivo,
          experimente e leve a descoberta ao violão.
        </Hint>
      </div>
      <div className="lab-navigation" role="group" aria-label="Oficinas do laboratório">
        {workshops.map(({ id, label, description, icon: Icon }) => (
          <button
            type="button"
            className="lab-navigation-choice"
            key={id}
            aria-pressed={id === active}
            aria-controls="lab-workshop"
            onClick={() => setActive(id)}
          >
            <Icon size={22} aria-hidden="true" />
            <strong>{label}</strong>
            <span>{description}</span>
          </button>
        ))}
      </div>
      <p className="lab-method">
        <strong>Ouvir → tentar → comparar → aplicar.</strong> Trabalhe um objetivo de cada vez.
        Depois de praticar, repita sem consultar e retome em outro dia.
      </p>
      <div id="lab-workshop" role="region" aria-label={current.label} key={active}>
        {active === 'rhythm' && <RhythmWorkshop />}
        {active === 'ear' && <EarTraining />}
        {active === 'notes' && (
          <>
            <FretboardRecall />
            <details className="lab-map">
              <summary>Explorar o mapa de notas e escalas</summary>
              <Fretboard />
            </details>
          </>
        )}
        {active === 'tools' && (
          <>
            <div className="two-columns">
              <Metronome />
              <TuningReference />
            </div>
            <ChordLibrary />
          </>
        )}
      </div>
      <section className="card lab-transfer" aria-label="Aplicar no violão">
        <p className="eyebrow">DO LABORATÓRIO PARA A MÚSICA</p>
        <h2>Agora, no seu violão</h2>
        <p>{current.apply}</p>
        <div className="control-row">
          <Link className="button" href={current.href}>
            {current.lesson}
          </Link>
          <Link className="button secondary" href={current.theory}>
            Consultar a teoria
          </Link>
        </div>
        <p className="hint">
          Na próxima prática, tente de novo antes de consultar. No diário da aula, registre o que
          conseguiu e um ponto para retomar com o professor.
        </p>
      </section>
    </div>
  );
}
