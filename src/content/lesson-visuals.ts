import type { Lesson, SongVersion } from './types';
import type { IllustratedStep, PracticeVisual } from '@/components/course/practice-visual-types';
import { describeChartBar } from '@/components/music/chart-layout';

// Editorial selection lives on the server, like lesson-enrichment and lesson-journey.
export const shapes = (title: string, caption: string, ...names: string[]): PracticeVisual => ({
  title,
  caption,
  diagram: { kind: 'chords', names },
});
export const notes = (
  title: string,
  caption: string,
  ...positions: [number, number, string][]
): PracticeVisual => ({
  title,
  caption,
  diagram: {
    kind: 'fretboard',
    points: positions.map(([string, fret, note]) => ({ string, fret, note })),
  },
});
export const path = (
  title: string,
  caption: string,
  ...items: [string, string][]
): PracticeVisual => ({
  title,
  caption,
  diagram: { kind: 'sequence', items: items.map(([label, detail]) => ({ label, detail })) },
});
export const rhythm = (
  title: string,
  caption: string,
  groups: [string, string[], string[], string[]?][],
): PracticeVisual => ({
  title,
  caption,
  diagram: {
    kind: 'rhythm',
    groups: groups.map(([label, counts, actions, details]) => ({
      label,
      cells: counts.map((count, i) => ({ count, action: actions[i], detail: details?.[i] })),
    })),
  },
});
export const dynamics = (
  title: string,
  caption: string,
  items: [string, string, number][],
): PracticeVisual => ({
  title,
  caption,
  diagram: {
    kind: 'dynamics',
    items: items.map(([label, detail, level]) => ({ label, detail, level })),
  },
});

type Selection = [section: string, first: number, last?: number];
export function passage(
  chart: SongVersion,
  title: string,
  caption: string,
  ...selections: Selection[]
): PracticeVisual {
  return {
    title,
    caption,
    diagram: {
      kind: 'bars',
      bars: selections.flatMap(([sectionId, first, last = first]) => {
        const section = chart.sections.find((s) => s.id === sectionId);
        if (!section || first < 1 || last > section.bars.length)
          throw new Error(`Trecho visual inválido: ${sectionId} ${first}–${last}`);
        return section.bars.slice(first - 1, last).map((bar, index) => ({
          ...describeChartBar(bar, chart),
          label: `${sectionId}${/\d$/.test(sectionId) ? '.' : ''}${first + index}`,
        }));
      }),
    },
  };
}

export function form(chart: SongVersion): PracticeVisual {
  return path(
    'O caminho da música',
    'Siga as setas na ordem da cifra. × indica quantas vezes tocar a seção inteira antes de seguir.',
    ...chart.order.map((entry): [string, string] => [
      entry.section,
      `${entry.repeat}× · ${chart.sections.find((s) => s.id === entry.section)!.title}`,
    ]),
  );
}

export const finger6 = (chord = 'Em', bass = '6ª'): PracticeVisual =>
  rhythm(
    `Dedilhado em ${chord} · 6/8`,
    'p = polegar · i = indicador · m = médio · a = anelar. Dois pulsos, três notas por pulso; o segundo pulso começa com a.',
    [
      ['Pulso 1', ['1', 'la', 'li'], ['p', 'i', 'm'], [bass, '3ª', '2ª']],
      ['Pulso 2', ['2', 'la', 'li'], ['a', 'm', 'i'], ['1ª', '2ª', '3ª']],
    ],
  );
const eighths = rhythm(
  'Quatro pulsos, oito ataques',
  '↓ ataque para baixo · ↑ ataque para cima. Cada par ocupa um pulso; mantenha a distância entre os ataques.',
  [1, 2, 3, 4].map((n) => [`Pulso ${n}`, [String(n), 'e'], ['↓', '↑']]),
);
const majorMinor = path(
  'A terça muda a sonoridade',
  'Compare as notas, depois toque os acordes. A terça está no centro de cada grupo.',
  ['C maior', 'C · E · G'],
  ['Dm menor', 'D · F · A'],
);
const cMajor = path(
  'Notas comuns, centros diferentes',
  'Use as mesmas sete notas. Escute o ponto de repouso para distinguir os centros.',
  ['C maior', 'C D E F G A B → C'],
  ['A menor natural', 'A B C D E F G → A'],
);
const thirds = notes(
  'Um semitom muda a terça',
  'Na 1ª corda: F é a terça de Dm; F# é a terça de D. A diferença é uma casa.',
  [1, 1, 'F'],
  [1, 2, 'F#'],
);
const bassLine = notes(
  'O baixo desce C–B–A–G',
  'Toque apenas os baixos nesta ordem: 5ª corda casas 3, 2 e solta; depois 6ª corda casa 3.',
  [5, 3, 'C'],
  [5, 2, 'B'],
  [5, 0, 'A'],
  [6, 3, 'G'],
);
const leading = notes(
  'A chegada E# → F#',
  'Na 4ª corda: casa 3 → casa 4. E# tem o mesmo som de F, mas é escrito E# como terça de C#7.',
  [4, 3, 'E#'],
  [4, 4, 'F#'],
);
const plan = path(
  'Prepare a apresentação',
  'Combine os sinais antes de tocar e observe uma habilidade por tentativa.',
  ['Preparar', 'Afinar · andamento · entrada'],
  ['Apresentar', 'Seguir a forma e o final'],
  ['Revisar', 'Uma conquista · próximo foco'],
);

type LessonVisualFactory = (chart: SongVersion) => [PracticeVisual, PracticeVisual, PracticeVisual];
const lessonVisuals: Record<string, LessonVisualFactory> = {
  'm1-a1': (c) => [
    shapes(
      'Seu primeiro trio de acordes',
      '× não tocar · ○ corda solta · números = dedos: 1 indicador, 2 médio, 3 anelar, 4 mínimo. Cordas 6 → 1, da esquerda para a direita.',
      'Em',
      'D',
      'G',
    ),
    passage(
      c,
      'Oito tempos antes da troca',
      'Cada caixa é um compasso. Conte dois compassos em D e dois em G; depois experimente G → Em no refrão.',
      ['I', 1, 4],
      ['R', 3, 4],
    ),
    form(c),
  ],
  'm1-a2': (c) => [
    shapes(
      'Prepare a próxima posição',
      'Experimente D → G → Em → D. Os números indicam dedos; ○ é corda solta e × não deve soar.',
      'D',
      'G',
      'Em',
    ),
    passage(
      c,
      'O refrão completo',
      'Leia a contagem sob os acordes e mantenha o pulso durante as trocas.',
      ['R', 1, 8],
    ),
    form(c),
  ],
  'm1-a3': (c) => [
    form(c),
    passage(
      c,
      'Da ponte ao refrão',
      'Ensaie a saída da ponte e a chegada ao refrão como uma única passagem.',
      ['P', 7, 8],
      ['R', 1],
    ),
    passage(
      c,
      'Sustente até o corte',
      'Toque os dois compassos finais de D, contando até o fim antes do corte combinado.',
      ['F', 1, 2],
    ),
  ],
  'm2-a1': (c) => [
    shapes(
      'C → Am: mova o anelar',
      'Indicador na 2ª corda/casa 1 e médio na 4ª/casa 2 permanecem. Mova o dedo 3 para a 3ª corda/casa 2.',
      'C',
      'Am',
    ),
    shapes(
      'F parcial → C',
      'Neste F, toque somente 4ª, 3ª e 2ª cordas. Preserve o indicador na 2ª corda/casa 1 ao ir para C.',
      'F',
      'C',
    ),
    passage(
      c,
      'Am–F–C–G na música',
      'Ataque no início de cada compasso e deixe soar pela duração escrita.',
      ['A', 1, 4],
    ),
  ],
  'm2-a2': (c) => [
    eighths,
    passage(
      c,
      'O ritmo dentro do ciclo',
      'Distribua oito ataques em cada compasso de quatro pulsos; os acordes mantêm suas durações.',
      ['A', 1, 4],
    ),
    form(c),
  ],
  'm2-a3': (c) => [
    form(c),
    rhythm(
      'Estrofe e refrão: mesmo pulso',
      'Compare um compasso de cada textura. Aumentar os ataques não muda a velocidade da contagem.',
      [
        ['A · quatro ataques', ['1', '2', '3', '4'], ['↓', '↓', '↓', '↓']],
        [
          'R · oito ataques',
          ['1', 'e', '2', 'e', '3', 'e', '4', 'e'],
          ['↓', '↑', '↓', '↑', '↓', '↑', '↓', '↑'],
        ],
      ],
    ),
    dynamics(
      'Desenhe sua intensidade',
      'Sugestão de contraste: mais presença no refrão, sem acelerar. Combine a ponte e o final com o professor.',
      [
        ['A', 'suave', 2],
        ['R', 'mais presente', 4],
        ['P', 'preparar a volta', 3],
        ['F', 'final combinado', 2],
      ],
    ),
  ],
  'm3-a1': (c) => [
    shapes(
      'O baixo de D e Em',
      'D começa na 4ª corda; Em, na 6ª. O polegar deve procurar a corda permitida.',
      'D',
      'Em',
    ),
    rhythm(
      'Sinta dois grupos de três',
      'Conte 1-la-li, 2-la-li. Faça um ataque no 1 e deixe soar; as seis sílabas ocupam dois pulsos.',
      [
        ['Pulso 1', ['1', 'la', 'li'], ['↓', '—', '—']],
        ['Pulso 2', ['2', 'la', 'li'], ['—', '—', '—']],
      ],
    ),
    passage(
      c,
      'Dois acordes por compasso em P',
      'A segunda posição entra no 2, depois das três primeiras subdivisões.',
      ['P', 1, 2],
    ),
  ],
  'm3-a2': (c) => [
    finger6(),
    passage(
      c,
      'Dedilhe o refrão',
      'Mantenha p–i–m–a–m–i; ajuste o baixo: G e Em na 6ª, D na 4ª, C na 5ª corda.',
      ['R', 1, 4],
    ),
    passage(
      c,
      'A troca acontece no gesto a',
      'Em cada compasso de P, monte o segundo acorde antes do a no pulso 2. O padrão de dedos continua.',
      ['P', 1, 2],
    ),
  ],
  'm3-a3': (c) => [
    form(c),
    passage(
      c,
      'A passagem e o encerramento',
      'Ensaie P2 → R1 e depois os quatro compassos finais. São dois trechos de prática separados.',
      ['P', 2],
      ['R', 1],
      ['F', 1, 4],
    ),
    finger6('G', '6ª'),
  ],
  'm4-a1': (c) => [
    shapes(
      'Encontre F dentro de Dm',
      'O dedo 1 pressiona F na 1ª corda/casa 1. Comece o acorde na 4ª corda solta.',
      'Dm',
    ),
    passage(c, 'Dm dura três pulsos', 'Em A4, mantenha Dm em 1–2–3; G entra somente no 4.', [
      'A',
      3,
      4,
    ]),
    form(c),
  ],
  'm4-a2': (c) => [
    majorMinor,
    thirds,
    passage(
      c,
      'Escute as tríades na ponte',
      'C em P1 e Dm em P4: a cifra mantém o lugar de cada sonoridade.',
      ['P', 1, 4],
    ),
  ],
  'm4-a3': (c) => [
    path(
      'Uma nota sim, outra não',
      'Forme tríades usando somente notas de C maior.',
      ['C · I', 'C–E–G'],
      ['Dm · ii', 'D–F–A'],
      ['G · V', 'G–B–D'],
    ),
    passage(
      c,
      'Cinco compassos de ponte',
      'Acompanhe C, Am, F e Dm; no quinto compasso, toque F → G. Não encurte o ciclo.',
      ['P', 1, 5],
    ),
    majorMinor,
  ],
  'm5-a1': (c) => [
    shapes(
      'Monte Bm a partir do baixo',
      'A pestana fica na casa 2, da 5ª à 1ª corda. Escute cada corda e solte a pressão entre tentativas.',
      'A',
      'Bm',
    ),
    passage(
      c,
      'A → Bm no refrão',
      'Quatro pulsos por acorde. Prepare a posição antes da chegada ao Bm.',
      ['R1', 2, 3],
    ),
    form(c),
  ],
  'm5-a2': (c) => [
    shapes(
      'Escolha a corda grave',
      'Leia “Comece na…” em cada posição. Use esse baixo como referência do ataque.',
      'D',
      'Bm',
      'G',
      'Em',
      'A',
    ),
    passage(
      c,
      'Use o tempo do Bm',
      'Confira o som e prepare a saída durante os dois compassos em Bm.',
      ['A', 1, 6],
    ),
    form(c),
  ],
  'm5-a3': (c) => [
    passage(
      c,
      'O refrão tem nove compassos',
      'Conte todos os compassos; a frase não termina no oitavo.',
      ['R1', 1, 9],
    ),
    passage(
      c,
      'Em(2) → A(2)',
      'A troca divide o compasso ao meio; confira a chegada no compasso seguinte.',
      ['R2', 6, 7],
    ),
    form(c),
  ],
  'm6-a1': (c) => [
    notes(
      'Casas vizinhas, semitons',
      '4ª corda: E–F. 2ª corda: C–C#/Db–D. Uma casa representa um semitom.',
      [4, 2, 'E'],
      [4, 3, 'F'],
      [2, 1, 'C'],
      [2, 2, 'C#'],
      [2, 3, 'D'],
    ),
    shapes(
      'C permanece em C e F',
      'Nos dois desenhos, o indicador fica na 2ª corda/casa 1: nota C.',
      'C',
      'F',
    ),
    form(c),
  ],
  'm6-a2': (c) => [
    notes(
      'O F# que já está no D',
      'Toque E solta, F na casa 1 e F# na casa 2 da 1ª corda; depois volte ao acorde D.',
      [1, 0, 'E'],
      [1, 1, 'F'],
      [1, 2, 'F#'],
    ),
    form(c),
    finger6('G', '6ª'),
  ],
  'm6-a3': (c) => [
    passage(
      c,
      'Escute onde o ciclo repousa',
      'Toque o ciclo e cante a chegada antes de dar nome ao centro.',
      ['A', 1, 4],
    ),
    cMajor,
    form(c),
  ],
  'm7-a1': (c) => [
    shapes(
      'Bm completo: x24432',
      'A fundamental B está na 5ª corda/casa 2. Não toque a 6ª corda.',
      'Bm',
    ),
    passage(
      c,
      'Dois tempos para sair da pestana',
      'Bm ocupa 1–2 e G ocupa 3–4. Continue contando durante a troca.',
      ['R', 1],
    ),
    form(c),
  ],
  'm7-a2': (c) => [
    shapes(
      'Troque Bm → G',
      'Alterne as posições em dois pulsos cada. Diminua a velocidade se precisar preparar a mão.',
      'Bm',
      'G',
    ),
    passage(
      c,
      'Conecte A2 e A3',
      'Acompanhe os números: quatro pulsos por compasso, mesmo durante as mudanças.',
      ['A', 2, 3],
    ),
    form(c),
  ],
  'm7-a3': (c) => [
    passage(
      c,
      'Três entradas em um compasso',
      'Diga Bm no 1, G no 2 e A no 4. A largura de cada acorde mostra sua duração.',
      ['S', 3],
    ),
    passage(
      c,
      'S3 continua em S4',
      'Não reinicie a contagem antes do fim de S3; sustente o A de S4.',
      ['S', 3, 4],
    ),
    form(c),
  ],
  'm8-a1': (c) => [
    passage(
      c,
      'Observe o último pulso de A4',
      'Dm dura três pulsos e G ocupa o último; confira antes de passar à ponte.',
      ['A', 1, 4],
    ),
    passage(
      c,
      'A ponte ocupa cinco compassos',
      'Leia as cinco caixas e mantenha o quinto compasso inteiro.',
      ['P', 1, 5],
    ),
    form(c),
  ],
  'm8-a2': (c) => [
    bassLine,
    passage(
      c,
      'Reúna baixos e acordes',
      'C–B–A–G aparece nos baixos de R1–R2; complete R3–R4 mantendo o pulso.',
      ['R', 1, 4],
    ),
    form(c),
  ],
  'm8-a3': () => [
    shapes(
      'C/E: E é o baixo',
      'A barra indica a nota mais grave. Localize E na 6ª corda solta e mantenha as notas de C maior.',
      'C/E',
    ),
    shapes(
      'Am → Am7/G',
      'O baixo G acrescenta a sétima: A–C–E–G. Compare as cordas graves dos dois desenhos.',
      'Am',
      'Am7/G',
    ),
    dynamics(
      'Contraste com o mesmo andamento',
      'Planeje a intensidade antes de tocar; conserve as durações da cifra.',
      [
        ['Estrofe', 'suave', 2],
        ['Refrão', 'mais presente', 4],
      ],
    ),
  ],
  'm9-a1': (c) => [
    shapes(
      'O E solto transforma o F',
      'F parcial não usa a 1ª corda. Em Fmaj7, a 1ª corda solta acrescenta E, a sétima maior.',
      'F',
      'Fmaj7',
    ),
    passage(
      c,
      'Troque no 1 e no 3',
      'V1 divide os quatro pulsos entre Fmaj7 e Am7; V2 mantém Gsus4.',
      ['V', 1, 2],
    ),
    passage(
      c,
      'Em7 no meio, G no fim',
      'Compare o quarto e o oitavo compassos do refrão enquanto segue o arranjo.',
      ['R', 1, 8],
    ),
  ],
  'm9-a2': (c) => [
    rhythm(
      'V1: quatro gestos por acorde',
      'p = polegar · i = indicador · m = médio · a = anelar. O segundo p coincide com o 3 e já pertence a Am7.',
      [
        [
          'Fmaj7 · pulsos 1–2',
          ['1', 'e', '2', 'e'],
          ['p', 'i', 'm', 'a'],
          ['4ª', '3ª', '2ª', '1ª'],
        ],
        ['Am7 · pulsos 3–4', ['3', 'e', '4', 'e'], ['p', 'i', 'm', 'a'], ['5ª', '3ª', '2ª', '1ª']],
      ],
    ),
    passage(
      c,
      'V1 → V2, sem interrupção',
      'Em V2, use os oito gestos no mesmo Gsus4; o baixo está na 6ª corda.',
      ['V', 1, 2],
    ),
    form(c),
  ],
  'm9-a3': (c) => [
    passage(
      c,
      'Prepare o acompanhamento',
      'Estabilize estes quatro compassos antes de inserir uma resposta.',
      ['R', 1, 4],
    ),
    path(
      'Uma resposta com espaço',
      'Escolha os sons com o professor e combine o lugar com quem canta. A pausa faz parte da resposta.',
      ['Ouvir', 'Esperar o espaço da voz'],
      ['Responder', 'Dois ou três sons + pausa'],
      ['Voltar', 'Retomar o acompanhamento'],
    ),
    form(c),
  ],
  'm10-a1': (c) => [
    shapes(
      'Reconheça as famílias móveis',
      'Compare Bm → C#m e Em → F#m; depois monte E aberto. Leia a casa inicial e o baixo de cada posição.',
      'Bm',
      'C#m',
      'Em',
      'F#m',
      'E',
    ),
    shapes(
      'Prepare a chegada em F#m',
      'Compare C#m → C#7 → F#m lentamente; use o indicador como referência, sem prender a pressão.',
      'C#m',
      'C#7',
      'F#m',
    ),
    form(c),
  ],
  'm10-a2': (c) => [
    leading,
    path(
      'Duas chegadas em A maior',
      'Compare a resolução local em F#m com a chegada a A. Ouça antes de nomear a função.',
      ['C#7 → F#m', 'V7/vi → vi'],
      ['Bm → E → A', 'ii → V → I'],
    ),
    passage(
      c,
      'Localize a chegada em B6',
      'Siga as durações reais desta passagem; B6 contém C#7 e F#m.',
      ['B', 5, 8],
    ),
  ],
  'm10-a3': (c) => [
    leading,
    shapes(
      'Mesmo baixo A, outra cor',
      'Compare as notas de A e G/A. A nota depois da barra permanece no baixo.',
      'A',
      'G/A',
    ),
    form(c),
  ],
  'm11-a1': (c) => [
    notes(
      'As fundamentais nas cordas graves',
      'Localize B–C#–D# na 5ª corda (casas 2–4–6) e F# na 6ª (casa 2).',
      [5, 2, 'B'],
      [5, 4, 'C#'],
      [5, 6, 'D#'],
      [6, 2, 'F#'],
    ),
    shapes(
      'B → F#: confira a casa e o baixo',
      'A forma B parte da 5ª corda; F#, da 6ª. Solte a pressão ao preparar a troca.',
      'B',
      'F#',
    ),
    form(c),
  ],
  'm11-a2': (c) => [
    shapes(
      'Escute cada corda da posição',
      'Monte cada pestana antes de iniciar p–i–m–a–m–i. Ouça especialmente as cordas agudas.',
      'D#m',
      'C#',
      'B',
      'F#',
    ),
    passage(
      c,
      'Prepare F# antes do próximo 1',
      'Cada compasso tem dois pulsos ternários. Leia os seis espaços de contagem.',
      ['R', 1, 4],
    ),
    finger6('F#', '6ª'),
  ],
  'm11-a3': (c) => [
    passage(
      c,
      'Compare a ordem dos ciclos',
      'Primeiro o ciclo V; depois o ciclo R. Ouça a ordem dos acordes para reconhecer a seção.',
      ['V', 1, 4],
      ['R', 1, 4],
    ),
    dynamics(
      'Quatro passagens pela ponte',
      'Proposta para ensaiar: aumente gradualmente, mantendo os dois pulsos de cada compasso.',
      [
        ['P · 1ª vez', 'suave', 1],
        ['P · 2ª vez', 'crescer', 2],
        ['P · 3ª vez', 'crescer', 3],
        ['P · 4ª vez', 'preparar retorno', 4],
      ],
    ),
    form(c),
  ],
  'm12-a1': (c) => [
    shapes(
      'Retome dois pares',
      'Pratique A → F#m; depois C#m → Bm. Confira os baixos e solte a pressão entre as trocas.',
      'A',
      'F#m',
      'C#m',
      'Bm',
    ),
    form(c),
    passage(
      c,
      'Prepare a ligação em J',
      'Ensaie a seção J e depois volte ao roteiro completo com voz ou contagem de apoio.',
      ['J', 1, 8],
    ),
  ],
  'm12-a2': (c) => [
    passage(
      c,
      'Escute E como repouso',
      'Toque A1–A4 e escute a nota E; coleção de notas e centro são duas observações diferentes.',
      ['A', 1, 4],
    ),
    passage(c, 'Observe G no refrão', 'Compare esta passagem com o repouso em E da estrofe.', [
      'R',
      1,
      4,
    ]),
    path(
      'Duas perguntas para a escuta',
      'Use a evidência da música para explicar; uma lista de notas sozinha não define o centro.',
      ['Coleção', 'Quais notas aparecem?'],
      ['Centro', 'Onde a frase repousa?'],
    ),
  ],
  'm12-a3': (c) => [
    shapes(
      'Compare baixos e acordes',
      'Ouça A → D/F#; depois F → G → A. Os baixos escritos pertencem a cada posição.',
      'A',
      'D/F#',
      'F',
      'G',
    ),
    passage(
      c,
      'Localize os empréstimos no final',
      'Em A maior, F e G são ♭VI e ♭VII. Confira seus lugares em F1 e F2.',
      ['F1', 1, 4],
      ['F2', 1, 4],
    ),
    form(c),
  ],
  'm13-a1': (c) => [
    passage(
      c,
      'Quatro, dois, quatro, quatro',
      'V2 tem somente dois pulsos. Volte ao 1 de V3 imediatamente depois do 2.',
      ['V', 1, 4],
    ),
    passage(
      c,
      'As mudanças de V3 e V7',
      'V3: D por três pulsos, A/C# por um. V7: D(1), A/C#(1), Bm7(2).',
      ['V', 3],
      ['V', 7],
    ),
    form(c),
  ],
  'm13-a2': (c) => [
    path(
      'Ensaie as ligações',
      'Use os sinais combinados para passar de uma seção à próxima.',
      ['P1', 'Primeira ponte'],
      ['P2', 'Último compasso: 2/4'],
      ['L', 'Ligação'],
      ['R', 'Refrão'],
    ),
    dynamics(
      'Duas intensidades, mesmo pulso',
      'Faça o contraste com a voz ou outro instrumento, mantendo as entradas em conjunto.',
      [
        ['Refrão 1', 'suave', 2],
        ['Refrão 2', 'mais presente', 4],
      ],
    ),
    form(c),
  ],
  'm13-a3': (c) => [
    plan,
    form(c),
    path(
      'Transforme a escuta em próximo passo',
      'Registre uma evidência concreta da execução e escolha uma habilidade para consolidar.',
      ['Conquista', 'O que consegui manter?'],
      ['Evidência', 'Em qual trecho ouvi isso?'],
      ['Próxima prática', 'Qual habilidade vou retomar?'],
    ),
  ],
};

export function getLessonVisualSteps(lesson: Lesson, chart: SongVersion): IllustratedStep[] {
  const visuals = lessonVisuals[lesson.id]?.(chart);
  if (!visuals || visuals.length !== lesson.steps.length)
    throw new Error(`Aula sem roteiro visual completo: ${lesson.id}`);
  return lesson.steps.map((instruction, i) => ({ instruction, visual: visuals[i] }));
}
