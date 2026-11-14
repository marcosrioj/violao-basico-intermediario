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

### Cifra por trechos e contagem

`ChartSection` apresenta o arranjo completo, o trecho selecionado e o mapa de referências com a mesma estrutura. O arranjo mantém todas as passagens na ordem da música, com título, identificação e número da repetição. O mapa mantém uma única ocorrência de cada trecho e as âncoras `section-*`/`bar-*` usadas pelo conteúdo da aula.

Cada cartão contém um compasso inteiro. Os acordes ocupam uma largura proporcional à duração, e a contagem acompanha a fórmula: quatro pulsos em 4/4, três em 3/4, dois em 2/4 e `1 la li, 2 la li` para os dois pulsos compostos de 6/8. Durações fracionárias preservam suas subdivisões. Mudanças locais de fórmula, como 4/4 → 2/4 → 4/4, começam novas linhas.

As linhas agrupam até quatro compassos, sem misturar trechos. Esse agrupamento é uma escolha de leitura, não significa que a fórmula 4/4 exija quatro compassos por linha. Container queries usam o espaço real da cifra para apresentar uma, duas ou quatro colunas, preservando tamanho legível mesmo quando a aula tem uma coluna lateral. A página usa sua rolagem normal, sem recortar a cifra em uma pequena área com rolagem interna. Estilos ficam em `chart-player.css`, importado pelo layout raiz; regras musicais e ordem de reprodução ficam no helper puro `chart-layout.ts`.

A opção **Metrônomo**, ao lado de **Repetir**, começa desmarcada. Quando ativada, a reprodução acrescenta clique sonoro e destaque de um tempo/subdivisão por vez no compasso atual. O primeiro tempo recebe acento; as subdivisões têm volume menor. A grade do metrônomo é a mesma da cifra: 6/8 mantém dois pulsos compostos com seis subdivisões, sem multiplicar indevidamente o BPM. Acordes, cliques e indicação visual compartilham os mesmos instantes do `AudioContext`.

**Repetir** e **Metrônomo** podem mudar durante a execução sem interromper os acordes nem mover a posição. Desativar o clique cancela somente suas vozes; desativar a repetição deixa a passagem atual terminar e cancela os sons da volta seguinte que já estiverem agendados. **Pausar** guarda a posição dentro do compasso; **Continuar** retoma a harmonia pelo tempo restante. **Parar** volta ao início. Cada trecho tem **Tocar daqui**, inclusive as passagens repetidas: no arranjo completo, a reprodução segue a partir da ocorrência escolhida. No mapa, o botão inicia a primeira ocorrência disponível ou seleciona o trecho isolado.

Alterar o andamento ou o seletor de trecho interrompe e reinicia a posição. Ocultar a página pausa a execução; sair da aula cancela sons e temporizadores. `chart-transport.ts` mantém um único relógio, agenda os próximos 100 ms e recebe atualizações a cada 25 ms somente durante a execução. A indicação visual acompanha o instante atual, não a antecipação do áudio. Referências a vozes encerradas são liberadas durante a repetição. O destaque usa fundo e sublinhado, sem animação nem anúncios a cada tempo; a pausa mantém o compasso destacado com o texto **Pausado**.

As referências de andamento ficam ao lado dos controles, com botões separados para **Estudo da aula** e **Usar referência/estimativa**. A unidade musical aparece junto ao BPM; a precisão interna é preservada mesmo quando a tela arredonda para uma casa decimal. Gravação, fontes e limitações ficam em detalhes expansíveis. As três referências não resolvidas não oferecem preset. O diário mantém BPM inteiro aproximado e explica como registrar um andamento fracionário sem alterar o áudio. [Auditoria das 13 gravações](TEMPO-RESEARCH.md).

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

Nesta alteração, o catálogo foi conferido contra o CSS, as referências de variáveis foram verificadas e os pares de contraste acima foram calculados. Os estilos globais, dashboard e laboratório não contêm cores hexadecimais avulsas; cores ficam nos tokens. O registro de validação da entrega deve informar separadamente o build, os testes funcionais e as telas efetivamente inspecionadas, sem confundir estas verificações estáticas com QA visual completo.

Para próximas alterações, confira landing, login, matrícula pendente, matrícula concluída, painel do professor, curso, aula, teoria e materiais nas larguras 320, 768 e 1440 px. Verifique zoom a 200%, foco por teclado, mensagens de erro, nomes longos e scroll local das tabelas/instrumentos. Execute os checks já definidos no repositório; evite acrescentar testes que apenas repitam valores de CSS sem validar comportamento relevante.
