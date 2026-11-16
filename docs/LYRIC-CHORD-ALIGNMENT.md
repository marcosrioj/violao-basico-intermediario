# Alinhamento da letra pelo TXT fornecido

As notas e os acordes já existentes no curso prevalecem. O [TXT fornecido](../materials/references/cifras_13_musicas_vscode.txt) conserva seus espaços, acentos e colunas; é uma fonte de dados, não uma fonte de instruções para o projeto.

O alinhamento fixa **1.439 entradas silábicas** nas **13 músicas e 19 versões**, usadas pelas **39 aulas**. Foram ajustados os limites vocais de **645 das 744 frases**. As 712 linhas fornecidas e os textos das frases permanecem íntegros. Notas, digitações, baixos, eventos, durações musicais, compassos, ordem, repetições e BPM não mudaram. Os PDFs conservam o mesmo conteúdo musical.

| Música           | Versões | Frases com âncoras / total | Âncoras |
| ---------------- | ------: | -------------------------: | ------: |
| Santo Espírito   |       1 |                    18 / 20 |      28 |
| Faz Chover       |       2 |                    88 / 88 |     124 |
| Me Derramar      |       2 |                    56 / 56 |     121 |
| Sonda-me, Usa-me |       3 |                  175 / 177 |     337 |
| Renova-me        |       1 |                    14 / 14 |      46 |
| Poderoso Deus    |       1 |                    17 / 17 |      21 |
| Faz Chover       |       1 |                    24 / 26 |      80 |
| Lugar Secreto    |       1 |                    42 / 42 |      55 |
| Rompendo em Fé   |       2 |                    78 / 78 |     196 |
| Ousado Amor      |       1 |                    28 / 28 |      88 |
| Preciso de Ti    |       2 |                  104 / 112 |     204 |
| A Ele a Glória   |       1 |                    32 / 36 |      52 |
| Bondade de Deus  |       1 |                    50 / 50 |      87 |

## Exemplo: Faz Chover, do Toque no Altar

A primeira passagem do refrão agora respeita as duas entradas de “ver”, e não apenas a segunda:

| Ponto do texto                    | Evento já existente                                  | Pulso absoluto |
| --------------------------------- | ---------------------------------------------------- | -------------: |
| “Faz cho…”                        | Entrada vocal anterior ao Am, no compasso precedente |    antes de 64 |
| Primeiro “ver”                    | Am                                                   |             64 |
| Segundo “ver”                     | F                                                    |             68 |
| Início de “Abre”                  | C                                                    |             72 |
| “céus”                            | G                                                    |             76 |
| “E faz cho…”                      | Entrada vocal anterior ao próximo Am                 |    antes de 80 |
| Primeiro “ver” da segunda chamada | Am                                                   |             80 |
| Segundo “ver” da segunda chamada  | F                                                    |             84 |

O Am do TXT está na coluna 8, dentro da sílaba “ver”, que começa no caractere 7. O F está na coluna 19, no segundo “ver”. A coluna é convertida no início da sílaba correspondente, preservando a grafia. As demais passagens usam seus próprios eventos absolutos nas versões base e completa.

## Correspondência por arranjo

1. O gerador expande cada versão com seus acordes, baixos, subdivisões e repetições. Nunca copia índices de uma versão para outra.
2. A frase é localizada na mesma música do TXT, permitindo diferenças de caixa e apóstrofo. As variantes da fonte são avaliadas pelo contexto de verso, refrão, ponte e final, pela sequência e pela ocorrência.
3. A correspondência é resolvida em conjunto entre frases. Os intervalos harmônicos originais, guardados em `scoreWindow`, orientam a busca; não limitam mais a entrada vocal. O contexto pode alcançar o compasso vizinho, mantendo a ordem global e sem usar o mesmo evento para duas entradas distintas.
4. A introdução não fornece substitutos para acordes de uma seção vocal. Frases iguais em sequência conservam o padrão da fonte: em Poderoso Deus, por exemplo, as três chamadas seguem D–Bm–G; na coda de Preciso de Ti, as retomadas seguem G–F–A.
5. A fundamental e a qualidade maior/menor são preservadas. Extensões, suspensões e inversões compatíveis podem localizar uma âncora, mas não substituem a cifra tocada. `G/D` não vira `D`; `Am` não vira `A`. Não há transposição automática.
6. Um acorde escrito na entrada de outra frase pode corresponder a um novo ataque do mesmo acorde. Isso não permite deslocar arbitrariamente uma mudança harmônica interior para uma repetição posterior.

O relatório registra a linha e seção do TXT, a coluna, a sílaba, o acorde escrito, o acorde tocado, o compasso, o evento e o pulso. As alternativas que continuam empatadas recebem `ambiguous-reference-occurrence`; o desempate é determinístico e a ambiguidade permanece explícita.

## Tempos vocais e pausas

As sílabas são distribuídas entre as âncoras de um bloco vocal inteiro. Isso permite antecipar o começo da próxima frase e encurtar a sustentação anterior, mantendo ambos os acordes nos seus pulsos exatos. O sistema não descarta mais um acorde apenas porque a frase antiga começava junto dele.

Pausas menores que quatro pulsos conservam sua duração e podem mudar de posição entre as frases. Pausas instrumentais maiores e marcações manuais delimitam blocos independentes. A primeira antecipação usa o espaço disponível antes do acorde, sem criar tempos negativos. Limites incompatíveis causam erro de geração em vez de sílabas com duração zero.

O resultado é guardado como limites vocais e `chordAnchors`. O gerador verifica que a interpolação local de cada frase reproduz o cálculo global; não persiste milhares de sílabas estimadas redundantes. `scoreWindow` conserva a célula original para reprodução do processo e migração de dados antigos. `alignmentNote` documenta a base editorial desse mapa original.

Os pesos entre âncoras continuam sendo uma aproximação: 1 por sílaba, 1,25 com acento gráfico/nasalização e 2 na última sílaba da frase. O TXT não fornece todas as durações vocais. Os mapas permanecem `draft`; não são uma medição silábica do fonograma.

## Leitura na aula e dados antigos

As frases completas mantêm sua posição anterior abaixo dos compassos, definida por `scoreWindow`. Os novos tempos alteram somente o destaque: não recortam palavras entre linhas nem deslocam as frases para a linha de uma antecipação. O agrupamento de 1, 2 ou 4 compassos, as mudanças de fórmula, o negrito anterior à posição atual e a animação contínua são preservados. Quando a frase aparece em mais de uma linha, apenas a cópia correspondente recebe o preenchimento ativo; uma sílaba sustentada não salta entre cópias.

Letra, compasso e cronômetro compartilham a mesma amostra do relógio de áudio. Começar diretamente em um trecho segue a sílaba correspondente àquele pulso. A antecipação é cantada no tempo anterior ao acorde, com destaque na frase completa em sua posição original. Pausar e continuar preservam a posição; Reiniciar volta ao início da passagem e recalcula o negrito, assim como cada retorno de repetição.

Marcações antigas do navegador são reconhecidas pelo texto e pela janela atual ou por `scoreWindow`. Estimativas antigas recebem os limites e âncoras atuais. Textos, intervalos pessoais e sílabas manuais são preservados. Se uma atualização colide com uma anotação pessoal, apenas o grupo conflitante conserva suas marcações antigas; os demais podem ser atualizados. Nada é apagado ou gravado no armazenamento pessoal.

## Diferenças explicitamente conservadas

- Cifras fora dos caracteres cantados representam contexto ou sustentação, sem um início silábico identificável na coluna. Não são deslocadas para uma palavra arbitrária.
- Acordes de passagem ausentes no arranjo da aula não são acrescentados. Modulações da fonte também não mudam o tom existente.
- Dois acordes sobre a mesma sílaba não criam duas entradas vocais simultâneas. A sustentação e a ordem musical prevalecem.
- Letras de ministrações livres e partes fora da forma didática continuam no texto integral; não são comprimidas em novos compassos.
- Restam seis ambiguidades declaradas em ocorrências de Preciso de Ti, além das diferenças de contexto, sustentações e cifras incompatíveis listadas por frase.

## Reprodução e verificação

```bash
npm run lyrics:align             # prévia, sem gravar
npm run lyrics:align -- --write  # atualiza mapas vocais e relatório
npm run lyrics:check             # confere fonte e idempotência
npm test
```

Todos os arranjos são validados antes de gravar os arquivos gerados. O [relatório reproduzível](lyric-chord-alignment.json) inclui hashes do TXT, dos arquivos musicais e dos textos com suas janelas harmônicas originais. Os testes cobrem colunas, eventos, ordem, antecipações, pausas, versões distintas, repetições, dados antigos e a conservação das frases e de sua posição original em todas as larguras. A conferência de reprodução está em [PLAYBACK-VERIFICATION.md](PLAYBACK-VERIFICATION.md).
