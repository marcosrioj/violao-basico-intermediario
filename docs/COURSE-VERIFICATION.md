# Verificação da atualização do curso

Verificação realizada em 15/11/2026.

## Conteúdo e preservação

- Os 13 módulos e as 39 aulas conservam seus IDs, repertório, versões harmônicas, posições de acordes e andamento pesquisado.
- Os oito arquivos legados registrados em `src/content/content-preservation.json` conservam seus SHA-256, incluindo os PDFs e o guia interativo originais.
- As 39 ampliações de aula têm exemplos próprios, prática guiada, pergunta de recuperação, quatro momentos flexíveis de revisão e critérios observáveis.
- Os 39 planos docentes somam 60 minutos cada. Os nove eixos oferecem 27 estudos, todos vinculados ao repertório e a fontes identificadas.
- Validação de pré-requisitos: primeira pestana completa no módulo 5, palheta a partir do módulo 4, articulações a partir do módulo 8, expressão a partir do módulo 9 e CAGED a partir do módulo 10.
- Testes conferem integridade dos PDFs, mapas de páginas, sincronização de conteúdo com os livros e alinhamento das seis linhas de tablatura.

## Código e produção

`npm run check` passou: ESLint, geração de tipos Next.js, TypeScript, **104 testes** e build de produção Next.js 16.4.6. A configuração de segurança inclui um subprocesso; a execução inicial dentro do sandbox restringiu esse subprocesso. A execução final com a permissão de processo necessária passou integralmente, usando valores fictícios nos testes.

O runner HTTP padrão encontrou a porta 3000 ocupada. Para evitar validar outro processo, foi iniciado um servidor próprio do build na porta 3008. O comando `SMOKE_BASE_URL=http://127.0.0.1:3008 SMOKE_ORIGIN=http://localhost:3000 npm run test:http` passou em **38 verificações**. Inclui páginas técnicas, metodologia docente e PDFs novos e originais; acesso anônimo negado, cabeçalhos, origem de mutações e redirecionamentos conferidos. O servidor existente não foi encerrado.

## Navegação e interface

Foi usada uma cópia isolada da aplicação na porta 3007, sem arquivos de ambiente do projeto, com serviço local de autenticação fictícia na porta 54398. O navegador bloqueou tráfego externo. Essa verificação não utilizou contas reais nem modificou o Supabase remoto.

**51 verificações registradas**, sem exceções de JavaScript:

- Visões de aluno e professor em curso, técnica, estudos, aulas e biblioteca; metodologia somente para professor.
- Larguras de 320, 768 e 1440 px, sem extravasamento horizontal da página; texto ampliado a 200% também conferido.
- Links de aplicação abrem o aprofundamento da aula e expandem o painel correto.
- A resposta de recuperação exige uma tentativa e é exibida por ação explícita.
- A apresentação docente oferece 12 etapas, preserva as sete originais, acrescenta o plano de quatro momentos e oculta respostas até a revelação; Escape encerra a apresentação.
- O estudo de 6/8 inicia o metrônomo com dois pulsos de semínima pontuada.
- Aluno recebe o PDF do aluno e recebe 403 ao solicitar o manual docente; professor recebe ambos.
- Não há rótulo de versão no nome do produto ou nas telas novas. O sufixo de versão fica nos nomes dos PDFs.

Capturas de estudo técnico, aula, metodologia, biblioteca e tela móvel foram inspecionadas. Essa revisão não equivale a auditoria integral com leitor de tela ou dispositivos físicos.

## Livros

O livro do aluno tem 351 páginas: 221 páginas principais e 130 páginas do acervo original. O manual do professor tem 310 páginas: 237 páginas principais e 73 páginas do acervo original. Os dois incluem todos os estudos técnicos, mapas e consultas. As cópias para download e entrega são idênticas.

Renderização, fontes, sobreposições, links internos, preservação de todas as páginas originais e hashes estão registrados em [Verificação dos PDFs](PDF-VERIFICATION.md). A fundamentação está em [Pesquisa musical](CURRICULUM-RESEARCH.md) e [Pesquisa pedagógica](TEACHING-RESEARCH.md).
