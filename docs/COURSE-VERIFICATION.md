# Verificação da trilha integrada

Evidências de preservação do conteúdo e funcionamento do curso. Cada registro identifica sua revisão; os testes automatizados e a inspeção visual são resultados distintos.

## Ações essenciais acessíveis · 17/11/2026

Conclusão e estado da aula estão fora dos painéis recolhíveis. A conclusão abre os objetivos pendentes sem gravar progresso; o salvamento continua exigindo sua conferência. Busca, controles de prática, agenda, devolutivas e entradas das tarefas docentes foram revistos pelos critérios das skills. A [matriz por página](DESIGN-SYSTEM.md#a%C3%A7%C3%B5es-essenciais--17112026) registra as decisões e as telas mantidas.

- `npm run check`: lint, tipos, **242 testes** e build aprovados. A renderização das 39 aulas verifica preservação do conteúdo, acesso à conclusão fora de expansões e ordem dos campos antes da ação.
- **36 verificações HTTP** aprovadas no build local, sem contas reais. Servidor temporário encerrado ao final.
- Cifra, metrônomo e cronômetro receberam pausa ao recolher seus controles. A navegação mantém IDs e conteúdo existentes; dados editoriais, PDFs e permissões foram preservados.
- Revisão de código baseada em `ui-ux-pro-max` e `ui-styling`, incluindo revisão independente. Nenhum navegador estava disponível: clique, teclado, retorno de foco, pausa por expansão e layout responsivo precisam de validação visual. Os testes estáticos não substituem essa verificação.

## Leitura simplificada · 17/11/2026

As aulas agora mostram uma etapa por vez, em uma coluna. Progresso e diário ficam na revisão; consultas e acervo ficam em **Materiais de apoio**. Biblioteca, técnicas, teoria, laboratório e painéis seguem a mesma organização. Os **24 documentos Markdown** têm uma entrada curta e detalhes por assunto.

- **241 testes**, lint, tipos e build aprovados. O último ajuste no guia docente foi conferido novamente por lint e build, incluindo TypeScript.
- **36 verificações HTTP** passaram no servidor local temporário da porta 3008, encerrado ao final. Nenhuma conta real foi usada.
- Renderização estática confere todos os textos das 39 aulas, os 27 estudos, os 39 planos docentes, tabelas e âncoras das oito consultas teóricas. Também confere uma única etapa inicial e os registros na revisão.
- Os 24 Markdown conservaram todos os blocos de código, links e títulos existentes. Os destinos locais e fragmentos foram conferidos. Os dados musicais e os PDFs permanecem inalterados.
- **Limite:** nenhum navegador estava disponível na sessão. Layout em diferentes larguras, teclado e pausa ao trocar de etapa ainda precisam de conferência no navegador. Os registros visuais abaixo pertencem às revisões anteriores.

<details>
<summary>Prática ilustrada · 17/11/2026</summary>

## Prática ilustrada · 17/11/2026

- Cobertura dos 117 passos das 39 aulas e dos exemplos dos 27 estudos técnicos; instruções originais preservadas na leitura conjunta.
- Diagramas de acordes usam as posições existentes; todos os pontos dos mapas de notas foram conferidos por afinação, corda e casa. Recortes da cifra conservam durações, ordem e métrica.
- Testes específicos verificam p–i–m / a–m–i em 6/8, p–i–m–a / p–i–m–a em 4/4, 4/4 → 2/4 → 4/4 e entradas de Bm, G e A nos pulsos 1, 2 e 4.
- Apresentação docente reutiliza os diagramas selecionados; testes conferem conteúdo por etapa e IDs únicos. O grafo cliente não inclui os novos catálogos editoriais completos.
- `npm run check`: lint, tipos, 239 testes e build de produção aprovados. A primeira execução no sandbox bloqueou `spawnSync` no teste de configuração (`EPERM`); a execução autorizada fora do sandbox passou, sem alterar o teste.
- SVGs representativos de apoio, abafamento, escala e pestana foram renderizados com Sharp e inspecionados. O navegador não estava disponível na sessão: interação por teclado, layout responsivo e projeção da apresentação ainda precisam de conferência visual em navegador. A renderização estática dos 39 percursos passou nos testes de preservação e âncoras.
- Esta atualização abrange a aplicação. Os PDFs e materiais originais permanecem na edição anterior.

</details>

<details>
<summary>Histórico: conteúdo e código</summary>

## Verificação anterior

Verificação realizada em 15/11/2026. A edição permanece a mesma, identificada apenas pelo sufixo dos PDFs.

## Conteúdo e preservação

- Os 13 módulos e as 39 aulas conservam seus IDs, títulos, repertório, versões harmônicas, posições de acordes e andamento pesquisado.
- Os cinco arquivos de dados originais registrados em `src/content/content-preservation.json` conservam seus SHA-256. O mesmo registro identifica os hashes de origem e as 203 páginas do acervo incorporado aos dois PDFs atuais.
- Os 27 estudos completos estão integrados às aulas. `lesson-journey.json` define 86 aplicações: 27 introduções únicas e 59 retomadas, cada uma com foco específico.
- As 39 ampliações de aula, perguntas, exemplos, práticas semanais, critérios e planos docentes de 60 minutos permanecem disponíveis.
- A primeira pestana completa continua no módulo 5; palheta a partir do módulo 4, articulações a partir do módulo 8, expressão a partir do módulo 9 e CAGED a partir do módulo 10.
- Testes de renderização conferem cada campo dos 27 estudos, suas tablaturas e fontes, todos os textos originais e ampliados das 39 aulas, IDs únicos e âncoras válidas. A demonstração conserva seu escopo limitado.
- A apresentação docente mantém as sete etapas originais e as cinco ampliadas, acrescentando duas etapas por estudo da aula. As respostas ficam ocultas até revelação explícita.

## Código e produção

`npm run check` passou: ESLint, geração de tipos Next.js, TypeScript, **112 testes** e build de produção Next.js 16.4.6.

A execução inicial identificou os PDFs ainda em regeneração e a restrição do sandbox ao subprocesso do teste de configuração. Depois da publicação dos PDFs e com a permissão de processo necessária, a verificação completa passou. A configuração de segurança é testada com valores fictícios; nenhum segredo é impresso.

Um servidor exclusivo do build foi iniciado na porta 3008. `SMOKE_BASE_URL=http://127.0.0.1:3008 SMOKE_ORIGIN=http://localhost:3000 npm run test:http` passou em **38 verificações**: cabeçalhos, acesso anônimo negado, materiais novos e originais, origem de mutações e redirecionamentos. O servidor existente na porta 3000 não foi encerrado.

</details>

<details>
<summary>Histórico: navegação e livros</summary>

## Navegação e interface

A revisão usou uma cópia isolada na porta 3007, sem arquivos de ambiente do projeto, e autenticação fictícia local na porta 54398. O navegador bloqueou tráfego externo. Não foram usadas contas reais nem feitas alterações no Supabase remoto.

Cobertura efetivamente executada:

- **39 aulas visitadas**, incluindo todos os estudos associados, com **86 aplicações técnicas** verificadas contra o conteúdo canônico.
- **117 combinações de aula e largura**: 320, 768 e 1440 px. Seções foram expandidas para conferir o conteúdo completo, cifras, campos e tablaturas.
- **27 navegações** do índice/estudo para a aula de introdução: a âncora correta e todos os seus ancestrais se abriram automaticamente.
- Catálogo: busca por técnica, música e módulo; ausência de resultados; texto ampliado a 200% em 375 px; acesso a todas as aulas.
- Continuidade: primeira aula, próxima aula, aula em andamento mais recente, revisão após concluir as 39 e falha de carregamento sem inventar progresso.
- Aluno e professor: etapas entender/treinar/aplicar/revisar, resposta técnica condicionada a tentativa, foco após link profundo, ampliação a 200%, consultas, biblioteca, laboratório e repertório.
- Professor: apresentação integrada de M9-A3 com 18 etapas, resposta técnica oculta até ação explícita e fechamento por Escape. Aluno não recebe plano docente.
- Downloads finais conferidos por papel e SHA-256: aluno recebe seu livro e 403 para o manual; professor recebe ambos. Nomes continuam com `_v6.pdf`.
- Atalhos por teclado abrem a etapa e posicionam o foco. IDs únicos e ausência de exceções JavaScript foram verificados.

Foram encontrados e corrigidos dois problemas durante a visita: o número da aula encolhia no catálogo móvel; rótulos longos de compassos de Bondade de Deus alargavam a cifra a 320 px. Ambos foram revalidados. As bordas dos disclosures internos dos estudos foram reduzidas para facilitar a leitura. Cores, foco, espaçamento e tipografia continuam usando os tokens existentes.

A revisão adicional do console identificou a expansão nativa de `details` antes da hidratação nos links com fragmento. O tratamento foi limitado aos atributos dos disclosures envolvidos, preservando a verificação do conteúdo descendente. Links técnicos e legados foram conferidos novamente sem avisos de hidratação. No catálogo móvel, módulo e aula também passaram a ocupar uma linha própria para evitar um número isolado na quebra.

Capturas desktop e móveis de catálogo, estudos dentro da aula, revisão, apresentação e cifras foram inspecionadas. A revisão não equivale a certificação de acessibilidade, teste com leitor de tela ou dispositivos físicos. Detalhes da navegação estão em [Navegação da trilha](COURSE-NAVIGATION.md), e o contrato editorial em [Trilha integrada](INTEGRATED-LEARNING.md).

## Livros

O livro do aluno tem **371 páginas**: 241 principais e 130 do acervo original. O manual do professor tem **341 páginas**: 268 principais e 73 do acervo original.

Cada estudo completo aparece na primeira aula canônica; as retomadas trazem o foco e a página de referência. O índice técnico mantém os nove eixos. Todos os mapas, diagramas, consultas e páginas originais foram preservados. Os arquivos de `materials/` são utilizados diretamente pelos downloads.

As **509 páginas principais** foram renderizadas e revisadas visualmente; as **203 páginas originais** foram comparadas sem diferenças. Cobertura textual dos 27 estudos, 86 focos, referências de páginas, links internos, fontes e hashes foram conferidos. Registro completo em [Verificação dos PDFs](PDF-VERIFICATION.md).

</details>
