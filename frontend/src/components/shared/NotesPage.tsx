import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useDialog } from '../ConfirmDialog';

const COLORS = ['#ffffff', '#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3', '#f3e8ff', '#fed7d7', '#e2e8f0'];

interface NotesPageProps {
  apiPrefix: string; // e.g. '/vendedor' or '/projetista' or '/admin'
}

export function NotesPage({ apiPrefix }: NotesPageProps) {
  const { confirm } = useDialog();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', content: '', color: '#ffffff', tags: '' });

  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', apiPrefix, search],
    queryFn: async () => {
      const params: any = {};
      if (search) params.search = search;
      const r = await api.get(`${apiPrefix}/notes`, { params });
      return r.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post(`${apiPrefix}/notes`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => api.patch(`${apiPrefix}/notes/${id}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notes'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`${apiPrefix}/notes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  const pinMutation = useMutation({
    mutationFn: (id: string) => api.patch(`${apiPrefix}/notes/${id}/pin`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notes'] }),
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', content: '', color: '#ffffff', tags: '' });
    setShowModal(true);
  };

  const openEdit = (note: any) => {
    setEditing(note);
    setForm({ title: note.title, content: note.content, color: note.color, tags: note.tags || '' });
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditing(null); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-gray-500 text-sm font-outer-sans">Crie e organize suas anotações</p>
        </div>
        <div className="flex gap-3">
          <div className="relative flex-1 md:w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text" placeholder="Buscar anotações..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-outer-sans"
            />
          </div>
          <button onClick={openCreate}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-200 flex items-center gap-2 font-outer-sans whitespace-nowrap">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Nova Anotação
          </button>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : notes.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex justify-center mb-4"><svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></div>
          <p className="text-gray-400 text-lg font-outer-sans">Nenhuma anotação encontrada</p>
          <p className="text-gray-300 text-sm mt-1">Clique em "Nova Anotação" para começar</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {notes.map((note: any) => (
            <div key={note.id}
              className="group rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 cursor-pointer relative overflow-hidden"
              style={{ backgroundColor: note.color || '#ffffff' }}
              onClick={() => openEdit(note)}
            >
              {/* Pin indicator */}
              {note.isPinned && (
                <div className="absolute top-2 right-2 text-amber-500">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" /></svg>
                </div>
              )}

              <div className="p-4">
                <h3 className="font-semibold text-gray-800 text-sm mb-2 font-outer-sans line-clamp-1">{note.title}</h3>
                <p className="text-gray-600 text-xs line-clamp-4 whitespace-pre-wrap font-outer-sans">{note.content}</p>

                {note.tags && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {note.tags.split(',').map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-black/5 rounded-full text-[10px] font-medium text-gray-600">{tag.trim()}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                  <span className="text-[10px] text-gray-400">{new Date(note.updatedAt).toLocaleDateString('pt-BR')}</span>
                  {note.createdBy && <span className="text-[10px] text-gray-400">{note.createdBy.name}</span>}
                </div>
              </div>

              {/* Actions overlay */}
              <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1" onClick={(e) => e.stopPropagation()}>
                <button onClick={() => pinMutation.mutate(note.id)}
                  className="w-7 h-7 rounded-lg bg-white/90 shadow-sm flex items-center justify-center hover:bg-amber-50 transition-colors" title="Fixar">
                  <svg className={`w-3.5 h-3.5 ${note.isPinned ? 'text-amber-500' : 'text-gray-400'}`} fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                  </svg>
                </button>
                <button onClick={async () => { const ok = await confirm({ title: 'Excluir anotação', message: 'Excluir esta anotação?', confirmText: 'Excluir' }); if (ok) deleteMutation.mutate(note.id); }}
                  className="w-7 h-7 rounded-lg bg-white/90 shadow-sm flex items-center justify-center hover:bg-red-50 transition-colors" title="Excluir">
                  <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 font-outer-sans">{editing ? 'Editar Anotação' : 'Nova Anotação'}</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Título</label>
                  <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Conteúdo</label>
                  <textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Cor</label>
                  <div className="flex gap-2">
                    {COLORS.map((c) => (
                      <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${form.color === c ? 'border-blue-500 scale-110' : 'border-gray-200 hover:border-gray-300'}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Tags (separadas por vírgula)</label>
                  <input type="text" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="urgente, cliente-x, montagem"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans" />
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors font-outer-sans">Cancelar</button>
                <button type="submit" disabled={createMutation.isPending || updateMutation.isPending}
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
