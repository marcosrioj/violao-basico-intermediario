# Sistema de design do Violão Vivo

Este documento complementa a arquitetura e os padrões de engenharia existentes. A aplicação continua em Next.js, React, TypeScript e CSS próprio. O refinamento visual não introduz Tailwind, shadcn/ui, bibliotecas de animação ou fontes externas.

## Tokens e responsabilidades

[`assets/design-tokens.css`](../assets/design-tokens.css) é a fonte usada em execução, importada uma vez por `src/app/globals.css`. [`assets/design-tokens.json`](../assets/design-tokens.json) é seu catálogo de valores e referências em três camadas. O JSON documenta os tokens; não há etapa oculta de geração de CSS. Ao alterar um token, atualize os dois arquivos.

| Camada     | Exemplo                                                        | Regra                                                      |
| ---------- | -------------------------------------------------------------- | ---------------------------------------------------------- |
| Primitiva  | `--forest-700`, `--space-4`, `--font-size-base`                | Valores de cor, espaçamento, tamanho e movimento           |
| Semântica  | `--color-primary`, `--color-muted-foreground`                  | Papel na interface, referenciando primitivas               |
| Componente | `--button-bg`, `--input-border`, `--card-radius`, `--slide-bg` | Contrato reutilizável, referenciando as camadas anteriores |

Referências no JSON identificam a camada, como `{semantic.color-primary}`. Valores compostos, como sombras e padding, são descritos como expressões; o arquivo não é anunciado como um exportador universal de ferramentas de design.

Os aliases anteriores (`--green`, `--deep`, `--muted`, `--line` etc.) são preservados para compatibilidade. Para código novo, prefira os nomes semânticos. **`--color-muted` é um fundo claro; `--color-muted-foreground` é texto secundário.** Cores `illustration-*` pertencem apenas à ilustração decorativa de violão.

## Tipografia e composição

- Corpo e campos: 16 px (`1rem`). Texto auxiliar, rótulos, legendas e botões: pelo menos 14 px (`0.875rem`). Títulos usam tamanhos em `rem` ou `clamp()`.
- A fonte de leitura é Arial/Helvetica. Georgia destaca títulos editoriais do hero, matrícula e apresentações. Código de matrícula usa a pilha monoespaçada do sistema.
- A escala de espaçamento tem base de 4 px: `--space-1` a `--space-16`. Cards usam `--card-padding` responsivo. Raios e sombras têm nomes reutilizáveis.
- O conteúdo cresce com o texto. Grids usam `minmax(0, 1fr)`, itens permitem quebra e a navegação vira grade em telas pequenas. Tabelas e braços de violão extensos têm rolagem local; não devem alargar a página.
- Há ajustes para larguras pequenas, incluindo 320 px: passos de matrícula em uma coluna, estatísticas empilhadas, afinação em três colunas e graus musicais em três colunas. Esses pontos são critérios de verificação, não uma garantia automática de conformidade.

## Contratos dos componentes

| Componente    | Comportamento visual e interação                                                                                                                                                      |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Botão         | Alvo mínimo de 44 × 44 px; texto pode quebrar; estado desabilitado preserva nome; foco visível; variante primária para a ação principal                                               |
| Campo         | Rótulo persistente, texto de ajuda, fonte de 16 px, borda de contraste e `aria-invalid` com mensagem associada quando inválido                                                        |
| Card          | Superfície branca, borda discreta, raio e padding por tokens; tamanho não depende de altura fixa                                                                                      |
| Navegação     | Estado ativo e ícone/texto identificam o destino; itens bloqueados levam à matrícula e mostram cadeado, sem fingir autorização                                                        |
| Matrícula     | Três etapas: conta, convite do professor e confirmação; etapa atual destacada por borda e `aria-current`; código, envio, erro e confirmação agrupados                                 |
| Aula e teoria | Corpo legível, controles de áudio explícitos, notas/graus selecionados com fundo e texto contrastantes; feedback textual de acerto/revisão                                            |
| Apresentação  | Componente `LessonPresentation`, CSS `lesson-slides-*` isolado, tokens globais, conteúdo real da aula e navegação explícita; consultar também a documentação pedagógica do componente |

`.enrollment-steps` é compartilhada pela apresentação pública do processo e pelo painel: a landing usa três colunas quando há espaço; `.enrollment-panel` apresenta os mesmos passos verticalmente junto ao formulário. `.enrollment-success` usa texto de confirmação e ação para seguir ao curso. Alterar a aparência dessas classes não deve modificar a regra de acesso.

As ferramentas musicais continuam usando Web Audio e os componentes já existentes. O estilo preserva conteúdo, eventos e regras de progressão. Notas características têm borda de acento; notas selecionadas, fundo verde; respostas apresentam texto e estado visual.

### Cards recolhíveis

`CollapsibleCard` usa `details`/`summary` nativos, começa fechado e mantém o conteúdo montado. Nas aulas, o resumo mostra somente o título; na trilha, número, título e objetivo do módulo; no repertório, ícone, música e intérprete. Cada card abre independentemente pelo cabeçalho inteiro, por clique, Enter ou Espaço. A seta acompanha o estado nativo de expansão, sem substituir seu nome acessível.

O componente reutiliza os tokens de card, tipografia, cor, foco e movimento. O foco fica dentro da borda para não ser cortado; títulos quebram naturalmente; os alvos têm pelo menos 44 px e a preferência por movimento reduzido desativa as transições. O CSS é importado uma única vez no layout principal. Não coloque links, botões, campos ou dicas dentro do resumo: essas ações pertencem ao corpo expandido.

Recolher não apaga rascunhos, marcações ou configurações, nem pausa automaticamente o áudio ou o cronômetro. Seus controles continuam disponíveis ao reabrir. A navegação para outra aula inicia seus cards fechados. `HashReveal` abre os ancestrais de um destino, inclusive a cifra e suas referências internas, antes de rolar e focar; mantenha os IDs dos destinos nos elementos recolhíveis correspondentes.

Nesta revisão, `ui-ux-pro-max` orientou teclado, foco e responsividade; `design`, `brand`, `design-system` e `ui-styling` orientaram composição, consistência e reutilização. As skills `banner-design` e `slides` foram conferidas quanto ao escopo: o cabeçalho editorial mantém sua função e a apresentação continua dentro da condução do professor, sem novos banners ou slides. A busca local inicial sobre disclosure retornou um resultado de tipografia fora do foco; a busca refinada sobre navegação por teclado retornou diretrizes aplicáveis. As evidências estão em [VERIFICATION.md](VERIFICATION.md#cards-recolhíveis-na-aula-trilha-e-repertório).

### Ajuda contextual e controles

`Hint` (`src/components/ui/hint.tsx`) reúne explicações opcionais da interface em um botão de ajuda com alvo de 44 × 44 px. O contrato é `label`, `children` e `className` opcional. O rótulo identifica o assunto no nome acessível e no título do painel. Toque, clique ou teclado abrem a ajuda; Escape, clique fora e **Fechar ajuda** a dispensam. Escape e o botão de fechar devolvem o foco ao acionador. O painel não é modal e permite seguir para outros controles.

O conteúdo é renderizado em um portal, usa a camada superior do Popover API quando disponível e permanece dentro da área visível, inclusive ao redimensionar ou ampliar a página. Um `ResizeObserver` reposiciona o painel quando seu conteúdo ou acionador muda de tamanho, inclusive ao expandir fontes; observação e atualização pendente são canceladas ao fechar. Existe fechamento equivalente sem o Popover API. O invocador e o painel têm `data-ui-hint`, permitindo que ferramentas musicais ignorem esses cliques em handlers globais de áudio. Não colocar um `Hint` dentro de outro botão, `summary` ou `label`; use os agrupamentos `.label-with-hint` e `.control-with-hint` para mantê-lo ao lado do assunto.

Textos de teoria, prática, cifras e demais conteúdos do curso permanecem no corpo da página. Rótulos de campos, erros, confirmações e estado da atividade também continuam visíveis. A ajuda contextual serve para instruções sobre operar a interface, sem depender de hover ou do atributo `title`. [Referência: Popover API e acessibilidade](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API/Using).

Botões permitem quebra de linha, preservam contraste ao selecionar/pressionar e não simulam hover quando desabilitados. Checkboxes e radios mantêm controles nativos; `.checkbox-label` oferece toda a área de toque, destaca a seleção e apresenta foco visível. Campos têm fonte de 16 px, largura flexível e limites dentro do contêiner. Esses contratos são compartilhados por telas de aluno e professor, preservando os tokens de marca existentes.

### Cifra por trechos e contagem

`ChartSection` apresenta o arranjo completo, o trecho selecionado e o mapa de referências com a mesma estrutura. O arranjo mantém todas as passagens na ordem da música, com título, identificação e número da repetição. O mapa mantém uma única ocorrência de cada trecho e as âncoras `section-*`/`bar-*` usadas pelo conteúdo da aula.

Cada cartão contém um compasso inteiro. Os acordes ocupam uma largura proporcional à duração, e a contagem acompanha a fórmula: quatro pulsos em 4/4, três em 3/4, dois em 2/4 e `1 la li, 2 la li` para os dois pulsos compostos de 6/8. Durações fracionárias preservam suas subdivisões. Mudanças locais de fórmula, como 4/4 → 2/4 → 4/4, começam novas linhas.

As linhas agrupam até quatro compassos, sem misturar trechos. Esse agrupamento é uma escolha de leitura, não significa que a fórmula 4/4 exija quatro compassos por linha. Container queries usam o espaço real da cifra para apresentar uma, duas ou quatro colunas, preservando tamanho legível mesmo quando a aula tem uma coluna lateral. A página usa sua rolagem normal, sem recortar a cifra em uma pequena área com rolagem interna. Estilos ficam em `chart-player.css`, importado pelo layout raiz; regras musicais e ordem de reprodução ficam no helper puro `chart-layout.ts`.

A opção **Metrônomo**, ao lado de **Repetir**, começa desmarcada. Quando ativada, a reprodução acrescenta clique sonoro e destaque de um tempo/subdivisão por vez no compasso atual. O primeiro tempo recebe acento; as subdivisões têm volume menor. A grade do metrônomo é a mesma da cifra: 6/8 mantém dois pulsos compostos com seis subdivisões, sem multiplicar indevidamente o BPM. Acordes, cliques e indicação visual compartilham os mesmos instantes do `AudioContext`.

**Repetir** e **Metrônomo** podem mudar durante a execução sem interromper os acordes nem mover a posição. Desativar o clique cancela somente suas vozes; desativar a repetição deixa a passagem atual terminar e cancela os sons da volta seguinte que já estiverem agendados. **Pausar** guarda a posição dentro do compasso; **Continuar** retoma a harmonia pelo tempo restante. **Parar** volta ao início. Cada trecho tem **Tocar daqui**, inclusive as passagens repetidas: no arranjo completo, a reprodução segue a partir da ocorrência escolhida. No mapa, o botão inicia a primeira ocorrência disponível ou seleciona o trecho isolado.

Cada passagem também oferece **Repetir**, com área clicável, estado marcado e borda do trecho. Uma passagem repete por vez; **Repetir arranjo/seleção** é uma alternativa mutuamente exclusiva. Marcar o trecho atual preserva o acorde e a posição; marcar um trecho à frente mantém a sequência até alcançá-lo. Um trecho já passado aguarda um novo início. Sem áudio em execução, a marcação não inicia som e **Ouvir acordes** começa na passagem escolhida. Desmarcar durante uma volta segue para os próximos compassos sem cortar o acorde atual. **Tocar daqui** em outra passagem cancela a repetição anterior. Os limites usam índices absolutos de início/fim, preservando a segunda ocorrência de um refrão e as mudanças locais de fórmula.

Os controles do player agrupam seleção, andamento com barra e botões de ±1 BPM, opções e transporte. Em telas compactas, campos e grupos se reorganizam, rótulos podem quebrar e a área de toque permanece com pelo menos 44 px. Instruções sobre o uso dos controles e do mapa ficam em `Hint`; a contagem musical, unidade do pulso e estado atual continuam visíveis.

Alterar o andamento ou o seletor de trecho interrompe e reinicia a posição. Ocultar a página pausa a execução; sair da aula cancela sons e temporizadores. `chart-transport.ts` mantém um único relógio, agenda os próximos 100 ms e recebe atualizações a cada 25 ms somente durante a execução. A indicação visual acompanha o instante atual, não a antecipação do áudio. Referências a vozes encerradas são liberadas durante a repetição. O destaque usa fundo e sublinhado, sem animação nem anúncios a cada tempo; a pausa mantém o compasso destacado com o texto **Pausado**.

As referências de andamento ficam ao lado dos controles. Por padrão, o player mantém **Estudo da aula** e oferece **Usar referência/estimativa** como opção adicional. Há três exceções adotadas pelo responsável pelo curso: Santo Espírito a **71,5**, Faz Chover — Toque no Altar a **67** e Poderoso Deus a **62 BPM por semínima**. Suas referências usam `status: "estimated"` e o campo opcional `useAsDefault: true`; `defaultPlaybackBpm(studyBpm, tempo?)` aplica a referência convertida somente quando essa opção está ativa e o valor é válido. Sem a opção ou com referência inválida, retorna o andamento de estudo. O valor bruto `lesson.bpm` da edição 5 permanece preservado.

Nessas três músicas, o preset principal se chama **Padrão da música**, sem duplicar o mesmo valor em um botão de referência. Gravação, fontes, natureza estimada e limitações ficam em `Hint`, e o aviso **Andamento da gravação não confirmado** deixa de aparecer nas telas. A unidade musical continua junto ao BPM; a precisão interna é preservada mesmo quando a tela arredonda para uma casa decimal. A indicação da aula e o valor inicial do diário usam o mesmo padrão, arredondado para inteiro somente no diário. Nas demais músicas, as referências e os detalhes expansíveis existentes permanecem, incluindo as conversões de 6/8. O estado atual da [auditoria das 13 gravações](TEMPO-RESEARCH.md) é de sete referências documentadas e seis estimadas: adotar as três hipóteses como padrão é uma decisão de uso, sem confirmação adicional nem nova pesquisa.

## Acessibilidade e estados

O foco de teclado usa contorno de 3 px e separação clara do fundo. Campos de formulário têm pelo menos 44 px de altura. Checkboxes e radios usam rótulos clicáveis amplos; links dentro de frases seguem o fluxo de leitura. Não use `outline: none` sem substituto visível.

`prefers-reduced-motion` desliga animações e transições, incluindo pseudoelementos. Feedback de carregamento precisa continuar identificável por texto ou estado sem depender da rotação de um ícone. Vídeos e áudio devem continuar respeitando os controles explícitos já presentes.

Contrastes calculados pelas luminâncias relativas sRGB dos tokens:

| Uso                                  | Primeiro plano / fundo | Razão   |
| ------------------------------------ | ---------------------- | ------- |
| Texto principal                      | `#263b36` / `#ffffff`  | 11,92:1 |
| Texto secundário                     | `#526258` / `#ffffff`  | 6,47:1  |
| Texto secundário na matrícula        | `#526258` / `#faf6e8`  | 5,98:1  |
| Texto secundário sobre seleção suave | `#526258` / `#dfe8d9`  | 5,14:1  |
| Botão principal                      | `#ffffff` / `#2b6650`  | 6,73:1  |
| Título sobre verde profundo          | `#efe9ce` / `#173f34`  | 9,58:1  |
| Erro                                 | `#8a3527` / `#fbece7`  | 6,97:1  |
| Aviso                                | `#714a24` / `#f6edd9`  | 6,66:1  |
| Foco sobre branco                    | `#954c33` / `#ffffff`  | 6,25:1  |
| Borda de campo sobre branco          | `#7b8c7f` / `#ffffff`  | 3,56:1  |

Os pares de texto acima superam 4,5:1; a borda supera 3:1. Bordas decorativas de cards podem ser mais suaves. Essa análise de tokens não substitui inspeção de conteúdo renderizado, zoom, navegação por teclado ou leitor de tela e não constitui certificação de acessibilidade.

## Aplicação das skills

| Skill solicitada | Aplicação no projeto                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| `ui-ux-pro-max`  | Pesquisa local de sistema visual e recomendações Next.js; hierarquia, legibilidade, foco, estados e responsividade |
| `design`         | Coordenação da identidade existente, componentes, banner e apresentação sem criar uma segunda linguagem visual     |
| `brand`          | Voz, paleta, tipografia e contexto pedagógico em [brand-guidelines.md](brand-guidelines.md)                        |
| `design-system`  | Tokens em três camadas, catálogo JSON, contratos e manutenção                                                      |
| `ui-styling`     | Padrões acessíveis de campos, botões, foco e estados adaptados ao CSS existente; sem migração de stack             |
| `banner-design`  | Hero com mensagem principal, um CTA, texto editável e ilustração decorativa existente                              |
| `slides`         | Apresentação interativa de aula e plano do professor, com conteúdo segmentado e tokens compartilhados              |

A pesquisa `music education calm editorial` sugeriu uma direção genérica de wellness; a tentativa mais específica `education learning platform accessible` sugeriu estilo infantil. Nenhuma correspondia ao curso existente. As sugestões de cor/fonte foram descartadas; os princípios aplicáveis foram avaliados com os padrões de acessibilidade e a identidade verde/creme. Não foi adotada uma referência visual sem correspondência nem inserido um resultado de busca como requisito do produto.

As referências consultadas das skills incluem arquitetura de tokens, componentes acessíveis, consistência de marca e formatos/hierarquia de banners. A documentação local instalada do Next.js sobre CSS global orientou a importação única e a preservação da ordem da cascata.

## Verificação e manutenção

### Trilha com técnica integrada

O curso tem uma entrada principal de continuidade e um índice técnico complementar. As aulas usam quatro etapas estáveis: entender, treinar, aplicar e revisar. A primeira abre inicialmente; acordes, estudos completos, práticas adicionais, consultas e acervo continuam montados em disclosures nativos. Cada estudo apresenta título, indicação textual de começar/retomar e foco da aplicação antes de abrir o conteúdo. Isso reduz a exposição inicial sem remover texto ou depender somente de cores.

`HashReveal` expande todos os ancestrais de `/aulas/{id}#estudo-{id}`, rola até o alvo e transfere o foco. Os atalhos legados `#acordes`, `#tocar`, `#praticar` e `#aprofundar` permanecem válidos. Os inputs usam IDs únicos, e as respostas dos estudos continuam ocultas até uma tentativa e uma ação explícita. A cifra, o diário e o progresso permanecem vinculados à aula.

A navegação nativa por fragmentos pode abrir `details` antes da hidratação. `CollapsibleCard` e o disclosure de cada estudo aceitam essa diferença de atributos com `suppressHydrationWarning` somente no próprio elemento; títulos e corpo descendentes continuam sujeitos à verificação do React. Essa exceção segue o guia local do Next.js `preventing-flash-before-hydration.md` e foi verificada com recarga direta e console do navegador, incluindo âncoras legadas.

A revisão usou `ui-ux-pro-max`, sua referência geral de acessibilidade/interação/performance e os documentos locais do Next.js sobre componentes de servidor/cliente. A busca específica de progressive disclosure retornou orientação de tipografia sem correspondência; a escolha de seções expansíveis usa os padrões nativos existentes e o guia geral da skill, sem atribuir recomendação específica à busca. Cores, foco, tipografia e espaçamento reutilizam os tokens atuais. A evidência de navegação, larguras e preservação está em [verificação do curso](COURSE-VERIFICATION.md).

Nesta alteração, o catálogo foi conferido contra o CSS, as referências de variáveis foram verificadas e os pares de contraste acima foram calculados. Os estilos globais, dashboard e laboratório não contêm cores hexadecimais avulsas; cores ficam nos tokens. O registro de validação da entrega deve informar separadamente o build, os testes funcionais e as telas efetivamente inspecionadas, sem confundir estas verificações estáticas com QA visual completo.

Para próximas alterações, confira landing, login, matrícula pendente, matrícula concluída, painel do professor, curso, aula, teoria e materiais nas larguras 320, 768 e 1440 px. Verifique zoom a 200%, foco por teclado, mensagens de erro, nomes longos e scroll local das tabelas/instrumentos. Execute os checks já definidos no repositório; evite acrescentar testes que apenas repitam valores de CSS sem validar comportamento relevante.

## Navegação e controles móveis

Até 1000 px, a navegação usa uma barra compacta e um menu lateral sob demanda. O `MobileNavigation` recebe a mesma navegação renderizada no servidor que a sidebar desktop, preservando permissões, rótulos e página atual; os IDs de descrição são distintos. Um `dialog` nativo torna o fundo inerte. Tab/Shift+Tab circulam pelos links, Escape, botão Fechar, toque fora e seleção de destino encerram o menu. A rolagem do fundo é restaurada no fechamento/desmontagem; ampliar para desktop fecha o painel. O drawer tem rolagem própria e considera áreas seguras.

No celular, os campos têm fonte de 16 px, alvos de pelo menos 44 px, cards com menos recuo e ações de reprodução lado a lado quando cabem. Atalhos internos da aula rolam horizontalmente dentro de sua faixa, sem alargar a página. Cabeçalhos aceitam texto ampliado. A marca usa os mesmos tokens, tipografia e ícones existentes, sem nova dependência.

Revisão orientada por `ui-ux-pro-max`, `ui-styling`, `design-system`, `design` e `brand`; `banner-design` e `slides` foram consultadas para conferir a hierarquia do hero e a apresentação existente. A revisão inclui retrato, paisagem, teclado, conteúdo ampliado e retorno ao desktop. Não equivale a uma auditoria com leitor de tela ou dispositivos físicos.

## Oficinas do laboratório musical

O laboratório apresenta quatro escolhas com estado `aria-pressed`: ritmo, escuta, notas e prática livre. Cada escolha monta somente sua oficina; a troca encerra áudio e estado transitório. A interface não usa persistência local compartilhada nem gera conclusão de aula. As quatro escolhas permanecem acessíveis por toque/teclado, reorganizando-se no celular e com fonte ampliada. Explicações operacionais ficam em Hint; conteúdo musical, feedback e aplicação no violão permanecem visíveis.

O treino auditivo oferece seis perguntas balanceadas e tônicas distintas. A primeira resposta só é liberada após ouvir o par completo; comparar e revisar não altera o resultado inicial. O treino de notas oculta as posições antes da tentativa, inclusive nos nomes acessíveis; revelar não gera acerto de primeira tentativa. O treino de pulso ancora a medição no primeiro toque e separa regularidade de velocidade. Suas margens são escolhas editoriais documentadas, não um instrumento de avaliação validado. A aplicação nas aulas usa links e conceitos reais do curso. [Pesquisa e limites](LABORATORY-RESEARCH.md).

### Biblioteca de acordes do laboratório

Em “Praticar livremente”, `ChordLibrary` reúne todas as 52 posições do catálogo instrumental, sem importar textos de aulas no cliente. Cinco grupos seguem a progressão: primeiras formas, pestanas/posições, sétimas, suspensões/nonas e baixos alternativos. O primeiro abre inicialmente; filtros abrem os grupos encontrados. Busca aceita cifra, nome da nota e posição; o filtro usa a nota base antes da barra, distinguindo C de C#.

Diagramas, notas por corda e dicas vêm da fonte existente. Um único controle de áudio cancela o acorde anterior, para ao filtrar, sair da oficina ou ocultar a página e oferece “Parar som”. Ajuda operacional fica em `Hint`; a explicação musical permanece visível. `ui-ux-pro-max`, `ui-styling` e `design-system` orientaram teclado, alvos de 44 px, agrupamento e grade responsiva, preservando a identidade existente.
