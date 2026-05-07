import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useDialog } from '../../components/ConfirmDialog';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  BRIEFING:              { label: 'Briefing',              color: 'text-gray-600',  bg: 'bg-gray-100',   border: 'border-gray-300' },
  EM_PRODUCAO:           { label: 'Em Produção',           color: 'text-blue-700',  bg: 'bg-blue-50',    border: 'border-blue-300' },
  AGUARDANDO_APROVACAO:  { label: 'Aguardando Aprovação',  color: 'text-amber-700', bg: 'bg-amber-50',   border: 'border-amber-300' },
  APROVADO:              { label: 'Aprovado',              color: 'text-green-700', bg: 'bg-green-50',   border: 'border-green-300' },
  FINALIZADO:            { label: 'Finalizado',            color: 'text-gray-700',  bg: 'bg-gray-100',   border: 'border-gray-400' },
};

const STATUS_ORDER = ['BRIEFING', 'EM_PRODUCAO', 'AGUARDANDO_APROVACAO', 'APROVADO', 'FINALIZADO'];

const COL_COLORS: Record<string, string> = {
  BRIEFING:             'border-t-gray-400',
  EM_PRODUCAO:          'border-t-blue-500',
  AGUARDANDO_APROVACAO: 'border-t-amber-500',
  APROVADO:             'border-t-green-500',
  FINALIZADO:           'border-t-gray-700',
};

export function ProjetistaProjects() {
  const { confirm } = useDialog();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showDetail, setShowDetail] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', clientName: '', description: '', deadline: '', status: 'BRIEFING' });
  const [uploadingProjectId, setUploadingProjectId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [view, setView] = useState<'kanban' | 'grid'>('kanban');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projetista', 'projects', search],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      return (await api.get('/projetista/projects', { params })).data;
    },
  });

  const { data: projectDetail } = useQuery({
    queryKey: ['projetista', 'project', showDetail?.id],
    queryFn: async () => (await api.get(`/projetista/projects/${showDetail.id}`)).data,
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
      return api.post(`/projetista/projects/${projectId}/files`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projetista'] }); setUploadingProjectId(null); },
  });

  const deleteFileMut = useMutation({
    mutationFn: (fileId: string) => api.delete(`/projetista/projects/files/${fileId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['projetista'] }),
  });

  const openCreate = () => { setEditing(null); setForm({ title: '', clientName: '', description: '', deadline: '', status: 'BRIEFING' }); setShowModal(true); };
  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ title: p.title, clientName: p.clientName || '', description: p.description || '', deadline: p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '', status: p.status });
    setShowModal(true);
  };
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); const data = { ...form, deadline: form.deadline || undefined }; editing ? updateMut.mutate({ id: editing.id, data }) : createMut.mutate(data); };
  const handleFileUpload = (projectId: string) => { setUploadingProjectId(projectId); fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file && uploadingProjectId) uploadMut.mutate({ projectId: uploadingProjectId, file }); e.target.value = ''; };

  // Drag and drop
  const handleDragStart = (e: React.DragEvent, projectId: string) => { e.dataTransfer.setData('projectId', projectId); };
  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    if (projectId) updateMut.mutate({ id: projectId, data: { status } });
    setDragOver(null);
  };

  const byStatus = (status: string) => projects.filter((p: any) => p.status === status && (!search || p.title.toLowerCase().includes(search.toLowerCase()) || (p.clientName || '').toLowerCase().includes(search.toLowerCase())));

  const ProjectCard = ({ p }: { p: any }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, p.id)}
      onClick={() => setShowDetail(p)}
      className="bg-white border border-gray-100 rounded-xl p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all duration-200 group select-none"
    >
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-800 text-sm font-outer-sans line-clamp-2 flex-1 pr-2">{p.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => handleFileUpload(p.id)} title="Upload" className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
          </button>
          <button onClick={() => openEdit(p)} title="Editar" className="w-6 h-6 rounded-lg hover:bg-gray-100 flex items-center justify-center">
            <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
          </button>
        </div>
      </div>
      {p.clientName && <p className="text-xs text-gray-400 mb-2 font-outer-sans">{p.clientName}</p>}
      {p.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3 font-outer-sans">{p.description}</p>}
      {p.files && p.files.length > 0 && (
        <div className="flex gap-1 mb-3">
          {p.files.slice(0, 3).map((f: any) => (
            <div key={f.id} className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0">
              {f.mimeType?.startsWith('image/') ? <img src={f.fileUrl} alt={f.fileName} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg></div>}
            </div>
          ))}
          {(p._count?.files || 0) > 3 && <div className="w-10 h-10 rounded-lg bg-gray-50 flex items-center justify-center text-[10px] text-gray-400 border border-gray-100">+{p._count.files - 3}</div>}
        </div>
      )}
      <div className="flex items-center justify-between pt-2 border-t border-gray-50">
        <span className="text-[10px] text-gray-300 font-outer-sans">{p._count?.files || 0} arquivo{(p._count?.files || 0) !== 1 ? 's' : ''}</span>
        {p.deadline && <span className="text-[10px] text-gray-400 font-outer-sans">{new Date(p.deadline).toLocaleDateString('pt-BR')}</span>}
      </div>
    </div>
  );

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.dwg,.ai,.psd" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <p className="text-gray-500 text-sm font-outer-sans">Arraste os cartões para mudar o status</p>
        <div className="flex gap-2 items-center">
          {/* View toggle */}
          <div className="flex rounded-xl border border-gray-200 overflow-hidden">
            <button onClick={() => setView('kanban')} className={`px-3 py-2 text-xs font-medium transition-colors font-outer-sans flex items-center gap-1.5 ${view === 'kanban' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" /></svg>
              Kanban
            </button>
            <button onClick={() => setView('grid')} className={`px-3 py-2 text-xs font-medium transition-colors font-outer-sans flex items-center gap-1.5 ${view === 'grid' ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              Grade
            </button>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Buscar..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent font-outer-sans w-44" />
          </div>
          <button onClick={openCreate} className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors flex items-center gap-2 font-outer-sans whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Novo Projeto
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]"><div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" /></div>
      ) : view === 'kanban' ? (
        /* ── KANBAN VIEW ── */
        <div className="flex gap-4 overflow-x-auto pb-4 flex-1 items-start">
          {STATUS_ORDER.map((status) => {
            const cards = byStatus(status);
            const isDragOver = dragOver === status;
            return (
              <div key={status}
                onDragOver={(e) => { e.preventDefault(); setDragOver(status); }}
                onDragLeave={() => setDragOver(null)}
                onDrop={(e) => handleDrop(e, status)}
                className={`flex-shrink-0 w-64 rounded-2xl border-t-4 ${COL_COLORS[status]} transition-all duration-150 ${isDragOver ? 'bg-gray-100 scale-[1.01]' : 'bg-gray-50'}`}
                style={{ minHeight: 200 }}
              >
                {/* Column header */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider font-outer-sans">{STATUS_MAP[status].label}</span>
                    <span className="ml-2 text-[10px] text-gray-400 font-outer-sans">{cards.length}</span>
                  </div>
                  <button onClick={() => { setForm(f => ({ ...f, status })); openCreate(); }} className="w-6 h-6 rounded-lg hover:bg-gray-200 flex items-center justify-center transition-colors" title="Novo projeto nesta coluna">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>

                {/* Cards */}
                <div className="px-3 pb-4 space-y-3">
                  {cards.map((p: any) => <ProjectCard key={p.id} p={p} />)}
                  {cards.length === 0 && (
                    <div className={`rounded-xl border-2 border-dashed p-6 text-center transition-colors ${isDragOver ? 'border-gray-400 bg-gray-200' : 'border-gray-200'}`}>
                      <p className="text-xs text-gray-400 font-outer-sans">Arraste aqui</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ── GRID VIEW ── */
        projects.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-14 h-14 text-gray-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            <p className="text-gray-400 font-outer-sans">Nenhum projeto encontrado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p: any) => <ProjectCard key={p.id} p={p} />)}
          </div>
        )
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Cliente</label>
                  <input type="text" value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Descrição</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent resize-none font-outer-sans" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Prazo</label>
                    <input type="date" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent font-outer-sans" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Status</label>
                    <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent font-outer-sans">
                      {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_MAP[s].label}</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 font-outer-sans">Cancelar</button>
                <button type="submit" disabled={createMut.isPending || updateMut.isPending}
                  className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors font-outer-sans disabled:opacity-50">
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
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Quick status change */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 mb-2 font-outer-sans">Mover para</p>
                <div className="flex flex-wrap gap-2">
                  {STATUS_ORDER.filter(s => s !== (projectDetail?.status || showDetail.status)).map(s => (
                    <button key={s} onClick={() => { updateMut.mutate({ id: showDetail.id, data: { status: s } }); setShowDetail({ ...showDetail, status: s }); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors font-outer-sans ${STATUS_MAP[s].bg} ${STATUS_MAP[s].color} ${STATUS_MAP[s].border}`}>
                      → {STATUS_MAP[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {projectDetail?.description && (
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2 font-outer-sans">Descrição</h3>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap">{projectDetail.description}</p>
                </div>
              )}

              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700 font-outer-sans">Arquivos ({projectDetail?.files?.length || 0})</h3>
                  <button onClick={() => handleFileUpload(showDetail.id)}
                    className="px-3 py-1.5 bg-gray-900 text-white rounded-lg text-xs font-medium hover:bg-gray-800 transition-colors flex items-center gap-1.5 font-outer-sans">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
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
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs hover:bg-red-600">×</button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-8 font-outer-sans">Nenhum arquivo enviado</p>
                )}
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button onClick={() => { openEdit(projectDetail || showDetail); setShowDetail(null); }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors font-outer-sans">
                  Editar
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
