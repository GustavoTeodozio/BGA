import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../../api/client';
import { useDialog } from '../../components/ConfirmDialog';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  FECHADA: { label: 'Fechada', color: 'bg-green-100 text-green-700' },
  PERDIDA: { label: 'Perdida', color: 'bg-wine-100 text-wine-700' },
};

const STATUS_PIE_COLORS = ['#10b981', '#eab308', '#ef4444'];

// Ícones
const UsersIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const TrophyIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);
const ChartPieIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H11V2.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);

const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export function AdminDashboardHome() {
  const { confirm } = useDialog();
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: async () => { const r = await api.get('/admin/stats'); return r.data; },
  });

  const { data: sales = [], isLoading: salesLoading } = useQuery({
    queryKey: ['admin', 'sales'],
    queryFn: async () => { const r = await api.get('/admin/sales'); return r.data; },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/sales/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'sales'] }),
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mb-4"></div>
          <p className="text-gray-600 font-outer-sans">Carregando...</p>
        </div>
      </div>
    );
  }

  const clientStatusPieData = [
    { name: 'Ativos', value: stats?.activeClients || 0 },
    { name: 'Pausados', value: stats?.pausedClients || 0 },
    { name: 'Cancelados', value: stats?.cancelledClients || 0 },
  ].filter((item) => item.value > 0);

  const totalRevenue = sales.reduce((sum: number, s: any) => s.status === 'FECHADA' ? sum + Number(s.value) : sum, 0);
  const closedCount = sales.filter((s: any) => s.status === 'FECHADA').length;
  const inProgressCount = sales.filter((s: any) => s.status === 'EM_ANDAMENTO').length;

  return (
    <div className="px-4 py-6 sm:px-0 animate-fade-in space-y-6 md:space-y-8">

      {/* ── Cards de Estatísticas ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-6">
        {/* Clientes Ativos */}
        <div className="stat-card group hover:scale-[1.02] transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                <UsersIcon />
              </div>
              <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1 font-outer-sans">Clientes Ativos</h3>
            <p className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent font-outer-sans">
              {stats?.activeClients || 0}
            </p>
            <div className="flex gap-2 mt-2 text-xs text-gray-500 font-outer-sans flex-wrap">
              <span className="text-yellow-600">{stats?.pausedClients || 0} pausados</span>
              <span className="text-wine-500">{stats?.cancelledClients || 0} cancelados</span>
            </div>
          </div>
        </div>

        {/* Receita de Vendas */}
        <div className="stat-card group hover:scale-[1.02] transition-transform duration-300">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <TrophyIcon />
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
            <h3 className="text-xs md:text-sm font-medium text-gray-600 mb-1 font-outer-sans">Receita de Vendas</h3>
            <p className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-500 to-blue-700 bg-clip-text text-transparent font-outer-sans">
              {formatCurrency(totalRevenue)}
            </p>
            <div className="flex gap-2 mt-2 text-xs text-gray-500 font-outer-sans flex-wrap">
              <span className="text-green-600">{closedCount} fechadas</span>
              <span className="text-blue-600">{inProgressCount} em andamento</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gráfico + Status Clientes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Distribuição de Clientes */}
        <div className="card-gradient">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800 font-outer-sans">Distribuição de Clientes</h2>
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg">
              <ChartPieIcon />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={clientStatusPieData.length > 0 ? clientStatusPieData : [{ name: 'Sem dados', value: 1 }]}
                cx="50%" cy="50%"
                labelLine={false}
                label={({ name, percent }) => percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''}
                outerRadius={90} innerRadius={35}
                dataKey="value" stroke="#fff" strokeWidth={2}
              >
                {clientStatusPieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_PIE_COLORS[index % STATUS_PIE_COLORS.length]} />
                ))}
                {clientStatusPieData.length === 0 && <Cell fill="#e5e7eb" />}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Resumo status clientes */}
        <div className="stat-card">
          <div className="relative z-10">
            <h3 className="text-sm font-medium text-gray-600 mb-4 font-outer-sans">Status dos Clientes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 items-center">
              {[
                { label: 'Ativos', value: stats?.activeClients || 0, color: 'bg-green-500', text: 'text-green-700' },
                { label: 'Pausados', value: stats?.pausedClients || 0, color: 'bg-yellow-500', text: 'text-yellow-700' },
                { label: 'Cancelados', value: stats?.cancelledClients || 0, color: 'bg-wine-500', text: 'text-wine-700' },
              ].map((item) => (
                <div key={item.label} className="flex-1 text-center p-3 bg-gray-50 rounded-xl">
                  <div className={`w-3 h-3 rounded-full ${item.color} mx-auto mb-2`}></div>
                  <p className={`text-xl md:text-2xl font-bold ${item.text} font-outer-sans`}>{item.value}</p>
                  <p className="text-xs text-gray-500 font-outer-sans">{item.label}</p>
                </div>
              ))}
              <div className="flex-1 text-center p-3 bg-wine-50 rounded-xl">
                <p className="text-xl md:text-2xl font-bold text-wine-700 font-outer-sans">{stats?.totalClients || 0}</p>
                <p className="text-xs text-gray-500 font-outer-sans">Total</p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-600 mb-3 font-outer-sans">Resumo de Vendas</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-xl">
                  <p className="text-xl font-bold text-gray-800 font-outer-sans">{sales.length}</p>
                  <p className="text-xs text-gray-500 font-outer-sans">Total</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-xl">
                  <p className="text-xl font-bold text-green-700 font-outer-sans">{closedCount}</p>
                  <p className="text-xs text-gray-500 font-outer-sans">Fechadas</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-xl">
                  <p className="text-xl font-bold text-blue-700 font-outer-sans">{inProgressCount}</p>
                  <p className="text-xs text-gray-500 font-outer-sans">Em andamento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tabela de Vendas ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 font-outer-sans">Vendas</h2>
        </div>

        {salesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-wine-600"></div>
          </div>
        ) : sales.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <p className="text-gray-400 text-lg font-outer-sans">Nenhuma venda registrada</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 font-outer-sans">Cliente</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 font-outer-sans hidden sm:table-cell">Empresa</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 font-outer-sans hidden md:table-cell">Vendedor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 font-outer-sans">Valor</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 font-outer-sans">Status</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-600 font-outer-sans hidden lg:table-cell">Data</th>
                    <th className="text-right py-3 px-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {sales.map((s: any) => (
                    <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-800 font-outer-sans">{s.clientName}</td>
                      <td className="py-3 px-4 text-gray-500 font-outer-sans hidden sm:table-cell">{s.companyName || '—'}</td>
                      <td className="py-3 px-4 hidden md:table-cell">
                        <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 rounded-full text-xs font-medium text-blue-700 font-outer-sans">
                          {s.closedBy?.name || '—'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-green-600 font-outer-sans">{formatCurrency(Number(s.value))}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium font-outer-sans ${STATUS_MAP[s.status]?.color}`}>
                          {STATUS_MAP[s.status]?.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 font-outer-sans hidden lg:table-cell">
                        {new Date(s.closedAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={async () => { const ok = await confirm({ title: 'Excluir venda', message: 'Excluir esta venda?', confirmText: 'Excluir' }); if (ok) deleteMut.mutate(s.id); }}
                          className="text-gray-300 hover:text-wine-600 transition-colors p-1"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
