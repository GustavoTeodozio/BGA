import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useDialog } from '../../components/ConfirmDialog';

const COMMISSION_RATE = 0.04; // 4%

const INSTALLMENT_OPTIONS = [1,2,3,4,5,6,7,8,9,10,11,12,18,24,36,48,60];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  FECHADA:      { label: 'Fechada',      color: 'bg-green-100 text-green-700' },
  PERDIDA:      { label: 'Perdida',      color: 'bg-red-100 text-red-700' },
};

export function VendedorSales() {
  const { confirm } = useDialog();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ clientName: '', companyName: '', value: '', installments: '1', description: '', status: 'FECHADA' });

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['vendedor', 'sales', filter],
    queryFn: async () => {
      const params: any = {};
      if (filter) params.status = filter;
      const r = await api.get('/vendedor/sales', { params });
      return r.data;
    },
  });

  // Fetch all sales (without filter) for commission totals
  const { data: allSales = [] } = useQuery({
    queryKey: ['vendedor', 'sales', ''],
    queryFn: async () => (await api.get('/vendedor/sales')).data,
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/vendedor/sales', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendedor'] }); setShowModal(false); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/vendedor/sales/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendedor', 'sales'] }),
  });

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate({ ...form, value: Number(form.value), installments: Number(form.installments) });
  };

  // Commission calculations from all (unfiltered) closed sales
  const closedSales = allSales.filter((s: any) => s.status === 'FECHADA');
  const totalRevenue = closedSales.reduce((sum: number, s: any) => sum + Number(s.value), 0);
  const totalCommission = totalRevenue * COMMISSION_RATE;
  const commissionCount = closedSales.length;

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <p className="text-gray-500 text-sm font-outer-sans">Registre e acompanhe suas vendas</p>
        <button
          onClick={() => { setForm({ clientName: '', companyName: '', value: '', installments: '1', description: '', status: 'FECHADA' }); setShowModal(true); }}
          className="px-4 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-green-500/25 transition-all duration-200 flex items-center gap-2 font-outer-sans whitespace-nowrap"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Registrar Venda
        </button>
      </div>

      {/* Commission panel */}
      <div className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 mb-6 text-white shadow-lg shadow-green-500/20">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm font-semibold opacity-90 font-outer-sans">Suas Comissões — 4% por venda fechada</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs opacity-70 font-outer-sans mb-0.5">Total em comissão</p>
            <p className="text-2xl font-bold font-outer-sans">{fmt(totalCommission)}</p>
          </div>
          <div>
            <p className="text-xs opacity-70 font-outer-sans mb-0.5">Vendas fechadas</p>
            <p className="text-2xl font-bold font-outer-sans">{commissionCount}</p>
          </div>
          <div>
            <p className="text-xs opacity-70 font-outer-sans mb-0.5">Volume total</p>
            <p className="text-2xl font-bold font-outer-sans">{fmt(totalRevenue)}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ key: '', label: 'Todas' }, ...Object.entries(STATUS_MAP).map(([k, v]) => ({ key: k, label: v.label }))].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-outer-sans ${filter === f.key ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-green-600" />
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4">
            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg font-outer-sans">Nenhuma venda encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sales.map((s: any) => {
            const value = Number(s.value);
            const commission = s.status === 'FECHADA' ? value * COMMISSION_RATE : null;
            return (
              <div key={s.id} className="bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 group">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate text-sm font-outer-sans">{s.clientName}</h3>
                      {s.companyName && <p className="text-xs text-gray-500 truncate">{s.companyName}</p>}
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 shrink-0 ${STATUS_MAP[s.status]?.color}`}>
                      {STATUS_MAP[s.status]?.label}
                    </span>
                  </div>

                  <p className="text-2xl font-bold text-green-600 font-outer-sans">{fmt(value)}</p>

                  {/* Installments */}
                  {(() => {
                    const inst = s.installments ?? 1;
                    const parcel = value / inst;
                    return (
                      <div className="mt-2 flex items-center gap-1.5 bg-blue-50 border border-blue-100 rounded-lg px-3 py-1.5">
                        <svg className="w-3.5 h-3.5 text-blue-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-xs font-outer-sans text-blue-700">
                          {inst === 1
                            ? 'À vista'
                            : <>{inst}x de <span className="font-bold">{fmt(parcel)}</span></>
                          }
                        </span>
                      </div>
                    );
                  })()}

                  {/* Commission badge */}
                  {commission !== null ? (
                    <div className="mt-1.5 flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5">
                      <svg className="w-3.5 h-3.5 text-emerald-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-xs font-outer-sans text-emerald-700">
                        Comissão (4%): <span className="font-bold">{fmt(commission)}</span>
                      </span>
                    </div>
                  ) : (
                    <div className="mt-1.5 flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5">
                      <span className="text-xs font-outer-sans text-gray-400">Sem comissão — venda não fechada</span>
                    </div>
                  )}

                  {s.description && <p className="text-xs text-gray-500 line-clamp-2 mt-2">{s.description}</p>}

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-[10px] text-gray-400">{new Date(s.closedAt).toLocaleDateString('pt-BR')}</span>
                    <button
                      onClick={async () => {
                        const ok = await confirm({ title: 'Excluir venda', message: 'Excluir esta venda?', confirmText: 'Excluir' });
                        if (ok) deleteMut.mutate(s.id);
                      }}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 font-outer-sans">Registrar Venda</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Nome do Cliente *</label>
                  <input
                    type="text" required value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent font-outer-sans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Empresa</label>
                  <input
                    type="text" value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent font-outer-sans"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Valor (R$) *</label>
                  <input
                    type="number" step="0.01" min="0.01" required value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent font-outer-sans"
                  />
                  {form.value && Number(form.value) > 0 && (
                    <p className="text-xs text-emerald-600 mt-1 font-outer-sans">
                      Comissão estimada (4%): {fmt(Number(form.value) * COMMISSION_RATE)}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Parcelamento</label>
                  <select
                    value={form.installments}
                    onChange={(e) => setForm({ ...form, installments: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent font-outer-sans bg-white"
                  >
                    {INSTALLMENT_OPTIONS.map(n => (
                      <option key={n} value={n}>
                        {n === 1 ? 'À vista' : `${n}x${form.value && Number(form.value) > 0 ? ` — ${fmt(Number(form.value) / n)} / parcela` : ''}`}
                      </option>
                    ))}
                  </select>
                  {form.value && Number(form.value) > 0 && Number(form.installments) > 1 && (
                    <p className="text-xs text-blue-600 mt-1 font-outer-sans">
                      {form.installments}x de {fmt(Number(form.value) / Number(form.installments))}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Status</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent font-outer-sans bg-white"
                  >
                    <option value="FECHADA">Fechada</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="PERDIDA">Perdida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Descrição</label>
                  <textarea
                    rows={2} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-outer-sans"
                  />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 font-outer-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={createMut.isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 font-outer-sans disabled:opacity-50"
                >
                  {createMut.isPending ? 'Registrando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
