# Violão Vivo

**Do primeiro acorde à liberdade de adorar.** Aplicação web de ensino de violão gospel, do básico ao intermediário, baseada nos materiais v5 do curso: **13 módulos, 39 aulas e um encontro semanal de 60 minutos**.

O repositório é **público**, por decisão do proprietário. O código e os materiais editoriais estão disponíveis no GitHub; contas, progresso e anotações pessoais ficam no Supabase, protegidos por autenticação e políticas de acesso.

## O que está implementado

- **Aluno:** conta, trilha por módulo, conclusão de aula, confiança e anotações, diário de prática, matrícula em turmas, agenda e devolutivas.
- **Professor:** turmas com código de entrada, acompanhamento individual, planos das aulas, encontros semanais, feedback e validação da execução.
- **Prática:** diagramas de acordes, cifras didáticas com reprodução e repetição, metrônomo, braço interativo, afinação de referência e percepção auditiva.
- **Conteúdo:** aulas completas, consultas teóricas com navegação de ida e volta, links de vídeos/gravações/cifras e PDFs originais. Primeira pestana no módulo 5, após as 12 aulas iniciais.
- **Segurança:** papel de professor concedido administrativamente, validação no servidor, RLS por usuário/vínculo de turma e respostas privadas sem cache público.

A conclusão declarada pelo aluno e a execução validada pelo professor são registros distintos. As ferramentas não avaliam automaticamente a execução instrumental.

## Executar localmente

Requisitos: **Node.js 22 LTS** e npm.

```bash
npm ci
npm run dev
```

Abrir [localhost:3000](http://localhost:3000). **Sem variáveis Supabase**, o conteúdo demonstrativo e os laboratórios funcionam; login e gravação de registros exigem um projeto configurado.

Para usar contas e persistência:

```bash
cp .env.example .env.local
```

Editar `.env.local` com a URL e a chave publicável do seu Supabase; definir `NEXT_PUBLIC_SITE_URL=http://localhost:3000`. Aplicar as migrations e configurar Auth conforme [publicação e ambiente](docs/DEPLOYMENT.md). Reiniciar `npm run dev`. Nenhuma chave administrativa é necessária no aplicativo.

```bash
npm run check  # lint, tipos, testes e build
npm start     # depois de um build bem-sucedido
```

Os testes cobrem contratos, casos negativos, integridade do conteúdo e RLS em PostgreSQL/PGlite com usuários sintéticos. O teste de banco local não comprova callbacks OAuth, SMTP ou configuração do Supabase hospedado; a matriz de validação externa está no guia de publicação.

## Tecnologias e organização

| Camada               | Tecnologia                                                      |
| -------------------- | --------------------------------------------------------------- |
| Interface e backend  | Next.js **16.4.6**, React **19.3.1**, TypeScript                |
| Autenticação SSR     | `@supabase/ssr` **0.12.7**, `@supabase/supabase-js` **2.119.0** |
| Persistência         | PostgreSQL no Supabase, migrations SQL e RLS                    |
| Validação            | Zod; constraints e permissões no banco                          |
| Qualidade            | ESLint, TypeScript, Node Test Runner, PGlite                    |
| Hospedagem principal | Vercel Hobby, uso **pessoal e não comercial**                   |

As versões exatas resolvidas estão no `package-lock.json`. Frontend e Route Handlers são publicados juntos; as funções acessam o banco com a sessão do usuário. Não há persistência de usuários no disco do servidor.

```text
src/app/              páginas, APIs e callbacks Auth
src/components/       interface e ferramentas musicais
src/content/          conteúdo v5 e proveniência
src/lib/              contratos, validação, comandos e consultas
supabase/             migrations, RLS e promoção de professor
materials/            PDFs e guia original, públicos no repositório
scripts/              importação reproduzível do curso
tests/                regras, segurança e isolamento
docs/                 arquitetura, operação, cotas e metodologia
```

## Publicar automaticamente pela main

1. Criar um projeto **Supabase Free**, aplicar as migrations e habilitar Google OAuth. Cadastro/recuperação por e-mail exigem SMTP próprio para atender todos os alunos.
2. Publicar o código na `main` do [repositório GitHub](https://github.com/marcosrioj/violao-basico-intermediario).
3. Importar esse repositório pessoal na **Vercel Hobby**, preset Next.js, Node 22, Install Command `npm ci`, Build Command **`npm run check`** e Production Branch **`main`**.
4. Cadastrar as três variáveis de `.env.example`, usando a URL gratuita `*.vercel.app`, e configurar os retornos de autenticação no Supabase.
5. Criar a conta do professor, promovê-la pelo procedimento administrativo e validar o fluxo com dois alunos diferentes.

Depois dessa conexão, um novo commit enviado à `main` dispara build e publicação, se os checks passarem. Nenhum upgrade, domínio pago ou cobrança automática por consumo é necessário ao desenho inicial. A integração com contas, migrations remotas, OAuth/SMTP, promoção do professor e primeiro deployment são configurações externas; os arquivos do projeto não as executam sozinhos.

O passo a passo, limites e comportamento em caso de cota esgotada estão em [DEPLOYMENT.md](docs/DEPLOYMENT.md) e [FREE-TIER.md](docs/FREE-TIER.md). Netlify Free está documentado como alternativa se o uso se tornar comercial.

## Documentação

- [Verificações executadas e pendências](docs/VERIFICATION.md)
- [Arquitetura e contratos](docs/ARCHITECTURE.md)
- [Padrões de engenharia aplicados](docs/ENGINEERING.md)
- [Execução, Supabase, GitHub e publicação](docs/DEPLOYMENT.md)
- [Planos gratuitos e fontes oficiais consultadas](docs/FREE-TIER.md)
- [Conteúdo, origem e reimportação](docs/CONTENT.md)
- [Pesquisa pedagógica e limites da evidência](docs/PEDAGOGY-RESEARCH.md)
- [Exportação e exclusão de dados pessoais](docs/DATA-ADMINISTRATION.md)

## Código público, materiais e dados pessoais

Os PDFs e planos do professor estão em um repositório público. As rotas do app respeitam o papel da conta, mas não tornam esses arquivos confidenciais no GitHub. Os registros reais de pessoas ficam exclusivamente no Supabase e não devem ser incluídos em commits, testes ou backups versionados.

Nenhuma licença de software foi escolhida nesta entrega. A publicação do código não define automaticamente uma licença MIT ou outra licença de reutilização. Letras, gravações e materiais de terceiros mantêm seus direitos e condições próprios; o aplicativo aponta para as fontes externas e não redistribui gravações comerciais. O campo `private` do `package.json` impede publicação acidental no npm; não altera a visibilidade pública do GitHub.
