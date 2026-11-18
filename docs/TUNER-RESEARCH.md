# Afinador do laboratório: pesquisa e decisões

Pesquisa consultada em 18 de novembro de 2026. Este documento fundamenta a oficina **Afinar o violão** e registra a estratégia e os resultados de validação. Não é uma certificação de precisão acústica.

A evolução de captação, sinais fracos, filtros e redundâncias está em [TUNER-SIGNAL-RESEARCH.md](TUNER-SIGNAL-RESEARCH.md), com fontes adicionais e a validação mais recente. Os resultados abaixo documentam a primeira versão.

## Necessidades e aplicação

| Necessidade                                    | Evidência primária                                                                                                                                                                                                                                                                                       | Decisão para o laboratório                                                                                                                                                                                            |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identificar rapidamente o ajuste necessário    | O BOSS TU-3 combina leitura em cents, modos cromático e por instrumento e confirmação de afinação estável. [Produto](https://www.boss.info/GLOBAL/products/tu-3/) e [manual](https://static.roland.com/assets/media/pdf/TU-3_M_eng01_W.pdf).                                                             | Nota com oitava, desvio com sinal, medidor central e instruções textuais para subir ou baixar a afinação. Cor acompanha o texto; não é a única informação.                                                            |
| Afinar uma corda conhecida sem perder o alvo   | O [manual Guided Tuning da Peterson](https://www.petersontuners.com/media/pdf/Guided%20Tuning%20Manual.pdf) identifica cordas em afinações predefinidas e orienta tocar a corda solta, sem harmônico.                                                                                                    | Seleção automática ou manual da corda, além do modo cromático. Mostrar o alvo e a nota realmente detectada, inclusive sua oitava.                                                                                     |
| Adaptar a referência ao conjunto ou à gravação | O TU-3 usa Lá4 = 440 Hz por padrão, permite 436–445 Hz e conserva a configuração. [Suporte BOSS/Roland](https://support.roland.com/hc/en-us/articles/210199373-TU-3-How-to-Change-the-Reference-Pitch).                                                                                                  | Lá4 ajustável de 400 a 480 Hz, padrão 440 Hz e preferências persistidas. Essa faixa ampliada é uma escolha do produto, não uma especificação herdada da BOSS nem uma recomendação de alterar a tensão do instrumento. |
| Trabalhar com repertórios em outras afinações  | [Fender: afinações alternativas](https://www.fender.com/articles/setup/alternate-guitar-tuning), [Fender: Open D](https://www.fender.com/articles/setup/open-d-tuning) e [Yamaha: afinações alteradas](https://hub.yamaha.com/guitars/g-how-to/altered-tunings-part-1/) apresentam usos e configurações. | Presets padrão, Drop D, DADGAD, Open D, Open G, meio tom abaixo e um tom abaixo. As notas e oitavas ficam explícitas.                                                                                                 |
| Atender ao violão brasileiro de sete cordas    | Os [anais da ANPPOM](https://anppom.org.br/anais/anaiscongresso_anppom_2025/papers/116.pdf) descrevem a sétima em Dó; a [pesquisa da UDESC](https://sistemabu.udesc.br/pergamumweb/vinculos/00002e/00002e1c.pdf) registra alternativas em Si e Lá.                                                       | Presets com sétima em Dó2 ou Si1, preservando as outras seis cordas.                                                                                                                                                  |
| Conferir a afinação com capotraste             | O [guia oficial PolyTune Clip](https://cdn.mediavalet.com/aunsw/musictribe/D02szAmYN0qFbKfldukZzQ/cra651UxhkSYbPAZ-d46Zg/Original/POLYTUNE%20CLIP_QSG_EN.pdf) inclui modos com capo.                                                                                                                     | Casas 0–7: transpor os alvos um semitom por casa para medir com o capotraste já colocado. Não orientar o usuário a tensionar cordas soltas até essas notas.                                                           |

### Notas dos presets

Ordem da corda mais grave para a mais aguda; referência em temperamento igual. A frequência de cada alvo acompanha o Lá4 selecionado.

| Preset          | Notas sem capotraste              |
| --------------- | --------------------------------- |
| Padrão          | E2 · A2 · D3 · G3 · B3 · E4       |
| Drop D          | D2 · A2 · D3 · G3 · B3 · E4       |
| DADGAD          | D2 · A2 · D3 · G3 · A3 · D4       |
| Open D          | D2 · A2 · D3 · F♯3 · A3 · D4      |
| Open G          | D2 · G2 · D3 · G3 · B3 · D4       |
| Meio tom abaixo | E♭2 · A♭2 · D♭3 · G♭3 · B♭3 · E♭4 |
| Um tom abaixo   | D2 · G2 · C3 · F3 · A3 · D4       |
| 7 cordas — Dó   | C2 · E2 · A2 · D3 · G3 · B3 · E4  |
| 7 cordas — Si   | B1 · E2 · A2 · D3 · G3 · B3 · E4  |

## Detecção e experiência de uso

O [artigo original do YIN, de de Cheveigné e Kawahara](https://www.ee.columbia.edu/~dpwe/e6820/papers/deChevK02-yin.pdf), fundamenta a estimativa da frequência fundamental por periodicidade. A escolha de YIN com interpolação evita depender apenas do maior pico espectral, que pode corresponder a um harmônico. Isso não elimina todos os erros de oitava ou de ruído.

As decisões seguintes são de engenharia e precisam de validação própria:

- Analisar uma nota por vez, rejeitando sinais fracos ou com periodicidade insuficiente. Não apresentar silêncio como nota afinada.
- Suavizar as leituras sem misturar alvos diferentes; confirmar afinação após leituras estáveis e descartar informação antiga quando o som desaparecer.
- Não deslocar automaticamente uma frequência por oitavas para fazê-la coincidir com a corda selecionada. Um E3 detectado não comprova que a sexta corda esteja em E2.
- Oferecer tolerância visual normal de ±3 cents e fina de ±1 cent. Esses valores são critérios de confirmação, **não a precisão medida do sistema**.
- Usar `AudioContext.sampleRate` efetivo. Pedir entrada sem cancelamento de eco, supressão de ruído e ganho automático, quando suportados; as preferências não garantem ausência de processamento no dispositivo. [MDN: constraints](https://developer.mozilla.org/en-US/docs/Web/API/Media_Capture_and_Streams_API/Constraints).
- Pedir o microfone somente ao iniciar. Explicar bloqueio de permissão, ausência de entrada, espera de autorização e necessidade de HTTPS ou contexto local seguro. A solicitação pode permanecer pendente; cancelar deve invalidá-la e encerrar um stream que chegue depois. [MDN: getUserMedia](https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia).
- Processar o áudio localmente, sem gravação ou envio para análise. Não conectar a entrada do microfone à saída de áudio. Encerrar as tracks ao parar, ocultar a página ou desmontar a oficina. [MDN: stop](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamTrack/stop).
- Desligar a captação antes de emitir um tom de referência, evitando que o próprio alto-falante produza a confirmação. O tom permite comparação de ouvido mesmo sem permissão de microfone.

A interface deve priorizar o medidor e a ação de iniciar/parar, deixando ajustes avançados em segundo plano. Controles com rótulos, alvos de toque confortáveis, foco visível, leitura independente de cor e redução de movimento seguem a skill local `ui-ux-pro-max`. Estados anunciados a leitores de tela devem comunicar mudanças úteis sem narrar cada quadro do medidor.

A ajuda prática pode orientar a tocar uma corda solta por vez, abafar as demais e ajustar gradualmente. A [Taylor recomenda terminar chegando à nota por baixo](https://blog.taylorguitars.com/how-to-tune-an-acoustic-guitar-for-beginners), aumentando a tensão após ficar ligeiramente abaixo do alvo.

## Limites do produto

O afinador é monofônico. Não promete leitura simultânea das cordas, precisão de hardware profissional, estroboscopia real ou equivalência às especificações dos fabricantes pesquisados. Microfone, interface, ruído ambiente, processamento do navegador, ataque e decaimento da corda podem afetar a leitura. Exibir casas decimais não comprova essa precisão.

Não são aplicados presets de compensação proprietários. A [Peterson explica que seus Sweeteners usam desvios em cents](https://www.petersontuners.com/support/stroboStompHD); não cabe inventar uma compensação universal ou tratá-la como necessária para todo violão.

Afinar as cordas soltas também não corrige a entonação ao longo do braço. A [Fender distingue a regulagem de entonação](https://www.fender.com/articles/maintenance/intonation-101/) da simples afinação. O produto não diagnostica nem executa ajustes de rastilho, escala ou trastes.

## Estratégia de validação

O plano abaixo orientou a implementação. Os resultados executados estão registrados ao final; os ensaios com instrumento físico permanecem pendentes.

1. **Matemática e presets:** conferir frequências, oitavas, cents positivos e negativos, transposição do capo e alteração do Lá4; testar os extremos permitidos.
2. **Detector:** sinais sintéticos em 44,1 e 48 kHz, todas as cordas previstas, desafinações conhecidas, fundamental fraca com harmônicos fortes, silêncio, ruído, amplitude baixa e decaimento. Separar erro algorítmico sintético de precisão acústica real.
3. **Estado da leitura:** transições entre cordas, confirmação persistente, desaparecimento do sinal e ausência de confirmação falsa após salto de oitava.
4. **Ciclo do microfone:** autorização concedida, negada ou ignorada; cancelamento antes da resposta; início/parada repetidos; saída da oficina e aba oculta. Verificar que nenhuma captura ou contexto de áudio permaneça ativo indevidamente.
5. **Referência sonora:** conferir frequência e encerramento do tom, com microfone desligado durante a emissão.
6. **Interface:** celular e desktop, teclado, rótulos e estados acessíveis, movimento reduzido, persistência das preferências e controles sem transbordamento horizontal.
7. **Qualidade do projeto:** executar lint, verificação de tipos, testes pertinentes e build. Ensaios com violão físico, diferentes microfones e afinador externo permanecem necessários antes de publicar qualquer especificação de precisão acústica.

## Verificação inicial · 18/11/2026

| Verificação          | Resultado                                                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`      | Lint, TypeScript, 276 testes e build de produção passaram.                                                                                                                                                                                  |
| Detector             | 11 testes de frequência, cents, harmônicos, ruído, silêncio e limites, com sinais em 44,1/48/96 kHz. Faixa de 45–1.400 Hz; inclui Si1 com Lá4 de 400 Hz, desafinado para baixo.                                                             |
| Preferências e alvos | 6 testes de presets, persistência inválida, limites, correspondência de cordas e respeito à oitava.                                                                                                                                         |
| Chromium / Web Audio | 13 verificações passaram: leitura estável, direção/cents, silêncio, dispositivos, referência, desconexão, aba oculta, saída da página/oficina, permissão negada, autorização tardia e leitura antiga. Nenhum erro de execução no navegador. |
| Captura nativa       | `getUserMedia` real, usando dispositivo simulado do Chromium com WAV temporário de Mi2 e harmônicos, confirmou a nota. Os ajustes de processamento estavam desativados e Parar encerrou a faixa de áudio.                                   |
| Interface            | Inspeção visual em desktop e telas de 320, 375 e 768 px. Sem transbordamento horizontal ou botões menores que 44 px; preferências restauradas após recarregar; movimento reduzido aplicado.                                                 |

O teste de navegador está em [`scripts/verify-tuner-browser.mjs`](../scripts/verify-tuner-browser.mjs), disponível por `npm run test:tuner`. Ele usa somente áudio de teste e não acessa um microfone físico. Requer o aplicativo em execução e uma instalação de Playwright/Chromium disponível; `TUNER_BASE_URL`, `PLAYWRIGHT_MODULE` e `CHROMIUM_EXECUTABLE` permitem apontar para instalações existentes, sem adicionar dependências de produção.

A confirmação exige 650 ms de **novas leituras** dentro da tolerância. Uma nota antiga mantida durante a expiração do sinal não pode completar esse tempo. A política `microphone=(self)` permite a captura somente à própria origem e é aplicada ao documento inteiro para funcionar também ao entrar no laboratório por navegação cliente.

Os ensaios sintéticos validam cálculo e integração. Não medem a precisão de um conjunto real de violão, microfone, ambiente e navegador; essa avaliação exige uma sessão acústica comparativa.
