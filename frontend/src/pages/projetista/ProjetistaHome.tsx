import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

export function ProjetistaHome() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['projetista', 'dashboard'],
    queryFn: async () => { const r = await api.get('/projetista/dashboard'); return r.data; },
  });

  const { data: recentProjects } = useQuery({
    queryKey: ['projetista', 'projects', 'recent'],
    queryFn: async () => { const r = await api.get('/projetista/projects'); return r.data; },
  });

  const STATUS_COLORS: Record<string, string> = {
    BRIEFING: 'from-gray-400 to-gray-500',
    EM_PRODUCAO: 'from-blue-400 to-blue-500',
    AGUARDANDO_APROVACAO: 'from-amber-400 to-amber-500',
    APROVADO: 'from-green-400 to-green-500',
    FINALIZADO: 'from-purple-400 to-purple-500',
  };

  const STATUS_LABELS: Record<string, string> = {
    BRIEFING: 'Briefing',
    EM_PRODUCAO: 'Em Produção',
    AGUARDANDO_APROVACAO: 'Aguardando Aprovação',
    APROVADO: 'Aprovado',
    FINALIZADO: 'Finalizado',
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total de Projetos',     value: stats?.total || 0,       color: 'from-purple-500 to-purple-600', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg> },
    { label: 'Em Produção',           value: stats?.emProducao || 0,  color: 'from-blue-500 to-blue-600',   icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { label: 'Aguardando Aprovação',  value: stats?.aguardando || 0,  color: 'from-amber-500 to-amber-600', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
    { label: 'Finalizados',           value: stats?.finalizados || 0, color: 'from-green-500 to-green-600', icon: <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 md:mb-8">
        <p className="text-gray-600 font-outer-sans text-sm md:text-lg">Acompanhe seus projetos e entregas.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
        {statCards.map((card, i) => (
          <div key={i} className="stat-card group animate-slide-up hover:scale-[1.02] transition-transform duration-300" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-lg`}>
                  {card.icon}
                </div>
              </div>
              <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1 font-outer-sans">{card.label}</h3>
              <p className="text-xl md:text-3xl font-bold text-gray-800 font-outer-sans">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Projetos Recentes */}
      <div className="card-gradient animate-scale-in">
        <h2 className="text-xl font-bold text-gray-800 font-outer-sans mb-6">Projetos Recentes</h2>
        {recentProjects && recentProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentProjects.slice(0, 6).map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 font-outer-sans text-sm line-clamp-1">{p.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-gradient-to-r ${STATUS_COLORS[p.status]} ml-2 whitespace-nowrap`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
                {p.clientName && <p className="text-xs text-gray-500 mb-2">{p.clientName}</p>}
                {p.description && <p className="text-xs text-gray-400 line-clamp-2">{p.description}</p>}

                {/* File previews */}
                {p.files && p.files.length > 0 && (
                  <div className="flex gap-1 mt-3">
                    {p.files.slice(0, 3).map((f: any) => (
                      <div key={f.id} className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden">
                        {f.mimeType?.startsWith('image/') ? (
                          <img src={f.fileUrl} alt={f.fileName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                        )}
                      </div>
                    ))}
                    {p._count?.files > 3 && (
                      <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-400 font-medium">
                        +{p._count.files - 3}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400">{new Date(p.updatedAt).toLocaleDateString('pt-BR')}</span>
                  {p.deadline && (
                    <span className="text-[10px] text-gray-400">Prazo: {new Date(p.deadline).toLocaleDateString('pt-BR')}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhum projeto ainda</p>
            <p className="text-gray-300 text-sm mt-1">Seus projetos aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}
