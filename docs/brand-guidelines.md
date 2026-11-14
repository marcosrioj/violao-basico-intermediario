# Identidade do Violão Vivo

O Violão Vivo acompanha alunos e professores do violão básico ao intermediário, com prática semanal, teoria aplicada e repertório gospel. A interface deve ajudar a entender a próxima ação, reconhecer o próprio progresso e praticar com calma.

## Voz e conteúdo

- Use português brasileiro, frases diretas e termos musicais explicados no contexto. Prefira “Confirme sua matrícula” a termos internos de autenticação ou banco de dados.
- Oriente sem infantilizar: “Pratique devagar e escute a mudança entre os acordes”. Evite promessas de domínio imediato e mensagens que culpem o aluno.
- Na área do professor, priorize turma, encontro, acompanhamento e devolutiva. Na área do aluno, priorize próxima aula, prática e orientação recebida.
- Separe conta e matrícula: criar uma conta não libera o curso. O professor cria a turma, entrega o código por um canal externo e o aluno confirma a matrícula no painel. A confirmação deve explicar o resultado e oferecer a próxima ação.
- Mantenha erros específicos e úteis, sem expor informações privadas. Carregamento, erro, sucesso e ausência de dados precisam de texto; cor ou ícone isolado não são suficientes.

## Identidade visual preservada

| Elemento        | Aplicação                                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| Nome            | **Violão Vivo**; assinatura curta “MÚSICA & PROPÓSITO”                                                          |
| Verde principal | `#2b6650`, ações e elementos musicais selecionados                                                              |
| Verde profundo  | `#173f34`, hero e painel editorial de autenticação                                                              |
| Creme           | `#efe9ce` e `#faf6e8`, acolhimento e matrícula                                                                  |
| Fundo           | `#f8f8f2`, com superfícies brancas e verdes suaves                                                              |
| Texto           | `#263b36`; secundário `#526258`, sem cinzas claros para instruções                                              |
| Acento          | `#954c33`, foco de teclado e destaques pontuais                                                                 |
| Tipografia      | Arial/Helvetica para leitura e operação; Georgia para títulos editoriais; monoespaçada para código de matrícula |
| Ícones          | Lucide já instalado; ícones acompanhados de texto ou nome acessível                                             |

A arte de violão existente é construída em CSS. Sua paleta de madeira e cordas fica nos tokens `illustration-*`, reservados à decoração. Esses valores não substituem as cores semânticas da interface. Não há fonte remota, imagem gerada, foto externa ou nova dependência para sustentar esta identidade.

## Hero e banners

O hero mantém título editável em HTML, uma mensagem principal, um único CTA para entrar e confirmar a matrícula e a ilustração decorativa de violão. Informações secundárias podem ser agrupadas abaixo do CTA. A arte perde destaque em telas pequenas para preservar a leitura. Evite texto rasterizado, altura rígida que corte conteúdo, vários botões primários e métricas de resultado sem evidência.

Avisos operacionais usam o mesmo vocabulário e os tokens de estado. A mensagem “Aguardando matrícula” descreve o estado real da conta e conduz ao formulário. Não representa uma autorização: a permissão é aplicada também no servidor e no banco.

## Consistência

Novas páginas devem reutilizar os tokens de [design-tokens.css](../assets/design-tokens.css), os componentes existentes e as regras do [sistema de design](DESIGN-SYSTEM.md). Preserve a legibilidade da teoria e da prática antes de adicionar decoração. Apresentações de aula devem usar o conteúdo real do curso, com uma ideia por tela e controles que o professor também possa operar pelo teclado.

As skills `brand`, `design` e `banner-design` orientaram voz, identidade, hierarquia e composição. As decisões preservam o produto existente; não foram criadas alternativas de marca nem peças de divulgação fora do escopo do aplicativo.
