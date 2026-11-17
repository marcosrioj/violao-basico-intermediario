# Verificação do acompanhamento das aulas

Este registro confere ordem, duração e acompanhamento das aulas. O áudio sintetizado segue o arranjo didático; o alinhamento vocal continua estimado onde não há marcação medida.

<details>
<summary>Arranjos, repetições e frases</summary>

A revisão cobre **13 músicas, 19 versões de arranjo e 39 aulas**. A fonte harmônica é `src/content/course-data.json`; os andamentos pesquisados continuam separados em `tempo-research.json`. As letras fornecidas pelo usuário têm **712 linhas**, preservadas nos três arquivos `song-lyrics-*.json`, e **744 frases marcadas** distribuídas entre as 19 versões. A conferência valida a execução dos arranjos de estudo existentes. Não equivale a uma transcrição temporal de cada gravação vinculada.

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

As frases aparecem automaticamente nas 39 aulas. Todas as versões estão como `draft`, pois as células e cadências documentadas dão um ponto de partida para o arranjo de estudo, sem comprovar o instante exato de cada entrada vocal. Cada marcação contém texto, pulso inicial e pulso final no arranjo expandido. Os limites de frase são explícitos. O TXT fornecido permitiu fixar 1.439 inícios silábicos em eventos harmônicos existentes. A revisão ajusta 645 janelas vocais, sem alterar notas ou durações do acompanhamento. As células originais ficam em `scoreWindow`: deixam de impedir antecipações vocais e orientam a correspondência de cada arranjo. Entre essas âncoras, a divisão temporal continua estimada; marcas individuais conferidas podem substituí-la. O [relatório de alinhamento pelo TXT](LYRIC-CHORD-ALIGNMENT.md) descreve as correspondências e as divergências preservadas. Marcas fora da duração, sobrepostas ou com fim anterior ao início são rejeitadas. Intervalos sem marca mantêm a pausa de texto.

O acompanhamento e a leitura usam o mesmo relógio de áudio. Todas as sílabas anteriores à posição atual ficam em negrito, inclusive ao começar em um trecho posterior. Pausar conserva a posição e o destaque; o término natural mantém o prefixo completo. Voltar ou repetir recalcula as marcas pela nova posição, sem depender de um histórico de passagens. As frases são exibidas completas, nas mesmas linhas definidas antes do ajuste temporal. `scoreWindow` determina a posição impressa, enquanto as âncoras determinam o canto. Uma antecipação preenche a primeira cópia da frase antes da entrada do acorde. A sílaba ativa mantém a mesma cópia até terminar, sem recortar palavras ou saltar durante uma sustentação. As quebras de 1/2/4 compassos por linha e por mudança de fórmula são preservadas.

A sequência do transporte permanece completa. Cada passagem oferece Tocar daqui quando inativa, Pausar quando está tocando e Continuar quando pausada. Continuar retoma o tempo restante do acorde. Reiniciar volta ao início da passagem, inclusive durante execução e pausa, preservando sua repetição. No mapa, reinicia a ocorrência atual da seção quando ativa; se inativa, inicia a primeira. O final de uma passagem leva automaticamente à próxima, incluindo ocorrências repetidas escritas. Repetir mantém a passagem escolhida em ciclo até ser desmarcado. O seletor Ir para o trecho interrompe a reprodução e navega até a primeira ocorrência, sem substituir os dados por um trecho isolado. O mapa resolve suas ações contra as ocorrências da sequência completa.

As letras integrais fornecidas pelo usuário estão no catálogo público do curso, incluindo versos, falas e interjeições não executados nas formas abreviadas. `getLessonLyrics` mantém o catálogo no grafo de módulos do servidor e entrega somente os dados da música/versão da aula. A aplicação ainda lê substituições pessoais salvas anteriormente no navegador. Estimativas de frases com o mesmo texto são reconhecidas pela janela atual ou por `scoreWindow` e recebem os limites e âncoras atuais. Textos, intervalos personalizados e marcas manuais são preservados; se houver sobreposição, apenas o grupo conflitante mantém a marcação pessoal anterior. A leitura não modifica o armazenamento. Não há editor na interface nem envio desses dados ao Supabase. Os PDFs não foram alterados por esta mudança do player.

O destaque usa um relógio compartilhado e atualiza apenas as linhas afetadas, sem renderizar a cifra inteira a cada quadro. A leitura fracionária independe do metrônomo e aguarda a entrada agendada do áudio. As cordas sintetizadas encerram no limite do acorde, inclusive em retomadas curtas. Essas correções evitam acumular atrasos do agendamento, mas não corrigem automaticamente marcações editoriais nem garantem latência zero em todo navegador, dispositivo de áudio ou conexão Bluetooth.

</details>

<details>
<summary>Comparação musical e limites</summary>

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

</details>

<details>
<summary>Validação executada</summary>

## Validação

A suíte completa passou com **187 testes**, sem falhas. Lint, TypeScript, build de produção e a verificação das 1.439 âncoras também passaram.

A validação automática cobre as 13 músicas, as 19 versões e o vínculo das 39 aulas com sua música/versão. As 1.439 âncoras são confrontadas com coluna literal, sílaba, acorde e evento existentes. Também são verificados os hashes dos dados musicais e das 712 linhas, a ordem global sem reutilizar eventos, antecipações, pausas, sustentações, marcações manuais e idempotência do gerador. Nenhuma sílaba tem duração zero; no BPM de referência, a menor estimativa é de cerca de 144 ms.

Os testes de leitura comparam todas as 744 frases com a disposição original em layouts de 1, 2 e 4 compassos por linha. Confirmam frases completas, sem recortes silábicos, mantendo os novos tempos e as quebras musicais. O relógio conserva negrito, pausas, reinício, retornos de repetição, saltos e cancelamento da animação. A migração de dados antigos cobre as duas entradas de “ver” de Faz Chover, marcações manuais, textos pessoais, intervalos modificados e conflitos de sobreposição.

Para reproduzir as verificações:

```bash
npm run lyrics:check
npm run check
```

A conferência no Chromium passou nas aulas **m2-a1** (base, 375 px) e **m6-a3** (completa, 1440 px), incluindo dados antigos do navegador: Am no primeiro “ver”, F no segundo, C no início de “Abre” e G em “céus”. “Faz cho…” começa antes do Am, mantendo a frase completa na posição original. Pausa e repetição preservaram o alinhamento, sem erros de página. Reiniciar foi conferido durante execução, pausa e depois do fim, mantendo a segunda ocorrência do refrão e sua repetição, inclusive pelo mapa. Em 375 px, os controles mantiveram alvos de pelo menos 44 px e texto dentro de seus limites com ampliação de 100% e 200%.

O TXT ainda deixa seis ambiguidades declaradas e diferenças de sustentações/acordes incompatíveis com a redução da aula. Esses testes não substituem a conferência dos instantes vocais das gravações; os tempos intermediários continuam interpolados e todas as versões editoriais permanecem `draft`.

</details>
