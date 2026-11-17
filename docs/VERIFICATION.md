# Entrega e evidências de verificação

Histórico de entregas e verificações. As contagens e inspeções visuais pertencem a cada revisão. Para a reorganização atual, consulte a [verificação do curso](COURSE-VERIFICATION.md).

<details>
<summary>Biblioteca, aulas e documentação</summary>

Registro de **14 de novembro de 2026**. O projeto está na branch `main`. Este documento distingue o código entregue, os testes executados e as configurações que dependem de contas externas.

Os registros abaixo são históricos de versões e ambientes específicos. URLs e execuções do GitHub citadas como evidência pertencem à instância/repositório do mantenedor; não são valores para copiar em sua instalação. Para instalar do zero, siga o [README](../README.md) e [DEPLOYMENT.md](DEPLOYMENT.md). Para usar a instância compartilhada, veja [TEACHERS.md](TEACHERS.md).

## Biblioteca completa de acordes no laboratório

Lint, tipos, **99 testes** e build passaram. Os testes novos garantem cobertura exata das 52 posições sem duplicações, nota base válida, distinção de sustenidos/baixos e busca com acentos e posições. A verificação musical existente continua conferindo digitações e alturas do áudio.

No Chrome com backend sintético, foram conferidos os 52 diagramas, cinco grupos, filtros, busca, ausência de resultados, limpeza, reprodução por teclado, parada e cancelamento ao sair da oficina. Layout e alvos foram verificados em 320, 375, 768, 844 e 1440 px, além de texto a 200%, sem transbordamento ou exceções de página. Capturas de celular e desktop foram inspecionadas; não houve validação em aparelho físico/leitor de tela nem publicação.

## Cards recolhíveis na aula, trilha e repertório

Passaram lint, tipos, **97 testes** e build. O componente compartilhado começa fechado: somente título nos cards da aula; número, título e objetivo nos módulos; ícone, música e intérprete no repertório. A abertura mantém o conteúdo e os controles existentes. O contrato está em [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md#cards-recolhíveis).

No Chrome com backend sintético local, passaram **45 verificações**: páginas em 320, 375, 768, 844 × 390 e 1440 px, cards fechados/abertos, Enter/Espaço/Tab, foco visível, texto a 200%, movimento reduzido, filtro da trilha, plano do professor e componente nativo isolado sem JavaScript. A árvore de acessibilidade do Chrome expõe nome e estado de expansão. Atalhos da aula e uma referência interna da cifra abrem seus ancestrais. Recolher/reabrir preservou anotações, checklist, rascunho, cronômetro, BPM, metrônomo e reprodução/pausa; a aula seguinte começou fechada. Não houve erros de página/console nem gravações nas APIs durante esses testes.

Uma rodada adicional passou em **18 verificações**: todos os cards abertos nas cinco larguras, card vizinho permanecendo compacto, IDs sem duplicação e apresentação do professor com avanço, preservação da etapa ao recolher e retorno de foco ao encerrar. A área interna da cifra continua sendo a referência das container queries, e as dicas acompanham os cabeçalhos mesmo na coluna lateral. Após esses ajustes de CSS, as duas rodadas e o build foram executados novamente com sucesso.

As capturas de aula, trilha e repertório foram inspecionadas em celular e desktop. Não houve teste em aparelho físico ou leitor de tela, nem publicação nesta revisão.

## Documentação para instalações independentes

README e guia de instalação foram revisados para usar o Supabase e a origem de cada administrador. O endereço da instância compartilhada aparece como opção de uso gratuito e nos registros históricos, não nos exemplos de configuração. O guia do professor inclui cadastro prévio, solicitação por e-mail com identificação da conta e liberação administrativa.

Foram conferidos os comandos do projeto, nomes das três variáveis, ordem das duas migrations, SQL de promoção, caminhos de arquivos, links e âncoras Markdown. Prettier e `git diff --check` passaram. A revisão cobre Supabase hospedado/local, Vercel, Netlify e servidor Node; fontes oficiais estão no guia. Não foram criadas contas, enviado e-mail, executadas migrations remotas ou publicadas novas instâncias para esta alteração documental.

</details>

<details>
<summary>Oficinas, mobile e controles de áudio</summary>

## Oficinas de aprendizagem musical

A revisão passou em lint, tipos, **97 testes** e build. Oito testes novos cobrem afinação/posições e semitons, rodadas auditivas balanceadas, resumo sem inflação por revisão e análise de pulsos: início deslocado, velocidade, regularidade, pausas, toques duplicados e dados inválidos.

No Chrome com backend sintético local, passaram **24 verificações**: quatro oficinas em 320, 375, 768, 844 (paisagem) e 1440 px; seis posições no braço com erro/revelação sem acerto indevido; seis perguntas auditivas com tônicas diferentes e revisão preservando 5/6; reprodução de oito pulsos por Espaço/Enter com distinção de andamento e regularidade; cancelamento das vozes futuras ao trocar de oficina. Os alvos testados têm pelo menos 44 px; dicas couberam na tela e não houve exceções. A fonte a 200% revelou um rótulo largo, corrigido e revalidado. Capturas móveis foram inspecionadas. Links de aplicação e teoria foram conferidos com o conteúdo real do curso. A verificação adicional confirmou o contraste entre terças, bloqueio da resposta ao parar a primeira escuta antes do fim, liberação após ouvir o par completo e cancelamento ao ocultar a página.

A pesquisa consultou oito trabalhos primários, incluindo resultados nulos, em [LABORATORY-RESEARCH.md](LABORATORY-RESEARCH.md). Testes técnicos não demonstram eficácia pedagógica: a retenção e a aplicação no violão ainda dependem de observação com alunos/professor. Resultados da rodada não são persistidos nem alteram matrícula/progresso. Nenhum serviço, upload ou custo adicional foi introduzido. Alteração local, sem publicação nesta revisão.

## Revisão móvel e navegação compacta

Passaram lint, tipos, **89 testes** e build. No Chrome com backend sintético, a auditoria geral completou **37 verificações** em nove páginas/estados a 320, 375, 768 e 1440 px, sem transbordamento, erros de página ou controles do produto abaixo de 44 px. O menu passou em **16 combinações de página e viewport**, incluindo paisagem a 844 × 390: abertura, ciclo de foco, Escape, toque fora, retorno de foco, bloqueio/restauração da rolagem, navegação e fechamento ao ampliar para desktop. A barra fechada permaneceu com até 72 px de altura nos tamanhos testados.

O hero inicial e as sete etapas da apresentação foram conferidos em 320, 375, 844 e 1440 px. O teste com texto a 200% identificou e corrigiu refluxo do cabeçalho; a revisão final passou. Capturas de menu, trilha e aula foram inspecionadas visualmente. Skills e decisões estão registradas no sistema de design. Não houve teste em aparelho físico ou leitor de tela, nem publicação desta alteração.

## Estimativas adotadas como andamento padrão

Santo Espírito inicia em **71,5 BPM**, Faz Chover (Toque no Altar) em **67 BPM** e Poderoso Deus em **62 BPM**, por semínima. Os valores vêm das hipóteses já pesquisadas e permanecem classificados como estimados. O preset **Padrão da música**, a indicação da aula e o diário usam essa escolha; somente o diário arredonda para inteiro. O aviso de andamento não confirmado foi retirado das telas, e fontes e limitações ficaram na dica de andamento. A [auditoria musical](TEMPO-RESEARCH.md) registra a decisão e preserva as evidências anteriores.

Passaram lint, tipos, **89 testes** e build. Os testes cobrem os padrões em todas as aulas das três músicas, intervalo dos cliques, ausência de mudança nas demais músicas e fallback para referências ausentes, inválidas ou não resolvidas. Os dados importados da edição 5 permanecem preservados.

No Chrome com backend sintético local, passaram **20 verificações**: três padrões em 320, 375, 768 e 1440 px; ajuste e retorno ao padrão; intervalo real agendado no Web Audio; pausa/retomada; indicação e diário; conversão de Me Derramar; repertório sem aviso e sem transbordamento. A abertura de fontes revelou um painel que crescia para fora da tela; o `Hint` passou a observar mudanças de tamanho e reposicionar-se. A revisão confirmou fontes expandidas dentro da área visível, além de teclado, foco, fechamento, conteúdo longo e fallback sem Popover API. Não houve exceções de página. São verificações locais, sem publicação desta alteração em produção.

## Repetição por passagem e dicas de interface

Passaram lint, tipos, **88 testes**, build e **33 verificações HTTP** contra o build final. A revisão acrescenta nove testes determinísticos do transporte: marcação silenciosa, início na passagem escolhida, preservação do acorde atual, repetição de dois compassos, segunda ocorrência do refrão, saída após várias voltas, cancelamento da próxima volta já agendada, troca entre repetição local/global, pausa e mudanças de fórmula. Os dados musicais e as regras de matrícula/autorização não foram alterados.

No Chrome com dados sintéticos, cada passagem apresentou seu controle de repetição; marcar o Final didático não iniciou áudio, e Ouvir acordes produziu `F1 → F2 → F1`. Pausar/Continuar preservou a execução; desmarcar permitiu o encerramento normal. A segunda passagem do refrão iniciou o compasso de índice 36; marcar Repetir arranjo desmarcou a passagem. Abrir a ajuda durante a execução não pausou os acordes. Controles e cabeçalhos foram verificados em 320, 375, 768 e 1440 px, com alvos de pelo menos 44 px.

A auditoria geral executou **37 verificações** em nove páginas/estados, incluindo laboratório, teorias R4/R6, repertório, professor, materiais, painel com/sem matrícula e login. Não houve transbordamento da página, erros de hidratação ou exceções; as dicas couberam na tela e Escape restaurou o foco. Em R6, abrir uma dica preservou as sete vozes do áudio. O componente Hint também passou em testes de Enter, Tab, botão Fechar, clique fora, painel único, checkbox vizinho, texto longo e fallback sem Popover API. Explicações musicais, resultados, requisitos essenciais e mensagens de estado continuam visíveis; instruções operacionais foram migradas para ajuda contextual.

As capturas locais foram inspecionadas. A revisão visual levou a ajustes específicos nos rótulos das opções do player e no seletor de compasso do laboratório para evitar texto cortado. As verificações são locais e não representam uma nova publicação.

## Transporte contínuo e pesquisa de andamentos — revisão anterior

Passaram lint, tipos, **79 testes** e build. Também passaram **33 verificações HTTP** contra o build final na porta temporária 3004, usando a origem `http://localhost:3000` incorporada ao build local; páginas públicas, rotas protegidas, CSRF e retornos de autenticação mantiveram seus contratos sem sessão autenticada. Dez novos testes do transporte exercitam troca das opções sem interromper acordes, cancelamento apenas dos cliques, desligamento da repetição dentro da janela de antecipação, pausa dentro de um acorde fracionário, retomada pelo tempo restante, início na segunda ocorrência de um trecho, parada/desmontagem, atraso de temporizador sem rajadas, 6/8 e 2/4. Quatro testes da pesquisa verificam cobertura e procedência das 13 gravações, preservação das aulas, conversão exata de unidades, ausência de presets indevidos e duração dos compassos locais.

No Chrome com backend sintético local, alternar **Repetir/Metrônomo** manteve o mesmo compasso e as mesmas vozes dos acordes, sem chamadas adicionais de parada. **Pausar** congelou R1/tempo 2 e o áudio durante 900 ms; **Continuar** retomou a partir dessa posição. **Tocar daqui** no segundo refrão iniciou o índice 36 da forma completa, sem retornar à primeira ocorrência. O mapa permitiu mudar do trecho isolado A para Ponte e iniciar P1. Ocultar a página pausa; **Parar** reinicia a posição.

A referência de Me Derramar conserva internamente 56/1,5 pulsos por minuto: Web Audio registrou intervalos de 0,5357142857 s entre subdivisões e 1,6071428571 s entre pulsos. Ousado Amor apresenta 55 como estimativa; músicas pendentes não oferecem preset de gravação. O repertório apresenta as 13 pesquisas. O diário bloqueia 37,3 e permite registrar o inteiro aproximado 37. Capturas de celular/desktop foram inspecionadas; não houve overflow em 320, 375, 768 e 1440 px nem erros de página.

A [auditoria](TEMPO-RESEARCH.md) distingue **7 referências documentadas, 3 estimativas e 3 pendências**, sem afirmar BPM exato para toda gravação ao vivo. Os testes usam áudio sintético e instrumentação das chamadas Web Audio; não medem latência dos alto-falantes físicos nem sincronização automática com vídeos. Todas estas verificações são locais; não houve nova publicação na Vercel.

## Metrônomo opcional na cifra

Passaram lint, tipos, **65 testes** e build. Os seis testes novos de metrônomo verificam acentos, índices visuais, intervalos dos cliques, 4/4, 3/4, 2/4, 6/8, subdivisões fracionárias e alinhamento com os acordes em dois ciclos de todos os arranjos do corpus.

No Chrome com backend sintético local, a opção começou desmarcada, sem cliques ou tempos destacados. Ao ativá-la, houve um único tempo destacado por vez, seguindo `F1:1 → F1:2 → F1:3 → F1:4 → F2:1…` e retornando a `F1:1` ao repetir. A instrumentação das chamadas reais de Web Audio confirmou cliques de 1200/800 Hz em 4/4 e 1200/550/550/800/550/550 Hz em 6/8, nos instantes previstos pelo andamento. Após desativar a opção, nenhuma nova voz foi agendada e o marcador permaneceu apagado; trocar de trecho também limpou a posição. Capturas de desktop e celular foram inspecionadas, incluindo o destaque de `la`; controles não excederam a largura em 320, 375, 768 e 1440 px. Não houve exceções de página. Esta verificação não mede latência ou qualidade dos alto-falantes físicos e não representa publicação em produção.

## Cifra organizada por trechos

A revisão da cifra passou localmente em lint, tipos, **59 testes** e build. Os quatro testes novos verificam os arranjos de todo o corpus, preservando ordem, repetições, duração e índices de reprodução; cobrem também linhas interrompidas por mudanças de métrica, 3/4, 6/8 e durações fracionárias.

No navegador com backend sintético local, a aula M1-A1 manteve seis passagens e 46 compassos; foram verificados seleção de trecho, início/parada pelo seletor, indicação do compasso em reprodução, nomes dos refrãos repetidos, âncora `bar-R-2` abrindo o mapa e ausência de IDs duplicados. Aulas M3-A1 e M13-A1 confirmaram a contagem de 6/8 e o compasso local em 2/4. Foram inspecionadas capturas de celular e desktop; testes em 320, 375, 768, 1440 e 1920 px confirmaram ausência de overflow e adaptação de uma a quatro colunas conforme a largura real da cifra. Não houve exceções de página. Estas são verificações locais e não representam publicação na Vercel.

</details>

<details>
<summary>Matrícula e versões anteriores</summary>

## Matrícula obrigatória e refinamento da interface

A revisão de matrícula passou localmente em `npm run check`: ESLint, geração de tipos, TypeScript, **55 testes** e build Next.js de produção. Contra esse build, `npm run test:http` passou em **33 verificações**, incluindo negação de acesso anônimo a aulas, demonstração, teoria e laboratório, cabeçalhos privados, validação de origem e regressões dos callbacks de autenticação.

Os testes PostgreSQL/PGlite executaram as duas migrations reais. Confirmaram: cadastro e criação de turma não matriculam automaticamente; aluno não cria turma nem insere vínculo diretamente; código inválido não libera o curso; código válido cria matrícula; outro aluno não herda acesso nem lê registros; remover o último vínculo revoga leitura/escrita e preserva o histórico; uma nova matrícula válida permite retomá-lo. Erros na consulta de autorização bloqueiam a operação. Um teste do grafo de imports também impede o envio dos textos completos e planos docentes nos bundles de componentes clientes.

Em Chrome headless, uma cópia isolada do aplicativo foi ligada a um backend HTTP **sintético local**, sem credenciais ou registros reais. Foram verificados: redirecionamento anônimo, painel do aluno sem turma, mensagens de código ausente/incorreto, confirmação válida, acesso à trilha, saída da última turma, novo bloqueio e acesso do professor sem matrícula. A apresentação foi exercitada com setas, seletor de etapa, revelar/ocultar resposta e Escape com retorno do foco. Não houve exceções de página. Capturas da página inicial, matrícula móvel e apresentação foram inspecionadas visualmente; layout móvel de 375 px e aula de 320 px não alargaram a página.

Essa verificação de interface usa sessões sintéticas somente no ambiente temporário de teste; não existe login simulado no produto. Ela não comprova emissão de sessão, OAuth ou RLS no Supabase hospedado. Os testes SQL complementam a verificação visual, sem substituir a matriz com contas reais.

A revisão adicional cobriu o painel docente com dados carregados, laboratório e consulta R3 em 320 px, materiais/repertório/trilha em 768 px e apresentação aberta em 320 px. O metrônomo alternou para 6/8, iniciou e parou, e uma nota do braço respondeu ao clique. A página inicial também passou na verificação de largura após duplicar o tamanho-base do texto; isso verifica refluxo de texto, não equivale a testar todas as formas de zoom do navegador.

A captura em 320 px revelou diagramas compactos pequenos e quebra de rótulo no laboratório. A grade foi ajustada para preservar ao menos 164 px por card, com diagramas de 150 px, e o rótulo deixou de encolher. A última revisão confirmou esses tamanhos, ausência de overflow e o link de pular ao conteúdo oculto até receber foco por Tab. Os checks completos passaram novamente depois dos ajustes.

Os 141 tokens CSS/JSON foram conferidos, assim como as referências e os contrastes documentados no [sistema de design](DESIGN-SYSTEM.md). As sete skills solicitadas foram aplicadas à identidade, componentes, banners e apresentação das aulas; [brand-guidelines.md](brand-guidelines.md) registra a voz e a identidade preservadas. Não foi realizada auditoria integral com leitores de tela.

**Estado remoto:** o proprietário informou nesta sessão que aplicou `202611140002_course_enrollment.sql` no Supabase. Esta declaração foi registrada, mas não houve acesso administrativo para inspecionar o histórico remoto ou testar contas reais. O procedimento de aplicação, preservação do histórico e validação está em [DEPLOYMENT.md](DEPLOYMENT.md#atualizar-um-projeto-existente-para-exigir-matrícula). Os registros de entregas anteriores abaixo são históricos e não substituem esta verificação.

## Correção dos links de confirmação em produção

Após incorporar a versão remota `cda8fd9`, a correção de redirects passou localmente em `npm run check`: ESLint, TypeScript, **46 testes** e build Next.js. O smoke HTTP contra esse build passou em **32 verificações**, incluindo os três caminhos antigos de confirmação/recuperação. Os códigos usados nos testes são fictícios; os redirects foram inspecionados sem seguir o callback nem consumir códigos de usuários.

Cadastro e recuperação agora usam `/auth/callback`; links personalizados por `token_hash` continuam compatíveis. O relay de links antigos preserva a origem do navegador e remove parâmetros alheios ao fluxo. O teste HTTP também detectou e corrigiu o uso do hostname interno do servidor em `/auth/confirm`, com um `Location` relativo.

A inspeção pública confirmou que `https://violao-basico-intermediario-iota.vercel.app` responde e contém a origem correta no JavaScript. Um token deliberadamente inválido confirmou que o retorno padrão do Supabase ainda apontava ao domínio antigo no momento do diagnóstico. A correção administrativa de Site URL/Redirect URLs está descrita em [DEPLOYMENT.md](DEPLOYMENT.md); ela não é aplicada pelo código. O fluxo completo com e-mail real e sessão autenticada permanece pendente de validação após salvar essa configuração.

## Versão consolidada aprovada

O commit `c8402aa8c206d3e15122a03ea73e38a88f4f6304` passou na [execução 43609584947 do GitHub Actions](https://github.com/marcosrioj/violao-basico-intermediario/actions/runs/43609584947), com Node.js 22.23.4:

| Verificação                   | Resultado confirmado                                                     |
| ----------------------------- | ------------------------------------------------------------------------ |
| Instalação pelo lockfile      | `npm ci` concluído; audit informou zero vulnerabilidades naquele momento |
| ESLint                        | Aprovado                                                                 |
| Geração de tipos e TypeScript | Aprovados                                                                |
| Testes automatizados          | **42 passaram; zero falhas, cancelamentos ou testes ignorados**          |
| Build Next.js de produção     | Aprovado                                                                 |
| Smoke HTTP contra o build     | **29 verificações passaram**                                             |

A execução inclui os arquivos recuperados e os oito laboratórios teóricos. Os testes cobrem navegação e conteúdo, regras musicais, autenticação, configuração pública e isolamento em banco. O smoke confirma o comportamento sem sessão e sem Supabase configurado; não equivale a login real com contas hospedadas. Alterações posteriores exclusivamente neste relatório não alteram o código testado; cada novo commit continua acionando o mesmo workflow.

</details>

<details>
<summary>Evidências da implementação e navegador</summary>

## Evidência da implementação-base

A implementação-base `59908af087c441824e923054ae788b441e1de4fd` passou em instalação reproduzível, ESLint, geração de tipos, TypeScript, **14 testes** e build Next.js de produção. A execução foi confirmada no [GitHub Actions, run 43580731986](https://github.com/marcosrioj/violao-basico-intermediario/actions/runs/43580731986).

O relatório inicial também registra **29 verificações HTTP** locais, isolamento de usuários no PostgreSQL/PGlite, rastreamento dos PDFs na saída serverless e formatação. Essas contagens pertencem à implementação-base, não representam o total de testes acrescidos depois.

## Consolidação e regressões

A revisão acrescenta verificações para configuração pública segura, logout independente do perfil, recuperação de senha sem repetir uma alteração já confirmada, chaves React únicas, navegação da teoria demonstrativa, grafia diatônica de escalas e duração do áudio.

Antes da indisponibilidade do ambiente local, passaram os testes focados das correções de autenticação e das ferramentas musicais, além de tipos e lint dessas alterações. Os laboratórios teóricos ampliados foram integrados posteriormente por recuperação do código. O ambiente perdido não permitiu comparar byte a byte todos os arquivos recuperados nem repetir toda a suíte local.

A verificação autoritativa de cada commit consolidado está no [workflow Verificação](https://github.com/marcosrioj/violao-basico-intermediario/actions/workflows/ci.yml). Conferir o SHA da execução, seu resultado e os logs: eles registram a contagem efetivamente executada para aquela versão. A CI instala com `npm ci` e executa:

1. ESLint.
2. Geração de tipos de rotas e TypeScript.
3. Testes de conteúdo, domínio, ferramentas musicais, configuração, autenticação e RLS.
4. Build Next.js de produção.
5. Smoke HTTP contra uma instância desse build, iniciada e encerrada pelo wrapper.

O teste de RLS executa o SQL real da migration em PostgreSQL/PGlite com identidades sintéticas. A fronteira `auth.uid()` é emulada por sessão; isso não testa emissão/renovação de JWT, OAuth ou a configuração de um projeto Supabase hospedado. [Detalhes de segurança](VERIFICATION-security.md).

## Revisão no navegador

A interface foi inspecionada em navegador desktop durante a execução local. Foram observados:

- Tela inicial, demonstração da primeira aula e seus diagramas/arranjo.
- Acesso à consulta R1 da demonstração e retorno à ocorrência exata na aula.
- Navegação por âncora até “Tocar junto”.
- Seleção do refrão, repetição, início e parada do player.
- Metrônomo em 6/8 com dois pulsos e subdivisão ternária.
- Seleção de nota no braço e atualização da leitura correspondente.
- Desafio auditivo com resposta e explicação.
- Tela de login sem credenciais indicando a necessidade de configuração, sem simular uma conta.

A revisão encontrou e corrigiu chaves React duplicadas, navegação da consulta demonstrativa para login e o aviso de navegação com rolagem suave. A captura abaixo é da interface implementada, não um mockup:

![Tela inicial verificada em navegador desktop](assets/violao-vivo-home.jpg)

A revisão desktop não cobre auditoria integral WCAG, leitor de tela, zoom, dispositivos móveis ou tablets. A interação completa dos oito laboratórios ampliados não foi revalidada visualmente depois da recuperação. Os testes automatizados correspondentes cobrem suas regras musicais, mas não substituem essa inspeção.

</details>

<details>
<summary>Reproduzir os checks e configurar as contas</summary>

## Comandos reproduzíveis

```bash
npm ci
npm run check
npm run test:http:ci
```

`test:http:ci` requer o build gerado por `check`; inicia o Next em loopback, executa verificações sem contas e encerra o processo. `npm run test:http` permanece disponível para um servidor já iniciado. Nenhum desses testes cria um Supabase remoto ou uma conta de aluno.

## Configurações externas pendentes

1. Criar/selecionar Supabase Free e aplicar `supabase/migrations/202611140001_initial.sql`.
2. Habilitar Google OAuth e configurar Site URL e redirects. Para cadastro/recuperação por e-mail fora da equipe, configurar SMTP.
3. Cadastrar o professor e promover o papel pelo script administrativo.
4. Conectar o repositório à hospedagem elegível, cadastrar as três variáveis e definir `main` como branch de produção.
5. Manter o GitHub público, conforme a decisão atual do proprietário; credenciais e registros pessoais permanecem fora do repositório.
6. Executar a matriz real com duas contas de aluno e duas de professor após a configuração.

Essas pendências registram o estado da entrega inicial. Posteriormente, foi observada uma publicação em `https://violao-basico-intermediario-iota.vercel.app` com Supabase configurado. A verificação pública não comprova a aplicação integral das migrations, as configurações administrativas ou o isolamento de contas reais. Não foram contratados serviços pagos nesta sessão.

Após conectar as contas, verificar: login, renovação, recuperação e logout; aluno A conclui aula e retoma após novo login; aluno B não lê seus registros; professor correto vê progresso/diário e envia feedback; outro professor recebe negação; matrícula e saída atualizam acesso; agenda respeita fuso; aluno não baixa manual pela rota do app; vídeos carregam somente após clique; áudio para ao navegar; referências de teoria retornam ao trecho exato.

O passo a passo está em [DEPLOYMENT.md](DEPLOYMENT.md), incluindo publicação automática por commit e validação do SHA publicado.

</details>

<details>
<summary>Controles da cifra e referência de andamento</summary>

## Controles da cifra e referência como padrão

A cifra inicia no BPM de referência em todas as 39 aulas, com conversão exata para semínimas pontuadas em 6/8 e fallback para o BPM de estudo quando não há referência válida. O seletor Trecho ocupa metade da grade ampla ou toda a largura no celular. Mostrar letra controla a letra sincronizada e o texto integral; alternar sua visibilidade mantém reprodução, pausa e repetição por passagem. O único preset de andamento restaura a referência da música.

Passaram lint, tipos, **131 testes** e build. Os testes cobrem os padrões das 13 músicas em todas as aulas, conversões, referências inválidas e a execução das repetições. Os arquivos de conteúdo preservados e os PDFs mantiveram seus hashes.

No Chromium com dados fictícios locais, passaram **11 verificações**: três padrões representativos (incluindo 37,3 e 71,5 BPM), alteração e retorno exato à referência; controles e seletor em 320, 375, 768, 844 e 1440 px; visibilidade da letra durante reprodução e pausa; seleção e repetição por passagem. Nenhum erro de página ou console foi observado. Evidências locais em `/tmp/violao-controls-qa/results.json` e `controls-*.png`.

</details>
