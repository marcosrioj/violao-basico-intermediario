# Captação do afinador: pesquisa e critérios de validação

Pesquisa consultada em 18/11/2026. Complementa [TUNER-RESEARCH.md](./TUNER-RESEARCH.md) com práticas de captação, sinais fracos e controle de leituras falsas. As referências fundamentam decisões; não certificam este produto nem transferem a ele a precisão anunciada pelos fabricantes.

## O que os equipamentos profissionais ensinam

| Evidência primária                                                                                                                                                                                                                                                                                                                                                                                       | Aplicação no laboratório                                                                                                                                                                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O [manual do Peterson iStroboSoft](https://www.petersontuners.com/media/pdf/iStroboSoft_UG.pdf), páginas 2–3, oferece reforço de entrada de 24 dB para sinais fracos e exige atenção ao medidor de saturação. Seu filtro ambiental leva 3–5 segundos e pede ausência de execução ou manuseio durante a amostragem. O fabricante considera esses recursos geralmente desnecessários em entradas de linha. | Dar controle explícito de sensibilidade e manter o diagnóstico de saturação antes dos filtros. Pedir que o músico abafe as cordas ao medir o ambiente. Nosso ajuste do limiar não reproduz o reforço nem o filtro espectral da Peterson.                    |
| A [FAQ do iStroboSoft](https://www.petersontuners.com/support/iStroboSoft) recomenda captação por vibração quando não é possível controlar o ruído ambiente. O [Korg CM-400](https://www.korg.com/us/products/tuners/cm_400/index.php) usa um captador piezoelétrico de contato para transmitir a vibração do instrumento ao afinador.                                                                   | Em ensaio ou sala ruidosa, orientar o uso de captador/interface compatível como alternativa ao microfone aberto. O CM-400 é exemplo da técnica, não uma promessa de compatibilidade direta com computador ou celular.                                       |
| O [manual BOSS TU-3](https://static.roland.com/assets/media/pdf/TU-3_M_eng01_W.pdf) orienta tocar uma nota por vez e distingue a indicação instantânea da confirmação de afinação estável pelo Accu-Pitch Sign.                                                                                                                                                                                          | Confirmar somente após novas leituras estáveis. Uma leitura antiga, o silêncio ou uma mudança de corda não podem completar o tempo de confirmação.                                                                                                          |
| O [guia oficial PolyTune 3](https://mediadl.musictribe.com/media/PLM/data/docs/P0CM0/POLYTUNE%203_QSG_EN.pdf) diferencia uma corda isolada de seu modo polifônico específico.                                                                                                                                                                                                                            | Manter explícito que este afinador lê uma corda por vez. Ter presets de seis ou sete cordas não transforma o detector em polifônico.                                                                                                                        |
| O [artigo original YIN](https://www.ee.columbia.edu/~dpwe/e6820/papers/deChevK02-yin.pdf) estima a fundamental pela repetição do sinal e reconhece diferentes formas de aperiodicidade. O [artigo MPM de McLeod e Wyvill](https://www.cs.otago.ac.nz/graphics/Geoff/tartini/papers/A_Smarter_Way_to_Find_Pitch.pdf) associa sua medida de clareza à presença de um tom em som monofônico.                | Combinar amplitude com periodicidade. Uma nota baixa pode ser utilizável; um sinal alto pode ser ruído. Clareza não é uma probabilidade de a corda estar correta. A validação em duas partes do quadro é uma decisão própria, não uma implementação de MPM. |
| A [MDN sobre constraints](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Constraints) distingue pedidos preferenciais de requisitos obrigatórios. [`getSettings()`](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/getSettings) informa a configuração efetiva da track.                                                                              | Solicitar áudio sem processamento de voz, usar a taxa efetiva do contexto e verificar o que a entrada reporta. Se o navegador mantiver processamento, informar isso sem impedir a tentativa de afinação.                                                    |

## Decisões de engenharia

### Sinal baixo sem amplificação artificial

O limiar anterior de RMS 0,0025 descartava qualquer sinal abaixo de aproximadamente −52 dBFS antes de avaliar sua utilidade. Os perfis passam a separar o piso de amplitude da exigência de periodicidade:

| Perfil           | RMS mínimo sem calibração | Aproximação em dBFS | Clareza mínima |
| ---------------- | ------------------------: | ------------------: | -------------: |
| Equilibrada      |                   0,00035 |               −69,1 |           0,90 |
| Sons suaves      |                   0,00008 |               −81,9 |           0,94 |
| Ambiente ruidoso |                     0,001 |               −60,0 |           0,96 |

Esses números são parâmetros do detector, não limites acústicos medidos. dBFS usa a amplitude digital como referência; não indica dB SPL, distância ou volume físico. Uma entrada com ganho baixo e outra distante podem apresentar o mesmo RMS com relações sinal/ruído diferentes.

O perfil Sons suaves aceita menor amplitude, mas exige maior periodicidade. Assim, ele não significa simplesmente “aceitar qualquer som”. Multiplicar todas as amostras por um ganho digital também multiplicaria o ruído e não recuperaria informação perdida na captação. Os valores precisam ser avaliados em sinais sintéticos e instrumentos reais; em situações difíceis, o perfil mais sensível pode continuar sem leitura.

### Dois caminhos de análise

A entrada alimenta um medidor bruto de nível/saturação e um caminho filtrado para estimar a nota. O caminho de afinação usa passa-altas de 30 Hz e passa-baixas de 2.000 Hz. Esses cortes são escolhas próprias para limitar interferência fora da região de interesse; não se atribuem aos fabricantes pesquisados.

É necessário conferir os extremos de 45–1.400 Hz e as notas graves do violão de sete cordas após os filtros. Eles atenuam frequências gradualmente, alteram a distribuição dos harmônicos e não isolam o violão de outro instrumento na mesma região. Não se aplica um corte fixo de 50/60 Hz: ele poderia afetar notas musicais próximas, incluindo o Si1.

A saturação deve ser observada antes do filtro, pois este pode reduzir picos sem desfazer a distorção já produzida na entrada. O nível filtrado serve à decisão de detecção; o nível bruto serve ao diagnóstico da captação. Nenhum deles recupera um sinal já recortado pelo microfone ou conversor.

### Medição opcional do ambiente

A ação explícita mede cerca de dois segundos de ambiente com as cordas abafadas. Um percentil dos níveis observados estima o piso, com rejeição de saturação e variações excessivas. O limiar resultante exige aproximadamente 6 dB acima desse piso, respeitando o mínimo do perfil. O piso e a nota devem ser medidos no mesmo caminho filtrado.

Este mecanismo ajusta quando uma leitura pode ser aceita. **Não remove frequências nem faz subtração espectral.** O nível total inclui nota e ruído; superar o piso em 6 dB não comprova uma relação sinal/ruído de 6 dB. Janelas de áudio sobrepostas também não são observações independentes.

A medição deve ser cancelável e removível, e precisa ser refeita após reiniciar ou trocar a entrada. O piso não deve ser aprendido continuamente enquanto o músico toca: o decaimento da própria corda poderia ser confundido com ruído. Uma nota sustentada durante toda a medição pode aparentar um ambiente estável e elevar indevidamente o limiar; a instrução de abafar as cordas continua necessária.

### Redundâncias com funções diferentes

1. **Amplitude:** rejeitar silêncio e sinais abaixo do piso selecionado ou medido.
2. **Periodicidade:** exigir estrutura tonal no YIN, comparar os períodos candidatos no mesmo trecho longo e conferir a consistência em duas partes do quadro. Refinar o período com o áudio já disponível reduz a oscilação sem acrescentar uma nova janela de espera.
3. **Histórico:** suavizar leituras próximas em cents, reiniciar a continuidade após saltos ou troca de perfil e retirar a nota assim que uma análise deixa de sustentá-la.
4. **Confirmação:** exigir 650 ms de novas leituras dentro da tolerância, sem aproveitar o tempo de uma leitura congelada.
5. **Diagnóstico:** tratar saturação, encerramento da entrada e processamento de voz reportado separadamente da nota.

Essas verificações são complementares, mas compartilham o mesmo sinal e podem compartilhar erros. Ruído tonal, outro instrumento sustentado ou relações harmônicas entre fontes podem satisfazer testes de periodicidade. Não se pode anunciar eliminação universal de ruído, identificação infalível de cordas, nem consenso entre algoritmos independentes. Na seleção manual, a oitava detectada deve continuar visível; não se desloca automaticamente a frequência para fazê-la coincidir com o alvo.

## Orientações ao músico e UX

Manter a ação principal e o medidor em destaque. Os perfis, a medição do ambiente e os detalhes da entrada pertencem aos ajustes de captação. Durante a medição, mostrar uma duração estimada breve e clara; ao terminar, mostrar o resultado ou a orientação para repetir. Não anunciar cada mudança do nível a leitores de tela.

A ajuda deve orientar a tocar uma corda por vez, abafar as demais e aproximar o instrumento de uma entrada desobstruída quando a leitura estiver fraca. Se a entrada saturar, reduzir o ganho ou afastar um pouco o microfone. Em ambiente ruidoso, diminuir fontes próximas de ruído ou usar uma entrada compatível por captador/interface. Não existe uma distância universal: cápsula, sala, instrumento e ganho mudam a captação. A [Taylor recomenda terminar o ajuste chegando à nota por baixo](https://blog.taylorguitars.com/how-to-tune-an-acoustic-guitar-for-beginners), aumentando gradualmente a tensão.

Preferências persistem; a medição do ambiente é temporária. Estados precisam de texto além da cor, controles com rótulos e foco visível, alvos de toque confortáveis e respeito à redução de movimento. A revisão pelas skills de interface verifica esses critérios; não é uma certificação metrológica ou aprovação dos fabricantes.

## Plano mensurável de aceitação

Esta seção descreve os ensaios previstos. Os resultados executados e as limitações estão registrados na seção seguinte.

| Ensaio                  | Medida e critério                                                                                                                                                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Notas estáveis          | Frequências conhecidas, desafinações positivas/negativas, três taxas de amostragem e todas as cordas; registrar o erro em cents e conferir ausência de erro de oitava.                                                                         |
| Sinais fracos           | RMS conhecido abaixo de 0,0025, inclusive próximo dos limiares dos perfis; confirmar que notas periódicas elegíveis são detectadas e que silêncio/ruído isolado não ganham uma nota por causa da sensibilidade.                                |
| Harmônicos e decaimento | Fundamental fraca, harmônicos fortes, ataque, envelope exponencial e fase inicial variada; conferir que a redundância não rejeita sistematicamente cordas graves ou o final útil da nota.                                                      |
| Ruído e transientes     | Ruído aleatório com semente fixa, interferência grave/aguda, picos isolados e mistura de notas; registrar rejeições e casos ambíguos, sem inferir garantia geral a partir de uma amostra.                                                      |
| Calibração ambiental    | Piso estável, silêncio, picos, saturação, cancelamento, remoção e reinício; verificar o limiar calculado e que notas tocadas durante a medição não recebem confirmação.                                                                        |
| Integração Web Audio    | Passar sinais por filtros reais do navegador; comparar o ramo bruto ao filtrado, incluindo extremos da faixa e sinal saturado antes do filtro.                                                                                                 |
| Estado e tempo          | Troca de nota, silêncio após uma nota quase confirmada, leitura congelada e troca de perfil; nenhuma confirmação pode aproveitar tempo sem leituras válidas.                                                                                   |
| Captação                | Permissão concedida/negada/tardia, dispositivo encerrado, troca de entrada e track com processamento reportado; verificar mensagens e encerramento de todas as tracks.                                                                         |
| Interface               | Teclado, leitor de tela, movimento reduzido e telas de 320 px ou maiores; sem transbordamento, controles acessíveis e leitura principal preservada.                                                                                            |
| Sessão acústica         | Violões de aço e náilon, microfone interno e interface, ambiente quieto e ruidoso, comparação com referência externa; registrar taxa de leituras úteis, erro, latência e falsos positivos. Pendente até existir ensaio com equipamento físico. |

A amostra digital sintética mede o cálculo e a integração, não a precisão acústica do conjunto. O próprio manual Peterson discute desvios do relógio de amostragem do dispositivo. Sem referência externa e ensaios físicos, não publicar uma especificação de precisão profissional em cents. A tolerância visual de ±1/±3 cents permanece um critério de confirmação, não essa especificação.

## Verificação executada · 18/11/2026

| Verificação             | Resultado                                                                                                                                                                                                                                                                                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`         | Lint, TypeScript, **300 testes** e build de produção passaram.                                                                                                                                                                                                                                                                                          |
| Detector                | **19 testes**: sinais de todas as cordas até −75 dBFS com boa relação sinal/ruído, harmônicos fortes, fundamental fraca, decaimento, ruído branco/colorido, transientes, clipping e mudanças de oitava. Taxas de 44,1 a 192 kHz; 16.384 amostras nas taxas acima de 96 kHz.                                                                             |
| Regressão com ruído     | Mi2 e Lá2, seno de amplitude 0,06 com ruído uniforme de amplitude 0,03 e filtragem determinística, em 44,1/48/96 kHz. Mais de 80% dos quadros aceitos, erro absoluto médio abaixo de 1,5 cent, percentil 95 abaixo de 3,5 cents e nenhum erro de oitava na amostra. Esses limites pertencem ao ensaio sintético.                                        |
| Captação e preferências | **10 testes** de sinal/calibração/histórico e **7 testes** de preferências/alvos. Incluem rejeição de medição saturada, troca de tamanho da janela de suavização e recuperação de preferências antigas.                                                                                                                                                 |
| `npm run test:tuner`    | **24 verificações** no Chromium passaram, usando Web Audio real com sinais sintéticos. Incluem Mi2 limpo em aproximadamente −75 dBFS, ruído isolado sem confirmação, Mi2/Lá2 com ruído, medição/cancelamento/rejeição do ambiente, saturação antes dos filtros, extremos de 45/1.400 Hz, Si1, troca externa de perfil e descarte de confirmação antiga. |
| Captura nativa          | `getUserMedia` real com dispositivo simulado do Chromium e WAV de Mi2 com harmônicos: nota confirmada, processamento reportado desativado e track encerrada ao parar. Negação/tardia concessão de permissão, desconexão e saída da página também foram verificadas.                                                                                     |
| Interface               | Inspeção visual em desktop e 320/375/768 px; sem transbordamento horizontal. Novos controles com pelo menos 44 px, seleção por teclado, foco visível e movimento reduzido. Preferência de sensibilidade persiste; medição ambiental não persiste. Nenhum erro de execução registrado no navegador.                                                      |

O caso de Lá2 interpretado como Lá1 sob ruído motivou a comparação dos candidatos no mesmo trecho longo, mantendo as proteções contra harmônicos dominantes. O refinamento final usa apenas o frame já disponível. Benchmark local, mediana de cinco rodadas de 240 frames: cerca de 1,00 ms em 48 kHz, 0,95 ms em 96 kHz e 1,07 ms em 192 kHz; aumento de aproximadamente 7–10% sobre o detector original. Isso não mede a latência total nem garante o mesmo desempenho em celulares.

A revisão com `ui-ux-pro-max` levou a preservar a corda fixada ao mudar a sensibilidade, evitar anúncios duplicados de calibração e adaptar a orientação quando Sons suaves já está selecionado. Os controles avançados continuam recolhidos por padrão. A validação de semântica acessível e teclado foi executada; uma sessão com leitor de tela real e os ensaios acústicos com instrumentos e microfones físicos permanecem pendentes.

Fontes dos ensaios: [`tuner-engine.test.ts`](../tests/tuner-engine.test.ts), [`tuner-signal.test.ts`](../tests/tuner-signal.test.ts), [`tuner-settings.test.ts`](../tests/tuner-settings.test.ts) e [`verify-tuner-browser.mjs`](../scripts/verify-tuner-browser.mjs). O teste de navegador requer app local e Playwright/Chromium disponíveis; aceita `TUNER_BASE_URL`, `PLAYWRIGHT_MODULE` e `CHROMIUM_EXECUTABLE`. Nenhum teste utiliza o microfone físico do usuário.
