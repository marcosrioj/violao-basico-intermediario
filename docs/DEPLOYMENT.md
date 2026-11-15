# Instalar e hospedar sua instância do Violão Vivo

Este guia é para instalar **sua própria aplicação**, com seu Supabase e seu endereço. Para usar a instância compartilhada gratuitamente, siga o [guia do professor](TEACHERS.md); não é necessário instalar nada nesse caso.

**Convenção dos exemplos:** `https://seu-app.example` representa a URL HTTPS definitiva da **sua** hospedagem. Substitua esse endereço em todos os exemplos; ele não é um site real. No computador, use `http://localhost:3000`. Nunca use a URL da instância compartilhada como configuração de sua instalação.

| Quero…                                              | Caminho                                                                           |
| --------------------------------------------------- | --------------------------------------------------------------------------------- |
| Executar o app no computador com Supabase hospedado | Seções 1, 2, 3 e 4                                                                |
| Executar app e Supabase no computador               | Seção 1 e [Supabase totalmente local](#supabase-totalmente-local); depois seção 4 |
| Publicar pela minha conta GitHub                    | Seções 1–5 e Vercel ou Netlify                                                    |
| Publicar em VPS/outra hospedagem Node               | Seções 1–4 e [servidor próprio](#servidor-próprio-ou-outra-hospedagem-nodejs)     |

O frontend e o backend formam um único projeto Next.js. Contas e dados usam **Supabase Auth + API + PostgreSQL**; não basta apontar para um PostgreSQL isolado. Os PDFs e dados do curso já estão versionados, sem importação adicional, seed de conteúdo ou buckets de Storage. As contas e turmas serão criadas pela interface.

## 1. Executar localmente

Instale Git, **Node.js 22** e npm. Use o lockfile para instalar as versões do projeto:

```bash
git clone https://github.com/marcosrioj/violao-basico-intermediario.git
cd violao-basico-intermediario
npm ci
cp .env.example .env.local
```

Se você já fez um fork, clone a URL do seu fork. No Windows, a cópia de `.env.example` também pode ser feita pelo explorador de arquivos.

Preencha `.env.local` depois de preparar o Supabase na seção 2:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

| Variável                               | Onde obter / o que preencher                                                                     |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL da API do seu projeto no painel Supabase; no modo local, saída de `supabase status`          |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave **publishable** do mesmo projeto; chave legada `anon` também é aceita                      |
| `NEXT_PUBLIC_SITE_URL`                 | Origem exata do app: `http://localhost:3000` localmente ou `https://seu-app.example` em produção |

Nunca coloque `service_role`, `sb_secret_`, senha do banco ou tokens de CLI nessas variáveis. Não envie `.env.local` ao Git. Não acrescente caminhos, parâmetros ou credenciais às URLs. O app aceita HTTP somente em loopback; outras origens exigem HTTPS. URL inválida, configuração parcial ou chave administrativa fazem o build falhar sem imprimir o segredo.

Depois de configurar o login na seção 3:

```bash
npm run dev
```

Abra **http://localhost:3000**. `localhost` e `127.0.0.1` são origens diferentes; use no navegador a mesma origem de `NEXT_PUBLIC_SITE_URL`. Reinicie o servidor após mudar `.env.local`. Para outra porta, ajuste também Site URL e redirects do Supabase.

Para apenas ver a apresentação pública, omita a cópia/configuração de `.env.local` e rode `npm ci` e `npm run dev`. Sem Supabase, login, aulas e ferramentas ficam indisponíveis. Com Supabase, criar uma conta ainda exige a liberação de professor ou matrícula em turma.

Verificação local: pare `npm run dev` com **Ctrl+C** antes dos comandos abaixo. O teste HTTP inicia seu próprio servidor e precisa da porta 3000 livre:

```bash
npm run check        # lint, tipos, testes e build
npm run test:http:ci # inicia o build local, verifica rotas e encerra
```

## 2. Preparar o banco Supabase

### Opção simples: painel do Supabase

1. Crie seu projeto no plano Free e guarde a senha do banco fora do repositório.
2. No **SQL Editor** desse projeto novo, execute o conteúdo completo de [`202611140001_initial.sql`](../supabase/migrations/202611140001_initial.sql).
3. Depois, execute [`202611140002_course_enrollment.sql`](../supabase/migrations/202611140002_course_enrollment.sql).
4. Confira que ambas terminaram sem erro. Copie a URL e a chave publicável do projeto para `.env.local`.

Esses arquivos configuram tabelas, relacionamentos e RLS. Não basta criar tabelas manualmente ou aplicar apenas o primeiro arquivo. A chave publicável trabalha junto com essas políticas.

### Alternativa: migrations pela CLI

Instale a [Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started). Os comandos abaixo seguem a CLI v3; confira `supabase --version`. Na CLI v2, o seletor remoto é `--linked` em vez de `--remote`.

Para um projeto novo que **ainda não recebeu SQL pelo painel**:

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase migration list --remote
supabase db push --remote
```

Confira o projeto de destino antes de confirmar. A CLI aplica os arquivos na ordem e registra o histórico. Se você já os executou pelo SQL Editor, **não aplique novamente**: reconcilie o histórico com `supabase migration repair` conforme a [referência oficial](https://supabase.com/docs/reference/cli/supabase-migration-repair), marcando somente versões efetivamente aplicadas. [Migrations](https://supabase.com/docs/guides/local-development/database-migrations), [destinos locais e remotos](https://supabase.com/docs/guides/local-development/local-and-hosted-projects).

### Supabase totalmente local

Essa opção permite usar contas, banco e confirmação de e-mail no computador, sem projeto Supabase hospedado ou provedor SMTP externo. Instale a CLI e mantenha o Docker (ou runtime compatível indicado pela CLI) em execução. A primeira inicialização baixa imagens; requer conexão e recursos disponíveis no computador.

O arquivo `supabase/config.toml` **já existe**. Na raiz do repositório:

```bash
supabase start
supabase status
```

Em um banco local **novo ou descartável**, reaplique o esquema versionado para garantir as duas migrations:

```bash
supabase db reset
```

**O reset apaga os dados locais.** Não use em um banco que queira preservar nem acrescente um destino remoto. Em uma instalação local já usada, aplique apenas migrations pendentes com `supabase migration up`, após conferir a versão da CLI e o destino.

1. Use a **API URL** e a chave **publishable/anon** exibidas em `supabase status` nas duas variáveis Supabase de `.env.local`. A API local costuma ser `http://127.0.0.1:54321`; isso é diferente da origem do app, que continua `http://localhost:3000`.
2. O `config.toml` já define Site URL e callbacks para `http://localhost:3000`, com confirmação de e-mail habilitada.
3. Rode `npm run dev`. Crie uma conta com e-mail e senha pela interface.
4. Abra o coletor de e-mail local (Mailpit/Inbucket) no endereço informado pela CLI e clique na confirmação. Não procure essa mensagem na caixa real do seu e-mail.
5. Abra o **Studio local** no endereço informado pela CLI e use seu SQL Editor para promover a conta conforme a seção 4.

Não é necessário `supabase login`, `supabase link` nem configurar Google para esse fluxo local. `supabase stop` encerra os serviços; `supabase start` permite retomá-los. Não copie a saída completa de `supabase status` para `.env.local`, pois ela pode incluir chaves administrativas.

Esse ambiente local é de desenvolvimento. Para operar o próprio Supabase em produção, use a [documentação de self-hosting do Supabase](https://supabase.com/docs/guides/self-hosting), configure TLS, Auth, entrega de e-mail e backups e aponte o app para sua API pública. A CLI local não substitui essa configuração de produção.

### Atualizar um projeto existente para exigir matrícula

A migration [`202611140002_course_enrollment.sql`](../supabase/migrations/202611140002_course_enrollment.sql) depende de `202611140001_initial.sql`. Aplicar a segunda migration **antes de publicar a versão com liberação por turma**, usando a CLI vinculada ao projeto correto:

```bash
supabase migration list --remote
supabase db push --remote
```

Se a operação for feita pelo SQL Editor, executar o conteúdo completo de `202611140002_course_enrollment.sql` uma única vez e reconciliar o histórico antes de voltar à CLI. Não reaplicar a migration inicial nem executar reset em produção. A alteração mantém matrículas, progresso e práticas existentes; restringe as políticas de progresso/práticas a alunos com matrícula e professores autorizados. Não exige novas variáveis na hospedagem.

Sem essa migration, o aplicativo já pode negar suas próprias rotas, mas a API direta do Supabase ainda usará as políticas antigas. A existência do arquivo no Git não comprova sua aplicação remota. Após aplicar e publicar, conferir com contas reais:

- Conta recém-criada vê o painel de matrícula, sem aulas; `/curso`, `/laboratorio`, `/demonstracao` e `/api/materials/aluno` não liberam conteúdo.
- Professor cria turma e envia o código fora do app. Código incorreto não cria vínculo; código correto confirmado pelo aluno libera o curso.
- Aluno sem matrícula não lê nem grava progresso/prática pela API direta do Supabase.
- Sair da última turma ou ter o vínculo removido revoga o acesso; registros pessoais permanecem no banco e voltam a ser acessíveis após nova matrícula válida.
- Outro aluno continua sem acesso a esses registros; professor consulta somente seus alunos.

Remover uma matrícula não invalida o código existente. Quem ainda possui um convite válido pode confirmar uma nova matrícula; esta versão não implementa suspensão permanente de conta nem rotação de convites pela interface.

## 3. Configurar autenticação

No projeto Supabase correspondente a `NEXT_PUBLIC_SUPABASE_URL` da sua instalação, abrir **Authentication → URL Configuration**. Há duas configurações distintas, que precisam ser salvas separadamente. Prefira projetos Supabase separados para desenvolvimento e produção para não misturar contas e retornos de autenticação.

### Site URL: destino padrão

No campo **Site URL**, preencher a origem pública definitiva, sem caminho ou parâmetros:

```text
https://seu-app.example
```

Clicar em **Save changes na seção Site URL** e conferir o valor após recarregar o painel. Substitua o exemplo pela origem definitiva da sua hospedagem. Não colocar `/auth/callback` nem `?code=...` nesse campo. Se o projeto Supabase for exclusivo de desenvolvimento local, usar `http://localhost:3000`; manter a origem de produção quando o mesmo projeto atender o site publicado.

### Redirect URLs: retornos autorizados

Na seção **Redirect URLs**, adicionar e salvar as três entradas exatas de produção:

```text
https://seu-app.example/auth/callback
https://seu-app.example/auth/callback?next=%2Fredefinir-senha
https://seu-app.example/auth/confirm
```

Para testar localmente, adicionar também as três entradas abaixo à lista, mantendo o Site URL de produção quando o Supabase for compartilhado com o site publicado:

```text
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=%2Fredefinir-senha
http://localhost:3000/auth/confirm
```

Se testar uma URL de preview, cadastrá-la explicitamente e usar o mesmo valor em `NEXT_PUBLIC_SITE_URL` daquele ambiente. Evitar curingas amplos na lista de produção.

**Salvar as Redirect URLs não atualiza o Site URL.** Configurar somente a variável na Vercel também não altera esse destino padrão do Supabase. As URLs solicitadas pelo aplicativo precisam estar autorizadas na lista de redirects; o callback com `next=%2Fredefinir-senha` encaminha a recuperação para o formulário de nova senha. [Configuração oficial de redirects](https://supabase.com/docs/guides/auth/redirect-urls)

### Google OAuth para começar sem envio de e-mail

Criar um cliente OAuth do tipo Web no Google Auth Platform. Configurar o consentimento com nome e contato do curso; em modo de testes, cadastrar os usuários de teste. Adicionar a origem do site e, para desenvolvimento, `http://localhost:3000`. A URI de retorno **do Google** é a do Supabase, normalmente `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback`, exibida no painel do provedor Google. Copiar Client ID e Client Secret para **Supabase → Authentication → Providers → Google**. Esses segredos não são variáveis públicas do Next.js. [Configuração oficial Google/Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

A URI do Google e `/auth/callback` do app são etapas diferentes. O Google retorna ao Supabase; o Supabase retorna ao app para trocar o código PKCE pela sessão. Para atender alunos fora da lista de testes, revisar o estado de publicação do consentimento no Google.

### Cadastro, confirmação e recuperação por e-mail

Manter confirmação de e-mail habilitada. O SMTP padrão não é serviço de produção: o limite consultado é 2 mensagens/hora e destinatários da equipe do projeto. Antes de liberar cadastro/recuperação a todos os alunos, configurar host, porta, remetente, usuário e senha de SMTP no Supabase, conferir cotas do fornecedor e testar a entrega. Domínio/verificação do remetente podem gerar custo; nenhum serviço foi contratado por este projeto. [Limitações e SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

O modelo padrão com `{{ .ConfirmationURL }}` funciona com `/auth/callback`, que troca o código PKCE pela sessão. Abra esse link no mesmo navegador usado para iniciar cadastro/recuperação, pois o verificador fica no navegador. Links antigos recebidos na raiz, em `/auth/confirm` ou em `/redefinir-senha` com `code` são encaminhados ao callback no mesmo domínio, sem cache. Isso não corrige um domínio inexistente no e-mail: o Site URL e a lista de redirects precisam ser corrigidos no Supabase.

Para confirmação em outro navegador/dispositivo, em **Email Templates**, usar o handler que valida `token_hash`. Os modelos abaixo sempre levam ao **Site URL** do projeto; se o mesmo Supabase atende desenvolvimento e produção, o destino será o Site URL salvo, mesmo quando a solicitação partir do outro ambiente. Exemplo para confirmação de cadastro:

```html
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=signup&amp;next=/painel"
  >Confirmar meu e-mail</a
>
```

Para **Reset Password**:

```html
<a
  href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=recovery&amp;next=/redefinir-senha"
  >Definir uma nova senha</a
>
```

Não desabilitar confirmação para contornar envio. Usar Google OAuth enquanto SMTP não estiver pronto. Testar links expirados, link já utilizado e recuperação em outro navegador.

### E-mail aponta para domínio antigo ou retorna 404

1. Em **Authentication → URL Configuration**, corrigir o **Site URL**, clicar em **Save changes nessa seção** e conferir o valor após recarregar o painel. Em seguida, cadastrar e salvar as três Redirect URLs de produção acima. Se as três URLs já estiverem corretas, corrigir somente o Site URL; não é necessário recriá-las.
2. Em **Email Templates → Confirm signup / Reset Password**, conferir se não existe domínio antigo escrito diretamente no HTML. Usar `{{ .ConfirmationURL }}` ou os modelos `{{ .SiteURL }}` acima. [Variáveis dos templates](https://supabase.com/docs/guides/auth/auth-email-templates)
3. Nas variáveis de produção da hospedagem (na Vercel, **Settings → Environment Variables → Production**), conferir `NEXT_PUBLIC_SITE_URL=https://seu-app.example`. Se mudar a variável, fazer **Redeploy**: a alteração só vale para novos deployments. Manter `http://localhost:3000` no `.env.local` de desenvolvimento. [Variáveis da Vercel](https://vercel.com/docs/environment-variables)
4. Gerar um novo e-mail após salvar as configurações; mensagens antigas não são reescritas. Se o e-mail já foi confirmado antes de ocorrer o erro de redirecionamento, tentar entrar normalmente com e-mail e senha.
5. Confirmar entrada no painel e testar recuperação de senha no mesmo navegador. Não copiar códigos reais para logs, testes ou Git.

## 4. Criar o primeiro professor

Este procedimento é para o administrador da **sua instalação**. Para solicitar acesso na instância compartilhada, use o [guia do professor](TEACHERS.md).

A conta se cadastra normalmente e recebe papel `student` pelo banco. Depois da confirmação do e-mail/identidade, o administrador executa `supabase/promote-teacher.sql` no SQL Editor, substituindo o e-mail de exemplo pelo e-mail correto. Conferir que uma linha foi retornada com `role = teacher`. Se não retornar nenhuma, confirme o e-mail exato, a confirmação da identidade, o primeiro login e se você abriu o projeto Supabase correto. Não editar `user_metadata`, não aceitar papel enviado pelo cliente e não expor uma chave `service_role` para essa tarefa.

O professor entra novamente, abre sua área, cria uma turma e envia o código de matrícula diretamente aos alunos, fora do aplicativo. O aluno entra com a própria conta e confirma o código no painel; só então o curso é liberado. O professor passa a ver somente os alunos vinculados às próprias turmas. As aulas incluem um modo de apresentação em sete etapas, disponível na seção do professor e controlado por teclado ou botões.

## 5. GitHub e publicação automática na main

Crie um **fork na sua conta** ou um repositório próprio com o código e mantenha a branch `main`. A integração da hospedagem deve apontar para esse repositório. O repositório original é público; escolha a visibilidade da sua cópia conforme suas necessidades. Credenciais e registros reais continuam fora do Git.

Se você clonou o original e depois criou um fork, ajuste o destino de envio (substitua `SEU_USUARIO`):

```bash
git remote set-url origin https://github.com/SEU_USUARIO/violao-basico-intermediario.git
git remote -v
```

Depois de revisar suas alterações:

```bash
npm run check
git status
git add .
git commit -m "Implementa Violão Vivo com alunos e professores"
git push -u origin main
```

Revisar os arquivos antes de adicionar: `.env.local`, tokens, backups e dados reais não devem aparecer. O workflow `.github/workflows/ci.yml` verifica PRs e pushes à `main`, com permissões de leitura e cancelamento de execução anterior.

No repositório público, configurar proteção da `main` e exigir o check do workflow quando disponível no painel. O build da hospedagem também executa os checks antes de publicar. Essas proteções precisam ser habilitadas na conta; não são criadas apenas por versionar o workflow. [Planos do GitHub](https://docs.github.com/en/get-started/learning-about-github/githubs-plans)

## 6. Vercel Hobby

1. Para uso **pessoal e não comercial**, entrar na Vercel com a conta pessoal e permanecer no plano **Hobby**. Autorizar a integração GitHub para este repositório.
2. **Add New → Project → Import Git Repository** e selecionar **seu fork/repositório**.
3. Framework: **Next.js**. Root Directory: raiz do repositório. Node.js: **22.x**.
4. Install Command: `npm ci`. Build Command: **`npm run check`**. Output Directory: padrão do Next.js.
5. Em **Settings → Environment Variables**, selecionar **Production** e cadastrar as três variáveis da tabela abaixo. URL e chave Supabase devem pertencer ao mesmo projeto configurado na seção 3.
6. Em **Settings → Environments → Production → Branch Tracking**, confirmar **main**. Publicar e completar as URLs de retorno no Supabase.
7. Se a URL definitiva só ficou conhecida após a primeira publicação, ajustar `NEXT_PUBLIC_SITE_URL`, Site URL e redirects e fazer redeploy. Variáveis `NEXT_PUBLIC_*` precisam estar corretas no build.
8. Testar o fluxo com duas contas de alunos e uma de professor. Confirmar o SHA do deployment e o commit de `main` correspondente.

| Variável                               | Valor em Production                                                       |
| -------------------------------------- | ------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL HTTPS do projeto Supabase, como `https://SEU_PROJECT_REF.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Chave **publishable** do mesmo projeto, copiada do painel Supabase        |
| `NEXT_PUBLIC_SITE_URL`                 | `https://seu-app.example`                                                 |

O domínio acima é fictício; substitua pela origem definitiva da sua hospedagem. Não incluir caminho ou parâmetros em `NEXT_PUBLIC_SITE_URL`. Manter os valores reais fora do Git e usar `.env.example` como referência dos nomes. A aplicação não usa chave `service_role` nem senha do banco na Vercel.

Alterar variáveis de ambiente não modifica um deployment já criado: fazer **Redeploy** ou enviar um novo commit à `main` para gerar outro build. Essa operação não altera Site URL/Redirect URLs no Supabase; salvar essas configurações separadamente, conforme a seção 3. Em `.env.local`, manter `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. [Variáveis de ambiente da Vercel](https://vercel.com/docs/environment-variables)

Depois de conectada a integração, cada novo commit enviado à `main` inicia build e, se `npm run check` passar, deployment de produção. O pipeline do GitHub e o build da Vercel são execuções independentes; a Vercel não aguarda automaticamente o GitHub Actions, razão para repetir os checks no Build Command. [Integração Git](https://vercel.com/docs/git), [builds](https://vercel.com/docs/builds)

Mudanças de banco são aplicadas por migrations antes de publicar código que dependa delas. Não há migration automática privilegiada no build. Isso evita entregar senha do banco à hospedagem e exige planejar alterações compatíveis com a versão anterior.

## 7. Alternativa Netlify Free

Se o uso for comercial, usar a alternativa Netlify Free e conferir as condições atuais do plano antes de conectar a conta. Importar o mesmo repositório pessoal no painel, confirmar production branch `main`, Node 22 e variáveis iguais; usar a URL `*.netlify.app` em `NEXT_PUBLIC_SITE_URL` e nos redirects Supabase. O `netlify.toml` executa `npm run check`; o adaptador oficial detecta App Router, SSR e Route Handlers. Não fixar uma versão antiga do adaptador. [Suporte Next.js](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)

O plano atual tem 300 créditos mensais compartilhados e pode pausar os projetos ao esgotar a cota. Conferir [FREE-TIER.md](FREE-TIER.md) antes da migração. Não habilitar recarga automática nem plano de avaliação. Contas antigas podem ter limites diferentes dos planos atuais.

## Servidor próprio ou outra hospedagem Node.js

Use uma hospedagem que execute **Node.js 22 e Next.js com servidor**. GitHub Pages, uma pasta de arquivos estáticos ou hospedagem somente PHP não executam a autenticação e as APIs deste projeto. Vercel não é obrigatória; Supabase pode continuar hospedado ou ser operado separadamente por você.

1. Disponibilize seu checkout no servidor, incluindo `materials/`, `public/`, os arquivos de configuração e `package-lock.json`.
2. Configure as três variáveis da seção 1 no ambiente da hospedagem, ou em `.env.local` privado no servidor. Use `NEXT_PUBLIC_SITE_URL=https://seu-app.example`, substituindo pela sua origem real.
3. Instale e gere o build **com essas variáveis já presentes**:

```bash
npm ci
npm run check
```

4. Inicie o servidor de produção:

```bash
npm start
```

O comando escuta na porta 3000 por padrão. Em plataformas que fornecem porta por ambiente, use `PORT`; ou escolha uma porta explicitamente com `npm start -- --port 3001`. Não use `npm run dev` em produção.

5. Configure a hospedagem para manter esse processo ativo e reiniciá-lo após falhas/reboots. Em um VPS, use o gerenciador de serviços da máquina, como systemd; em uma plataforma gerenciada, informe `npm start` como comando de inicialização.
6. Disponibilize **HTTPS** na origem escolhida. Em VPS, um proxy reverso como Nginx/Caddy deve encaminhar para a porta do Next.js, preservando `Host`, `X-Forwarded-Host` e `X-Forwarded-Proto` corretos. Restrinja a porta interna ao proxy e preserve as respostas privadas sem cache público. Se o provedor já oferece HTTPS/proxy, use essa configuração.
7. No Supabase, salve sua origem em Site URL e os três callbacks da seção 3. Se usar Google, configure também o retorno ao Supabase no provedor.
8. Execute a validação da seção 9 usando **seu endereço público**.

Mantenha as variáveis também no processo em execução. Não copie apenas `.next`: o projeto usa `next start` e precisa das dependências, arquivos de configuração, `public/` e dos PDFs em `materials/`. Não há persistência de usuários no disco do app; ela fica no Supabase. A aquisição de servidor/domínio e a operação dessa infraestrutura são escolhas suas, não serviços gratuitos fornecidos pelo repositório. [Guia oficial de self-hosting Next.js](https://nextjs.org/docs/app/guides/self-hosting).

### Atualizar sua instalação

Em uma cópia sem alterações locais pendentes, obtenha o novo código da sua `main`, confira novas migrations, faça backup e aplique apenas as migrations pendentes no Supabase. Depois execute `npm ci`, `npm run check` e reinicie o processo de produção. Em hospedagem ligada ao GitHub, o envio à `main` pode iniciar esse build automaticamente; **migrations continuam sendo uma operação separada**. Em VPS sem integração Git, um push não publica sozinho: configure seu pipeline ou atualize manualmente.

## 8. Exportação, recuperação e rollback

O Free não oferece o mesmo backup disponível aos planos pagos. Fazer exportação regular e antes de migrations. Para exportar o esquema e os dados da aplicação em CLI v3 já vinculada:

```bash
supabase db dump --remote --schema public --file /CAMINHO-PRIVADO/violao-schema.sql
supabase db dump --remote --schema public --data-only --use-copy --file /CAMINHO-PRIVADO/violao-data.sql
```

Usar uma pasta privada fora do Git e do diretório público do app. Esses arquivos contêm dados pessoais. Eles são uma exportação da aplicação, **não um backup completo das contas Auth**. Para restauração em novo projeto, também preservar as identidades Auth e seguir o procedimento oficial de backup/restauração, incluindo papéis e dados gerenciados; UUIDs de usuários são referenciados por chaves estrangeiras. Testar a recuperação em um projeto de teste e conferir RLS e privilégios após restaurar. Não restaurar diretamente sobre produção sem preparar a operação. [Backup e restore oficial](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)

Uma pausa por inatividade deve ser retomada no painel Supabase, seguida por teste de login e gravação. O rollback do frontend pode promover o deployment anterior na hospedagem; migrations de banco exigem migration corretiva compatível, não apenas rollback do site.

Exportação individual e exclusão de conta são operações administrativas descritas em [DATA-ADMINISTRATION.md](DATA-ADMINISTRATION.md), com o efeito das chaves estrangeiras e o cuidado com cópias de segurança.

## 9. Validação após conectar as contas

- Aluno A cria prática e conclusão; sai e retorna; os registros permanecem.
- Aluno B não vê nem altera esses registros, inclusive chamando a API diretamente.
- Professor A vê a turma A e seus alunos. Professor B não acessa a turma A nem registra feedback nela.
- Aluno não se promove a professor por formulário, API ou metadados Auth.
- Código de turma inválido falha; matrícula repetida não duplica o vínculo.
- Professor agenda encontro; aluno matriculado vê horário convertido; aluno externo não vê.
- Sair remove acesso protegido; callback externo/manipulado não redireciona para domínio arbitrário.
- Link de confirmação/recuperação e Google OAuth funcionam na URL de produção.
- Um commit válido em `main` aparece no deployment de produção com o mesmo SHA.

Os testes automatizados locais não substituem essa validação da configuração real de Auth, RLS, callbacks e hospedagem.

## 10. O que depende das contas

| Configuração externa                | Resultado esperado                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------ |
| GitHub: acesso, push e visibilidade | Seu repositório na `main`, com acesso autorizado à hospedagem                  |
| Supabase Free                       | Projeto criado, migrations aplicadas, URL e chave publicável disponíveis       |
| Google e/ou SMTP                    | Provedor habilitado, callbacks e entrega real validados                        |
| Promoção administrativa             | Conta correta com papel professor                                              |
| Hospedagem escolhida                | Repositório conectado, variáveis, `main`, Build Command e domínio configurados |
| Teste em produção                   | Duas contas isoladas, um professor e progresso persistente                     |

A presença destes arquivos configura o projeto para a publicação; somente o estado retornado pelos serviços confirma que cada etapa externa foi executada.

O `vercel.json` também fixa `npm ci` e `npm run check`, conforme a [configuração oficial de projetos Vercel](https://vercel.com/docs/project-configuration). A conexão da conta e a branch de produção continuam sendo configuradas no painel.
