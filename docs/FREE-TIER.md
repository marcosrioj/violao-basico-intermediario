# Infraestrutura sem custo inicial

Para usar o curso sem administrar hospedagem, veja o [guia do professor](TEACHERS.md). Uma instalação própria depende das cotas de cada serviço; os valores abaixo registram a consulta de **14/11/2026**.

<details>
<summary>Planos, cotas e fontes consultadas</summary>

Consulta às fontes oficiais em **14 de novembro de 2026**, para uso **pessoal e não comercial**. A opção principal é GitHub Free + Vercel Hobby + Supabase Free. Os números são cotas do fornecedor, não uma promessa de capacidade ou disponibilidade deste aplicativo. A conta pode compartilhar limites com outros projetos.

| Serviço e função                                       | Plano recorrente         | Cotas relevantes consultadas                                                                                                                                                                                              | Ao atingir limite / condição                                                                                                                                                               | Fonte oficial                                                                                                                                                                                                                    |
| ------------------------------------------------------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GitHub — código público, migrations e CI               | Free pessoal             | Repositórios públicos ilimitados; runners padrão do Actions são gratuitos em repositórios públicos. Cache incluído: 10 GB/repositório; artefatos: 500 MB. Este workflow usa runner Ubuntu padrão e não publica artefatos. | Não usar runners maiores pagos nem aumentar limites de armazenamento. A franquia recorrente de US$ 12/mês aplica-se a computação elegível privada, não é necessária ao CI público adotado. | [Planos](https://docs.github.com/en/get-started/learning-about-github/githubs-plans), [Actions](https://docs.github.com/en/billing/concepts/product-billing/github-actions)                                                      |
| Vercel — frontend Next.js e API serverless             | Hobby                    | 100 GB de transferência, 10 GB de origem, 1 milhão de requisições CDN e 1 milhão de invocações; 4 horas CPU ativa e 360 GB-h de memória provisionada                                                                      | Em geral, recurso excedido fica indisponível até a janela de 30 dias renovar; não fazer upgrade automático. Somente uso pessoal/não comercial.                                             | [Hobby](https://vercel.com/docs/plans/hobby), [termos](https://vercel.com/legal/terms)                                                                                                                                           |
| Vercel — builds e funções                              | Incluído no Hobby        | 100 deployments/dia, 1 build concorrente, 45 min por build; funções Fluid Compute com limite de 300s, 2 GB e 1 vCPU                                                                                                       | Build acima do tempo falha; respeitar requisições curtas. Git da conta pessoal; Hobby não conecta repositório de organização.                                                              | [Limites](https://vercel.com/docs/limits)                                                                                                                                                                                        |
| Supabase — PostgreSQL e Auth                           | Free                     | 500 MB de banco na franquia, 50.000 usuários ativos/mês; 5 GB de saída e 5 GB de saída em cache; até 2 projetos ativos                                                                                                    | Pode pausar após 7 dias de baixa atividade. Retomar no painel. Excesso pode causar restrições; manter backups próprios.                                                                    | [Preços](https://supabase.com/pricing), [produção](https://supabase.com/docs/guides/deployment/going-into-prod)                                                                                                                  |
| Supabase Storage — reservado, sem uploads nesta versão | Free                     | 1 GB de objetos; usa cota de saída acima                                                                                                                                                                                  | Não é necessário habilitar buckets para este aplicativo. Materiais editoriais versionados são entregues pelo app.                                                                          | [Preços](https://supabase.com/pricing)                                                                                                                                                                                           |
| Supabase — envio de e-mail                             | SMTP padrão de testes    | Apenas destinatários autorizados da equipe do projeto; 2 mensagens/hora, sem SLA                                                                                                                                          | Não atende cadastro/recuperação de todos os alunos. Usar OAuth Google para começar; e-mail requer SMTP próprio.                                                                            | [SMTP](https://supabase.com/docs/guides/auth/auth-smtp)                                                                                                                                                                          |
| Netlify — alternativa frontend/API para uso comercial  | Free, modelo de créditos | 300 créditos/mês compartilhados: deploy produção 15; tráfego 20/GB; compute 10/GB-h; 2 por 10 mil requisições; 1 build concorrente                                                                                        | Ao esgotar, projetos da conta podem pausar até o próximo ciclo. Free tem teto rígido sem excedente cobrado.                                                                                | [Preços](https://www.netlify.com/pricing/), [uso comercial permitido](https://www.netlify.com/blog/introducing-netlify-free-plan/), [Next.js](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/) |

</details>

<details>
<summary>Instância compartilhada e regras de operação</summary>

## Usar sem administrar hospedagem

Quem quer ministrar aulas pode criar uma turma gratuitamente na instância compartilhada, após cadastrar uma conta comum e solicitar acesso conforme o [guia do professor](TEACHERS.md). Não precisa configurar GitHub, Vercel ou Supabase para usar essa opção.

Quem instala uma cópia administra suas próprias contas e cotas; siga [DEPLOYMENT.md](DEPLOYMENT.md). A gratuidade da turma na instância compartilhada não paga infraestrutura, domínio ou SMTP de uma instalação própria.

## Regras operacionais

- Usar apenas os planos acima; não ativar testes Pro, domínios pagos, recursos de IA cobrados, compute extra ou recarga automática.
- Manter o subdomínio gratuito `*.vercel.app` (alternativa `*.netlify.app`) e o endpoint `*.supabase.co`.
- Conferir Usage/Billing mensalmente e antes de abrir novas turmas. Exportar dados antes de mudanças de esquema.
- Incorporar ou vincular gravações nas plataformas de origem; não hospedar vídeos no banco, Git ou Functions. Metronômo e sons sintetizados executam no navegador.
- As respostas privadas não usam cache público. Conteúdo editorial pode ser estático. Limitar páginas de dados e tamanho de texto evita transferências desnecessárias.
- No Netlify, 20 publicações já consumiriam os 300 créditos se nenhum outro consumo existisse. Essa conta é ilustrativa: tráfego, compute e requisições usam o mesmo saldo.

</details>

<details>
<summary>Limites do banco e envio de e-mail</summary>

## Quando a cota do Supabase acaba

Ao exceder saída no Free, a documentação prevê aviso e período de tolerância, seguido de possível restrição. A saída já consumida não diminui ao apagar dados; uma restrição por saída pode terminar no próximo ciclo. A alternativa sem custo é reduzir uso e aguardar a renovação, preservando os dados. [Gestão de saída](https://supabase.com/docs/guides/platform/manage-your-usage/egress)

O banco não cresce sem limite no Free. A política de tamanho considera o consumo agregado da organização e pode restringir chamadas com HTTP 402; reduzir dados não remove imediatamente uma média mensal já elevada. Disco cheio é um limite operacional separado, que pode impedir escrita. Monitorar o painel e arquivar registros antigos somente após exportação e decisão do responsável. [Tamanho do banco](https://supabase.com/docs/guides/platform/database-size)

## E-mail e custo zero

A integração Google usa o fluxo OAuth e não exige SMTP para cada login. A compra de domínio não é requisito dessa arquitetura. O consentimento mostrará o domínio Supabase do projeto; configure nome e suporte corretamente. O cadastro com e-mail deve manter confirmação habilitada. Para liberar esse método a todos, configurar SMTP no Supabase e verificar cotas/condições do provedor escolhido, incluindo eventual necessidade de domínio próprio. Não há provedor SMTP contratado nem garantia de e-mail de produção gratuito nesta entrega.

Uma aplicação gratuita pode ficar indisponível por cota ou inatividade. Os procedimentos de retomada e backup estão em [DEPLOYMENT.md](DEPLOYMENT.md).

</details>
