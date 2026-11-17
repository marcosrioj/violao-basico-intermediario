# Administração de dados pessoais

Guia do administrador da instância para exportar ou excluir dados pessoais. Confirme a identidade e o escopo do pedido antes de executar o procedimento correspondente.

<details>
<summary>Responsabilidade e dados protegidos</summary>

Este guia é executado pelo administrador do Supabase **da instância em uso**. Para criar sua própria instalação, consulte [DEPLOYMENT.md](DEPLOYMENT.md); para pedir acesso de professor na instância compartilhada, consulte [TEACHERS.md](TEACHERS.md). Contas e turmas de instalações distintas são independentes.

Procedimento do responsável pelo curso para as solicitações descritas na página de privacidade. A aplicação não oferece exclusão administrativa por endpoint público e não precisa de `service_role` no frontend ou nas variáveis normais da hospedagem.

## O que é público e o que é pessoal

O código, os PDFs, o guia HTML e os planos editoriais do professor são públicos no GitHub por decisão do proprietário. Essa publicidade não inclui contas Auth, nomes de alunos, matrículas, progresso, confiança, anotações, diário, feedback ou agenda de turmas. Esses registros ficam no Supabase, com as políticas da migration.

O operador deve informar aos participantes quem é o responsável pelo curso e qual canal já utilizado por eles recebe solicitações. Nenhum endereço de contato foi inventado no projeto. Os pedidos são tratados administrativamente, sem exigir que o aluno publique dados em uma issue do GitHub.

</details>

<details>
<summary>Exportar registros</summary>

## Exportar os registros de uma pessoa

1. Confirmar a identidade e o escopo do pedido pelo canal do curso. Localizar o **UUID exato** em **Supabase → Authentication → Users**. Não usar somente o nome exibido como identificador.
2. No SQL Editor, consultar apenas os campos necessários. O exemplo abaixo usa UUID fictício e exporta dados do próprio aluno; substituir pelo ID verificado.
3. Exportar cada resultado como CSV ou reunir em JSON. Guardar temporariamente em pasta privada fora do repositório e entregar pelo canal acordado. Não incluir tokens, senha/hashes, logs de sessão, dados de outros alunos nem códigos de convite ativos.
4. Conferir a exportação e remover a cópia temporária após a entrega conforme a rotina de retenção do responsável.

```sql
select id, display_name, role, timezone, created_at
from public.profiles
where id = '00000000-0000-0000-0000-000000000001';

select lesson_id, status, notes, confidence, updated_at
from public.lesson_progress
where student_id = '00000000-0000-0000-0000-000000000001'
order by lesson_id;

select id, lesson_id, minutes, bpm, notes, practiced_at
from public.practice_logs
where student_id = '00000000-0000-0000-0000-000000000001'
order by practiced_at;

select class_id, joined_at
from public.memberships
where student_id = '00000000-0000-0000-0000-000000000001';

select lesson_id, body, validated, created_at
from public.feedback
where student_id = '00000000-0000-0000-0000-000000000001'
order by created_at;
```

Para um professor, incluir também as turmas de sua autoria e as devolutivas escritas por ele, selecionando os campos conforme o pedido e evitando exportar dados pessoais desnecessários dos alunos. Informações básicas da conta Auth podem ser consultadas no painel. Nunca entregar `select * from auth.users`: o schema contém campos internos que não pertencem a um arquivo de portabilidade do aluno.

</details>

<details>
<summary>Excluir conta de aluno</summary>

## Excluir uma conta de aluno

1. Confirmar a conta e a intenção de excluir permanentemente; oferecer a exportação antes, se solicitada.
2. Conferir se a conta ainda tem papel `student` e se não é proprietária de turmas ou autora de feedback. Contas que já foram professor exigem o procedimento seguinte.
3. Em **Authentication → Users**, selecionar o UUID conferido e excluir a conta pelo painel. Para automação administrativa futura, o método oficial é `auth.admin.deleteUser(id)` com exclusão efetiva, executado somente em ambiente administrativo. [Gerenciamento de usuários](https://supabase.com/docs/guides/auth/managing-user-data), [API administrativa](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)
4. A chave estrangeira de `profiles` remove o perfil em cascata; por consequência, progresso, diário, matrículas, tentativas de ingresso e feedback recebido também são removidos. Conferir ausência de linhas com o UUID nas tabelas afetadas.
5. Conferir que a conta não consegue mais renovar sessão ou consultar dados. Tokens já emitidos podem existir até expirar; não afirmar revogação instantânea de todo JWT. O app consulta identidade e perfil no servidor, e as linhas pessoais foram removidas.

A versão atual não armazena arquivos enviados por usuários. Se Storage for adicionado, objetos e propriedade precisam ser tratados antes da exclusão; o Supabase pode bloquear exclusão de usuário proprietário de objetos.

</details>

<details>
<summary>Excluir conta que é ou foi professor</summary>

## Excluir uma conta que é ou foi professor

As referências `classrooms.teacher_id` e `feedback.teacher_id` bloqueiam a remoção de um perfil ainda utilizado. Não desabilitar constraints nem RLS para contornar essa proteção.

Primeiro, listar as dependências no SQL Editor:

```sql
select id, name from public.classrooms
where teacher_id = '00000000-0000-0000-0000-000000000001';

select id, class_id, student_id, lesson_id, created_at from public.feedback
where teacher_id = '00000000-0000-0000-0000-000000000001';
```

O responsável deve decidir o destino das turmas antes de executar exclusões. Se as turmas continuarem, podem ser transferidas administrativamente para outro perfil já verificado como professor, conferindo as linhas afetadas. Não trocar o autor histórico de feedback para simular que outra pessoa o escreveu.

Se a decisão for encerrar as turmas, removê-las administrativamente após conferir os IDs: isso remove convites, matrículas, encontros e feedback vinculado em cascata. Progresso e diário pessoais dos alunos permanecem. Remover também feedback de autoria do professor em eventuais turmas previamente transferidas, conforme o escopo de exclusão confirmado. Só então excluir a conta Auth e verificar as cascatas como no procedimento do aluno.

A interface permite remover matrículas e cancelar encontros; ela não oferece exclusão de turma ou de conta. Essas ações mais amplas permanecem no painel administrativo do Supabase.

</details>

<details>
<summary>Backups e restauração</summary>

## Cópias de segurança e restauração

A exclusão da base ativa não apaga automaticamente exportações antigas, cópias privadas do operador ou registros retidos pelo fornecedor. Inventariar as cópias sob controle do curso, definir prazo de retenção e remover versões quando apropriado. Não prometer um prazo único que não tenha sido configurado.

Ao restaurar um backup, reaplicar exclusões já atendidas antes de abrir o acesso aos usuários. Armazenar esse controle administrativo fora do Git público, com o mínimo de informação necessário. A operação de backup completo está em [DEPLOYMENT.md](DEPLOYMENT.md).

</details>
