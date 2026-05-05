import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

export function VendedorHome() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['vendedor', 'dashboard'],
    queryFn: async () => { const r = await api.get('/vendedor/dashboard'); return r.data; },
  });

  const { data: recentSales } = useQuery({
    queryKey: ['vendedor', 'sales', 'recent'],
    queryFn: async () => { const r = await api.get('/vendedor/sales'); return r.data; },
  });

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  const SalesCountIcon = () => (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3 3h18a1 1 0 011 1v1H2V4a1 1 0 011-1z" opacity="0.6" />
      <path d="M2 7l2 13h16l2-13H2z" />
      <path d="M9 11c0-1.657 1.343-3 3-3s3 1.343 3 3" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M9 11v1a3 3 0 006 0v-1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
    </svg>
  );

  const RevenueIcon = () => (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="9" opacity="0.2" />
      <path d="M12 3a9 9 0 100 18A9 9 0 0012 3z" opacity="0.85" />
      <path d="M12 7v1.5M12 15.5V17M9.5 10a2.5 2.5 0 015 0c0 1.38-1.12 2.5-2.5 2.5S9.5 11.38 9.5 10zM9.5 14a2.5 2.5 0 005 0" stroke="white" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );

  const TicketIcon = () => (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <path d="M2 9a2 2 0 012-2h16a2 2 0 012 2v1.17a3 3 0 000 5.66V17a2 2 0 01-2 2H4a2 2 0 01-2-2v-1.17a3 3 0 000-5.66V9z" opacity="0.85" />
      <path d="M9 12h6M9 9.5h3M9 14.5h4" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </svg>
  );

  const BudgetOpenIcon = () => (
    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="2" width="18" height="20" rx="2" opacity="0.85" />
      <path d="M7 7h10M7 11h10M7 15h6" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <circle cx="17" cy="17" r="3.5" fill="rgba(255,255,255,0.25)" />
      <path d="M17 15.5v3M15.5 17h3" stroke="white" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );

  const statCards = [
    { label: 'Vendas do Mês', value: stats?.monthlyCount || 0, color: 'from-blue-500 to-blue-600', icon: <SalesCountIcon /> },
    { label: 'Receita do Mês', value: formatCurrency(stats?.monthlyRevenue || 0), color: 'from-green-500 to-green-600', icon: <RevenueIcon /> },
    { label: 'Ticket Médio', value: formatCurrency(stats?.avgTicket || 0), color: 'from-purple-500 to-purple-600', icon: <TicketIcon /> },
    { label: 'Orçamentos Abertos', value: stats?.openBudgets || 0, color: 'from-amber-500 to-amber-600', icon: <BudgetOpenIcon /> },
  ];

  return (
    <div className="animate-fade-in">
      <div className="mb-6 md:mb-8">
        <p className="text-gray-600 font-outer-sans text-sm md:text-lg">
          Acompanhe suas vendas, orçamentos e resultados.
        </p>
      </div>

      {/* Stat Cards */}
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

      {/* Vendas Recentes */}
      <div className="card-gradient animate-scale-in">
        <h2 className="text-xl font-bold text-gray-800 font-outer-sans mb-6">Vendas Recentes</h2>
        {recentSales && recentSales.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentSales.slice(0, 6).map((sale: any) => (
              <div key={sale.id} className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800 font-outer-sans text-sm">{sale.clientName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    sale.status === 'FECHADA' ? 'bg-green-100 text-green-700' :
                    sale.status === 'EM_ANDAMENTO' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {sale.status === 'FECHADA' ? 'Fechada' : sale.status === 'EM_ANDAMENTO' ? 'Em Andamento' : 'Perdida'}
                  </span>
                </div>
                {sale.companyName && <p className="text-xs text-gray-500 mb-2">{sale.companyName}</p>}
                <p className="text-lg font-bold text-green-600 font-outer-sans">{formatCurrency(Number(sale.value))}</p>
                <p className="text-xs text-gray-400 mt-2">{new Date(sale.closedAt).toLocaleDateString('pt-BR')}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">Nenhuma venda registrada ainda</p>
            <p className="text-gray-300 text-sm mt-1">Suas vendas aparecerão aqui</p>
          </div>
        )}
      </div>
    </div>
  );
}
