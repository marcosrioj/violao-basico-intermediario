# Violão Vivo

Curso de violão gospel do básico ao intermediário, **13 módulos e 39 aulas com 27 estudos técnicos integrados**, cifras interativas, laboratório musical e acompanhamento de alunos por turma. Feito com Next.js, TypeScript e Supabase.

Cada aula segue o percurso **entender, treinar, aplicar e revisar**. Os estudos completos ficam dentro da aula, com foco específico e indicação de introdução ou retomada; os nove eixos permanecem como índice de consulta. O professor dispõe de 39 planos de 60 minutos, diagnóstico, adaptações, apresentação com os estudos da aula e rubrica de execução. Os PDFs do aluno e do professor seguem essa sequência e incluem o acervo original integral. [Mapa da trilha integrada](docs/INTEGRATED-LEARNING.md) · [Conteúdo e geração dos materiais](docs/CONTENT.md) · [Pesquisa musical](docs/CURRICULUM-RESEARCH.md) · [Pesquisa pedagógica](docs/TEACHING-RESEARCH.md).

## Quero usar como professor, sem instalar

Você pode **criar sua turma gratuitamente** na [instância compartilhada do Violão Vivo](https://violao-basico-intermediario-iota.vercel.app).

1. Abra o site e **crie uma conta comum**. Confirme seu e-mail ou entre com Google.
2. Envie a solicitação abaixo para **[marcosrioj@gmail.com](mailto:marcosrioj@gmail.com)**. Inclua o **e-mail exato da conta cadastrada** para identificarmos seu usuário.
3. Aguarde a liberação, saia e entre novamente. Na **Área do professor**, crie sua turma e entregue o código aos alunos pelo canal combinado.
4. Cada aluno cria sua própria conta e confirma esse código no painel para liberar o curso.

```text
Para: marcosrioj@gmail.com
Assunto: Solicitação de acesso de professor — Violão Vivo

Olá, Marcos!

Já criei minha conta no Violão Vivo e gostaria de solicitar
acesso de professor para criar uma turma gratuita.

Nome: [seu nome]
E-mail da conta cadastrada: [email usado para entrar no aplicativo]

Obrigado!
```

Substitua os campos entre colchetes. Não envie senha nem código de confirmação. Mais detalhes no [guia do professor](docs/TEACHERS.md).

## Quero instalar minha própria instância

Sua instalação usa **seu banco, suas contas e seu endereço**. Você não precisa solicitar acesso ao mantenedor para administrar sua própria instância.

### 1. Baixar e instalar

Instale **Git, Node.js 22 e npm**. Depois:

```bash
git clone https://github.com/marcosrioj/violao-basico-intermediario.git
cd violao-basico-intermediario
npm ci
cp .env.example .env.local
```

No Windows, você também pode copiar `.env.example` para `.env.local` pelo explorador de arquivos. Para publicar automaticamente na sua conta, faça um **fork** e conecte esse fork à hospedagem.

**Se for usar a Supabase CLI**, para migrations ou para executar o Supabase no computador, crie também a configuração local, preservando qualquer arquivo existente:

```bash
cp -n supabase/config.local.toml.example supabase/config.toml
```

No Windows, copie o modelo pelo explorador de arquivos e renomeie a cópia para `config.toml`, sem substituir um arquivo existente. Essa cópia é ignorada pelo Git; as URLs de autenticação do projeto hospedado são configuradas no painel Supabase. Se usar apenas o painel, essa cópia não é necessária. [Detalhes sobre as URLs entre publicações](docs/DEPLOYMENT.md#preservar-as-urls-de-auth-entre-publicações).

### 2. Preparar o Supabase

Crie seu projeto no [Supabase](https://supabase.com/dashboard). No **SQL Editor**, execute estes arquivos completos, uma vez cada e nesta ordem:

1. [`202611140001_initial.sql`](supabase/migrations/202611140001_initial.sql)
2. [`202611140002_course_enrollment.sql`](supabase/migrations/202611140002_course_enrollment.sql)

Eles criam tabelas, permissões e regras de matrícula. Não precisa importar os PDFs nem criar buckets: o conteúdo já está no repositório.

Prefere executar também o banco no seu computador? Siga a [opção totalmente local com Supabase CLI e Docker](docs/DEPLOYMENT.md#supabase-totalmente-local).

### 3. Preencher as três variáveis

Edite `.env.local` com a URL e a chave **publishable** do **seu** projeto Supabase:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Os dois primeiros valores são exemplos: substitua pelos do painel Supabase. Não use `service_role`, chave secreta ou senha do banco. Não envie `.env.local` ao GitHub.

### 4. Configurar o login

Em **Supabase → Authentication → URL Configuration**, salve:

- **Site URL:** `http://localhost:3000`
- **Redirect URLs:**

```text
http://localhost:3000/auth/callback
http://localhost:3000/auth/callback?next=%2Fredefinir-senha
http://localhost:3000/auth/confirm
```

Configure pelo menos uma forma de entrada: **[Google OAuth](docs/DEPLOYMENT.md#google-oauth-para-começar-sem-envio-de-e-mail)** ou **[e-mail com SMTP](docs/DEPLOYMENT.md#cadastro-confirmação-e-recuperação-por-e-mail)**. O envio padrão do Supabase hospedado é limitado e não atende livremente todos os alunos; mantenha a confirmação de e-mail habilitada.

### 5. Abrir e criar o primeiro professor

```bash
npm run dev
```

Abra **[localhost:3000](http://localhost:3000)**, crie sua conta e confirme a identidade. No SQL Editor do **seu Supabase**, execute [`supabase/promote-teacher.sql`](supabase/promote-teacher.sql), substituindo `professor@example.com` pelo e-mail dessa conta. A consulta deve retornar uma linha com `role = teacher`.

Saia e entre novamente. Crie uma turma na Área do professor e use outra conta para testar a matrícula de um aluno. **Criar conta não libera as aulas:** o aluno precisa confirmar o código da turma. [Passo a passo e solução de problemas](docs/DEPLOYMENT.md#4-criar-o-primeiro-professor).

Para conferir o projeto, pare `npm run dev` com **Ctrl+C**; o teste HTTP precisa da porta 3000 livre:

```bash
npm run check       # lint, tipos, testes e build
npm run test:http:ci # testes HTTP contra o build
```

Sem Supabase configurado, `npm ci` e `npm run dev` permitem ver apenas a apresentação pública e a privacidade; não é uma instalação completa do curso.

## Quero publicar no meu endereço

1. Use seu fork/repositório na branch `main` e escolha uma hospedagem com suporte a **Next.js com servidor**.
2. Configure as três variáveis **antes do build**, usando **sua URL HTTPS definitiva** em `NEXT_PUBLIC_SITE_URL`.
3. No Supabase, salve essa mesma origem em **Site URL** e adicione as três **Redirect URLs** acima, trocando `http://localhost:3000` por sua origem HTTPS.
4. Publique. Se mudar uma variável `NEXT_PUBLIC_*`, gere um novo build/deploy.

Escolha o guia:

- **[Vercel Hobby](docs/DEPLOYMENT.md#6-vercel-hobby):** uso pessoal e não comercial; publicação automática ao enviar commits à `main` do seu repositório.
- **[Netlify](docs/DEPLOYMENT.md#7-alternativa-netlify-free):** alternativa documentada para uso comercial, sujeita às condições do plano.
- **[Servidor próprio ou outra hospedagem Node.js](docs/DEPLOYMENT.md#servidor-próprio-ou-outra-hospedagem-nodejs):** `npm ci`, `npm run check` e `npm start`, com HTTPS e processo contínuo.

O endereço da instância compartilhada serve apenas para quem quer usá-la. **Não copie esse endereço para configurar sua instalação.** Consulte [cotas e condições dos serviços gratuitos](docs/FREE-TIER.md).

## Documentação

Confira a [verificação da atualização do curso](docs/COURSE-VERIFICATION.md), incluindo preservação dos materiais, testes da aplicação e revisão dos PDFs.

| Preciso de…                                       | Guia                                                                                                |
| ------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Criar uma turma na instância compartilhada        | [Professor: cadastro, solicitação e matrícula](docs/TEACHERS.md)                                    |
| Instalar, configurar login, publicar ou atualizar | [Guia completo de instalação e hospedagem](docs/DEPLOYMENT.md)                                      |
| Conferir custos e limites                         | [Planos gratuitos](docs/FREE-TIER.md)                                                               |
| Administrar, exportar ou excluir dados            | [Administração de dados](docs/DATA-ADMINISTRATION.md)                                               |
| Entender o código e contribuir                    | [Arquitetura](docs/ARCHITECTURE.md) · [Engenharia](docs/ENGINEERING.md)                             |
| Conhecer conteúdo e metodologia                   | [Conteúdo](docs/CONTENT.md) · [Pedagogia](docs/PEDAGOGY.md) · [Pesquisa](docs/PEDAGOGY-RESEARCH.md) |
| Entender os exercícios e andamentos               | [Laboratório](docs/LABORATORY-RESEARCH.md) · [Andamentos](docs/TEMPO-RESEARCH.md)                   |
| Manter a interface e a identidade                 | [Sistema de design](docs/DESIGN-SYSTEM.md) · [Marca](docs/brand-guidelines.md)                      |
| Conferir o que foi testado                        | [Verificação](docs/VERIFICATION.md) · [Segurança](docs/VERIFICATION-security.md)                    |

Código e materiais editoriais estão públicos; contas, matrículas e registros pessoais ficam no Supabase de cada instalação. O projeto, incluindo seu código e materiais autorais, é distribuído sob a [licença MIT](LICENSE). Materiais de terceiros mantêm seus direitos e licenças próprios. Detalhes em [Conteúdo](docs/CONTENT.md).
