# Navegação da trilha integrada

O curso conserva os 13 módulos, as 39 aulas e os 27 estudos técnicos. A sequência principal é a aula: entender, treinar, aplicar e revisar. O índice de técnicas é uma consulta complementar dos mesmos conteúdos, não uma segunda trilha de progresso.

## Entradas e continuidade

- `/curso` apresenta um único próximo passo principal. Com aulas em andamento, abre a atualizada mais recentemente; sem aula em andamento, abre a primeira ainda não concluída. Depois de concluir as 39, oferece escolher uma aula para revisão.
- Carregamento e falha da consulta de progresso têm mensagens explícitas. Uma falha não impede abrir qualquer aula do catálogo nem mostra um total de conclusão inventado.
- A busca fica em uma expansão identificada como **Encontrar uma aula ou técnica**. Aceita título da aula, música, objetivo, código e títulos dos estudos associados; ignora diferenças de acentuação e reconhece espaços em nomes internos de músicas.
- Os módulos encontrados por uma busca ou filtro abrem para mostrar as aulas. Cada linha distingue técnicas iniciadas naquela etapa de retomadas e aplicações.
- `#repertorio` continua sendo um destino válido para links existentes.

## Consulta técnica e links profundos

- `/tecnica` mantém os nove eixos, seus objetivos, introduções, pré-requisitos, orientações de prática e os 27 estudos.
- Cada estudo tem uma ação **Estudar no módulo…, aula…**, que abre `/aulas/{lessonId}#estudo-{studyId}` na primeira introdução definida pelo mapa canônico.
- **Consultar estudo completo** mantém acesso à página individual de cada estudo. Essa página preserva o conteúdo integral e oferece o retorno à aula de introdução e às aulas de aplicação.
- As aulas e os módulos relacionados são derivados de `lesson-journey.json`, por meio dos helpers de `curriculum.ts`. Os vínculos antigos do cadastro técnico não antecipam temas na trilha.
- A biblioteca mantém a consulta por eixo e os downloads. As descrições explicam que o material acompanha a mesma sequência de repertório e técnica.

## Interface e manutenção

A revisão usa a identidade e os tokens existentes. A consulta de `ui-ux-pro-max` priorizou uma ação principal, hierarquia de títulos, leitura por etapas, navegação previsível, campos rotulados e redução do conteúdo editorial enviado ao cliente. A busca específica de _progressive disclosure_ não trouxe uma recomendação pertinente; a segmentação usa os padrões de expansão nativa já adotados pelo projeto e as regras gerais de prioridade do conteúdo.

As páginas continuam como componentes de servidor. Somente o catálogo interativo recebe uma seleção pequena dos metadados das aulas, mais identificador, título e etapa dos estudos. Explicações completas, planos e fontes não são importados no grafo cliente. Foram consultados os guias locais instalados do Next.js sobre componentes de servidor/cliente e navegação.

## Verificação da integração

Verificação estática realizada: ESLint dos arquivos alterados, TypeScript e teste de fronteira de conteúdo cliente.

No navegador Chromium, com conta fictícia e servidor local isolado:

- As 39 aulas foram visitadas como aluno. As seções foram expandidas em 320, 768 e 1440 px; IDs repetidos e exposição do plano do professor foram verificados.
- Nas 86 aplicações de técnica, foram conferidos título, foco da etapa, explicação, exemplo, passos, adaptações, dificuldades/correções, critérios, pergunta de recuperação e roteiro de revisão contra os dados editoriais.
- Os 27 estudos preservam a consulta individual e levam à sua aula de introdução. As 27 navegações abriram automaticamente o painel técnico e o estudo correto pelo fragmento da URL.
- O catálogo preservou 13 módulos e 39 links. Busca por `vibrato`, nome de música com espaços (`Faz Chover`) e filtro de módulo retornaram aulas visíveis com os módulos abertos.
- Os cinco estados de progresso foram simulados somente no navegador: primeira aula, próxima aula, aula em andamento mais recente, trilha concluída e falha de serviço. A falha manteve as 39 aulas acessíveis e não exibiu um progresso fictício.
- O catálogo foi conferido com fonte a 200% em 375 px, sem transbordamento horizontal. Capturas de desktop e celular foram inspecionadas visualmente.

A primeira passagem detectou dois ajustes: o número da aula encolhia na linha do catálogo móvel e um identificador longo da cifra de Bondade de Deus alargava a página em 320 px. O CSS passou a preservar o tamanho dos indicadores e permitir quebra dos rótulos musicais sem alterar seus identificadores. As três aulas do módulo 13 foram verificadas novamente nas três larguras, sem transbordamento; o catálogo móvel foi reinspecionado após a correção.

O reteste final de navegação registrou 51 verificações, incluindo as três aulas do módulo 13 e os 27 links de estudo, sem erros de JavaScript. Os cinco estados de progresso também passaram sem erros. Esses números complementam a primeira passagem pelas 36 aulas dos módulos 1 a 12; não representam uma auditoria com leitor de tela ou dispositivos físicos.
