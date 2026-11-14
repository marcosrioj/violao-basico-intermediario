# Verificação de autenticação e isolamento

Executada em **14 de novembro de 2026** no checkout local. Não foram usadas contas reais de aluno/professor, SMTP, OAuth ou um projeto remoto do Supabase.

## Resultados executados

| Verificação                                                                                 | Resultado                    | Evidência reproduzível                                                                                                    |
| ------------------------------------------------------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Políticas RLS, grants, triggers, FKs e RPCs em PostgreSQL real compilado para WASM (PGlite) | Passou                       | `node --import tsx tests/security-rls.test.ts`                                                                            |
| Identificadores das 39 aulas, contratos, URLs e redirecionamentos                           | 3 casos passaram             | `node --import tsx tests/domain-validation.test.ts`                                                                       |
| Origem de mutações e leitura limitada de JSON/streams                                       | 2 casos passaram             | `node --import tsx tests/security-request.test.ts`                                                                        |
| HTTP contra o servidor Next.js local sem sessão                                             | **29 verificações passaram** | `node scripts/smoke-http.mjs` com o servidor iniciado                                                                     |
| TypeScript e ESLint dos componentes de autenticação/backend/testes                          | Passaram                     | `npm run typecheck`; `npx eslint src/lib src/proxy.ts src/components/auth scripts/smoke-http.mjs tests/security*.test.ts` |

O teste de banco cria identidades sintéticas e emula somente a fronteira `auth.uid()` por configuração de sessão. O motor executa o SQL real da migration. Ele não comprova a configuração de tokens, redirects ou provedores de um Supabase remoto.

## Fronteiras cobertas

- Aluno não lê nem altera progresso, diário, perfil, feedback ou encontros de outro aluno de outra turma.
- Professor lê os registros de estudo dos alunos matriculados em suas turmas; não lê turmas alheias nem feedback escrito em outra turma.
- Professor não altera anotações, nome ou prática do aluno, não forja outro autor de feedback, não transfere a propriedade da turma e não atribui papéis.
- O cadastro sempre cria `student`, mesmo que os metadados enviados tentem pedir `teacher`. Os grants impedem alteração de `role` por contas autenticadas.
- Feedback exige professor proprietário e matrícula válida na mesma turma; a FK impede referências cruzadas entre turmas.
- Convites não são enumeráveis pelos alunos. A RPC é idempotente e conserva as tentativas inválidas; o limite de 10 tentativas por 15 minutos é exercitado no banco.
- Aluno não transfere a propriedade do progresso, falsifica timestamps do servidor, lê a tabela interna do limite de tentativas ou cancela encontros do professor.
- Remover a matrícula retira o acesso do professor aos registros pessoais daquele aluno. Feedback da matrícula é removido pela FK; o progresso pessoal permanece.
- Requisições anônimas aos endpoints retornam `401` quando a autenticação está configurada ou `503 SETUP_REQUIRED` quando não está. Neste ambiente sem credenciais foi verificado o segundo caso, sem retorno de dados privados.
- Páginas restritas e PDFs exigem sessão; manual docente exige papel `teacher`. A demonstração não inclui plano do professor.
- Mutações com `Origin` ausente, `null`, HTTP divergente, porta diferente ou domínio semelhante são rejeitadas. `Host` e `X-Forwarded-Host` não substituem a origem configurada.
- O parser rejeita JSON inválido, tipo de mídia incorreto, campos não reconhecidos e corpos maiores que 16 KiB em bytes; interrompe a leitura de streams excedentes.
- Callbacks sem credenciais válidas falham com mensagens genéricas e redirecionamento interno. `safeRedirect` rejeita URLs externas, barras invertidas e caracteres de controle.

## Cookies, cache e cabeçalhos

O cliente oficial `@supabase/ssr` gerencia cookies com `SameSite=Lax`, domínio restrito ao host e `Secure` em produção. A biblioteca precisa permitir que o cliente JavaScript leia a sessão; não se alega uso de cookies `HttpOnly`. As operações protegidas de dados usam `getUser()` para validar a identidade e consultam o perfil no banco. O logout verifica a origem e encerra a sessão SSR local sem depender da leitura do perfil; a fronteira de erro, os cabeçalhos privados e o identificador de requisição são preservados. A renovação pelo Proxy cobre todas as páginas protegidas e APIs.

Respostas de APIs, callbacks e arquivos usam `Cache-Control: private, no-store`. Nenhuma chave administrativa é usada pela aplicação. As consultas selecionam campos explícitos; listas usam paginação. Os logs contêm operação, status, duração e identificador da requisição, sem corpo, e-mail, tokens ou dados de estudo.

Os cabeçalhos incluem `nosniff`, bloqueio de frames e uma CSP restrita às integrações usadas. `unsafe-eval` é permitido somente no desenvolvimento. `unsafe-inline` ainda é necessário para a estratégia atual de renderização/hidratação do Next.js; esta CSP não deve ser descrita como uma política estrita baseada em nonce.

## Como repetir o smoke HTTP

Com `npm run dev` ou `npm start` ativo:

```bash
npm run test:http
```

Para outra URL, configure `SMOKE_BASE_URL`; `SMOKE_ORIGIN` deve corresponder exatamente à origem pública autorizada por `NEXT_PUBLIC_SITE_URL`. O script não inicia servidor, não envia cookies, não cria conta, não grava dados e não simula autenticação.

## Regressões adicionais

`tests/security-env.test.ts` cobre URLs públicas, configuração parcial, exigência da origem de produção e rejeição de chaves administrativas antes do build. `tests/auth-operations.test.ts` cobre saída sem consulta ao perfil e a recuperação em duas etapas: depois que a senha é atualizada, uma falha ao revogar sessões permite repetir somente a revogação, sem enviar a senha novamente. Esses testes usam portas simuladas; não comprovam o comportamento de um provedor hospedado.

A CI também executa `npm run test:http:ci`: o wrapper inicia o build de produção, roda o smoke sem credenciais e encerra o processo. O script original `test:http` continua disponível para um servidor já iniciado.

## Pendente de configuração externa

Depois de aplicar a migration no Supabase escolhido e configurar os provedores, executar o fluxo real com duas contas de aluno e duas de professor: login Google, cadastro confirmado, recuperação, logout, matrícula, gravação e releitura do progresso, diário, feedback, encontros e downloads. Repetir os ataques negativos de acesso direto à API usando os JWTs reais. Confirmar a allowlist de redirects e os templates de e-mail de `DEPLOYMENT.md`.

A revisão e os testes fornecem evidência das fronteiras implementadas; não são uma auditoria externa nem uma garantia de ausência de vulnerabilidades. A navegação e os controles de áudio foram inspecionados posteriormente em navegador desktop, conforme `VERIFICATION.md`. Cookies reais de Supabase, entrega de e-mail, consentimento Google e implantação remota ainda não foram validados.
