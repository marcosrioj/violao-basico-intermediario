# Verificação do acompanhamento das aulas

A revisão cobre **13 músicas, 19 versões de arranjo e 39 aulas**. A fonte harmônica é `src/content/course-data.json`; os andamentos pesquisados continuam separados em `tempo-research.json`. As letras fornecidas pelo usuário têm **712 linhas**, preservadas nos três arquivos `song-lyrics-*.json`, e **744 marcações iniciais** distribuídas entre as 19 versões. A conferência valida a execução dos arranjos de estudo existentes. Não equivale a uma transcrição temporal de cada gravação vinculada.

## Ordem, repetições e duração

Todas as seções têm IDs únicos, referências de `order` existentes e repetições inteiras positivas. Não há trechos órfãos. Expandir a ordem escrita produz os totais de compassos e pulsos registrados nas 39 aulas, sem descartar as ocorrências repetidas.

| Música                      | Versões                             | Compassos / pulsos por versão |
| --------------------------- | ----------------------------------- | ----------------------------- |
| Santo Espírito              | `base`                              | 46 / 184                      |
| Faz Chover — Toque no Altar | `base`; `completa`                  | 49 / 196; 109 / 436           |
| Me Derramar                 | `base`; `completa`                  | 42 / 84; 104 / 208            |
| Sonda-me, Usa-me            | `base`; `baixos_iniciais`; `baixos` | 83 / 332 em cada versão       |
| Renova-me                   | `base`                              | 72 / 288                      |
| Poderoso Deus               | `base`                              | 44 / 176                      |
| Faz Chover — Fernandinho    | `base`                              | 58 / 232                      |
| Lugar Secreto               | `setimas`                           | 69 / 276                      |
| Rompendo em Fé              | `base`; `harmonia_e_baixos`         | 72 / 288 em cada versão       |
| Ousado Amor                 | `base`                              | 113 / 226                     |
| Preciso de Ti               | `base`; `baixos`                    | 112 / 448 em cada versão      |
| A Ele a Glória              | `base`                              | 84 / 336                      |
| Bondade de Deus             | `base`                              | 84 / 330                      |

O tempo de uma execução é `pulsos × 60 / BPM`, usando o BPM atual sem arredondamento intermediário. Em 6/8, cada pulso é uma semínima pontuada; mudanças locais para 2/4 conservam o andamento e encurtam o compasso. A duração legada `lesson.duration_minutes` não acompanha mudanças do controle de andamento e não deve alimentar o cronômetro do player. Uma repetição de estudo ativada pelo usuário é um ciclo adicional, distinto das repetições finitas já escritas no arranjo.

## Frases sincronizadas

As frases aparecem automaticamente nas 39 aulas, com **Prévia silábica · tempos estimados** visível. Todas as versões estão como `draft`, pois as células e cadências documentadas dão um ponto de partida para o arranjo de estudo, sem comprovar o instante exato de cada entrada vocal. Cada marcação contém texto, pulso inicial e pulso final no arranjo expandido. Os limites de frase são explícitos. A prévia silábica usa uma distribuição estimada identificada como tal; marcas individuais conferidas podem substituí-la. Marcas fora da duração, sobrepostas ou com fim anterior ao início são rejeitadas. Intervalos sem marca mantêm a pausa de texto.

O acompanhamento e a leitura usam o mesmo relógio de áudio. As sílabas concluídas continuam em negrito somente na linha atual. Avançar para outra frase, linha de compassos ou linha quebrada na tela remove o destaque anterior; terminar a execução também limpa a última linha. Pausar preserva o destaque atual. Parar e Tocar daqui limpam as marcações; partes puladas ficam sem destaque. Cada retorno de uma repetição de estudo reinicia o preenchimento. O início real da passagem vem do transporte, incluindo ciclos perdidos entre quadros de animação. Pausar conserva a posição; retomar, saltar para uma passagem e repetir usam a posição musical correspondente. O metrônomo pode permanecer desligado. Ocorrências distintas do mesmo trecho não herdam automaticamente a mesma letra. No trecho isolado, a projeção usa a primeira ocorrência no arranjo completo e recorta os limites necessários.

As letras integrais fornecidas pelo usuário estão no catálogo público do curso, incluindo versos, falas e interjeições não executados nas formas abreviadas. `getLessonLyrics` mantém o catálogo no grafo de módulos do servidor e entrega somente os dados da música/versão da aula. O editor opcional aplica substituições pessoais no navegador, com exportação, importação e restauração das marcações do curso; essas substituições não são enviadas ao Supabase. Os PDFs não foram alterados por esta mudança do player.

O destaque usa um relógio compartilhado e atualiza apenas as linhas afetadas, sem renderizar a cifra inteira a cada quadro. A leitura fracionária independe do metrônomo e aguarda a entrada agendada do áudio. As cordas sintetizadas encerram no limite do acorde, inclusive em retomadas curtas. Essas correções evitam acumular atrasos do agendamento, mas não corrigem automaticamente marcações editoriais nem garantem latência zero em todo navegador, dispositivo de áudio ou conexão Bluetooth.

## Limites da conferência musical

Os arranjos são pedagógicos. Há abreviação de repetições e ministrações, regularização de durações e finais fixos. Por exemplo, Santo Espírito abrevia a forma e Ousado Amor fixa a ponte em quatro ciclos. Preservar esses dados não comprova que a forma seja idêntica à gravação externa.

A pesquisa mantém sete referências documentadas e seis estimadas. Cinco músicas registram andamento variável: Me Derramar, Sonda-me, Usa-me, Lugar Secreto, Rompendo em Fé e Preciso de Ti. A indicação de 68 → 71 BPM em Preciso de Ti não informa um mapa temporal verificável para automatizar a mudança. [Evidências e pendências de andamento](TEMPO-RESEARCH.md).

## Comparação com as gravações vinculadas

Nesta revisão, o HTML público do YouTube retornou `playabilityStatus.status = "OK"` e o campo `videoDetails.lengthSeconds` para os cinco vídeos abaixo. A duração é a do vídeo, em segundos inteiros, e pode incluir abertura ou encerramento. A coluna do arranjo é calculada pelos pulsos escritos **no BPM de referência**, sem rubato; não representa necessariamente o andamento inicial de cada aula. Somente Poderoso Deus, entre estes cinco títulos, adota essa referência como padrão.

| Gravação vinculada                                                            | Duração do vídeo | BPM de referência usado no cálculo | Duração do arranjo    | Diferença vídeo − arranjo |
| ----------------------------------------------------------------------------- | ---------------- | ---------------------------------- | --------------------- | ------------------------- |
| [Poderoso Deus — Antônio Cirilo](https://www.youtube.com/watch?v=TnKTUZfNafM) | 889 s · 14:49    | 62 por semínima, estimado          | 176 pulsos → 170,32 s | 718,68 s                  |
| [Faz Chover — Fernandinho](https://www.youtube.com/watch?v=SDzsBXMNlZY)       | 759 s · 12:39    | 72 por semínima, estimado          | 232 pulsos → 193,33 s | 565,67 s                  |
| [Lugar Secreto — Gabriela Rocha](https://www.youtube.com/watch?v=YnrN0o0lubM) | 423 s · 7:03     | 69 por semínima, documentado       | 276 pulsos → 240 s    | 183 s                     |
| [Rompendo em Fé — CEIZS](https://www.youtube.com/watch?v=5cUhcZ4jMrw)         | 353 s · 5:53     | 68 por semínima, documentado       | 288 pulsos → 254,12 s | 98,88 s                   |
| [Ousado Amor — Isaias Saad](https://www.youtube.com/watch?v=wSKKEAnLTDw)      | 337 s · 5:37     | 55 por semínima pontuada, estimado | 226 pulsos → 246,55 s | 90,45 s                   |

As diferenças são de forma e duração musical, não um pequeno atraso visual que possa ser corrigido deslocando todas as frases alguns milissegundos. A forma escrita de Lugar Secreto, por exemplo, executa quatro células de estrofe antes do primeiro refrão; a letra fornecida e a [cifra de referência](https://www.cifraclub.com.br/gabriela-rocha/lugar-secreto/) contêm oito frases de estrofe antes dele. Os trechos adicionais continuam visíveis na letra integral, sem serem comprimidos artificialmente na grade existente.

Ousado Amor e Lugar Secreto anunciaram faixas de legenda em português no HTML público, mas os URLs de legenda retornaram corpo vazio e a ação pública de transcrição retornou `400 / Precondition check failed`. Os outros três vídeos não anunciaram faixas de legenda nessa consulta. Não houve tentativa de contornar a restrição nem download das gravações integrais. Prévias licenciadas da Apple já disponíveis localmente têm cerca de 30 segundos e não informam o deslocamento do trecho dentro da faixa; não comprovam os limites vocais de toda a música.

Portanto, as letras estão preenchidas, mas **as entradas e saídas vocais exatas ainda não foram verificadas**. Para afirmar sincronização com cada gravação, é necessário um mapa completo de sua forma, mudanças de andamento e limites vocais, seguido de conferência auditiva. O estado `draft` deve permanecer enquanto essa evidência não existir.

## Validação

Passaram o lint, a checagem de tipos, os **131 testes** e o build de produção. As 38 verificações HTTP anteriores foram executadas contra um build identificado na porta 3014; não substituem a inspeção de áudio no navegador.

A suíte percorre todas as sílabas das 744 frases para conferir o acúmulo dentro de cada frase e a limpeza das frases anteriores nas 19 versões. Também cobre preservação das 712 linhas fornecidas (hashes de proveniência), presença das letras nas 39 aulas e 19 versões, intervalos silábicos, pausas, sustentação manual, repetição, projeção por seção e cancelamento da animação durante desmontagem. O preenchimento avança no mesmo relógio sem provocar uma renderização completa a cada quadro.

A revisão anterior abriu as 19 versões das 13 músicas no Chromium com contas fictícias locais. A correção de legibilidade foi conferida novamente com a frase de Ousado Amor reportada pelo usuário, em 320, 375, 768, 844 e 1440 px: cópia visível única, largura reservada sem colisão, negrito apenas na linha atual, limpeza da linha anterior, pausa, parada e preenchimento contínuo. Também foram verificados texto ampliado a 200%, movimento reduzido e cores forçadas. A evidência desta correção está em `/tmp/violao-line-qa/results.json` e nas capturas `clean-line-*.png`.

Esses testes não substituem a conferência dos instantes vocais das gravações; todas as versões editoriais continuam `draft`.
