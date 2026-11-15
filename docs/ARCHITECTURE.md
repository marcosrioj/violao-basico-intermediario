# Arquitetura do Violão Vivo

Para instalar e operar uma cópia independente, use [DEPLOYMENT.md](DEPLOYMENT.md). Para utilizar a instância compartilhada como professor, veja [TEACHERS.md](TEACHERS.md). Cada instância tem seu próprio Supabase, contas e origem pública.

O projeto reúne o curso gospel básico ao intermediário e o acompanhamento semanal em um monólito modular. O conteúdo editorial é versionado; o progresso e as relações entre pessoas são persistidos no Supabase. O backend pode executar em funções da hospedagem ou em um servidor Next.js contínuo. Não depende de processos de fundo nem de disco local para guardar dados de usuários.

```mermaid
flowchart LR
  B[Navegador: aluno ou professor] --> N[Next.js: páginas e Route Handlers]
  B --> A[Supabase Auth: Google ou e-mail]
  N --> U[Contexto autenticado e autorização]
  U --> C[Comandos e consultas]
  C --> P[PostgreSQL com RLS e constraints]
  E[Conteúdo v5 versionado] --> N
  G[GitHub main] --> V[Build na hospedagem: npm run check]
  V --> N
```

## Fronteiras

- `src/app`: rotas, composição das páginas, callbacks de autenticação e adaptadores HTTP.
- `src/components`: apresentação compartilhada e ferramentas musicais interativas no navegador.
- `src/content`: módulos, aulas, teoria, referências, plano do professor e proveniência extraídos dos materiais.
- `src/lib/contracts.ts` e `validation.ts`: DTOs e schemas de entrada.
- `src/lib/application`: comandos de escrita e consultas de leitura.
- `src/lib/supabase`: clientes oficiais separados por ambiente; o cliente de servidor carrega a sessão da requisição.
- `src/lib/auth.ts`, `endpoint.ts`, `http.ts` e `errors.ts`: autenticação, papel, origem, limite de corpo, respostas e registro seguro.
- `supabase/migrations`: esquema, funções e políticas. `supabase/promote-teacher.sql` é operação administrativa separada.

A escolha de Next.js/React e as versões efetivamente instaladas estão no manifesto e lockfile. A linha Next.js 16 recebeu correções relevantes em novembro de 2026; atualizações futuras devem preservar os testes de isolamento e a ausência de cache compartilhado de dados privados. [Release oficial de segurança](https://nextjs.org/blog/november-2026-security-release)

## Autenticação e autorização

Supabase Auth verifica identidade. Nas operações de dados, o servidor usa `getUser()` e carrega o perfil protegido no banco; sessão presente em cookie não basta para permitir acesso aos registros. O logout verifica a origem e usa o cliente SSR associado aos cookies para encerrar a sessão local, sem depender de consulta a `profiles` ou de `getUser()`. O papel padrão criado pelo trigger é `student`, mesmo se metadados enviados pelo cliente disserem outra coisa. A promoção é administrativa, sem endpoint público.

O professor administra as próprias turmas. O aluno acessa os próprios registros. O professor pode consultar o progresso e as práticas dos alunos matriculados em uma de suas turmas, para acompanhar o curso; esse progresso pertence ao aluno, e não a uma turma específica. Feedback e encontros pertencem à turma. A remoção de um vínculo pelo próprio aluno ou pelo professor proprietário deve ser considerada junto com os efeitos de cascata documentados na migration: feedback daquela matrícula é removido; progresso pessoal permanece.

O cadastro ou login sozinho não libera o curso. O professor cria a turma e entrega seu código fora do aplicativo; o aluno confirma esse código pelo comando de matrícula, que persiste o vínculo em `memberships`. Antes desse vínculo, o aluno acessa somente sua conta e a tela de matrícula. Aulas, consultas, laboratório, apresentações e materiais exigem ao menos uma matrícula vigente; o papel protegido `teacher` continua autorizado para preparar e ministrar o conteúdo.

O guard `requireCourseProfile()` protege páginas e `courseApi()` protege APIs antes de executar operações do curso. A consulta usa a sessão SSR e não guarda autorização em cache compartilhado. A migration `202611140002_course_enrollment.sql` também exige matrícula para ler/gravar progresso e práticas via PostgREST, impedindo contorno pela API direta do banco. Retirar o último vínculo revoga o acesso sem apagar histórico; uma nova matrícula válida restaura o acesso. Remover um vínculo não invalida o código da turma: enquanto o convite existir, sua confirmação permite nova matrícula. Perfil, logout e comandos de matrícula permanecem acessíveis para permitir entrada, correção da conta e saída.

Todas as tabelas expostas têm RLS. Chamadas comuns usam a sessão do usuário e a chave publicável, preservando essas políticas. Não existe cliente `service_role` no fluxo do aplicativo. Funções SQL com privilégios elevados são pequenas, têm `search_path` explícito e verificam papel/vínculo antes de agir. A matrícula por código possui limite persistido de tentativas.

Mutações HTTP exigem origem igual a `NEXT_PUBLIC_SITE_URL`. JSON é limitado e validado com Zod; IDs e relacionamentos são conferidos também no banco. Respostas privadas usam `Cache-Control: private, no-store`. Logs registram operação, status, duração e identificador; não registram notas do aluno, corpo de formulário, cookies, senha ou token.

## Modelo de dados

| Tabela                  | Responsabilidade                             | Escopo de leitura                              |
| ----------------------- | -------------------------------------------- | ---------------------------------------------- |
| `profiles`              | Nome, papel e fuso IANA; ID vinculado a Auth | Próprio usuário e professor de aluno vinculado |
| `classrooms`            | Turma com professor proprietário             | Professor proprietário e aluno matriculado     |
| `classroom_invites`     | Código de entrada da turma                   | Professor proprietário                         |
| `memberships`           | Vínculo único entre turma e aluno            | Próprio aluno e professor proprietário         |
| `lesson_progress`       | Estado, notas e confiança por aluno/aula     | Aluno e professor vinculado                    |
| `practice_logs`         | Sessão de prática, minutos, BPM e observação | Aluno e professor vinculado                    |
| `feedback`              | Devolutiva e validação do professor          | Aluno destinatário e professor da turma        |
| `lesson_sessions`       | Encontro com instante e link HTTPS opcional  | Participantes da turma                         |
| `private.join_attempts` | Controle de tentativas de matrícula          | Apenas função controlada no banco              |

O identificador editorial da aula é `m1-a1` até `m13-a3`. Módulo e aula continuam separados para exibir a numeração reiniciada. Constraints impedem referências de aula fora desse catálogo. Mudar a estrutura do currículo exige alterar conteúdo, validação e constraint por migration coordenada.

A criação da turma e do convite ocorre em uma transação SQL. Matrícula repetida preserva um único vínculo. O progresso é um upsert por aluno/aula; eventos de prática usam UUID para evitar duplicação em retentativa do mesmo envio. Instantes são `timestamptz`; o perfil mantém o fuso de apresentação.

## Contrato HTTP

Operações autenticadas retornam `{ "data": ... }`. Falhas retornam `{ "error": { "code", "message", "requestId" } }` e status HTTP apropriado. Listas de práticas, turmas, feedback e encontros usam `page`, tamanho fixo de 20 e `hasMore`; o progresso retorna no máximo 39 aulas. O cliente não determina uma página ilimitada.

| Caminho                                           | Operações         | Uso                                                        |
| ------------------------------------------------- | ----------------- | ---------------------------------------------------------- |
| `/api/me`                                         | GET, PATCH        | Consultar e editar nome/fuso                               |
| `/api/progress`                                   | GET, PUT          | Consultar e registrar estado de aula                       |
| `/api/practice`                                   | GET, POST         | Diário de prática                                          |
| `/api/classes`                                    | GET, POST         | Listar e criar turma                                       |
| `/api/classes/[id]`                               | GET, DELETE       | Detalhe paginado; remover vínculo autorizado (`studentId`) |
| `/api/classes/[id]/students/[studentId]/practice` | GET               | Diário paginado de aluno matriculado na turma do professor |
| `/api/classes/join`                               | POST              | Matrícula pelo código                                      |
| `/api/feedback`                                   | GET, POST         | Ler e enviar devolutivas                                   |
| `/api/sessions`                                   | GET, POST, DELETE | Ler, agendar e cancelar encontros (`id`)                   |
| `/api/auth/logout`                                | POST              | Encerrar sessão                                            |

Os schemas em `validation.ts` e handlers são a referência executável para campos e permissões. Campos de autoria são derivados da sessão; IDs de outro aluno só são aceitos nos comandos próprios do professor, com checagem do vínculo.

## Conteúdo e interação

O curso preserva 13 módulos com três aulas, encontro semanal de uma hora e a entrada da primeira pestana no módulo 5. As consultas teóricas e suas menções possuem navegação de ida e volta. O conteúdo do professor fica em módulo de servidor, separado dos dados serializados para aluno.

`lesson-journey.json` é a fonte canônica das 86 aplicações dos 27 estudos técnicos nas 39 aulas. A ordem, o estágio de introdução/retomada e o foco alimentam catálogo, conteúdo integrado, apresentação docente, backlinks e PDFs. `relatedLessons` dos estudos é preservado como histórico editorial e não determina a navegação. O catálogo cliente recebe apenas os campos necessários para filtros e títulos; textos integrais são compostos no servidor. A apresentação recebe somente os estudos da aula autorizada. [Contrato da trilha](INTEGRATED-LEARNING.md).

Diagramas, braço do instrumento, metrônomo, reprodução de sequências e percepção auditiva executam localmente no navegador. A Web Audio API sintetiza sons para demonstração; não há streaming de gravação comercial nem serviço de IA. O aluno inicia o áudio e pode pará-lo. A precisão do relógio de áudio depende do dispositivo e das limitações do navegador; metrônomo não avalia a execução do aluno.

PDFs são materiais editoriais de leitura, fora da pasta `public`, com entrega por rota autorizada no aplicativo. Como o repositório GitHub está público no estado atual, os PDFs em `materials/` e os textos do manual do professor também podem ser consultados diretamente no GitHub. A autorização organiza a experiência do app; não fornece sigilo para conteúdo editorial público. Não há upload de dados pessoais nesta versão; Supabase Storage é dispensável. Adicionar gravações de alunos exigiria bucket privado, políticas, limites de tipo/tamanho e ciclo de vida próprios.

## Verificação e limites

`npm run check` é a entrada para checks locais e build da hospedagem. Casos de RLS usam banco de teste com usuários sintéticos. O resultado confirma as políticas naquele ambiente, não a configuração de um projeto Supabase ainda não conectado. Depois da publicação, repetir a matriz de duas contas e professor em [DEPLOYMENT.md](DEPLOYMENT.md).

Sem credenciais, somente apresentação pública e privacidade ficam disponíveis. Não há escrita de usuários em JSON, `localStorage` ou arquivo no servidor. Os dados instrumentais `chords-data.json` são separados dos textos de aulas e planos para os componentes de navegador não importarem o curso completo; o teste da árvore de dependências preserva essa fronteira. Configuração externa e quotas ficam documentadas em [FREE-TIER.md](FREE-TIER.md). O mapa dos padrões recebidos está em [ENGINEERING.md](ENGINEERING.md).
