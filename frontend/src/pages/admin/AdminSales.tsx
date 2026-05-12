import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useDialog } from '../../components/ConfirmDialog';

const COMMISSION_RATE = 0.04;
const INSTALLMENT_OPTIONS = [1,2,3,4,5,6,7,8,9,10,11,12,18,24,36,48,60];

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-700' },
  FECHADA:      { label: 'Fechada',      color: 'bg-green-100 text-green-700' },
  PERDIDA:      { label: 'Perdida',      color: 'bg-red-100 text-red-700' },
};

const EMPTY_FORM = {
  clientName: '', companyName: '', value: '', installments: '1',
  firstPaymentDate: '', description: '', status: 'FECHADA',
};

export function AdminSales() {
  const { confirm } = useDialog();
  const qc = useQueryClient();
  const [editSale, setEditSale] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const { data: sales = [], isLoading } = useQuery({
    queryKey: ['admin', 'sales'],
    queryFn: async () => { const r = await api.get('/admin/sales'); return r.data; },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/admin/sales/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'sales'] }); closeModal(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/sales/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'sales'] }),
  });

  const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function openEdit(s: any) {
    setEditSale(s);
    setForm({
      clientName: s.clientName ?? '',
      companyName: s.companyName ?? '',
      value: String(Number(s.value)),
      installments: String(s.installments ?? 1),
      firstPaymentDate: s.firstPaymentDate ? s.firstPaymentDate.slice(0, 10) : '',
      description: s.description ?? '',
      status: s.status ?? 'FECHADA',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditSale(null);
    setForm(EMPTY_FORM);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editSale) return;
    const payload: any = { ...form, value: Number(form.value), installments: Number(form.installments) };
    if (!payload.firstPaymentDate) delete payload.firstPaymentDate;
    updateMut.mutate({ id: editSale.id, data: payload });
  }

  const inst = Number(form.installments);
  const val = Number(form.value);

  const closedSales = sales.filter((s: any) => s.status === 'FECHADA');
  const totalRevenue = closedSales.reduce((sum: number, s: any) => sum + Number(s.value), 0);
  const totalCommission = totalRevenue * COMMISSION_RATE;

  const commissionBySeller: Record<string, { name: string; revenue: number; commission: number; count: number }> = {};
  for (const s of closedSales) {
    const id = s.closedBy?.id ?? 'unknown';
    if (!commissionBySeller[id]) commissionBySeller[id] = { name: s.closedBy?.name ?? '—', revenue: 0, commission: 0, count: 0 };
    commissionBySeller[id].revenue += Number(s.value);
    commissionBySeller[id].commission += Number(s.value) * COMMISSION_RATE;
    commissionBySeller[id].count += 1;
  }
  const sellerList = Object.values(commissionBySeller).sort((a, b) => b.commission - a.commission);

  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <p className="text-gray-500 text-sm font-outer-sans">Visão geral de todas as vendas da equipe</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card"><div className="relative z-10">
          <h3 className="text-sm font-medium text-gray-600 mb-1 font-outer-sans">Total de Vendas</h3>
          <p className="text-3xl font-bold text-gray-800 font-outer-sans">{sales.length}</p>
        </div></div>
        <div className="stat-card"><div className="relative z-10">
          <h3 className="text-sm font-medium text-gray-600 mb-1 font-outer-sans">Fechadas</h3>
          <p className="text-3xl font-bold text-green-600 font-outer-sans">{closedSales.length}</p>
        </div></div>
        <div className="stat-card"><div className="relative z-10">
          <h3 className="text-sm font-medium text-gray-600 mb-1 font-outer-sans">Receita Total</h3>
          <p className="text-3xl font-bold text-wine-600 font-outer-sans">{fmt(totalRevenue)}</p>
        </div></div>
        <div className="stat-card"><div className="relative z-10">
          <h3 className="text-sm font-medium text-gray-600 mb-1 font-outer-sans">Total em Comissões (4%)</h3>
          <p className="text-3xl font-bold text-emerald-600 font-outer-sans">{fmt(totalCommission)}</p>
        </div></div>
      </div>

      {/* Commission by seller */}
      {sellerList.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 font-outer-sans mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Comissões por Vendedor
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sellerList.map((seller) => (
              <div key={seller.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-700 font-outer-sans shrink-0">
                    {seller.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-semibold text-sm text-gray-800 font-outer-sans truncate">{seller.name}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-outer-sans">
                    <span className="text-gray-500">Vendas fechadas</span>
                    <span className="font-medium text-gray-700">{seller.count}</span>
                  </div>
                  <div className="flex justify-between text-xs font-outer-sans">
                    <span className="text-gray-500">Volume</span>
                    <span className="font-medium text-gray-700">{fmt(seller.revenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-outer-sans pt-1 border-t border-gray-200 mt-1">
                    <span className="text-emerald-600 font-semibold">Comissão (4%)</span>
                    <span className="font-bold text-emerald-600">{fmt(seller.commission)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-wine-600" />
        </div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16">
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
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 font-outer-sans hidden lg:table-cell">Parcelas</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 font-outer-sans hidden lg:table-cell">Comissão</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 font-outer-sans">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-600 font-outer-sans hidden lg:table-cell">Data</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-600 font-outer-sans"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sales.map((s: any) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="py-3 px-4 font-medium text-gray-800">{s.clientName}</td>
                    <td className="py-3 px-4 text-gray-500 hidden sm:table-cell">{s.companyName || '—'}</td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 rounded-full text-xs font-medium text-blue-700">
                        {s.closedBy?.name || '—'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-green-600">{fmt(Number(s.value))}</td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {(() => {
                        const sInst = s.installments ?? 1;
                        if (sInst === 1) return <span className="text-xs text-gray-500">À vista</span>;
                        const parcel = fmt(Number(s.value) / sInst);
                        const firstDate = s.firstPaymentDate
                          ? new Date(s.firstPaymentDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : null;
                        return (
                          <div>
                            <span className="text-xs text-blue-600 font-medium">{sInst}x de {parcel}</span>
                            {firstDate && <p className="text-[10px] text-gray-400 mt-0.5">1º em {firstDate}</p>}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell">
                      {s.status === 'FECHADA'
                        ? <span className="text-emerald-600 font-semibold text-xs">{fmt(Number(s.value) * COMMISSION_RATE)}</span>
                        : <span className="text-gray-400 text-xs">—</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[s.status]?.color}`}>
                        {STATUS_MAP[s.status]?.label}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-500 hidden lg:table-cell">
                      {new Date(s.closedAt).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => openEdit(s)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={async () => {
                            const ok = await confirm({ title: 'Excluir venda', message: 'Excluir esta venda?', confirmText: 'Excluir' });
                            if (ok) deleteMut.mutate(s.id);
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {showModal && editSale && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-100 sticky top-0 bg-white z-10 flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-800 font-outer-sans">Editar Venda</h2>
                <button type="button" onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Nome do Cliente *</label>
                  <input type="text" required value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Empresa</label>
                  <input type="text" value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Valor Total (R$) *</label>
                  <input type="number" step="0.01" min="0.01" required value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Parcelamento</label>
                  <select value={form.installments}
                    onChange={(e) => setForm({ ...form, installments: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans bg-white">
                    {INSTALLMENT_OPTIONS.map(n => (
                      <option key={n} value={n}>
                        {n === 1 ? 'À vista' : `${n}x${val > 0 ? ` — ${fmt(val / n)} / parcela` : ''}`}
                      </option>
                    ))}
                  </select>
                </div>
                {inst > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Data do 1º pagamento</label>
                    <input type="date" value={form.firstPaymentDate}
                      onChange={(e) => setForm({ ...form, firstPaymentDate: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans" />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Status</label>
                  <select value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans bg-white">
                    <option value="FECHADA">Fechada</option>
                    <option value="EM_ANDAMENTO">Em Andamento</option>
                    <option value="PERDIDA">Perdida</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Descrição</label>
                  <textarea rows={2} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent resize-none font-outer-sans" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button type="button" onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 font-outer-sans">
                  Cancelar
                </button>
                <button type="submit" disabled={updateMut.isPending}
                  className="px-6 py-2.5 bg-wine-600 hover:bg-wine-700 text-white rounded-xl text-sm font-semibold transition-colors font-outer-sans disabled:opacity-50">
                  {updateMut.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
