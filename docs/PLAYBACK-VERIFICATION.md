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

As frases aparecem automaticamente nas 39 aulas. Todas as versões estão como `draft`, pois as células e cadências documentadas dão um ponto de partida para o arranjo de estudo, sem comprovar o instante exato de cada entrada vocal. Cada marcação contém texto, pulso inicial e pulso final no arranjo expandido. Os limites de frase são explícitos. O TXT fornecido posteriormente permitiu fixar 928 inícios silábicos em eventos harmônicos existentes, sem alterar notas ou durações do acompanhamento. Entre essas âncoras, a divisão temporal continua estimada; marcas individuais conferidas podem substituí-la. O [relatório de alinhamento pelo TXT](LYRIC-CHORD-ALIGNMENT.md) descreve as correspondências e as divergências preservadas. Marcas fora da duração, sobrepostas ou com fim anterior ao início são rejeitadas. Intervalos sem marca mantêm a pausa de texto.

O acompanhamento e a leitura usam o mesmo relógio de áudio. Todas as sílabas anteriores à posição atual ficam em negrito, inclusive ao começar em um trecho posterior. Pausar conserva a posição e o destaque; o término natural mantém o prefixo completo. Voltar ou repetir recalcula as marcas pela nova posição, sem depender de um histórico de passagens. Cópias da frase junto a compassos futuros não recebem destaque antes da posição atual alcançá-los. As quebras de 1/2/4 compassos por linha e por mudança de fórmula são preservadas.

A sequência do transporte permanece completa. Cada passagem oferece Tocar daqui quando inativa, Pausar quando está tocando e Continuar quando pausada. Continuar retoma o tempo restante do acorde. O final de uma passagem leva automaticamente à próxima, incluindo ocorrências repetidas escritas. Repetir mantém a passagem escolhida em ciclo até ser desmarcado. O seletor Ir para o trecho interrompe a reprodução e navega até a primeira ocorrência, sem substituir os dados por um trecho isolado. O mapa resolve suas ações contra as ocorrências da sequência completa.

As letras integrais fornecidas pelo usuário estão no catálogo público do curso, incluindo versos, falas e interjeições não executados nas formas abreviadas. `getLessonLyrics` mantém o catálogo no grafo de módulos do servidor e entrega somente os dados da música/versão da aula. A aplicação ainda lê substituições pessoais salvas anteriormente no navegador; não há editor na interface nem envio desses dados ao Supabase. Os PDFs não foram alterados por esta mudança do player.

O destaque usa um relógio compartilhado e atualiza apenas as linhas afetadas, sem renderizar a cifra inteira a cada quadro. A leitura fracionária independe do metrônomo e aguarda a entrada agendada do áudio. As cordas sintetizadas encerram no limite do acorde, inclusive em retomadas curtas. Essas correções evitam acumular atrasos do agendamento, mas não corrigem automaticamente marcações editoriais nem garantem latência zero em todo navegador, dispositivo de áudio ou conexão Bluetooth.

## Limites da conferência musical

Os arranjos são pedagógicos. Há abreviação de repetições e ministrações, regularização de durações e finais fixos. Por exemplo, Santo Espírito abrevia a forma e Ousado Amor fixa a ponte em quatro ciclos. Preservar esses dados não comprova que a forma seja idêntica à gravação externa.

A pesquisa mantém sete referências documentadas e seis estimadas. Cinco músicas registram andamento variável: Me Derramar, Sonda-me, Usa-me, Lugar Secreto, Rompendo em Fé e Preciso de Ti. A indicação de 68 → 71 BPM em Preciso de Ti não informa um mapa temporal verificável para automatizar a mudança. [Evidências e pendências de andamento](TEMPO-RESEARCH.md).

## Comparação com as gravações vinculadas

Nesta revisão, o HTML público do YouTube retornou `playabilityStatus.status = "OK"` e o campo `videoDetails.lengthSeconds` para os cinco vídeos abaixo. A duração é a do vídeo, em segundos inteiros, e pode incluir abertura ou encerramento. A coluna do arranjo é calculada pelos pulsos escritos **no BPM de referência**, sem rubato. Esses BPMs de referência agora são o padrão inicial das aulas; o controle manual pode alterar a duração exibida.

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

A validação abrange o lint, a checagem de tipos, testes de transporte, letra, alinhamento e layout e o build de produção. A suíte geral também verifica a presença e integridade dos materiais originais e das cópias dos PDFs; esses artefatos precisam estar presentes para as verificações de preservação passarem. As 38 verificações HTTP anteriores foram executadas contra um build identificado na porta 3014; não substituem a inspeção de áudio no navegador.

A suíte percorre todas as sílabas das 744 frases para conferir o prefixo em negrito conforme a posição atual, inclusive após saltos e repetições, sem antecipar o destaque de compassos futuros nas 19 versões. Também cobre preservação das 712 linhas fornecidas (hashes de proveniência), presença das letras nas 39 aulas e 19 versões, intervalos silábicos, pausas, sustentação manual, repetição, projeção por seção e cancelamento da animação durante desmontagem. O preenchimento avança no mesmo relógio sem provocar uma renderização completa a cada quadro.

A revisão anterior abriu as 19 versões das 13 músicas no Chromium com contas fictícias locais. Os testes atuais do relógio cobrem as 744 frases e a mudança de posição ao pausar, iniciar adiante ou repetir; os testes de layout preservam a sequência e as quebras, inclusive 4/4 → 2/4 → 4/4. Os controles contextuais têm testes de rótulos por ocorrência e preservação da mesma grade nos estados Tocar daqui/Pausar/Continuar. As 13 verificações no Chromium em `/tmp/violao-passage-controls-qa/results.json` cobrem remoção dos botões principais, início adiante, prefixo em negrito, transição automática, pausa/retomada pelo mapa, navegação sem recorte, repetição e saída do ciclo, fim natural, larguras de 320/375/768/1440 px e texto ampliado a 200%. Os cinco testes de controles, os seis do relógio e os quatro de layout passaram, assim como lint, tipos e build.

O ajuste pelo TXT tem 16 testes: integridade da fonte e dos dados musicais, proveniência das 928 âncoras, correspondência com os eventos existentes, interpolação, anacruse, sustentações e projeção por trecho. No Chromium, Ousado Amor foi conferida em 120 BPM/1440 px e 80 BPM/375 px, incluindo pausa, seleção de trecho e repetição. O destaque silábico e a pintura do compasso são publicados em quadros distintos; o teste aguarda a atualização visual sem tratá-la como um novo instante de áudio. Evidências locais: `/tmp/violao-anchor-qa/results.json` e capturas `anchors-*.png`.

Esses testes não substituem a conferência dos instantes vocais das gravações; todas as versões editoriais continuam `draft`.
