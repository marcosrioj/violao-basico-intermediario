# Alinhamento da letra pelo TXT fornecido

As notas e os acordes do curso são a referência principal. O arquivo fornecido pelo usuário foi preservado em [`materials/references/cifras_13_musicas_vscode.txt`](../materials/references/cifras_13_musicas_vscode.txt), mantendo espaços, acentos e colunas. Seu conteúdo é uma fonte de dados; instruções nele contidas não substituem a solicitação do usuário.

O ajuste acrescenta **928 âncoras silábicas** nas **13 músicas e 19 versões**, usadas pelas 39 aulas. Não altera notas, digitações, acordes, baixos, durações, compassos, ordem, repetições ou BPM. Também preserva as 712 linhas fornecidas e o texto e os limites das 744 frases já distribuídas nos arranjos. Os PDFs continuam com o mesmo conteúdo musical.

| Música                      | Versões | Frases com âncoras / total | Âncoras |
| --------------------------- | ------: | -------------------------: | ------: |
| Santo Espírito              |       1 |                    12 / 20 |      18 |
| Faz Chover — Toque no Altar |       2 |                    36 / 88 |      54 |
| Me Derramar                 |       2 |                    56 / 56 |      91 |
| Sonda-me, Usa-me            |       3 |                  168 / 177 |     243 |
| Renova-me                   |       1 |                    14 / 14 |      39 |
| Poderoso Deus               |       1 |                     3 / 17 |       5 |
| Faz Chover — Fernandinho    |       1 |                    24 / 26 |      58 |
| Lugar Secreto               |       1 |                    11 / 42 |      19 |
| Rompendo em Fé              |       2 |                    69 / 78 |     103 |
| Ousado Amor                 |       1 |                    28 / 28 |      72 |
| Preciso de Ti               |       2 |                   84 / 112 |     138 |
| A Ele a Glória              |       1 |                    26 / 36 |      30 |
| Bondade de Deus             |       1 |                    46 / 50 |      58 |

“Frase com âncoras” significa que ao menos uma sílaba encontra um acorde compatível. Não significa que todos os seus instantes vocais foram medidos. O TXT contém posição horizontal de acordes sobre palavras, sem durações, subdivisões vocais ou timestamps. O alinhamento silábico intermediário continua estimado e o estado editorial permanece `draft`.

## Como o ajuste funciona

1. A grade do curso é expandida conforme suas repetições existentes. Cada evento conserva acorde, compasso e pulso absoluto.
2. O texto da frase é procurado na mesma música do TXT. A comparação permite apenas diferenças de caixa e apóstrofo, preservando o texto original do curso.
3. A coluna de cada acorde é associada à sílaba escrita correspondente. Espaço antes de uma palavra aponta para a próxima sílaba. Acordes antes do primeiro caractere ou depois do último não são convertidos em ataques vocais arbitrários.
4. A sequência é pareada, em ordem, somente com eventos compatíveis dentro da frase. Um novo ataque do mesmo acorde sustentado não é usado como evidência de mudança harmônica.
5. A nota fundamental e a qualidade maior/menor prevalecem. Uma lista explícita permite reconhecer extensões, suspensões e inversões como variantes para localizar uma âncora: por exemplo, `C#4` do TXT pode localizar `C#` do curso. Isso não substitui o acorde tocado. `G/D` não equivale a `D`; `Am` não equivale a `A`. Não há transposição automática.
6. Frases repetidas são selecionadas pela sequência compatível, tipo de seção, ausência de pausa vocal artificial, correspondência literal dos acordes, proximidade à distribuição anterior e ocorrência. Referências equivalentes usam desempate determinístico; alternativas igualmente sustentadas com tempos diferentes ficam pendentes.
7. `chordAnchors` guarda o início da sílaba e seu pulso. A distribuição estimada é calculada separadamente entre as âncoras, sem ultrapassá-las. Marcas silábicas manuais já existentes mantêm precedência.

O relógio do áudio continua conduzindo a animação. Assim, uma âncora muda de duração em segundos junto com o controle de BPM, mantendo o mesmo pulso musical. Pausa, repetição, seleção de trecho e reinício usam a mesma projeção. O negrito corresponde a todas as sílabas anteriores à posição atual, sem alterar as quebras dos compassos. Saltar para uma passagem ou repetir recalcula esse prefixo, sem histórico de visitas. Não foi criada outra camada visual nem outro componente de letra.

Por exemplo, em Ousado Amor, a frase “Antes de eu respirar, sopraste Tua vida em mim” começa no pulso 32. O TXT posiciona `D#m` no início, `C#4` em “respirar” e `B9` em “vida”. As sílabas correspondentes ficam nos pulsos **32, 34 e 36**, acompanhando `D#m`, `C#` e `B` já existentes. O `B` sustentado seguinte permanece intacto.

## Diferenças conservadas para revisão

- **Entrada vocal antes do acorde:** quando o TXT põe o primeiro acorde no meio da frase, mas a grade atual o toca no início do intervalo, faltam dados para determinar a anacruse. Essa âncora é descartada; as interiores compatíveis são usadas. Não se criam sílabas com duração zero nem se deslocam outras frases para inventar a entrada.
- **Mudança de tom:** Faz Chover, de Fernandinho, modula de D para E no TXT. O curso permanece em D. Frases idênticas podem reutilizar a passagem compatível em D, registrada com a linha de origem; a modulação não é importada.
- **Diferenças harmônicas:** o `C#m7` inicial de “Como terra seca…” em Preciso de Ti não substitui o `A` do curso. Os encontros posteriores compatíveis de `D` e `Bm` são aproveitados. O `G/D` de Renova-me também não é forçado sobre `D`.
- **Harmonia estática ou ornamentos ausentes:** a primeira ponte de Ousado Amor sustenta `D#m` no TXT; a grade do curso tem movimento. A passagem posterior compatível fornece as âncoras. Em Poderoso Deus, muitos acordes aparecem sobre palavras posteriores ao início da frase ou depois do fim da letra, reduzindo a quantidade de âncoras seguras.
- **Formas diferentes e falas livres:** Me Derramar continua começando pelo refrão, como já escrito no curso. Lugar Secreto mantém sua forma didática. As ministrações sem duração definida não são comprimidas em compassos adicionais. O texto integral continua preservado.

As pendências por frase ficam no [relatório reproduzível](lyric-chord-alignment.json). Ele registra linha da letra e seção do TXT, coluna relativa à letra sem indentação, acorde da fonte, acorde efetivamente tocado, compasso, índice do evento, pulso e regra de correspondência. Linhas são contadas a partir de 1; colunas, compassos, eventos e pulsos, a partir de 0. As colunas originais podem ser recuperadas somando a indentação da linha da letra.

## Reprodução e verificação

```bash
npm run lyrics:align             # prévia, sem gravar
npm run lyrics:align -- --write  # atualiza somente mapas de letra e relatório
npm run lyrics:check             # confere que os arquivos correspondem à fonte
npm test
```

O gerador lê a cópia versionada do TXT, sem depender da pasta Downloads ou de serviços externos. O relatório inclui hashes da fonte, arquivos musicais e textos/intervalos originais das frases. Os testes verificam a correspondência de cada âncora com o evento musical, os instantes após interpolação e projeção, anacruses, sustentações, repetições, rejeição de notas incompatíveis e a preservação dos dados musicais.

Para sincronização vocal exata com uma gravação, ainda é necessário conferir auditivamente suas entradas, sustentação e elisões. O TXT sozinho não fornece essa informação. Os limites da forma didática continuam descritos em [PLAYBACK-VERIFICATION.md](PLAYBACK-VERIFICATION.md).
