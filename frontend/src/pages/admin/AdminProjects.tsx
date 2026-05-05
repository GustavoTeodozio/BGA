import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useDialog } from '../../components/ConfirmDialog';

const STATUS_MAP: Record<string, { label: string; bg: string; color: string }> = {
  BRIEFING: { label: 'Briefing', bg: 'bg-gray-100', color: 'text-gray-700' },
  EM_PRODUCAO: { label: 'Em Produção', bg: 'bg-blue-100', color: 'text-blue-700' },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', bg: 'bg-amber-100', color: 'text-amber-700' },
  APROVADO: { label: 'Aprovado', bg: 'bg-green-100', color: 'text-green-700' },
  FINALIZADO: { label: 'Finalizado', bg: 'bg-wine-100', color: 'text-wine-700' },
};

const EMPTY_FORM = {
  title: '',
  clientName: '',
  description: '',
  status: 'BRIEFING',
  deadline: '',
};

export function AdminProjects() {
  const { confirm } = useDialog();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editProject, setEditProject] = useState<any | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formError, setFormError] = useState('');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['admin', 'projects'],
    queryFn: async () => { const r = await api.get('/admin/projects?mine=true'); return r.data; },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/projects', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'projects'] }); closeModal(); },
    onError: (e: any) => setFormError(e.response?.data?.message || 'Erro ao salvar'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => api.patch(`/admin/projects/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'projects'] }); closeModal(); },
    onError: (e: any) => setFormError(e.response?.data?.message || 'Erro ao salvar'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/projects/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'projects'] }),
  });

  function openCreate() {
    setEditProject(null);
    setForm(EMPTY_FORM);
    setFormError('');
    setShowModal(true);
  }

  function openEdit(p: any) {
    setEditProject(p);
    setForm({
      title: p.title || '',
      clientName: p.clientName || '',
      description: p.description || '',
      status: p.status || 'BRIEFING',
      deadline: p.deadline ? p.deadline.slice(0, 10) : '',
    });
    setFormError('');
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditProject(null);
    setForm(EMPTY_FORM);
    setFormError('');
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { setFormError('Título do projeto é obrigatório'); return; }
    const payload: any = {
      title: form.title,
      status: form.status,
      ...(form.clientName && { clientName: form.clientName }),
      ...(form.description && { description: form.description }),
      ...(form.deadline && { deadline: form.deadline }),
    };
    if (editProject) {
      updateMut.mutate({ id: editProject.id, data: payload });
    } else {
      createMut.mutate(payload);
    }
  }

  const isSaving = createMut.isPending || updateMut.isPending;

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-500 text-sm font-outer-sans">Seus projetos</p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-wine-600 hover:bg-wine-700 text-white text-sm font-semibold rounded-lg transition-colors font-outer-sans shadow"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Novo Projeto
        </button>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-wine-600"></div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-200">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-400 font-outer-sans">Nenhum projeto ainda</p>
          <button onClick={openCreate} className="mt-3 text-wine-600 text-sm font-semibold font-outer-sans hover:underline">
            Criar o primeiro
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: any) => (
            <div
              key={p.id}
              className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300 group cursor-pointer"
              onClick={() => openEdit(p)}
            >
              <div className="flex items-start justify-between mb-2 gap-2">
                <h3 className="font-semibold text-gray-800 text-sm font-outer-sans line-clamp-1 flex-1">{p.title}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0 ${STATUS_MAP[p.status]?.bg} ${STATUS_MAP[p.status]?.color}`}>
                  {STATUS_MAP[p.status]?.label}
                </span>
              </div>
              {p.clientName && <p className="text-xs text-gray-500 font-outer-sans">{p.clientName}</p>}
              <p className="text-xs text-gray-400 mt-1 font-outer-sans">
                Responsável: <span className="font-medium text-blue-600">{p.designer?.name}</span>
              </p>
              {p.description && (
                <p className="text-xs text-gray-400 line-clamp-2 mt-2 font-outer-sans">{p.description}</p>
              )}

              {p.files && p.files.length > 0 && (
                <div className="flex gap-1 mt-3">
                  {p.files.slice(0, 3).map((f: any) => (
                    <div key={f.id} className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
                      {f.mimeType?.startsWith('image/') ? (
                        <img src={f.fileUrl} alt={f.fileName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300"><svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                      )}
                    </div>
                  ))}
                  {p._count?.files > 3 && (
                    <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-400 border border-gray-100">
                      +{p._count.files - 3}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <span className="text-[10px] text-gray-400 font-outer-sans">
                  {p.deadline ? `Prazo: ${new Date(p.deadline).toLocaleDateString('pt-BR')}` : `${p._count?.files || 0} arquivos`}
                </span>
                <button
                  onClick={async (e) => { e.stopPropagation(); const ok = await confirm({ title: 'Excluir projeto', message: 'Excluir este projeto?', confirmText: 'Excluir' }); if (ok) deleteMut.mutate(p.id); }}
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
                {editProject ? 'Editar Projeto' : 'Novo Projeto'}
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

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Título do Projeto *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                  placeholder="Ex: Stand Feira de Tecnologia 2025"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Cliente</label>
                <input
                  type="text"
                  value={form.clientName}
                  onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                  placeholder="Nome do cliente ou empresa"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Status</label>
                <select
                  value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans bg-white"
                >
                  <option value="BRIEFING">Briefing</option>
                  <option value="EM_PRODUCAO">Em Produção</option>
                  <option value="AGUARDANDO_APROVACAO">Aguardando Aprovação</option>
                  <option value="APROVADO">Aprovado</option>
                  <option value="FINALIZADO">Finalizado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Prazo de Entrega</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Descrição</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans resize-none"
                  placeholder="Detalhes do projeto, materiais, referências..."
                />
              </div>

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
                  {isSaving ? 'Salvando...' : editProject ? 'Salvar' : 'Criar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
