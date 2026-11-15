# Verificação dos PDFs do curso

Verificação realizada em 15/11/2026. Os dois livros foram gerados a partir dos mesmos dados usados na aplicação e preservam os 13 módulos e as 39 aulas. Os 27 estudos técnicos agora estão integrados às aulas: a explicação completa aparece uma única vez, na primeira introdução, e as retomadas trazem o foco da aplicação e um vínculo com a página de consulta. O percurso reúne 86 aplicações, sendo 27 introduções e 59 retomadas. As oito consultas teóricas, os 19 mapas harmônicos e o atlas das 52 posições originais permanecem. O manual contém também as explicações e práticas do aluno, além dos planos docentes, intervenções, adaptações e rubrica.

| Material  | Páginas totais | Parte reformulada | Início do acervo integral | Páginas originais preservadas |
| --------- | -------------: | ----------------: | ------------------------: | ----------------------------: |
| Aluno     |            371 |               241 |                       242 |                           130 |
| Professor |            341 |               268 |                       269 |                            73 |

As capas e os cabeçalhos usam o nome **Violão Vivo**. O sufixo de versão permanece nos nomes `Curso_Aluno_Violao_Gospel_v6.pdf` e `Manual_Professor_Violao_Gospel_v6.pdf`. A identificação histórica do acervo e os identificadores musicais dos compassos são preservados.

## Geração reproduzível

```bash
python3 -m venv /tmp/violao-pdf-env
source /tmp/violao-pdf-env/bin/activate
python -m pip install -r scripts/requirements-pdf.txt
python scripts/build-course-pdfs.py
```

São necessárias as fontes DejaVu em `/usr/share/fonts/truetype/dejavu/`. As versões de ReportLab, pypdf, Pillow e PyMuPDF utilizadas estão fixadas em `scripts/requirements-pdf.txt`. O Poppler fornece `pdftoppm` e `pdfinfo` para inspeção complementar.

O gerador sempre produz os dois livros. Ele verifica a cobertura de 13 módulos, 39 aulas, 27 estudos e os planos docentes de 60 minutos. O mapa canônico `lesson-journey.json` determina a ordem das aplicações. Cada estudo deve ter uma única introdução, aparecer dentro da aula correspondente e preceder suas retomadas. A paginação é repetida até que o sumário e as referências impressas convirjam. O gerador constrói os arquivos temporariamente e só publica as cópias em `output/pdf/` e `materials/` depois que ambos passam pelas verificações estruturais. Se os dados mudarem durante a geração, a publicação é interrompida.

`src/content/pdf-manifest.json` registra os hashes dos sete arquivos de conteúdo, os hashes dos PDFs e dos originais, os totais e as páginas de cada aula, estudo, consulta e mapa harmônico. O campo `studyLessons` identifica a aula de introdução de cada estudo. Os atalhos do aplicativo usam esse manifesto. Qualquer mudança editorial exige gerar novamente os dois livros e conferir o manifesto.

## Preservação e integridade

- Os dois PDFs originais permanecem intactos em `materials/`.
- Cada página original foi anexada ao livro correspondente. Os fluxos de conteúdo decodificados das 203 páginas foram comparados com os originais e são iguais.
- Uma comparação raster independente, com PyMuPDF na escala 0,65, também encontrou **zero diferenças** nas 203 páginas anexadas.
- As cópias finais em `output/pdf/` e `materials/` são idênticas, byte a byte.
- O sumário, os marcadores e os vínculos entre aula, estudo, consulta, mapa e resposta foram verificados. Não foram encontrados destinos internos inválidos.
- A extração do texto confirmou a presença de todos os campos dos 27 estudos, das 86 aplicações com seus focos e das referências impressas aos 27 estudos em cada volume. Nenhum parágrafo explicativo dos estudos foi duplicado. O índice dos nove eixos preserva suas orientações e serve para localizar introduções e retomadas.
- Os arquivos contêm texto pesquisável e fontes incorporadas. Os diagramas de acordes e mapas harmônicos novos são vetoriais.

## Revisão visual

As 509 páginas da parte reformulada foram renderizadas e examinadas em folhas de contato, com ampliação de páginas de introdução de estudo, retomada, plano docente, tablatura e índice técnico. As seções de mapas, atlas, respostas e referências também foram conferidas nos contatos. A edição anterior já havia passado por inspeção ampliada dessas seções. Um segundo agente revisou as primeiras 60 páginas docentes em contatos e ampliou as páginas 133, 149, 171 e 191, sem identificar problemas adicionais.

Os arquivos publicados foram renderizados novamente. A comparação raster de todas as páginas principais com a prévia revisada encontrou zero diferenças; a inspeção ampliada da tablatura e do índice técnico nos arquivos finais confirmou o resultado.

A integração mantém os estudos dentro do fluxo das aulas, apresenta o foco de cada aplicação e indica a volta ao repertório. As páginas das retomadas mostram referências corretas para quem usa o livro impresso. Os finais de aula mantêm o plano de quatro dias junto às orientações de continuidade. Notas de versão e links das cifras permanecem agrupados. A tablatura autoral foi conferida em ampliação: as seis linhas têm a mesma largura, as barras coincidem e a contagem está alinhada aos eventos.

O corpo principal usa DejaVu Sans de 10,2 pontos, com entrelinha de 14,2 pontos. As tabelas usam cabeçalhos repetidos quando atravessam páginas. A checagem geométrica de todas as páginas novas encontrou **zero ocorrências** de texto fora dos limites adotados, sobreposição relevante de linhas ou páginas vazias. A inspeção das imagens finais não identificou cortes, glifos ausentes, sobreposições ou tabelas ilegíveis.

O modelo de sessão de prática é apresentado como parte do roteiro de quatro dias, com tempos flexíveis; os dois roteiros não devem ser somados como cargas independentes. A numeração impressa no acervo integral continua sendo a da edição original, conforme explicado no início de cada livro e na abertura do acervo.

## Entregáveis

- `output/pdf/Curso_Aluno_Violao_Gospel_v6.pdf`
- `output/pdf/Manual_Professor_Violao_Gospel_v6.pdf`
- Cópias homônimas em `materials/`, utilizadas pelas rotas protegidas da aplicação.

Os arquivos intermediários de diagramação e as imagens de inspeção não são entregáveis do curso.
