# Entrega verificada

Verificação local em **14 de novembro de 2026**. O código foi implementado na branch `main` do projeto Violão Vivo. Este relatório distingue execução local de configuração externa.

| Item                            | Resultado                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `npm run check`                 | Aprovado: ESLint, geração de tipos de rotas, TypeScript, 14 testes e build Next.js de produção                               |
| `npm run format:check`          | Aprovado: código e documentação formatados                                                                                   |
| Testes musicais                 | 13 módulos / 39 aulas, primeira pestana no módulo 5, 52 diagramas, notas, compassos, durações, referências e links validados |
| Isolamento em PostgreSQL/PGlite | Aprovado: aluno A/B, professores de turmas diferentes, grants, RLS, FKs, convites e escalada de privilégios                  |
| `npm run test:http`             | 29 verificações: páginas públicas, rotas protegidas, APIs/PDFs sem sessão, CSRF e callbacks seguros                          |
| PDFs na saída serverless        | Ambos os PDFs constam no rastreamento de arquivos da função de materiais                                                     |
| Dependências                    | `npm install`/audit final: zero vulnerabilidades reportadas; override restrito ao lint documentado                           |
| GitHub/Vercel                   | Workflow CI e `vercel.json` versionados; conectar a conta Vercel e definir `main` como Production Branch                     |

Os 14 testes incluem dezenas de asserções de acesso e integridade; a contagem não deve ser confundida com 14 usuários ou 14 testes de navegador. [Detalhes dos testes de segurança](VERIFICATION-security.md).

## Configuração externa ainda necessária

1. Criar/selecionar Supabase Free e aplicar `supabase/migrations/202611140001_initial.sql`.
2. Habilitar Google OAuth e configurar URL do site e redirects. Para cadastro/recuperação por e-mail fora da equipe, configurar SMTP.
3. Cadastrar o professor e promover o papel pelo script administrativo.
4. Importar o GitHub na Vercel Hobby, cadastrar as três variáveis e conferir a branch `main`.
5. Executar a matriz real com duas contas de aluno e duas de professor após a configuração.

Não foram criados projetos remotos de Supabase/Vercel, contratados serviços, instaladas credenciais reais ou efetuada uma publicação da aplicação. A ausência de credenciais retorna erro de configuração sem expor dados; o aplicativo não oferece login simulado.

## Limites da verificação

O navegador automatizado desta sessão estava indisponível. Layout responsivo, teclado, áudio e interações estão implementados, mas precisam de uma revisão visual/interativa em navegador. Não foi validada entrega SMTP, consentimento Google, renovação real de sessão ou persistência através das APIs de um Supabase remoto. As políticas do banco foram exercitadas com o SQL real e identidades sintéticas no PostgreSQL/PGlite; isso não comprova a configuração de produção.

Após configurar as contas, verificar: login e logout; aluno A conclui aula e retoma após novo login; aluno B não lê seus registros; professor correto vê progresso/diário e envia feedback; outro professor recebe negação; matrícula e saída atualizam acesso; agendamento respeita fuso; aluno não baixa manual pela rota do app; vídeos carregam somente após clique; áudio para ao navegar; navegação de ida/volta da teoria abre o trecho exato.
