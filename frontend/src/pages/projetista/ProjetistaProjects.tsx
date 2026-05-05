import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useDialog } from '../../components/ConfirmDialog';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  BRIEFING: { label: 'Briefing', color: 'text-gray-700', bg: 'bg-gray-100' },
  EM_PRODUCAO: { label: 'Em Produção', color: 'text-blue-700', bg: 'bg-blue-100' },
  AGUARDANDO_APROVACAO: { label: 'Aguardando Aprovação', color: 'text-amber-700', bg: 'bg-amber-100' },
  APROVADO: { label: 'Aprovado', color: 'text-green-700', bg: 'bg-green-100' },
  FINALIZADO: { label: 'Finalizado', color: 'text-purple-700', bg: 'bg-purple-100' },
};

const STATUS_ORDER = ['BRIEFING', 'EM_PRODUCAO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'FINALIZADO'];

export function ProjetistaProjects() {
  const { confirm } = useDialog();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', clientName: '', description: '', deadline: '', status: 'BRIEFING' });
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(null);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projetista', 'projects', filter, search],
    queryFn: async () => {
      const params: any = {};
      if (filter) params.status = filter;
      if (search) params.search = search;
      const r = await api.get('/projetista/projects', { params });
      return r.data;
    },
  });

  const { data: projectDetail } = useQuery({
    queryKey: ['projetista', 'project', showDetail?.id],
    queryFn: async () => {
      if (!showDetail?.id) return null;
      const r = await api.get(`/projetista/projects/${showDetail.id}`);
      return r.data;
    },
    enabled: !!showDetail?.id,
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/projetista/projects', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projetista'] }); setShowModal(false); },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`/projetista/projects/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projetista'] }); setShowModal(false); setShowDetail(null); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/projetista/projects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projetista'] }); setShowDetail(null); },
  });

  const uploadMut = useMutation({
    mutationFn: ({ projectId, file }: { projectId: string; file: File }) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post(`/projetista/projects/${projectId}/files`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projetista'] });
      setUploadingProjectId(null);
    },
  });

  const deleteFileMut = useMutation({
    mutationFn: (fileId: string) => api.delete(`/projetista/projects/files/${fileId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projetista'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', clientName: '', description: '', deadline: '', status: 'BRIEFING' });
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      title: p.title, clientName: p.clientName || '', description: p.description || '',
      deadline: p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '',
      status: p.status,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { ...form, deadline: form.deadline || undefined };
    if (editing) updateMut.mutate({ id: editing.id, data });
    else createMut.mutate(data);
  };

  const handleFileUpload = (projectId: string) => {
    setUploadingProjectId(projectId);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadingProjectId) {
      uploadMut.mutate({ projectId: uploadingProjectId, file });
    }
    e.target.value = '';
  };

  return (
    <div className="animate-fade-in">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.dwg,.ai,.psd" />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <p className="text-gray-500 text-sm font-outer-sans">Gerencie seus projetos e arquivos</p>
        <div className="flex gap-3">
          <div className="relative flex-1 md:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-outer-sans" />
          </div>
          <button onClick={openCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-200 flex items-center gap-2 font-outer-sans whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ key: '', label: 'Todos' }, ...STATUS_ORDER.map((k) => ({ key: k, label: STATUS_MAP[k].label }))].map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all font-outer-sans ${filter === f.key ? 'bg-purple-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]"><div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div></div>
      ) : projects.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4"><svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></div>
          <p className="text-gray-400 text-lg font-outer-sans">Nenhum projeto encontrado</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p: any) => (
            <div key={p.id} className="bg-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer group"
              onClick={() => setShowDetail(p)}>
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-800 text-sm font-outer-sans line-clamp-1 flex-1">{p.title}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ml-2 whitespace-nowrap ${STATUS_MAP[p.status]?.bg} ${STATUS_MAP[p.status]?.color}`}>
                    {STATUS_MAP[p.status]?.label}
                  </span>
                </div>
                {p.clientName && <p className="text-xs text-gray-500 mb-1">{p.clientName}</p>}
                {p.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{p.description}</p>}

                {/* File previews */}
                {p.files && p.files.length > 0 && (
                  <div className="flex gap-1.5 mt-3">
                    {p.files.slice(0, 4).map((f: any) => (
                      <div key={f.id} className="w-14 h-14 rounded-lg bg-gray-50 overflow-hidden border border-gray-100">
                        {f.mimeType?.startsWith('image/') ? (
                          <img src={f.fileUrl} alt={f.fileName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>
                        )}
                      </div>
                    ))}
                    {p._count?.files > 4 && (
                      <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center text-xs text-gray-400 font-medium border border-gray-100">
                        +{p._count.files - 4}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400">{p._count?.files || 0} arquivos</span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => handleFileUpload(p.id)}
                      className="w-7 h-7 rounded-lg hover:bg-purple-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100" title="Upload">
                      <svg className="w-3.5 h-3.5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    </button>
                    <button onClick={() => openEdit(p)}
                      className="w-7 h-7 rounded-lg hover:bg-blue-50 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100" title="Editar">
                      <svg className="w-3.5 h-3.5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 font-outer-sans">{editing ? 'Editar Projeto' : 'Novo Projeto'}</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Título *</label>
                  <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Cliente</label>
                  <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Descrição</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-outer-sans" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Prazo</label>
                    <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-outer-sans" />
                  </div>
                  {editing && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Status</label>
                      <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent font-outer-sans">
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>{STATUS_MAP[s].label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 font-outer-sans">Cancelar</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 font-outer-sans disabled:opacity-50">
                  {editing ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowDetail(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-800 font-outer-sans">{projectDetail?.title || showDetail.title}</h2>
                {projectDetail?.clientName && <p className="text-sm text-gray-500 mt-0.5">{projectDetail.clientName}</p>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${STATUS_MAP[projectDetail?.status || showDetail.status]?.bg} ${STATUS_MAP[projectDetail?.status || showDetail.status]?.color}`}>
                  {STATUS_MAP[projectDetail?.status || showDetail.status]?.label}
                </span>
                <button onClick={() => setShowDetail(null)} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {projectDetail?.description && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 font-outer-sans">Descrição</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{projectDetail.description}</p>
                </div>
              )}

              {/* Files */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 font-outer-sans">Arquivos ({projectDetail?.files?.length || 0})</h3>
                  <button onClick={() => handleFileUpload(showDetail.id)}
                    className="px-3 py-1.5 bg-purple-50 text-purple-600 rounded-lg text-xs font-medium hover:bg-purple-100 transition-colors flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload
                  </button>
                </div>
                {projectDetail?.files && projectDetail.files.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {projectDetail.files.map((f: any) => (
                      <div key={f.id} className="group relative rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all">
                        {f.mimeType?.startsWith('image/') ? (
                          <img src={f.fileUrl} alt={f.fileName} className="w-full h-32 object-cover" />
                        ) : (
                          <div className="w-full h-32 bg-gray-50 flex flex-col items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                            <span className="text-[10px] text-gray-400 px-2 text-center truncate w-full">{f.fileName}</span>
                          </div>
                        )}
                        <button onClick={async () => { const ok = await confirm({ title: 'Excluir arquivo', message: 'Excluir arquivo?', confirmText: 'Excluir' }); if (ok) deleteFileMut.mutate(f.id); }}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600">
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8">Nenhum arquivo enviado</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => { openEdit(projectDetail || showDetail); setShowDetail(null); }}
                  className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors font-outer-sans">
                  Editar Projeto
                </button>
                <button onClick={async () => { const ok = await confirm({ title: 'Excluir projeto', message: 'Excluir projeto e todos os arquivos?', confirmText: 'Excluir' }); if (ok) deleteMut.mutate(showDetail.id); }}
                  className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors font-outer-sans">
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
