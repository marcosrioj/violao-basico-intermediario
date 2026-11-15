# Repertório e técnica na mesma trilha

A edição atual mantém os 13 módulos, as 39 aulas e os 27 estudos completos. A sequência principal acompanha as aulas do repertório; os nove eixos técnicos permanecem disponíveis como índice de consulta. Nenhum estudo cria uma aula adicional nem uma segunda contagem de progresso.

## Fonte canônica

`src/content/lesson-journey.json` define, em ordem de aula, cada aplicação técnica:

```json
{
  "edition": 6,
  "lessons": [
    {
      "lessonId": "m5-a1",
      "techniques": [
        {
          "studyId": "t3-e3",
          "stage": "introducao",
          "focus": "Preparar o Bm gradualmente, conferir notas e apoios e entrar na progressão sem apertar além do necessário."
        }
      ]
    }
  ]
}
```

- `introducao` indica a primeira entrada na sequência, não a exigência de concluir todo o estudo nessa aula.
- `retomada` indica uma nova aplicação do mesmo estudo com o foco específico daquela aula.
- `focus` delimita o que praticar agora, incluindo o que será aprofundado mais adiante quando um estudo abrange várias habilidades.
- A ordem de `techniques` é a ordem editorial dentro da aula. A edição interna não aparece como parte do nome do curso.

O mapa contém 39 aulas, 86 aplicações e 27 introduções únicas. `lesson-enrichment.json` preserva as explicações, exemplos, práticas, perguntas e planos semanais; seu campo `techniqueStudyIds` deve corresponder exatamente ao mapa. Os textos completos continuam em `technique-data.json`.

`relatedLessons` dos estudos permanece preservado como informação editorial anterior, mas não dirige mais a navegação: alguns vínculos antecipavam estudos sem seus pré-requisitos. Site, materiais docentes e PDFs usam o mapa canônico.

## Contrato dos helpers

Em `src/content/curriculum.ts`, todos os exports anteriores são mantidos:

| Export                                   | Uso                                                                                      |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- |
| `lessonJourneys`                         | Mapa com IDs, estágios e focos, sem os textos completos dos estudos.                     |
| `getLessonTechniqueEntries(lessonId)`    | Entradas ordenadas `{ study, stage, focus }`; `study` inclui `moduleId` e `moduleTitle`. |
| `getTechniqueStudyIntroduction(studyId)` | `{ lessonId, focus }` da primeira introdução, ou `undefined`.                            |
| `getStudyLessonIds(studyId)`             | Aulas do mapa em ordem do curso; não combina backlinks antigos.                          |
| `getLessonStudies(lessonId)`             | Estudos completos na ordem canônica da aula.                                             |
| `getModuleTechniqueCount(moduleNumber)`  | Quantidade de estudos distintos aplicados no módulo, sem contar retomadas duas vezes.    |

IDs desconhecidos retornam listas vazias, contagem zero ou `undefined`, conforme o retorno do helper. Os componentes de servidor selecionam os dados antes de enviá-los a componentes de cliente; o catálogo recebe apenas os títulos e metadados de que precisa.

Links diretos para uma aplicação usam `/aulas/{lessonId}#estudo-{studyId}`. A introdução canônica permite que o índice técnico leve o aluno à aula em que o estudo começa.

## Progressão preservada

| Módulo | Introduções técnicas                                                  | Retomadas e aplicação                                                |
| ------ | --------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1      | Postura, afinação e cifras na aula 1; mãos, trocas e pulso na aula 2. | Reconhecer as partes e terminar junto com D, G e Em.                 |
| 2      | Nenhum estudo novo.                                                   | C, Am e F de três cordas, oito ataques e intensidade sem acelerar.   |
| 3      | Dois pulsos ternários em 6/8.                                         | Dedilhado de seis notas e apresentação completa.                     |
| 4      | Tablatura, palheta, intervalos e escalas.                             | Dm e notas; tríades e construção da escala maior.                    |
| 5      | Primeira pestana em Bm.                                               | Entrada e saída da pestana, escolha dos baixos e duração das frases. |
| 6      | Alternância entre cordas, campo maior e campo menor.                  | Doze notas, G maior, 6/8 e comparação entre C e Am.                  |
| 7      | Síncope, antecipação e mudanças dentro do compasso.                   | Pestana em novo repertório e trocas a cada dois tempos.              |
| 8      | Legato/staccato e pizzicato.                                          | Graus, inversões, linha descendente e sétima no baixo.               |
| 9      | Arpejos com palheta, dinâmica/timbre, ligados e vibrato.              | Tétrades, dedilhado e resposta curta com espaço musical.             |
| 10     | Formas CAGED, ornamentos e posições do mesmo acorde.                  | Dominante de acorde menor e condução para a resolução.               |
| 11     | Nenhum estudo novo.                                                   | Formas móveis, pestanas em 6/8 e dinâmica entre seções.              |
| 12     | Conexão entre acordes e melodias pelo braço.                          | Forma completa, centros musicais, ornamentos e empréstimos.          |
| 13     | Planejamento e avaliação de um arranjo.                               | Compassos curtos, conjunto, apresentação e autonomia.                |

A coordenação das mãos foi deslocada da primeira para a segunda aula para reduzir o número de estudos novos no início. Dinâmica, timbre e direção da frase entram na segunda aula do módulo 9 e retornam no módulo 11. Pestana continua a partir do módulo 5; palheta a partir do 4; articulações a partir do 8; expressão a partir do 9; CAGED a partir do 10. Ornamentos seguem os ligados; posições do CAGED seguem o reconhecimento das formas.

## Uso pedagógico e docente

Cada aplicação parte do foco da aula, passa por demonstração e tentativa curta e retorna ao trecho do repertório. O estudo completo permite consulta e aprofundamento; o foco evita exigir todas as suas variações na primeira apresentação. O professor decide o apoio e o ritmo de avanço a partir da execução observada, preservando as alternativas mais simples e mais difíceis já disponíveis.

As retomadas podem começar por uma tentativa antes da consulta. A prática semanal continua flexível e distribuída em quatro oportunidades; não é uma dose obrigatória. Concluir uma aula registra percurso, e não comprova domínio. O diário e os critérios de sucesso orientam a escolha da próxima prática sem introduzir uma segunda métrica de conclusão técnica.

Nos PDFs, o estudo completo aparece em sua primeira aula canônica. As retomadas mantêm o foco da aplicação e uma referência à primeira apresentação; os nove eixos oferecem um índice para consulta. O material original permanece preservado.

## Verificação

`tests/curriculum.test.ts` verifica cobertura e ordem das 39 aulas, correspondência dos dois mapas, 27 introduções únicas, foco por aplicação, retornos dos helpers, pré-requisitos entre estudos e exclusão de backlinks antigos que antecipavam recursos. As verificações existentes continuam cobrindo integridade dos originais, textos e fontes dos estudos, planos docentes e sincronização dos PDFs.
