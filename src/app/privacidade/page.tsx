import { Shell, PageHeading } from '@/components/shell';
import { getPublicViewer } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export default async function Privacy() {
  const viewer = await getPublicViewer();
  return (
    <Shell teacher={viewer.profile?.role === 'teacher'} courseAccess={viewer.courseAccess}>
      <PageHeading eyebrow="SUA JORNADA, SEUS DADOS" title="Privacidade e uso responsável" />
      <article className="card prose">
        <h2>Código e materiais públicos</h2>
        <p>
          O código da aplicação e os materiais didáticos, incluindo o manual do professor, estão
          disponíveis no repositório público do GitHub. Os registros pessoais dos alunos são
          armazenados separadamente no Supabase e não são enviados ao repositório.
        </p>
        <h2>O que fica salvo</h2>
        <p>
          Seu perfil, progresso das aulas, anotações, confiança declarada, registros de prática e
          participação em turmas ficam associados à sua conta. A autenticação e o banco são operados
          pelo Supabase. O site usa cookies necessários à sessão.
        </p>
        <p>
          A aplicação pode ler letras e marcações pessoais de acompanhamento salvas anteriormente
          neste navegador, usadas entre as aulas da mesma versão musical neste dispositivo. Elas não
          são enviadas ao Supabase nem compartilhadas automaticamente com a turma. Limpar os dados
          deste site nas configurações do navegador remove essas marcações locais.
        </p>
        <h2>Microfone do afinador</h2>
        <p>
          O afinador do laboratório acessa o microfone somente quando você ativa a escuta e autoriza
          o navegador. O áudio é analisado no dispositivo, sem gravação ou envio ao servidor. A
          escuta termina ao parar, trocar de oficina ou ocultar a página. As preferências de
          afinação ficam salvas neste navegador e podem ser restauradas nos ajustes do afinador.
        </p>
        <h2>Quem pode acompanhar</h2>
        <p>
          Você acessa seus próprios registros. Ao ingressar em uma turma pelo código do professor,
          esse professor poderá consultar seu perfil, progresso, anotações e diário de prática para
          orientar o estudo. Outros alunos não têm acesso aos seus registros. Professores de turmas
          em que você não está matriculado também não têm acesso.
        </p>
        <h2>Vídeos e páginas externas</h2>
        <p>
          Os vídeos do YouTube são carregados somente após sua ação. Cifras, gravações e outras
          referências abrem serviços externos com suas próprias políticas. As letras do repertório
          foram fornecidas pelo responsável pelo curso; suas personalizações ficam neste navegador.
          O curso não hospeda cópias das gravações. Os áudios dos exercícios são gerados no seu
          navegador.
        </p>
        <h2>Controle da sua conta</h2>
        <p>
          Solicite ao responsável pelo curso a exportação ou exclusão da sua conta e dos registros.
          O procedimento de administração está documentado no projeto. Não escreva dados pessoais
          sensíveis no diário. Nenhum pagamento é coletado pelo aplicativo.
        </p>
        <h2>Estudo e acessibilidade</h2>
        <p>
          As ferramentas ajudam a visualizar e ouvir conceitos; não avaliam automaticamente a
          execução no instrumento. Você pode ajustar o andamento, pausar o áudio e navegar por
          teclado. Se sentir desconforto ao tocar, interrompa a prática e ajuste a postura com seu
          professor.
        </p>
      </article>
    </Shell>
  );
}
