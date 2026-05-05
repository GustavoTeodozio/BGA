import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import type { Task, TaskStatus } from '../../types/task';

type OppStage = 'LEAD_NOVO' | 'CONTATO_FEITO' | 'PROPOSTA_ENVIADA' | 'NEGOCIACAO' | 'FECHAMENTO' | 'GANHO' | 'PERDIDO';
interface LinkedOpportunity {
  id: string; title: string; clientName: string;
  value: number; stage: OppStage; updatedAt: string;
}

const OPP_STAGE_LABEL: Record<OppStage, { label: string; color: string; bg: string }> = {
  LEAD_NOVO:        { label: 'Lead',            color: 'text-slate-600',  bg: 'bg-slate-100' },
  CONTATO_FEITO:    { label: 'Contato',         color: 'text-blue-600',   bg: 'bg-blue-100' },
  PROPOSTA_ENVIADA: { label: 'Proposta',        color: 'text-violet-600', bg: 'bg-violet-100' },
  NEGOCIACAO:       { label: 'Negociação',      color: 'text-amber-600',  bg: 'bg-amber-100' },
  FECHAMENTO:       { label: 'Fechamento',      color: 'text-orange-600', bg: 'bg-orange-100' },
  GANHO:            { label: 'Ganho',           color: 'text-green-600',  bg: 'bg-green-100' },
  PERDIDO:          { label: 'Perdido',         color: 'text-red-600',    bg: 'bg-red-100' },
};

const STAGE_MAP: Record<TaskStatus, { label: string; color: string; bg: string }> = {
  BACKLOG:      { label: 'Solicitado',   color: 'text-gray-600',   bg: 'bg-gray-100' },
  IN_PRODUCTION:{ label: 'Em Produção',  color: 'text-blue-600',   bg: 'bg-blue-100' },
  FOR_APPROVAL: { label: 'Aprovação',    color: 'text-amber-600',  bg: 'bg-amber-100' },
  SCHEDULED:    { label: 'Montagem',     color: 'text-purple-600', bg: 'bg-purple-100' },
  PUBLISHED:    { label: 'Concluído',    color: 'text-green-600',  bg: 'bg-green-100' },
};

export function DashboardHome() {
  const { user } = useAuthStore();

  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['client', 'tasks'],
    queryFn: async () => {
      const r = await api.get('/client/tasks?perPage=100');
      return r.data;
    },
  });

  const { data: mediaData } = useQuery({
    queryKey: ['client', 'media'],
    queryFn: async () => {
      const r = await api.get('/client/media');
      return r.data;
    },
  });

  const { data: linkedOpps = [] } = useQuery<LinkedOpportunity[]>({
    queryKey: ['client', 'linked-opportunities'],
    queryFn: async () => {
      const r = await api.get('/client/linked-opportunities');
      return r.data;
    },
  });

  const tasks: Task[] = tasksData?.items || [];

  const grouped: Record<TaskStatus, number> = {
    BACKLOG: 0, IN_PRODUCTION: 0, FOR_APPROVAL: 0, SCHEDULED: 0, PUBLISHED: 0,
  };
  tasks.forEach((t) => { grouped[t.status] = (grouped[t.status] || 0) + 1; });

  const pendingApprovals = tasks.filter((t) => t.status === 'FOR_APPROVAL');
  const inProduction = tasks.filter((t) => t.status === 'IN_PRODUCTION');
  const recentTasks = [...tasks]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5);

  const totalDone = grouped.PUBLISHED;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((totalDone / totalTasks) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mb-4"></div>
          <p className="text-gray-600 font-outer-sans">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-wine-600 via-wine-500 to-gold-500 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-wine-100 text-sm font-outer-sans mb-1">Bem-vindo(a) de volta,</p>
            <h1 className="text-2xl md:text-3xl font-black font-outer-sans mb-2">{user?.name || 'Cliente'}</h1>
            <p className="text-wine-100 font-outer-sans text-sm">Acompanhe aqui o andamento do seu projeto.</p>
          </div>
          <div className="hidden sm:flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex-shrink-0">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
          </div>
        </div>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="mt-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-wine-100 text-xs font-outer-sans">Progresso do projeto</span>
              <span className="text-white font-bold text-sm font-outer-sans">{progress}%</span>
            </div>
            <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-wine-100 text-xs mt-1.5 font-outer-sans">{totalDone} de {totalTasks} etapas concluídas</p>
          </div>
        )}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {(Object.keys(STAGE_MAP) as TaskStatus[]).map((status) => {
          const s = STAGE_MAP[status];
          return (
            <div key={status} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm hover:shadow-md transition-shadow">
              <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold font-outer-sans mb-3 ${s.bg} ${s.color}`}>
                {s.label}
              </div>
              <p className="text-3xl font-black text-gray-800 font-outer-sans">{grouped[status]}</p>
              <p className="text-xs text-gray-400 mt-0.5 font-outer-sans">{grouped[status] === 1 ? 'tarefa' : 'tarefas'}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Pendente aprovação */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-800 font-outer-sans">Aguardando Aprovação</h2>
              <p className="text-xs text-gray-400 font-outer-sans">{pendingApprovals.length} {pendingApprovals.length === 1 ? 'item' : 'itens'}</p>
            </div>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-400 text-sm font-outer-sans">Nada pendente no momento</p>
            </div>
          ) : (
            <div className="space-y-2">
              {pendingApprovals.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                  <div className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0 animate-pulse" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate font-outer-sans">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-amber-600 font-outer-sans mt-0.5">
                        Prazo: {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              {pendingApprovals.length > 4 && (
                <p className="text-xs text-gray-400 text-center pt-1 font-outer-sans">+{pendingApprovals.length - 4} mais itens</p>
              )}
            </div>
          )}
        </div>

        {/* Em produção */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-800 font-outer-sans">Em Produção</h2>
              <p className="text-xs text-gray-400 font-outer-sans">{inProduction.length} {inProduction.length === 1 ? 'etapa' : 'etapas'} ativas</p>
            </div>
          </div>

          {inProduction.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-400 text-sm font-outer-sans">Nenhuma etapa em produção</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inProduction.slice(0, 4).map((task) => (
                <div key={task.id} className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate font-outer-sans">{task.title}</p>
                    {task.assigneeName && (
                      <p className="text-xs text-blue-500 font-outer-sans mt-0.5">Resp.: {task.assigneeName}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Atividade recente */}
      {recentTasks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h2 className="font-bold text-gray-800 font-outer-sans mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            {recentTasks.map((task) => {
              const s = STAGE_MAP[task.status];
              return (
                <div key={task.id} className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.bg.replace('bg-', 'bg-').replace('-100', '-400')}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm text-gray-700 font-outer-sans font-medium truncate block">{task.title}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-outer-sans flex-shrink-0 ${s.bg} ${s.color}`}>
                    {s.label}
                  </span>
                  <span className="text-xs text-gray-400 font-outer-sans flex-shrink-0 hidden sm:block">
                    {new Date(task.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Oportunidades vinculadas pelo admin */}
      {linkedOpps.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-wine-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="font-bold text-gray-800 font-outer-sans">Acompanhamento Comercial</h2>
              <p className="text-xs text-gray-400 font-outer-sans">{linkedOpps.length} {linkedOpps.length === 1 ? 'proposta' : 'propostas'} da BGA</p>
            </div>
          </div>
          <div className="space-y-2">
            {linkedOpps.map((opp) => {
              const s = OPP_STAGE_LABEL[opp.stage];
              const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
              return (
                <div key={opp.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate font-outer-sans">{opp.title}</p>
                    <p className="text-xs text-gray-400 font-outer-sans mt-0.5">
                      Atualizado em {new Date(opp.updatedAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {opp.value > 0 && (
                      <span className="text-sm font-bold text-wine-600 font-outer-sans">{fmt(opp.value)}</span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-outer-sans ${s.bg} ${s.color}`}>
                      {s.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Empty state */}
      {tasks.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-wine-100 to-gold-100 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-wine-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="font-bold text-gray-700 font-outer-sans mb-2">Seu projeto está sendo preparado</h3>
          <p className="text-gray-400 text-sm font-outer-sans">Em breve as etapas do seu projeto aparecerão aqui.</p>
        </div>
      )}
    </div>
  );
}
