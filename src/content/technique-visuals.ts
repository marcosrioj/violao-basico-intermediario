import type { PracticeVisual } from '@/components/course/practice-visual-types';
import { dynamics, finger6, notes, path, rhythm, shapes } from './lesson-visuals';

/** Diagrams of the authored examples, never substitutions for the repertoire. */
const techniqueVisuals: Record<string, PracticeVisual[]> = {
  't1-e1': [
    {
      title: 'Prepare o apoio antes do acorde',
      caption:
        'Esquema de apoio: encontre um ângulo confortável, sem elevar o ombro. A mão que monta os acordes deve ficar livre para se mover.',
      diagram: { kind: 'instrument', focus: 'support' },
    },
    shapes(
      'Primeiro D: quatro cordas',
      'Comece na 4ª corda solta. × não tocar · ○ corda solta · 1 indicador, 2 médio, 3 anelar, 4 mínimo.',
      'D',
    ),
  ],
  't1-e2': [
    path(
      'Afinação: do grave para o agudo',
      'Aponte cada corda antes de conferir a nota no afinador.',
      ['6ª', 'E · Mi'],
      ['5ª', 'A · Lá'],
      ['4ª', 'D · Ré'],
      ['3ª', 'G · Sol'],
      ['2ª', 'B · Si'],
      ['1ª', 'E · Mi'],
    ),
    notes(
      'E–F–G na primeira corda',
      'E → F: uma casa. F → G: duas casas. Volte G–F–E sem alterar o apoio.',
      [1, 0, 'E'],
      [1, 1, 'F'],
      [1, 3, 'G'],
    ),
  ],
  't1-e3': [
    rhythm(
      'Ataque, sustentação, silêncio',
      'C na 2ª corda/casa 1. Ataque uma vez e interrompa encostando suavemente a mão que toca no início do pulso 4.',
      [
        [
          'Um compasso · 4/4',
          ['1', '2', '3', '4'],
          ['C', '—', '—', '×'],
          ['atacar', 'sustentar', 'sustentar', 'silêncio'],
        ],
      ],
    ),
  ],
  't2-e1': [
    shapes(
      'Leia do grave para o agudo',
      'Cordas 6 → 1, da esquerda para a direita. × não tocar · ○ solta · números dentro dos pontos = dedos. D usa quatro cordas; Em usa seis.',
      'D',
      'Em',
    ),
  ],
  't2-e2': [
    shapes(
      'Um ciclo, quatro pulsos por acorde',
      'Exemplo autoral: Am–F–C–G. Ataque no 1 de cada compasso; este F usa apenas as cordas 4, 3 e 2.',
      'Am',
      'F',
      'C',
      'G',
    ),
  ],
  't2-e3': [
    rhythm(
      'Leia as casas, conserve a duração',
      'Todos os números são casas da 2ª corda B. Na tablatura, ela é a segunda linha de cima. No segundo compasso, ataque C uma vez.',
      [
        ['Compasso 1 · 2ª corda', ['1', '2', '3', '4'], ['1', '3', '1', '0'], ['C', 'D', 'C', 'B']],
        [
          'Compasso 2 · 2ª corda',
          ['1', '2', '3', '4'],
          ['1', '—', '—', '—'],
          ['C', 'sustentar', 'sustentar', 'sustentar'],
        ],
      ],
    ),
  ],
  't3-e1': [
    path(
      'A terça explica maior e menor',
      'Conte os semitons entre fundamental e terça; a quinta completa a tríade.',
      ['C → E', '4 semitons · terça maior'],
      ['C–E–G', 'C maior'],
      ['D → F', '3 semitons · terça menor'],
      ['D–F–A', 'D menor'],
    ),
  ],
  't3-e2': [
    notes(
      'C–D–E–F na quinta corda',
      'Casas 3–5–7–8: tom, tom, semitom. Reposicione a mão; não tente alcançar todas as casas ao mesmo tempo.',
      [5, 3, 'C'],
      [5, 5, 'D'],
      [5, 7, 'E'],
      [5, 8, 'F'],
    ),
  ],
  't3-e3': [
    shapes(
      'D → Bm: um compasso por posição',
      'Exercício de preparação em 4/4. Bm: pestana na casa 2, cinco cordas permitidas. Teste, solte a pressão e remonte.',
      'D',
      'Bm',
    ),
  ],
  't4-e1': [
    rhythm(
      'Alterne a palheta na 2ª corda solta',
      '↓ para baixo · ↑ para cima. Faça dois compassos com ataques e um de silêncio, contando também durante a pausa.',
      [1, 2, 3, 4].map((n) => [`Pulso ${n}`, [String(n), 'e'], ['↓', '↑']]),
    ),
  ],
  't4-e2': [
    notes(
      'A fronteira D → E',
      'Uma opção nas primeiras casas: C e D na 2ª corda; E e F na 1ª. Use ↓ ↑ ↓ ↑ para C–D–E–F e novamente para F–E–D–C.',
      [2, 1, 'C'],
      [2, 3, 'D'],
      [1, 0, 'E'],
      [1, 1, 'F'],
    ),
  ],
  't4-e3': [
    rhythm(
      'Uma corda por pulso',
      'Mantenha cada acorde montado. Os números abaixo indicam cordas, não casas; alterne a palheta em cada evento.',
      [
        [
          'D · 4/4',
          ['1', '2', '3', '4'],
          ['↓', '↑', '↓', '↑'],
          ['4ª · D', '3ª · A', '2ª · D', '1ª · F#'],
        ],
        [
          'Em · 4/4',
          ['1', '2', '3', '4'],
          ['↓', '↑', '↓', '↑'],
          ['6ª · E', '4ª · E', '3ª · G', '2ª · B'],
        ],
      ],
    ),
  ],
  't5-e1': [
    rhythm(
      'Mesmos ataques, durações diferentes',
      '2ª corda, casas 1–3–5–3. Na versão conectada, deixe soar até a próxima nota; na destacada, interrompa na metade de cada pulso. × = silêncio.',
      [
        [
          'Conectado · 4/4',
          ['1', 'e', '2', 'e', '3', 'e', '4', 'e'],
          ['C', '—', 'D', '—', 'E', '—', 'D', '—'],
        ],
        [
          'Destacado · 4/4',
          ['1', 'e', '2', 'e', '3', 'e', '4', 'e'],
          ['C', '×', 'D', '×', 'E', '×', 'D', '×'],
        ],
      ],
    ),
  ],
  't5-e2': [
    rhythm(
      '1h3 e 3p1 na segunda corda',
      '1h3: dedo 3 produz a segunda nota sem novo ataque. 3p1: mantenha o dedo 1 preparado ao retirar o 3. Uma nota por pulso.',
      [
        ['Ascendente · 1h3', ['1', '2'], ['C', 'D'], ['ataque · casa 1', 'ligado · casa 3']],
        ['Descendente · 3p1', ['3', '4'], ['D', 'C'], ['ataque · casa 3', 'ligado · casa 1']],
      ],
    ),
  ],
  't5-e3': [
    {
      title: 'Reduza a ressonância perto do rastilho',
      caption:
        'Toque E na 6ª corda solta com o polegar. Compare som livre e contato leve junto ao rastilho; a nota precisa continuar reconhecível.',
      diagram: { kind: 'instrument', focus: 'damping' },
    },
  ],
  't6-e1': [
    rhythm(
      'Vibrato depois da chegada',
      'E na 2ª corda/casa 5. Faça um movimento longitudinal discreto, com o dedo apoiado; não ataque novamente. Interrompa no 4 nas duas versões.',
      [
        [
          'Som estável',
          ['1', '2', '3', '4'],
          ['E', '—', '—', '×'],
          ['ataque', 'sustentar', 'sustentar', 'encerrar'],
        ],
        [
          'Com vibrato',
          ['1', '2', '3', '4'],
          ['E', '∿', '∿', '×'],
          ['ataque', 'vibrato', 'vibrato', 'encerrar'],
        ],
      ],
    ),
  ],
  't6-e2': [
    rhythm(
      'Mordente inferior: E–D–E',
      'Na 2ª corda: casas 5–3–5. As duas primeiras notas duram uma semicolcheia; o último E dura uma colcheia. O grupo inteiro ocupa um pulso.',
      [
        [
          'Um pulso, quatro subdivisões',
          ['1', 'ta', 'e', 'ta'],
          ['E', 'D', 'E', '—'],
          ['casa 5', 'casa 3', 'casa 5', 'sustentar'],
        ],
      ],
    ),
    rhythm(
      'Apogiatura: F resolve em E',
      'Tarefa separada do mordente. Na 2ª corda, F na casa 6 chega a E na casa 5; sustente E até o fim do compasso.',
      [
        [
          'Um compasso · 4/4',
          ['1', '2', '3', '4'],
          ['F', 'E', '—', '—'],
          ['apoio', 'resolução', 'sustentar', 'sustentar'],
        ],
      ],
    ),
  ],
  't6-e3': [
    dynamics(
      'Uma frase com direção',
      'Exercício autoral em 4/4: um acorde por compasso. A altura das barras representa intensidade, não andamento.',
      [
        ['C', 'suave', 1],
        ['Am', 'crescer um pouco', 2],
        ['Dm', 'continuar crescendo', 3],
        ['G', 'chegada clara', 4],
      ],
    ),
  ],
  't7-e1': [
    rhythm(
      'Ataques e movimentos sem ataque',
      'Em D, ataque em 1, 2, e depois do 2, 3 e 4. — significa deixar soar; não é uma pausa que interrompe o som.',
      [
        ['Pulsos 1–2', ['1', 'e', '2', 'e'], ['↓', '—', '↓', '↑']],
        ['Pulsos 3–4', ['3', 'e', '4', 'e'], ['↓', '—', '↓', '—']],
      ],
    ),
  ],
  't7-e2': [finger6('G', '6ª')],
  't7-e3': [
    rhythm(
      'Antecipe C e atravesse o próximo 1',
      'Tarefa A: ataque no e do 4 e sustente sobre o próximo 1, sem novo ataque. Continue contando.',
      [
        ['Fim do compasso', ['4', 'e'], ['·', 'C'], ['contar', 'atacar']],
        ['Compasso seguinte', ['1', 'e'], ['—', '—'], ['sustentar', 'sustentar']],
      ],
    ),
    rhythm(
      'O compasso central é mais curto',
      'Tarefa B, separada da antecipação: D por quatro pulsos, G por dois e Em por quatro. Não acrescente pulsos ao G.',
      [
        ['D · 4/4', ['1', '2', '3', '4'], ['D', '—', '—', '—']],
        ['G · 2/4', ['1', '2'], ['G', '—']],
        ['Em · 4/4', ['1', '2', '3', '4'], ['Em', '—', '—', '—']],
      ],
    ),
  ],
  't8-e1': [
    notes(
      'Tônicas C que orientam as famílias',
      'Localize C na 5ª/casa 3, 6ª/casa 8 e 4ª/casa 10. CAGED nomeia famílias de formas; neste exemplo o acorde continua sendo C maior.',
      [5, 3, 'C'],
      [6, 8, 'C'],
      [4, 10, 'C'],
    ),
  ],
  't8-e2': [
    notes(
      'C/G · região aberta',
      'Toque somente 3ª solta, 2ª/casa 1 e 1ª solta: G–C–E. O baixo deste conjunto é G.',
      [3, 0, 'G'],
      [2, 1, 'C'],
      [1, 0, 'E'],
    ),
    notes(
      'C · região central',
      'Toque somente 3ª/casa 5, 2ª/casa 5 e 1ª/casa 3: C–E–G. O baixo é C.',
      [3, 5, 'C'],
      [2, 5, 'E'],
      [1, 3, 'G'],
    ),
    notes(
      'C/E · região aguda',
      'Toque somente 3ª/casa 9, 2ª/casa 8 e 1ª/casa 8: E–G–C. O baixo é E.',
      [3, 9, 'E'],
      [2, 8, 'G'],
      [1, 8, 'C'],
    ),
  ],
  't8-e3': [
    notes(
      'C: ponto de partida',
      'Nas três cordas agudas: C–E–G. Toque um compasso de 4/4.',
      [3, 5, 'C'],
      [2, 5, 'E'],
      [1, 3, 'G'],
    ),
    notes(
      'F/C: mantenha a nota C',
      'C permanece na 3ª/casa 5; as outras vozes vão para F e A.',
      [3, 5, 'C'],
      [2, 6, 'F'],
      [1, 5, 'A'],
    ),
    notes(
      'G/D: desloque o conjunto',
      'D–G–B nas três cordas agudas. Como tarefa separada, responda sobre C com E–G–E–C.',
      [3, 7, 'D'],
      [2, 8, 'G'],
      [1, 7, 'B'],
    ),
  ],
  't9-e1': [
    path(
      'Selecione notas alternadas da escala',
      'C maior: C–D–E–F–G–A–B. Comece em cada fundamental e escolha uma nota sim, outra não.',
      ['Dm · ii', 'D → F → A'],
      ['G · V', 'G → B → D'],
      ['C · I', 'C → E → G'],
    ),
    shapes(
      'Ouça ii–V–I em C',
      'Exercício autoral: um compasso de 4/4 por acorde, conservando a duração na chegada.',
      'Dm',
      'G',
      'C',
    ),
  ],
  't9-e2': [
    notes(
      'G# conduz a A',
      'Na 3ª corda: G solta, G# na casa 1 e A na casa 2. Em usa G; E7 usa G#. Compare a resolução E7 → Am.',
      [3, 0, 'G'],
      [3, 1, 'G#'],
      [3, 2, 'A'],
    ),
    path(
      'Compare duas cadências',
      'Exercícios autorais separados: um compasso de 4/4 por acorde. Escute a diferença antes do último Am.',
      ['Am–Dm–Em–Am', 'G natural em Em'],
      ['Am–Dm–E7–Am', 'G# em E7 → A em Am'],
    ),
  ],
  't9-e3': [
    path(
      'Um mapa para cada apresentação',
      'Preencha este percurso para cada um dos três arranjos escolhidos. Registre a métrica e combine os sinais com o professor.',
      ['Entrada', 'Andamento e sinal'],
      ['Trecho difícil', 'Ensaiar com antes e depois'],
      ['Repetição', 'Quantas vezes?'],
      ['Final', 'Sustentação e corte'],
      ['Revisão', 'Uma evidência e um ajuste'],
    ),
  ],
};

export function getTechniqueVisuals(studyId: string): PracticeVisual[] {
  const visuals = techniqueVisuals[studyId];
  if (!visuals) throw new Error(`Estudo sem ilustração: ${studyId}`);
  return visuals;
}
