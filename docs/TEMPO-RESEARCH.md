# Auditoria dos andamentos do repertório

Use a referência de andamento com sua unidade musical e confira a versão da gravação. O catálogo distingue referências documentadas de estimativas; escolher um BPM padrão não muda essa classificação.

<details>
<summary>Como usar e consultar os resultados</summary>

Consulta em **14/11/2026**, cobrindo as **13 músicas** cadastradas. Estado atual: **7 referências documentadas e 6 estimativas**. “Documentada” significa que existe uma indicação de andamento vinculada à versão escolhida; a origem pode ser o fornecedor do master ou uma transcrição independente, conforme identificado abaixo. Não significa que a gravação inteira tenha velocidade constante.

A consulta originalmente deixou Santo Espírito, Faz Chover (Toque no Altar) e Poderoso Deus sem referência utilizável. Por decisão posterior do responsável pelo curso, suas hipóteses foram adotadas como estimativas e como padrão de reprodução: **71,5, 67 e 62 BPM por semínima**, respectivamente. A mudança não resulta de uma nova pesquisa nem confirma o andamento das gravações; conserva as evidências e incertezas descritas nesta auditoria.

Os dados usados pela aplicação estão em [`src/content/tempo-research.json`](../src/content/tempo-research.json). Cada entrada registra a gravação, URL, data de consulta, unidade, evidências, limitações e estado da pesquisa. Esta auditoria complementa a [metodologia do conteúdo](CONTENT.md).

## Como usar os resultados

`lesson.bpm` continua sendo o andamento de estudo da aula, preservado sem alteração nos dados da edição 5. Por decisão do responsável pelo curso, as referências válidas das 13 músicas são agora o padrão das 39 aulas. `defaultPlaybackBpm(studyBpm, tempo?)` converte a referência para a unidade do player, preservando a precisão; retorna o andamento de estudo apenas quando a referência estiver ausente, inválida ou não resolvida. Os campos históricos `useAsDefault` permanecem no arquivo de pesquisa preservado pelos PDFs; não controlam mais o comportamento do player.

O player oferece um único botão **Usar referência**. Fontes e limitações permanecem na ajuda contextual (`Hint`). A indicação de BPM da aula e o valor inicial do diário usam a mesma referência; somente o diário arredonda para inteiro. As seis estimativas continuam classificadas como estimadas, sem nova confirmação das gravações.

O metrônomo e a marcação visual acompanham a grade didática. Não há sincronização automática com o vídeo, detecção de batidas em tempo real nem mapa de mudanças de andamento da gravação. O ajuste manual continua necessário para estudar trechos específicos, rubato, rallentando ou entradas de banda.

O player inclui as letras fornecidas pelo usuário para as 13 músicas e mapas iniciais de frases nas 19 versões, disponíveis nas 39 aulas. A posição é registrada em pulsos e acompanha a mudança do BPM de estudo pelo mesmo relógio do áudio. Todas as marcações atuais permanecem `draft`: associar uma frase à célula harmônica não confirma seu instante vocal na gravação. Isso não amplia a evidência dos BPMs nem transforma as formas abreviadas em transcrições integrais. A [verificação do acompanhamento](PLAYBACK-VERIFICATION.md) compara também a duração de cinco vídeos oficiais vinculados com a duração calculada de seus arranjos nos BPMs de referência; as diferenças de forma impedem tratar a reprodução da aula como uma faixa idêntica aos vídeos.

## Resultado por gravação

Os valores da coluna “Player” são **pulsos por minuto na unidade indicada**. Nos compassos simples, o pulso é a semínima; em 6/8, o player conta duas semínimas pontuadas por compasso.

| Música e gravação escolhida                                                                                                | Compasso              | Player                                | Estado e origem                                                                                                                                                                                 | Variação ou limite relevante                                                            |
| -------------------------------------------------------------------------------------------------------------------------- | --------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| [Santo Espírito — Nívea Soares, vídeo publicado em 2017](https://www.youtube.com/watch?v=Jsr1C6xVhDg)                      | 4/4                   | Aproximadamente 71,5; semínima        | Estimado, adotado como padrão; [análise automática](https://chordify.net/chords/santo-espirito-nivea-soares-nivea-soares)                                                                       | Metade de 143; a figura musical não foi confirmada pela fonte.                          |
| [Faz Chover — Toque no Altar / Trazendo a Arca, 2003, 6:18](https://music.apple.com/br/song/faz-chover-ao-vivo/1675244989) | 4/4                   | Aproximadamente 67; semínima          | Estimado, adotado como padrão; [133 BPM](https://songbpm.com/%40toque-no-altar/faz-chover) versus [79 BPM](https://getsongbpm.com/album/toque-no-altar/g81lG) em agregadores                    | Hipótese de 66,5 arredondada para 67; sem confirmação independente pela prévia.         |
| [Me Derramar — Ministério Vineyard, Vem, Esta É a Hora, 2001](https://www.youtube.com/watch?v=LJyK6vZRFSw)                 | 6/8                   | 37,3; semínima pontuada               | Documentado; [MultiTracks, master original](https://www.multitracks.com/songs/Vineyard-Music/Vem,-Esta-E-A-Hora/Me-Derramar/)                                                                   | A fonte publica 56 em semínimas; conversão exata `56 × 2/3`. Há variações de andamento. |
| [Sonda-me, Usa-me — Aline Barros, Som de Adoradores, 2004](https://www.youtube.com/watch?v=zUOaDzTmpNA)                    | 4/4                   | 62; semínima                          | Documentado; [transcrição de bateria](https://danielbatera.com.br/newsite/wp-content/uploads/2012/03/partitura-gospel-bateria-aline-barros-sonda-me-usa-me-portal-daniel-batera-drum-sheet.pdf) | Rallentando no final, também indicado na cifra usada pelo curso.                        |
| [Renova-me — Aline Barros 20 Anos ao Vivo, 2012](https://www.youtube.com/watch?v=F4lki0EbNCo)                              | 4/4                   | Aproximadamente 94; semínima          | Estimado; [cifra da versão](https://cifrasgospel.online/aline-barros/renova-me-ao-vivo/) e [analisador](https://chordify.net/chords/aline-barros-songs/renova-me-chords)                        | A cifra indica 95; a divergência 94–95 permanece aberta.                                |
| [Poderoso Deus — Antônio Cirilo, 2002, 14:49](https://www.youtube.com/watch?v=TnKTUZfNafM)                                 | 4/4 na grade didática | Aproximadamente 62; semínima          | Estimado, adotado como padrão; [distribuição oficial](https://music.apple.com/br/album/poderoso-deus/1835698567?i=1835698738) e análise da prévia                                               | Hipótese da família 124–125/62–62,5; sem validação independente da figura musical.      |
| [Faz Chover — Fernandinho, 2003, 12:38](https://www.youtube.com/watch?v=SDzsBXMNlZY)                                       | 4/4                   | Aproximadamente 72; semínima          | Estimado; medição da [prévia oficial de 2003](https://music.apple.com/us/album/faz-chover-ao-vivo/1468020851?i=1468021445)                                                                      | Trecho de 30 s, correlação baixa; não confirma a faixa inteira.                         |
| [Lugar Secreto — Gabriela Rocha, Céu, 2018](https://www.youtube.com/watch?v=YnrN0o0lubM)                                   | 4/4                   | 69; semínima                          | Documentado; [MultiTracks, master original](https://www.multitracks.com.br/songs/Gabriela-Rocha/C%C3%A9u/Lugar-Secreto/)                                                                        | Valor nominal; o fornecedor informa variações.                                          |
| [Rompendo em Fé — Comunidade Evangélica Internacional da Zona Sul, 1998](https://www.youtube.com/watch?v=5cUhcZ4jMrw)      | 4/4                   | 68; semínima                          | Documentado; [transcrição de Gladstone Leon](https://www.gladstoneleon.com.br/_files/ugd/a0a895_f34c14fe027a4c188ea4266095aa6648.pdf)                                                           | Rallentando final.                                                                      |
| [Ousado Amor — Isaías Saad, 2018](https://www.youtube.com/watch?v=wSKKEAnLTDw)                                             | 6/8                   | Aproximadamente 55; semínima pontuada | Estimado; medição da [prévia oficial de 2018](https://music.apple.com/br/album/ousado-amor/6815818197?i=6815818554)                                                                             | Os 164 da cifra não têm unidade explícita e não são aplicados diretamente.              |
| [Preciso de Ti — Diante do Trono 4, 2001](https://www.youtube.com/watch?v=7h7t0jzCYIY)                                     | 4/4                   | 68; semínima                          | Documentado; [transcrição de Gladstone Leon](https://www.gladstoneleon.com.br/_files/ugd/a0a895_8eecd11d4b3b4e2d936b8577ac1d4bc5.pdf)                                                           | A fonte marca 71 na banda forte; o preset usa o andamento inicial.                      |
| [A Ele a Glória — Diante do Trono, Exaltado DVD, 1999](https://www.youtube.com/watch?v=Q_MerFW9qA4)                        | 4/4                   | 75; semínima                          | Documentado; [transcrição de Gladstone Leon](https://www.gladstoneleon.com.br/_files/ugd/a0a895_784fd276efc54ad69efebc04e7ef9e77.pdf)                                                           | A transcrição cobre somente o trecho até 4:27.                                          |
| [Bondade de Deus — Isaías Saad, 2022](https://www.youtube.com/watch?v=mZ9yZYo9Mmk)                                         | 4/4, com 2/4 locais   | 68; semínima                          | Documentado; [transcrição de Gladstone Leon](https://www.gladstoneleon.com.br/_files/ugd/a0a895_8d41165bd6304292aafb266969382202.pdf)                                                           | Em 2/4, permanecem 68 BPM e passam a ser dois pulsos no compasso.                       |

</details>

<details>
<summary>Unidades e qualidade das evidências</summary>

## Unidade e conversão

Um número de BPM sem a figura musical não determina a duração dos compassos. Em 4/4, quatro semínimas a 68 BPM ocupam o mesmo tempo que oito colcheias a 136 BPM. Usar 136 como quatro pulsos na grade atual dobraria a velocidade do acompanhamento.

Em 6/8, o agrupamento usado pelo curso é `1 la li, 2 la li`: seis colcheias distribuídas em dois pulsos de semínima pontuada. A [documentação oficial do Playback](https://helpcenter.multitracks.com/en/articles/4720422-how-to-cloud-song-click-tracks) explica que o serviço representa o clique de 6/8 em semínimas e converte um andamento de semínima pontuada multiplicando por `3/2`. Para **Me Derramar**, usamos o inverso: os 56 em semínimas publicados pelo catálogo tornam-se `56 × 2/3 = 37,333…` semínimas pontuadas por minuto. A interface apresenta 37,3; o cálculo de reprodução conserva o valor convertido, sem arredondá-lo para 37.

Essa convenção do fornecedor não pode ser atribuída automaticamente a outras fontes. A [cifra de Ousado Amor da Igreja Batista Barcelona](https://batistabarcelona.com.br/wp-content/uploads/2019/05/A0418-Ousado-Amor.pdf) informa 164 BPM e 6/8, sem nomear a unidade. Se fossem colcheias, seriam `164/3 ≈ 54,7` pulsos compostos. Essa é uma hipótese compatível com a prévia, não uma unidade declarada pela cifra; o preset estimado de 55 tem essa incerteza registrada.

## Qualidade das evidências e identificação das versões

Foram consultadas três classes de evidência:

1. **Distribuição e recursos da gravação original.** Artista, gravadora, Apple Music e fornecedor de master ajudam a identificar o fonograma. MultiTracks publica andamento e compasso para Me Derramar e Lugar Secreto. A Apple identifica faixas e oferece prévias, mas não publica os BPM aqui estimados.
2. **Transcrições assinadas ou publicadas pelo próprio transcritor.** São evidência direta da leitura musical feita pelo autor da partitura. Foram inspecionadas visualmente as marcas de metrônomo, figuras, compassos e avisos de alteração de andamento. Isso não transforma a transcrição em declaração do artista ou da gravadora.
3. **Analisadores e medições próprias.** Servem para levantar ou comparar hipóteses. Metade, dobro e subdivisão são ambiguidades comuns. Dois sites podem reutilizar o mesmo dado, portanto concordância entre agregadores não equivale a duas medições independentes.

Nas partituras de **Rompendo em Fé**, **Preciso de Ti**, **A Ele a Glória** e **Bondade de Deus**, as anotações de hyperlink dos PDFs foram extraídas e conferidas. Apontam exatamente aos IDs dos vídeos cadastrados, respectivamente `5cUhcZ4jMrw`, `7h7t0jzCYIY`, `Q_MerFW9qA4` e `mZ9yZYo9Mmk`. Isso oferece rastreabilidade mais forte que uma busca somente pelo título.

Para **Sonda-me, Usa-me**, a página 2 da partitura de bateria de Anderson Cleiton Rodrigues identifica o álbum de 2004 e traz explicitamente semínima = 62. A [cifra de Gladstone Leon](https://www.gladstoneleon.com.br/_files/ugd/a0a895_2198813895904e8eb46371c0212d8da0.pdf) complementa a informação com o rallentando final. Os valores automáticos próximos do dobro não substituem a figura escrita.

Para **Lugar Secreto**, os [detalhes do catálogo](https://www.multitracks.com.br/songs/Gabriela-Rocha/C%C3%A9u/Lugar-Secreto/overview/) vinculam o master `mtID 11133`, o EP Céu, o ano **2018** e o mesmo vídeo do curso. O [anúncio do fornecedor](https://www.multitracks.com.br/blog/anunciando-gabriela-rocha) identifica recursos da gravação original. A nova referência editorial usa 2018; a menção legada a 2017 nos materiais v5 permanece nos originais importados para preservar sua proveniência.

</details>

<details>
<summary>Estimativas, método e manutenção</summary>

## Estimativas e pendências

**Renova-me:** a [cifra vinculada ao vídeo de 2012](https://cifrasgospel.online/aline-barros/renova-me-ao-vivo/) informa 95, enquanto [Tunebat](https://tunebat.com/Info/Renova-Me-Ao-Vivo-Aline-Barros/5fytDMLCSDAxEyITCy2YZR) e Chordify indicam 94. Álbum e duração foram confrontados com a distribuição oficial. O preset 94 representa a faixa aproximada 94–95; a prévia não resolveu a diferença. Não se utilizaram os valores 70/140 associados à gravação de 2000.

**Faz Chover, Fernandinho:** a hipótese de 72 vem de uma prévia licenciada de 30 segundos da edição de 2003, com duração integral de 12:38. A [partitura utilizada no curso](https://www.gladstoneleon.com.br/_files/ugd/a0a895_48e8cca6d4b644338bba0936544f1e44.pdf) confirma a leitura em 4/4, mas não publica BPM. Os picos de análise próximos de 71–73 e 142–146 tiveram baixa correlação. A estimativa deve continuar identificada como tal. Não foram transferidos valores do Acústico de 2014, da gravação no Mineirão de 2025 ou de playbacks recriados mais curtos.

**Ousado Amor:** a prévia oficial da faixa lançada em 08/03/2018, com duração integral de 5:33,903, apresentou periodicidade de aproximadamente 2,17 segundos por compasso e 1,08 segundo por pulso composto. Isso sustenta uma estimativa arredondada de 55 semínimas pontuadas por minuto. Não é BPM publicado pela Apple nem medição da gravação completa; Live de 2020 e Na Casa de 2024 são outras versões.

**Santo Espírito:** o analisador do vídeo cadastrado informa 143 sem indicar a figura rítmica. A consulta não encontrou evidência suficiente para confirmar esse valor ou sua metade, 71,5. Por decisão do responsável pelo curso, foi adotada a hipótese de **71,5 semínimas por minuto**, com `status: "estimated"`. A grade 4/4 da edição didática, sozinha, não resolve a unidade da detecção automática; a escolha permanece uma estimativa.

**Faz Chover, Toque no Altar:** a faixa de 2003 tem 6:18. Os agregadores divergem entre 133 e 79; metade de 133 produz a hipótese 66,5, arredondada para **67 semínimas por minuto** no padrão adotado pelo responsável pelo curso. A entrada passa a `status: "estimated"`. A prévia de 30 segundos produziu picos conflitantes, sem confirmação independente; adotar 67 não resolve essa divergência. Esta canção é distinta de Faz Chover, de Fernandinho.

**Poderoso Deus:** a edição de 2002 tem 14:49; o upload oficial de 2025 é uma republicação. A prévia e parte dos agregadores sugerem a família 124–125/62–62,5. A [cifra LAR Music](https://larmusic.lardejesus.com.br/Cifras/LD0625-O%20-%20PODEROSO%20DEUS%20-%20ANTONIO%20CIRILO.pdf) não publica fórmula de compasso nem andamento. O responsável pelo curso adotou **62 semínimas por minuto** como hipótese de trabalho, com `status: "estimated"`; falta validação independente dessa unidade. Playbacks de 7:59, produções recentes e versões de outros intérpretes não confirmam esse fonograma.

## Método das prévias e limites

As análises exploratórias usaram somente prévias públicas licenciadas de cerca de 30 segundos, identificadas por artista, álbum, data e duração da faixa no catálogo oficial. Não foi baixado áudio do YouTube nem a música integral.

A medição comparou periodicidades da energia e de seus aumentos ao longo do tempo. Para Ousado Amor e Poderoso Deus, foram usados áudio mono a 8 kHz, janelas de 10 ms e comparação do sinal completo com bandas filtradas. Para Faz Chover, de Fernandinho, foram usados mono a 22,05 kHz, janelas de 110 amostras e diferentes bandas e recortes temporais. Procuraram-se picos de autocorrelação correspondentes a pulsos, subdivisões ou compassos.

Esse método não identifica, por si só, a figura musical, o início do compasso ou todas as mudanças de andamento. Não houve validação auditiva/manual de cada compasso das gravações completas. Picos baixos ou conflitantes não foram tratados como comprovação. A anotação `variable: true` registra variação conhecida; `false` significa que esta revisão não registrou uma variação documentada, não que tenha provado estabilidade absoluta.

Nenhum áudio ou PDF de terceiros consultado nesta pesquisa foi adicionado ao repositório. O registro persistente contém links, resultados e descrições das evidências. Os materiais v5 já fornecidos pelo proprietário seguem a política descrita em [CONTENT.md](CONTENT.md).

## Manutenção e próximas revisões

[`course.ts`](../src/content/course.ts) associa a pesquisa à música por ID, separadamente de `course-data.json`. [`tempo.ts`](../src/content/tempo.ts) converte a unidade publicada para a unidade do player. O importador [`scripts/import-course.py`](../scripts/import-course.py) reconstitui os dados v5, mas não escreve `tempo-research.json`: reimportar os originais não deve apagar a auditoria nem promover um andamento de estudo a BPM da gravação.

Para atualizar uma entrada:

1. Confirmar o fonograma por vídeo ou identificador de catálogo, álbum, ano e duração. Registrar diferenças entre regravação, remasterização e novo upload.
2. Buscar uma indicação metronômica e sua figura musical em partitura identificada, recurso do master ou documentação do artista. Conservar a unidade original em `reference.unit` e justificar qualquer conversão.
3. Quando só houver análise sonora, registrar a origem autorizada, duração do trecho, método, ambiguidades e faixa provável. Não promover `estimated` para `documented` somente porque outro agregador repetiu o número.
4. Para as três estimativas adotadas como padrão, buscar validação da unidade e confrontar a contagem dos compassos com a gravação escolhida antes de alterar sua classificação. A adoção de todas as referências como padrão expressa uma decisão de uso no curso, não um grau de certeza. O modelo continua aceitando `unresolved` com `reference: null` para futuras entradas sem hipótese adotada.
5. Atualizar data, evidências e limites em `tempo-research.json` e nesta tabela. Uma mudança de andamento documentada, como 68 → 71 em Preciso de Ti, continua sendo uma nota para ajuste manual até existir um mapa temporal verificável.
6. Verificar cobertura das 13 músicas, conversões, valores nulos, os padrões das 39 aulas e o retorno ao andamento de estudo quando a referência estiver ausente, inválida ou não resolvida. Conferir a consistência entre player, indicação da aula e diário arredondado, executar os testes do projeto e conferir as ajudas no player. Alterações pedagógicas em `lesson.bpm` exigem uma revisão própria, independente desta pesquisa.

</details>
