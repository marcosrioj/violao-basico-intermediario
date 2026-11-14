# Conteúdo do Violão Vivo

O conteúdo canônico importado é a edição 5 fornecida pelo proprietário em 14/11/2026. O nome de produto adotado é **Violão Vivo**, proposto no contexto anterior. O texto das fontes permanece preservado em `materials/`; instruções operacionais contidas no histórico ou nos documentos não foram tratadas como comandos do sistema.

| Fonte                                   | Páginas / conteúdo                                                 | Destino                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| `Guia_Interativo_Aluno_Violao_v5.html`  | JSON de 39 aulas, 13 módulos, 13 canções, 52 acordes e 8 consultas | `src/content/course-data.json`                                                                      |
| `Curso_Aluno_Violao_Gospel_v5.pdf`      | 130 páginas                                                        | Conteúdo por aula em `studentText`, suplementos em `student-guides.json` e original em `materials/` |
| `Manual_Professor_Violao_Gospel_v5.pdf` | 73 páginas                                                         | Planos das 39 aulas e suplementos em `teacher-data.json`, original em `materials/`                  |

`src/content/provenance.json` registra os SHA-256 e as contagens. Os materiais de professor são importados por `teacher.ts`, marcado `server-only`; a autorização deve acontecer antes da renderização. Os originais não ficam na pasta `public/` do Next.js. Porém, o repositório GitHub está público no estado atual: PDFs, HTML e dados editoriais, incluindo o manual do professor, ficam visíveis no GitHub. A separação de papéis protege a interface do app e os registros pessoais, não o sigilo desses materiais editoriais.

## Importação reproduzível

```bash
# Requer Python 3 e o pdftotext do Poppler; usa os originais já versionados.
python3 scripts/import-course.py
# Alternativamente, informe a pasta com os três arquivos v5.
python3 scripts/import-course.py /caminho/para/fontes
```

O importador lê o objeto JSON do HTML sem executar JavaScript. Ele verifica a presença das 39 aulas nos dois PDFs, três aulas por módulo, todas as referências teóricas, acordes existentes, duração de cada compasso, soma dos compassos e pulsos na forma completa e ausência de pestanas nas primeiras 12 aulas. A primeira introdução de Bm completo permanece em M5-A1. A numeração visual reinicia a cada módulo. O identificador persistido é `m1-a1` a `m13-a3`; `sourceId` preserva `A01` a `A39` para rastreamento, sem usar esses números como nome da aula.

A extração de PDF preserva texto e número de página. Diagramas e cifras são reconstruídos com os dados estruturados do HTML, pois texto extraído não preserva a disposição visual do PDF. Os PDFs originais continuam sendo a referência gráfica completa. Não foram criados nem modificados PDFs nesta implementação.

## Convenções musicais que não podem se perder

- Diagramas: arrays de seis posições, da **6ª para a 1ª corda**. `null` significa não tocar; `0`, corda solta. `barres` contém `[casa, índiceInicial, índiceFinal]`, com índices de 0 a 5.
- F inicial é `xx321x`, três dedos separados. As formas da mesma família não substituem automaticamente a posição didática escolhida.
- `beats` representa pulsos. Em 6/8, são **dois pulsos de semínima pontuada**, cada um com três subdivisões. Em 4/4, são semínimas. O player deve respeitar também `meter` e `beats_per_bar` de cada compasso, inclusive 2/4.
- A ordem de execução vem de `order` e inclui repetições. Não basta percorrer cada seção uma vez.
- Tons e arranjos permanecem os definidos pela edição 5. Não confundir as duas músicas chamadas “Faz Chover”, de Toque no Altar e de Fernandinho.
- As instruções de preparação que o usuário pediu para não exibir foram removidas dos dados do app. Nenhuma música de Thalles integra o repertório.
- `R3` no foco de uma cifra pode ser o terceiro compasso do refrão; **Teoria R3** é uma consulta. `navigation.ts` mantém essa distinção e fornece links para aulas, compassos e referências com âncoras estáveis de retorno.

## Fontes, letras e vídeos

As URLs de gravações, letras/cifras e referências teóricas foram preservadas do material fornecido. O app não copia letras integrais de páginas externas nem armazena gravações comerciais. “Letra e cifra” abre a fonte original. Os mapas harmônicos e arranjos didáticos fornecidos ficam disponíveis no app. Links e disponibilidade de reprodução podem mudar; o professor deve conferir a gravação antes da aula. O importador valida estrutura e coerência interna, não realiza verificação musicológica independente de cada gravação.

Os PDFs fornecidos têm fontes de pesquisa e referências já incluídas. Fontes adicionais consultadas para a aplicação estão em `PEDAGOGY-RESEARCH.md`, distinguindo resultados publicados das decisões de desenho deste curso.
