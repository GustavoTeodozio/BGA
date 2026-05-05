import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useDialog } from '../../components/ConfirmDialog';

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  PENDENTE: { label: 'Pendente', color: 'bg-amber-100 text-amber-700' },
  APROVADO: { label: 'Aprovado', color: 'bg-green-100 text-green-700' },
  RECUSADO: { label: 'Recusado', color: 'bg-red-100 text-red-700' },
  FECHADO: { label: 'Fechado', color: 'bg-blue-100 text-blue-700' },
};

export function VendedorBudgets() {
  const { confirm } = useDialog();
  const qc = useQueryClient();
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ clientName: '', clientEmail: '', clientPhone: '', companyName: '', description: '', items: '', totalValue: '', notes: '' });

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['vendedor', 'budgets', filter, search],
    queryFn: async () => {
      const params: any = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const r = await api.get('/vendedor/budgets', { params });
      return r.data;
    },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/vendedor/budgets', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendedor', 'budgets'] }); closeModal(); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`/vendedor/budgets/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['vendedor', 'budgets'] }); closeModal(); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/vendedor/budgets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vendedor', 'budgets'] }),
  });

  const convertToSaleMut = useMutation({
    mutationFn: (budget: any) => api.post('/vendedor/sales', {
      clientName: budget.clientName,
      companyName: budget.companyName,
      value: budget.totalValue,
      budgetId: budget.id,
      description: `Conversão do orçamento: ${budget.description || budget.clientName}`,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendedor'] });
    },
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ clientName: '', clientEmail: '', clientPhone: '', companyName: '', description: '', items: '', totalValue: '', notes: '' });
    setShowModal(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      clientName: b.clientName, clientEmail: b.clientEmail || '', clientPhone: b.clientPhone || '',
      companyName: b.companyName || '', description: b.description || '', items: b.items || '',
      totalValue: b.totalValue ? String(b.totalValue) : '', notes: b.notes || '',
    });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, totalValue: form.totalValue ? Number(form.totalValue) : undefined };
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <p className="text-gray-500 text-sm font-outer-sans">Gerencie seus orçamentos</p>
        <div className="flex gap-3">
          <div className="relative flex-1 md:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans" />
          </div>
          <button onClick={openCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 flex items-center gap-2 font-outer-sans whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Orçamento
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ key: '', label: 'Todos' }, ...Object.entries(STATUS_MAP).map(([k, v]) => ({ key: k, label: v.label }))].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-outer-sans ${filter === f.key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]"><div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4"><svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
          <p className="text-gray-400 text-lg font-outer-sans">Nenhum orçamento encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b: any) => (
            <div key={b.id} className="bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => openEdit(b)}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-800 truncate text-sm font-outer-sans">{b.clientName}</h3>
                    {b.companyName && <p className="text-xs text-gray-500 truncate">{b.companyName}</p>}
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ml-2 ${STATUS_MAP[b.status]?.color}`}>
                    {STATUS_MAP[b.status]?.label}
                  </span>
                </div>
                {b.description && <p className="text-xs text-gray-500 line-clamp-2 mb-3">{b.description}</p>}
                {b.totalValue && <p className="text-lg font-bold text-gray-800 font-outer-sans">{formatCurrency(Number(b.totalValue))}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400">{new Date(b.createdAt).toLocaleDateString('pt-BR')}</span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    {b.status === 'APROVADO' && (
                      <button onClick={async () => { const ok = await confirm({ title: 'Converter em venda', message: 'Converter este orçamento em venda?', confirmText: 'Converter', type: 'warning' }); if (ok) convertToSaleMut.mutate(b); }}
                        className="px-2 py-1 bg-green-500 text-white rounded-lg text-[10px] font-medium hover:bg-green-600 transition-colors">
                        Fechar Venda
                      </button>
                    )}
                    <button onClick={async () => { const ok = await confirm({ title: 'Excluir orçamento', message: 'Excluir este orçamento?', confirmText: 'Excluir' }); if (ok) deleteMut.mutate(b.id); }}
                      className="w-7 h-7 rounded-lg hover:bg-red-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100">
                      <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 font-outer-sans">{editing ? 'Editar Orçamento' : 'Novo Orçamento'}</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Nome do Cliente *</label>
                    <input type="text" required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Empresa</label>
                    <input type="text" value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Email</label>
                    <input type="email" value={form.clientEmail} onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Telefone</label>
                    <input type="text" value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Descrição</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Itens do Orçamento</label>
                  <textarea rows={3} value={form.items} onChange={(e) => setForm({ ...form, items: e.target.value })} placeholder="Liste os itens..."
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Valor Total (R$)</label>
                  <input type="number" step="0.01" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Observações</label>
                  <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-outer-sans" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 font-outer-sans">Cancelar</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 font-outer-sans disabled:opacity-50">
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
