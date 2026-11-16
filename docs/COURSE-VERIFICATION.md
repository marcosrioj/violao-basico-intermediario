# Verificação da trilha integrada

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
