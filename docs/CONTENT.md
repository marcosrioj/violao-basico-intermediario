# Conteúdo do Violão Vivo

O conteúdo do **Violão Vivo** foi aprofundado em 15/11/2026. A base canônica importada continua sendo a edição 5 fornecida pelo proprietário em 14/11/2026. Seus 13 módulos, 39 aulas, músicas, acordes, textos e arquivos permanecem integralmente preservados. Instruções operacionais contidas no histórico ou nos documentos não foram tratadas como comandos do sistema.

## Conteúdo aprofundado

A atualização é uma reformulação integrada por associação aos IDs existentes. `lesson-enrichment.json` aprofunda as 39 aulas; `technique-data.json` contém nove eixos e 27 estudos autorais; `teacher-enrichment.json` contém princípios de ensino, rubrica e 39 planos individualizados de 60 minutos. `lesson-journey.json` organiza 86 aplicações, com 27 introduções únicas, retomadas e foco específico por aula. `curriculum.ts` usa esse mapa canônico sem alterar os mapas harmônicos ou chaves de progresso. O carregamento docente permanece em `teacher.ts`, com `server-only`, e só é renderizado após autorização. [Contrato e progressão](INTEGRATED-LEARNING.md).

Os nove eixos cobrem fundamentos, acordes e notação, intervalos/escalas/pestana, palhetada, articulações, expressão, ritmos, CAGED e campos harmônicos/cadências. A ementa pública de Fábio Lima é referência de abrangência; os exercícios, exemplos e planos são autorais. Não há atribuição de aulas privadas ao artista nem reprodução de seu curso. As fontes especializadas consultadas e os limites da pesquisa estão em [pesquisa musical](CURRICULUM-RESEARCH.md) e [pesquisa pedagógica](TEACHING-RESEARCH.md).

Cada estudo inclui pré-requisitos, explicação, exemplo trabalhado, prática gradual, simplificação, ampliação, erros observáveis, critérios de execução, pergunta de recuperação e revisões. As quatro práticas semanais são uma organização flexível. Os estudos entram nos encontros existentes e na prática entre encontros; os 27 estudos não equivalem automaticamente a 27 semanas extras. Não há garantia universal de domínio em prazo fixo.

### Navegação e acompanhamento

- `/curso`: uma trilha com os 13 módulos, ação de continuar e busca por aula, música ou técnica.
- `/aulas/[id]`: quatro etapas (entender, treinar, aplicar, revisar), com os estudos completos na própria aula. Introduções e retomadas mostram o foco atual; `#estudo-{id}` abre diretamente o estudo e seus painéis ancestrais. Os conteúdos originais e ampliados permanecem disponíveis.
- `/tecnica` e `/tecnica/[id]`: índice complementar e consulta completa, com entrada principal para a introdução do estudo na trilha e retorno às aplicações posteriores.
- `/professor/metodologia`: princípios, rubrica e acesso aos 39 planos, somente para professores.
- `/materiais`: PDFs completos atualizados, consultas R1–R8, guias preservados e arquivos V5.

Os estudos são registrados no diário da aula de aplicação. O curso mantém o modelo existente de progresso das 39 aulas; não cria conclusão automática de habilidade ou de estudo técnico. Quiz e autorrelato não substituem observação instrumental. A apresentação docente preserva as etapas anteriores e acrescenta demonstração, prática, critérios e pergunta de recuperação dos estudos selecionados para aquela aula; as respostas dependem de revelação explícita.

### PDFs completos e reprodução

`materials/Curso_Aluno_Violao_Gospel_v6.pdf` e `materials/Manual_Professor_Violao_Gospel_v6.pdf` são os downloads ativos, com cópias idênticas em `output/pdf/`. A edição permanece a mesma: o sufixo aparece somente nos nomes dos PDFs. Cada estudo completo entra na primeira aula canônica; as retomadas indicam foco e página para revisão. O índice técnico conserva os nove eixos, e diagramas, mapas e teoria continuam completos. Cada livro termina com seu PDF V5 integral, identificado como acervo. `pdf-manifest.json` contém total de páginas, posições de aulas/estudos e início do acervo; as páginas originais são convertidas por `legacyStartPage + páginaV5 - 1`.

Os endpoints originais `/api/materials/aluno` e `/api/materials/professor` entregam os livros atualizados. As rotas adicionais `aluno-v5` e `professor-v5` preservam o download dos originais, com as mesmas regras de matrícula e papel. Os PDFs não ficam em `public/`.

```bash
python3 -m venv /tmp/violao-pdf-env
. /tmp/violao-pdf-env/bin/activate
python -m pip install -r scripts/requirements-pdf.txt
npm run pdf:build
```

O builder lê os JSONs editoriais e os PDFs originais; não precisa de rede depois de instalar as dependências. Após alterar conteúdo, regenere os PDFs, confira a paginação e o manifesto e execute `npm run check`. [Registro de verificação gráfica](PDF-VERIFICATION.md).

`content-preservation.json` registra SHA-256 de todos os dados e fontes legadas preservados. O teste de integridade confere esses hashes, a cobertura de 39 aulas, 27 estudos, planos de 60 minutos, referências válidas e os mapas de páginas dos PDFs. O importador abaixo continua importando exclusivamente a base V5 e não sobrescreve os arquivos de aprofundamento.

## Base importada da edição 5

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

A extração de PDF preserva texto e número de página. Diagramas e cifras são reconstruídos com os dados estruturados do HTML, pois texto extraído não preserva a disposição visual do PDF. Os PDFs originais continuam sendo a referência gráfica completa. Na implementação inicial V5, não foram criados nem modificados PDFs; a geração dos livros atualizados está descrita acima.

A pesquisa de andamentos fica separada em `src/content/tempo-research.json` e é associada às músicas por ID em `course.ts`. O importador não escreve esse arquivo: reimportar a edição 5 preserva a pesquisa. O valor bruto de `lesson.bpm` continua sendo o andamento de estudo da edição 5. `defaultPlaybackBpm(studyBpm, tempo?)` usa sempre a referência válida, convertida para a unidade do player; sem referência utilizável, retorna o andamento de estudo. A [auditoria dos andamentos](TEMPO-RESEARCH.md) registra versões, unidades, fontes, conversões e incertezas das 13 músicas.

As 39 aulas iniciam no andamento de referência da música, incluindo as estimativas já adotadas. A indicação da aula e o valor inicial do diário seguem o mesmo padrão; somente o diário arredonda para inteiro. O player oferece um único botão **Usar referência**, com fontes e limitações na ajuda contextual. O seletor manual continua disponível. A adoção como padrão não transforma uma estimativa em medição confirmada.

## Convenções musicais que não podem se perder

- Diagramas: arrays de seis posições, da **6ª para a 1ª corda**. `null` significa não tocar; `0`, corda solta. `barres` contém `[casa, índiceInicial, índiceFinal]`, com índices de 0 a 5.
- F inicial é `xx321x`, três dedos separados. As formas da mesma família não substituem automaticamente a posição didática escolhida.
- `beats` representa pulsos. Em 6/8, são **dois pulsos de semínima pontuada**, cada um com três subdivisões. Em 4/4, são semínimas. O player deve respeitar também `meter` e `beats_per_bar` de cada compasso, inclusive 2/4.
- Um BPM de referência sempre inclui sua figura musical. `tempo.ts` converte a unidade publicada para a do player; não basta copiar um número ou escolher sua metade como confirmação. Em Me Derramar, 56 semínimas/min correspondem a 37,333… semínimas pontuadas/min. A pesquisa distingue `documented`, `estimated` e `unresolved`; escolher uma estimativa como padrão não a torna documentada. O modelo continua aceitando casos não resolvidos sem preset de gravação, embora as 13 entradas atuais tenham referência documentada ou estimada. As conversões e referências de 6/8 permanecem inalteradas.
- A ordem de execução vem de `order` e inclui repetições. Não basta percorrer cada seção uma vez.
- Tons e arranjos permanecem os definidos pela edição 5. Não confundir as duas músicas chamadas “Faz Chover”, de Toque no Altar e de Fernandinho.
- As instruções de preparação que o usuário pediu para não exibir foram removidas dos dados do app. Nenhuma música de Thalles integra o repertório.
- `R3` no foco de uma cifra pode ser o terceiro compasso do refrão; **Teoria R3** é uma consulta. `navigation.ts` mantém essa distinção e fornece links para aulas, compassos e referências com âncoras estáveis de retorno.

## Fontes, letras e vídeos

As URLs de gravações, letras/cifras e referências teóricas foram preservadas do material fornecido. O app não copia letras integrais de páginas externas nem armazena gravações comerciais. “Letra e cifra” abre a fonte original. Os mapas harmônicos e arranjos didáticos fornecidos ficam disponíveis no app. Links e disponibilidade de reprodução podem mudar; o professor deve conferir a gravação antes da aula. O importador valida estrutura e coerência interna, não realiza verificação musicológica independente de cada gravação.

O usuário forneceu as letras completas das 13 músicas. Suas **712 linhas** foram preservadas literalmente em `song-lyrics-1.json`, `song-lyrics-2.json` e `song-lyrics-3.json`, incluindo repetições, interjeições e ministrações. `song-lyrics-provenance.json` registra a origem e a integridade desses textos. `getLessonLyrics` seleciona no servidor somente a música e a versão da aula; o catálogo completo não entra no módulo cliente.

As 19 versões de arranjo têm marcações iniciais e as 39 aulas exibem as frases automaticamente abaixo da linha de compassos correspondente. A opção **Mostrar letra** nos controles principais oculta ou exibe a letra e o texto integral sem interromper a reprodução. Cada marcação tem início e fim em pulsos do arranjo expandido; ocorrências do mesmo trecho podem usar textos diferentes. O destaque segue o relógio do áudio sintetizado ao pausar, retomar, mudar o BPM ou repetir uma passagem. Os trechos oferecem Tocar daqui, Pausar ou Continuar conforme seu estado; a reprodução segue automaticamente para o próximo, salvo repetição ativa. Ir para o trecho navega à primeira ocorrência sem recortar o arranjo. Os mapas atuais mantêm `status: "draft"` nos dados. Foram associados às células harmônicas e cadências das fontes, sem medir todas as entradas vocais das gravações. O [alinhamento pelo TXT fornecido](LYRIC-CHORD-ALIGNMENT.md) fixa 928 inícios silábicos em acordes já existentes. Os intervalos entre essas âncoras continuam estimados; não há alegação de karaokê exato do fonograma.

A seção expansível da letra integral mostra também os versos e falas que não cabem nas formas didáticas abreviadas. A aplicação preserva a leitura de ajustes pessoais salvos anteriormente no navegador, associados à música e à estrutura do arranjo; não são enviados ao Supabase ou compartilhados automaticamente com a turma. As letras agora incluídas no curso permanecem no repositório público, enquanto o carregamento nas aulas segue as regras de acesso existentes. Esta mudança do player não altera os mapas harmônicos legados nem os PDFs. [Conferência de execução e limites](PLAYBACK-VERIFICATION.md).

Os PDFs fornecidos têm fontes de pesquisa e referências já incluídas. Fontes adicionais consultadas para a aplicação estão em [PEDAGOGY-RESEARCH.md](PEDAGOGY-RESEARCH.md), distinguindo resultados publicados das decisões de desenho deste curso. A pesquisa musical de 14/11/2026 e a decisão posterior de adotar três hipóteses como padrão estão em [TEMPO-RESEARCH.md](TEMPO-RESEARCH.md): o estado atual é de sete referências documentadas e seis estimadas, com fontes e incertezas preservadas. Não foi adicionado ao repositório nenhum áudio ou PDF de terceiros consultado nessa pesquisa.

O andamento de referência é nominal ou estimado, não um mapa de sincronização com o vídeo. Variações conhecidas, como 68 → 71 em Preciso de Ti e rallentandos finais, são descritas para ajuste manual. A referência editorial pesquisada de Lugar Secreto identifica Céu (2018); o ano legado de 2017 permanece nos materiais originais v5 para preservar a proveniência.

## Divisão silábica e animação

O texto enviado permanece integral, sem inserir hífens ou separadores na leitura. `lyric-syllable-boundaries.json` contém somente posições de divisão de 520 palavras do material fornecido. As posições foram preparadas com [Pyphen 0.17.2](https://pyphen.org/), dicionário `pt_BR` e limites de uma letra. É uma divisão escrita, não uma transcrição do canto: elisões entre palavras, melismas e pronúncia exigem revisão humana. Nenhum pacote ou dicionário completo de terceiros foi incluído no aplicativo; apenas os resultados sobre o vocabulário fornecido.

Cada marcação pode conter sílabas com offsets no texto, pulsos de entrada/saída e origem `manual` ou `estimated`. Marcas manuais têm precedência e permitem sustentações e pausas. Sem elas, a prévia distribui o intervalo da frase com pesos iniciais (1 por sílaba, 1,25 quando há acento gráfico/nasalização e 2 na última sílaba). Esses pesos são uma aproximação de interface, **não são uma transcrição musical nem ensinam com precisão o ritmo da gravação**. A divisão e os intervalos podem ser revisados nos dados de conteúdo; não há editor na interface.

A animação usa a posição do áudio, sem relógio independente nem transições com duração acumulada. Cada sílaba possui uma única cópia visível, com avanço suave dentro do próprio texto. Toda sílaba anterior à posição atual fica em negrito, inclusive ao iniciar mais adiante ou mudar de frase ou linha. A distribuição dos compassos por linha permanece inalterada; linhas posteriores à posição atual não recebem destaque antecipado. Isso vale para as 744 frases das 19 versões, nas 13 músicas. Pausar preserva o destaque e o término natural mantém o prefixo completo. Iniciar outra execução, voltar ou repetir recalcula o negrito pela posição atual: texto anterior fica marcado mesmo que tenha sido pulado; texto posterior permanece normal. Movimento reduzido mantém a sílaba ativa em negrito sem varredura. O texto integral e os PDFs anteriores permanecem preservados.
