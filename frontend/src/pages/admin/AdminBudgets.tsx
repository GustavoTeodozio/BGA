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

const EMPTY_FORM = {
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  companyName: '',
  description: '',
  items: '',
  totalValue: '',
  notes: '',
};

export function AdminBudgets() {
  const { confirm } = useDialog();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editBudget, setEditBudget] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ['admin', 'budgets'],
    queryFn: async () => { const r = await api.get('/admin/budgets?mine=true'); return r.data; },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/budgets', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'budgets'] }); closeModal(); },
    onError: (e: any) => setFormError(e.response?.data?.message || 'Erro ao salvar'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/admin/budgets/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'budgets'] }); closeModal(); },
    onError: (e: any) => setFormError(e.response?.data?.message || 'Erro ao salvar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/budgets/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'budgets'] }),
  });

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  function openCreate() {
    setEditBudget(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(b: any) {
    setEditBudget(b);
    setForm({
      clientName: b.clientName || '',
      clientEmail: b.clientEmail || '',
      clientPhone: b.clientPhone || '',
      companyName: b.companyName || '',
      description: b.description || '',
      items: b.items || '',
      totalValue: b.totalValue ? String(b.totalValue) : '',
      notes: b.notes || '',
    });
    setFormError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditBudget(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clientName.trim()) { setFormError('Nome do cliente é obrigatório'); return; }
    const payload: any = {
      clientName: form.clientName,
      ...(form.clientEmail && { clientEmail: form.clientEmail }),
      ...(form.clientPhone && { clientPhone: form.clientPhone }),
      ...(form.companyName && { companyName: form.companyName }),
      ...(form.description && { description: form.description }),
      ...(form.items && { items: form.items }),
      ...(form.totalValue && { totalValue: Number(form.totalValue) }),
      ...(form.notes && { notes: form.notes }),
    };
    if (editBudget) {
      updateMut.mutate({ id: editBudget.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500 text-sm font-outer-sans">Seus orçamentos</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-wine-600 hover:bg-wine-700 text-white text-sm font-semibold rounded-lg transition-colors font-outer-sans shadow"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Orçamento
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-wine-600"></div>
        </div>
      ) : budgets.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 font-outer-sans">Nenhum orçamento ainda</p>
          <button onClick={openCreate} className="mt-3 text-wine-600 text-sm font-semibold font-outer-sans hover:underline">
            Criar o primeiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b: any) => (
            <div
              key={b.id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => openEdit(b)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 text-sm font-outer-sans">{b.clientName}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_MAP[b.status]?.color}`}>
                  {STATUS_MAP[b.status]?.label}
                </span>
              </div>
              {b.companyName && <p className="text-xs text-gray-500 font-outer-sans">{b.companyName}</p>}
              <p className="text-xs text-gray-400 mt-1 font-outer-sans">
                Criado por: <span className="font-medium text-blue-600">{b.createdBy?.name}</span>
              </p>
              {b.totalValue && (
                <p className="text-lg font-bold text-gray-800 mt-3 font-outer-sans">{formatCurrency(Number(b.totalValue))}</p>
              )}
              {b.description && (
                <p className="text-xs text-gray-400 line-clamp-2 mt-2 font-outer-sans">{b.description}</p>
              )}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-[10px] text-gray-400 font-outer-sans">{new Date(b.createdAt).toLocaleDateString('pt-BR')}</span>
                <button
                  onClick={async (e) => { e.stopPropagation(); const ok = await confirm({ title: 'Excluir orçamento', message: 'Excluir este orçamento?', confirmText: 'Excluir' }); if (ok) deleteMut.mutate(b.id); }}
                  className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800 font-outer-sans">
                {editBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
              </h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-outer-sans">{formError}</div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Nome do Cliente *</label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                    placeholder="Nome completo"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Empresa</label>
                  <input
                    type="text"
                    value={form.companyName}
                    onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                    placeholder="Nome da empresa"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">E-mail</label>
                  <input
                    type="email"
                    value={form.clientEmail}
                    onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                    placeholder="email@exemplo.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Telefone</label>
                  <input
                    type="text"
                    value={form.clientPhone}
                    onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Valor Total (R$)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.totalValue}
                  onChange={e => setForm(f => ({ ...f, totalValue: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Descrição / Escopo</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans resize-none"
                  placeholder="Descreva o serviço..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Itens do Orçamento</label>
                <textarea
                  rows={3}
                  value={form.items}
                  onChange={e => setForm(f => ({ ...f, items: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans resize-none"
                  placeholder="Liste os itens, materiais, serviços..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Observações</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans resize-none"
                  placeholder="Condições de pagamento, prazo, etc."
                />
              </div>

              {editBudget && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Status</label>
                  <select
                    value={editBudget.status}
                    onChange={e => setEditBudget((b: any) => ({ ...b, status: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans bg-white"
                  >
                    <option value="PENDENTE">Pendente</option>
                    <option value="APROVADO">Aprovado</option>
                    <option value="RECUSADO">Recusado</option>
                    <option value="FECHADO">Fechado</option>
                  </select>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors font-outer-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 px-4 py-2 bg-wine-600 hover:bg-wine-700 text-white rounded-lg text-sm font-semibold transition-colors font-outer-sans disabled:opacity-60"
                >
                  {isSaving ? 'Salvando...' : editBudget ? 'Salvar' : 'Criar Orçamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
