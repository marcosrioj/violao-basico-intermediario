# Executar e publicar o Violão Vivo

O projeto está preparado para **Vercel Hobby** quando o uso for pessoal e não comercial. Para uso comercial, usar a alternativa **Netlify Free** da seção 7. O código é um único projeto Next.js: frontend, Route Handlers, dados editoriais, migrations e documentação. O banco e as contas ficam no Supabase Free. Não há compra de domínio ou upgrade pago no procedimento.

## 1. Executar localmente

Requisitos: Node.js 22 LTS e npm; para o banco local completo, Supabase CLI e o runtime exigido pela CLI (Docker é a opção usual). A versão exata das dependências do app está no `package-lock.json`.

```bash
npm ci
npm run dev
```

Abrir a origem exata definida em `NEXT_PUBLIC_SITE_URL` (por padrão, `http://localhost:3000`). `localhost` e `127.0.0.1` são origens diferentes: usar uma para navegar e outra na variável fará as mutações serem rejeitadas, como previsto. Sem configuração do Supabase, a demonstração permite conhecer o conteúdo; ela não cria contas nem persiste progresso de alunos.

Para autenticação e persistência, copiar `.env.example` para `.env.local` e substituir os três valores fictícios. Nunca versionar `.env.local`. Use a URL e a chave **publishable** do painel Supabase. `NEXT_PUBLIC_SITE_URL` deve ser a origem exata da aplicação, sem caminho. Em produção com Supabase configurado, essa variável é obrigatória. URLs devem usar HTTPS; HTTP é aceito apenas em loopback para desenvolvimento. Configuração parcial, URL inválida ou chave administrativa em variável pública interrompem o build. A chave publicável nova ou uma chave legada `anon` são aceitas; `service_role` e `sb_secret_` são rejeitadas sem imprimir seu valor.

```bash
cp .env.example .env.local
npm run check
```

`check` executa lint, tipos, testes e build. `npm run test:http:ci` inicia uma instância local do build de produção, executa as verificações HTTP sem contas e encerra o processo. O launcher de desenvolvimento aceita `--host` como alias de `--hostname` e ignora `--strictPort`; um port explícito ocupado já causa falha no Next.js. A aplicação não usa chave administrativa em execução. Senha do banco e tokens de CLI servem exclusivamente para operação, fora do código.

## 2. Preparar o banco Supabase

1. Criar uma organização/projeto **Free**. Escolher uma região próxima dos alunos, guardar a senha do banco em um gerenciador de senhas e não habilitar complementos pagos.
2. Instalar a CLI estável conforme a [documentação oficial](https://supabase.com/docs/guides/local-development/cli/getting-started). Os comandos remotos abaixo seguem a CLI v3. Na CLI v2, consultar `--help`: o seletor tradicional é `--linked`.
3. Autenticar e vincular o projeto. As credenciais devem ser informadas pelo fluxo da CLI, nunca gravadas no Git.
4. Aplicar os arquivos de `supabase/migrations` na ordem. Em projeto existente, primeiro reconciliar seu histórico; o procedimento abaixo presume um projeto novo.

```bash
supabase login
supabase link --project-ref SEU_PROJECT_REF
supabase migration list --remote
supabase db push --remote
```

Conferir o projeto de destino mostrado pela CLI antes de confirmar. Uma alternativa inicial é executar a migration completa no SQL Editor e registrar essa aplicação no histórico da CLI antes de usá-la depois; não executar a mesma migration duas vezes por métodos diferentes. [Migrations oficiais](https://supabase.com/docs/guides/local-development/database-migrations)

Para testar a pilha local, usar `supabase start`, depois `supabase db reset` **somente local**. Copiar URL/chave local para `.env.local`. O reset apaga o banco local e reaplica as migrations; não executar reset remoto de produção. O e-mail de desenvolvimento aparece no coletor local informado pela CLI.

## 3. Configurar autenticação

No Supabase, abrir **Authentication → URL Configuration**:

- Site URL em produção: `https://SEU-PROJETO.vercel.app`.
- Redirect URLs exatas para o desenvolvimento: `http://localhost:3000/auth/callback` e `http://localhost:3000/auth/confirm`.
- Redirect URLs exatas para produção: `https://SEU-PROJETO.vercel.app/auth/callback` e `https://SEU-PROJETO.vercel.app/auth/confirm`.
- Se testar uma URL de preview, cadastrá-la explicitamente e usar o mesmo valor em `NEXT_PUBLIC_SITE_URL` daquele ambiente. Evitar curingas amplos na lista de produção.

### Google OAuth para começar sem envio de e-mail

Criar um cliente OAuth do tipo Web no Google Auth Platform. Configurar o consentimento com nome e contato do curso; em modo de testes, cadastrar os usuários de teste. Adicionar a origem do site e, para desenvolvimento, `http://localhost:3000`. A URI de retorno **do Google** é a do Supabase, normalmente `https://SEU_PROJECT_REF.supabase.co/auth/v1/callback`, exibida no painel do provedor Google. Copiar Client ID e Client Secret para **Supabase → Authentication → Providers → Google**. Esses segredos não são variáveis públicas do Next.js. [Configuração oficial Google/Supabase](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)

A URI do Google e `/auth/callback` do app são etapas diferentes. O Google retorna ao Supabase; o Supabase retorna ao app para trocar o código PKCE pela sessão. Para atender alunos fora da lista de testes, revisar o estado de publicação do consentimento no Google.

### Cadastro, confirmação e recuperação por e-mail

Manter confirmação de e-mail habilitada. O SMTP padrão não é serviço de produção: o limite consultado é 2 mensagens/hora e destinatários da equipe do projeto. Antes de liberar cadastro/recuperação a todos os alunos, configurar host, porta, remetente, usuário e senha de SMTP no Supabase, conferir cotas do fornecedor e testar a entrega. Domínio/verificação do remetente podem gerar custo; nenhum serviço foi contratado por este projeto. [Limitações e SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

Em **Email Templates**, usar links compatíveis com o handler de confirmação. Exemplo para confirmação de cadastro:

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

## 4. Criar o primeiro professor

A conta se cadastra normalmente e recebe papel `student` pelo banco. Depois da confirmação do e-mail/identidade, o administrador executa `supabase/promote-teacher.sql` no SQL Editor, substituindo o e-mail de exemplo pelo e-mail correto. Conferir a linha resultante. Não editar `user_metadata`, não aceitar papel enviado pelo cliente e não expor uma chave `service_role` para essa tarefa.

O professor entra novamente, abre sua área, cria uma turma e compartilha o código de matrícula com os alunos. O aluno entra com a própria conta e usa esse código. O professor passa a ver somente os alunos vinculados às próprias turmas.

## 5. GitHub e publicação automática na main

O remoto é `https://github.com/marcosrioj/violao-basico-intermediario`. O estado atual é **repositório público**, com código e materiais editoriais versionados acessíveis, e branch **main**. Para cumprir a preferência por repositório privado, alterar a visibilidade em **Settings → General → Danger Zone → Change repository visibility**. A permissão disponível nesta entrega permite commits, mas não a alteração dessa configuração. Ao privatizar, conferir a franquia de Actions e manter o orçamento configurado para interromper uso pago. Credenciais e registros reais de alunos/professores continuam fora do Git, no Supabase. A proteção de uma rota de download no aplicativo não torna confidencial um PDF disponível no repositório público.

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

1. Entrar na Vercel com a conta pessoal e permanecer no plano **Hobby**. Autorizar a integração GitHub para este repositório.
2. **Add New → Project → Import Git Repository** e selecionar o repositório.
3. Framework: **Next.js**. Root Directory: raiz do repositório. Node.js: **22.x**.
4. Install Command: `npm ci`. Build Command: **`npm run check`**. Output Directory: padrão do Next.js.
5. Em Environment Variables, cadastrar `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` e `NEXT_PUBLIC_SITE_URL`. Para produção, usar a URL final `https://SEU-PROJETO.vercel.app`.
6. Em **Settings → Environments → Production → Branch Tracking**, confirmar **main**. Publicar e completar as URLs de retorno no Supabase.
7. Se a URL definitiva só ficou conhecida após a primeira publicação, ajustar `NEXT_PUBLIC_SITE_URL`, Site URL e redirects e fazer redeploy. Variáveis `NEXT_PUBLIC_*` precisam estar corretas no build.
8. Testar o fluxo com duas contas de alunos e uma de professor. Confirmar o SHA do deployment e o commit de `main` correspondente.

Depois de conectada a integração, cada novo commit enviado à `main` inicia build e, se `npm run check` passar, deployment de produção. O pipeline do GitHub e o build da Vercel são execuções independentes; a Vercel não aguarda automaticamente o GitHub Actions, razão para repetir os checks no Build Command. [Integração Git](https://vercel.com/docs/git), [builds](https://vercel.com/docs/builds)

Mudanças de banco são aplicadas por migrations antes de publicar código que dependa delas. Não há migration automática privilegiada no build. Isso evita entregar senha do banco à hospedagem e exige planejar alterações compatíveis com a versão anterior.

## 7. Alternativa Netlify Free

Se o uso for comercial, usar a alternativa Netlify Free e conferir as condições atuais do plano antes de conectar a conta. Importar o mesmo repositório pessoal no painel, confirmar production branch `main`, Node 22 e variáveis iguais; usar a URL `*.netlify.app` em `NEXT_PUBLIC_SITE_URL` e nos redirects Supabase. O `netlify.toml` executa `npm run check`; o adaptador oficial detecta App Router, SSR e Route Handlers. Não fixar uma versão antiga do adaptador. [Suporte Next.js](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)

O plano atual tem 300 créditos mensais compartilhados e pode pausar os projetos ao esgotar a cota. Conferir [FREE-TIER.md](FREE-TIER.md) antes da migração. Não habilitar recarga automática nem plano de avaliação. Contas antigas podem ter limites diferentes dos planos atuais.

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

| Configuração externa                | Resultado esperado                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| GitHub: acesso, push e visibilidade | Código entregue na `main`; visibilidade atual pública; ajuste para privado pendente no painel |
| Supabase Free                       | Projeto criado, migrations aplicadas, URL e chave publicável disponíveis             |
| Google e/ou SMTP                    | Provedor habilitado, callbacks e entrega real validados                              |
| Promoção administrativa             | Conta correta com papel professor                                                    |
| Vercel Hobby                        | Repositório conectado, variáveis, `main`, Build Command e domínio configurados       |
| Teste em produção                   | Duas contas isoladas, um professor e progresso persistente                           |

A presença destes arquivos configura o projeto para a publicação; somente o estado retornado pelos serviços confirma que cada etapa externa foi executada.

O `vercel.json` também fixa `npm ci` e `npm run check`, conforme a [configuração oficial de projetos Vercel](https://vercel.com/docs/project-configuration). A conexão da conta e a branch de produção continuam sendo configuradas no painel.
