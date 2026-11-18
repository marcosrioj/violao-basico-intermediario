# Afinador no curso: auditoria e integração

Revisão em 18/11/2026. A busca percorreu os textos das 39 aulas, 27 estudos técnicos, consultas teóricas, guias, planos docentes e fontes dos PDFs, incluindo as formas **afine**, **afinar**, **afinação**, **afinador** e **afinada**. O objetivo é tornar a ferramenta acessível no momento da preparação, mantendo a tarefa musical em primeiro plano.

## Decisões por contexto

| Contexto encontrado                                                      | Decisão                                                                                                                                                                            |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primeira etapa da rotina das 39 aulas: “2 min: afine e leia a meta.”     | A própria palavra **afine** vira um link para `/laboratorio#afinador`. Nenhum texto ou botão extra é acrescentado. O texto original dos dados permanece intacto.                   |
| Estudo T1-E2, “Afinar e localizar as notas”                              | A explicação distingue a medição pelo microfone da comparação de ouvido. Na página independente, um único acesso ao afinador aparece junto à prática.                              |
| T1-E2 dentro de M1-A1, M4-A1 e M6-A1                                     | A explicação compartilhada permanece disponível dentro do estudo. O link destacado da página independente não se repete aqui: a rotina da aula já oferece o acesso.                |
| Prévia pública da primeira aula                                          | Usa o mesmo link contextual da rotina; o laboratório é público.                                                                                                                    |
| Guia inicial do aluno `student-p4` e orientação docente `teacher-p3`     | Uma referência curta acompanha cada guia, dentro da seção expansível, sem reescrever seu texto arquivado.                                                                          |
| Guia do professor                                                        | Um acesso discreto nos recursos de preparação atende à rotina dos encontros. Não se acrescentam instruções repetidas aos 38 planos regulares nem uma exigência na avaliação final. |
| Fonte BW-AFINACAO                                                        | Corrigida a afirmação antiga de que o curso não mede a afinação; limitações de leitura e distinção entre recurso e orientação musical permanecem explícitas.                       |
| Teoria R8, tradições musicais, vibrato, enarmonia e formato de tablatura | Mantidos como conteúdo musical. A mera ocorrência de “afinação” não gera link ou aviso.                                                                                            |
| Apostila e manual                                                        | A orientação atualizada integra a parte editorial atual. As páginas do acervo V5 são preservadas; os volumes e o manifesto devem ser reconstruídos após mudanças nas fontes.       |

## Regras para evitar repetição

O renderizador `RichText` só transforma a primeira ocorrência inteira de **afine** quando recebe uma aula e o campo exato `practice-0`, sem contexto de leitura teórica. Não há substituição global de palavras de afinação. Campos de passos, objetivos, textos de arquivo, outras etapas da rotina e consultas teóricas continuam sem esse tratamento.

O link mantém a palavra visível e inclui essa mesma palavra no nome acessível, seguido de “com o afinador do laboratório”. Usa `PageLink` com `purpose="reference"`: abre em outra aba e informa esse comportamento, preservando o ponto da aula. O destino possui a âncora `afinador`; a entrada não solicita o microfone automaticamente.

## Revisão pelas skills

A UI/UX Pro Max orientou a revisão por **prioridade do conteúdo**, **ação principal** e **divulgação progressiva**, usando as regras explícitas `content-priority`, `primary-action` e `progressive-disclosure` de sua referência local. A política de links segue o componente e o sistema de design já existentes.

As buscas `progressive disclosure content priority` e, depois, `progressive disclosure`, com `--domain ux`, retornaram correspondências fora do foco da tarefa, como equilíbrio de títulos e truncamento. Elas não foram tratadas como evidência de uma recomendação específica: os critérios aplicados vieram das referências explícitas da skill. Essa revisão não representa uma certificação automática.

## Verificação

`tests/tuner-course-links.test.ts` cobre as 39 páginas completas, a demonstração pública e os 27 estudos independentes. Confere um único link contextual por aula, preservação da rotina, nomes acessíveis, aviso de nova aba e ausência de links inseridos em teoria, passos e arquivo. Verifica também que referências teóricas existentes continuam funcionando.

Os testes de conteúdo e PDFs do projeto verificam a sincronização dos livros e suas fontes; a revisão visual precisa acompanhar qualquer regeneração que altere texto ou paginação.

Verificação desta entrega: `npm run check` passou com lint, TypeScript, 281 testes e build de produção. Uma prévia local renderizada pelo componente real da aula foi inspecionada em 1280 e 375 px, sem transbordamento horizontal. O link abriu o laboratório em outra aba, diretamente na âncora do afinador, mantendo a expansão da prática na aula de origem; nenhum erro de execução foi observado. A prévia não usa uma sessão autenticada.

Os dois PDFs foram regenerados e conferidos pela skill PDF. A apresentação da ferramenta aparece uma vez por volume (aluno p. 13; professor p. 16), sem alterar a paginação total. As 203 páginas do acervo V5 permanecem idênticas em conteúdo e renderização. Resultados detalhados em `docs/PDF-VERIFICATION.md`.
