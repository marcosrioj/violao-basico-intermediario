# Aplicação dos padrões de engenharia fornecidos

O catálogo “Padrões de engenharia reutilizáveis”, incluído no texto anexado, foi tratado como referência de arquitetura. Os caminhos .NET do documento são evidências de outro projeto, não arquivos existentes neste repositório. A adaptação usa TypeScript e PostgreSQL, com uma aplicação modular única.

| Família do catálogo          | Aplicação neste projeto                                                                                                                       | Limite explícito                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Responsabilidades e camadas  | Páginas/componentes apresentam; contratos e validação descrevem entrada; serviços coordenam operações; clientes Supabase adaptam persistência | Não há microserviços nem um container de injeção de dependências                     |
| Composição e dependências    | Clientes de navegador/servidor e contexto autenticado centralizados                                                                           | Funções simples substituem fábricas e classes quando suficientes                     |
| Entradas finas e CQRS lógico | Route Handlers autenticam, validam e delegam; operações de leitura e escrita distintas                                                        | Mesmo banco e mesmo deploy; sem mediator obrigatório                                 |
| DTOs e erros                 | Tipos compartilhados, schemas Zod, mensagens seguras e identificador de requisição                                                            | Erro interno do provedor não deve chegar ao aluno                                    |
| Validação em camadas         | Formulário, API, constraints e RLS no PostgreSQL                                                                                              | O frontend nunca é a autoridade de segurança                                         |
| Persistência e desempenho    | Migrations, chaves estrangeiras, unicidade, índices, seleção de campos e paginação                                                            | Não há ORM nem rastreamento de entidades                                             |
| Unidade de trabalho          | Operações SQL/RPC quando a alteração precisa ser atômica; upsert para progresso                                                               | Uma série de chamadas HTTP não é transação distribuída                               |
| Isolamento                   | Sessão do Supabase + papel protegido + vínculo de turma + RLS por linha                                                                       | Código público e conteúdo editorial não expõem registros pessoais protegidos por RLS |
| Credenciais                  | Chave publicável no cliente; senhas e segredos do provedor fora do Git                                                                        | `service_role` não participa do fluxo normal                                         |
| Idempotência                 | Chaves únicas e atualização do progresso; UUID do registro de prática permite repetição sem duplicar o evento                                 | Não há garantia genérica “exatamente uma vez”                                        |
| Estados de interface         | Carregamento, vazio, erro recuperável e sucesso; pendência ao enviar formulários                                                              | Estado local temporário não equivale a persistência                                  |
| Componentes e acessibilidade | Navegação, formulários, cartões e controles reutilizados; teclado e layout responsivo                                                         | Auditoria WCAG integral não é inferida a partir de componentes                       |
| Estado remoto e local        | Dados pessoais retornam da API; andamento e seleção de ferramentas ficam na interface                                                         | Sem cache público dos dados de aluno                                                 |
| Instantes e idioma           | `timestamptz` para instantes, perfil com fuso IANA e interface em português                                                                   | Localização para outros idiomas não foi implementada                                 |
| Verificação                  | Tipos, lint, build, casos negativos e teste de políticas em banco de teste                                                                    | Testes locais não comprovam configuração do Supabase hospedado                       |
| Ambiente e operação          | Lockfile, `.env.example`, pipeline, migrations e guia de publicação                                                                           | Criar arquivos de CI não prova que houve execução remota                             |

## Padrões não adicionados sem necessidade

Inbox/outbox, filas, workers contínuos, notificações em tempo real, upload de mídia, sagas, Event Sourcing e exclusão lógica não são requisitos do fluxo inicial. Não foram criadas dependências pagas ou mecanismos incompletos apenas para usar esses nomes. Se houver importação de vídeos, tarefas demoradas ou pagamentos no futuro, esses casos exigirão desenho e testes próprios.

Não existe rastreamento distribuído entre fornecedores, auditoria inviolável, antivírus, detecção de desempenho musical por IA ou sincronização offline. Os registros pedagógicos possuem autoria e instante; isso não os transforma em trilha de auditoria imutável.

## Regra de evolução

Uma funcionalidade nova deve declarar entrada, papel autorizado, dados consultados, efeito persistido, erros esperados e teste negativo de acesso. Uma tabela nova exposta deve trazer RLS e privilégios explícitos na mesma migration. Qualquer cache com dados pessoais precisa justificar chave, contexto e invalidação; o padrão inicial é não armazená-los em cache compartilhado.

O dono de cada assunto documental é: arquitetura em `ARCHITECTURE.md`; configuração e operação em `DEPLOYMENT.md`; cotas em `FREE-TIER.md`; fidelidade editorial em `CONTENT.md`; evidência didática em `PEDAGOGY-RESEARCH.md`. O README aponta para essas referências.

A liberação do curso é centralizada em `requireCourseProfile` para páginas e `courseApi` para operações protegidas. Ambas consultam a matrícula persistida; o navegador apenas apresenta o estado. A migration de matrícula aplica a mesma exigência às políticas de progresso e prática. Consulta com erro não libera acesso, e a revogação não apaga o histórico pessoal. Conta, adesão por código e autorização do curso são responsabilidades distintas.

Identidade e padrões visuais são mantidos em [brand-guidelines.md](brand-guidelines.md) e [DESIGN-SYSTEM.md](DESIGN-SYSTEM.md). Os tokens compartilham a mesma paleta e escala em todas as folhas de estilo; o modo de apresentação reutiliza os dados da aula, sem duplicar o currículo ou introduzir dependências de execução. Alterações visuais preservam os controles de áudio explícitos e a autorização aplicada no servidor.

## Dependências de desenvolvimento

O override de `minimatch` 11.0.8 aplica-se somente ao parser do ESLint, para corrigir o advisory GHSA-g3hv-75wg-m249. Lint, tipos e testes foram executados com essa versão. Reavaliar o override quando `typescript-eslint` incorporar a correção no próprio intervalo de dependências. O lockfile fixa as versões resolvidas e `npm ci` garante instalações reproduzíveis.
