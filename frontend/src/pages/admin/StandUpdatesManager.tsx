import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useAuthStore } from '../../store/auth.store';
import { useDialog } from '../../components/ConfirmDialog';

interface Photo {
  id: string;
  url: string;
  caption?: string;
  order: number;
}

interface Comment {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  isApproval: boolean;
  createdAt: string;
}

interface StandUpdate {
  id: string;
  stage: string;
  title: string;
  description?: string;
  published: boolean;
  publishedAt?: string;
  createdAt: string;
  author: { id: string; name: string };
  photos: Photo[];
  comments: Comment[];
}

interface Stage {
  key: string;
  label: string;
}

interface Props {
  clientId: string;
}

const STAGE_COLORS: Record<string, string> = {
  pre_montagem: 'bg-gray-100 text-gray-700 border-gray-200',
  estrutura:    'bg-blue-100 text-blue-700 border-blue-200',
  montagem:     'bg-amber-100 text-amber-700 border-amber-200',
  acabamento:   'bg-orange-100 text-orange-700 border-orange-200',
  finalizacao:  'bg-purple-100 text-purple-700 border-purple-200',
  entrega:      'bg-green-100 text-green-700 border-green-200',
};

export function StandUpdatesManager({ clientId }: Props) {
  const { confirm } = useDialog();
  const qc = useQueryClient();
  const { user } = useAuthStore();
  const prefix = user?.role === 'VENDEDOR' ? '/vendedor' : '/admin';

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ stage: 'pre_montagem', title: '', description: '' });
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const newPhotosInputRef = useRef<HTMLInputElement>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);

  const { data: stages = [] } = useQuery<Stage[]>({
    queryKey: ['stand-stages'],
    queryFn: async () => (await api.get(`${prefix}/stand-updates/stages`)).data,
  });

  const { data: updates = [], isLoading } = useQuery<StandUpdate[]>({
    queryKey: ['stand-updates', clientId],
    queryFn: async () => (await api.get(`${prefix}/clients/${clientId}/stand-updates`)).data,
    enabled: !!clientId,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['stand-updates', clientId] });

  const createMut = useMutation({
    mutationFn: (data: typeof form) => api.post(`${prefix}/clients/${clientId}/stand-updates`, data),
    onSuccess: async (res) => {
      const newId: string = res.data.id;
      if (pendingFiles.length > 0) {
        const fd = new FormData();
        pendingFiles.forEach(f => fd.append('photos', f));
        await api.post(`${prefix}/stand-updates/${newId}/photos`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      invalidate();
      setShowForm(false);
      setForm({ stage: 'pre_montagem', title: '', description: '' });
      setPendingFiles([]);
    },
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof form & { published: boolean }> }) =>
      api.patch(`${prefix}/stand-updates/${id}`, data),
    onSuccess: () => { invalidate(); setEditingId(null); },
    onError: (err: any) => {
      console.error('[StandUpdate] Erro ao atualizar:', err?.response?.data || err.message);
      alert(`Erro ao atualizar: ${err?.response?.data?.message || err.message}`);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`${prefix}/stand-updates/${id}`),
    onSuccess: invalidate,
  });

  const deletePhotoMut = useMutation({
    mutationFn: (photoId: string) => api.delete(`${prefix}/stand-updates/photos/${photoId}`),
    onSuccess: invalidate,
  });

  const commentMut = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      api.post(`${prefix}/stand-updates/${id}/comments`, { content }),
    onSuccess: (_d, { id }) => { invalidate(); setCommentText(prev => ({ ...prev, [id]: '' })); },
  });

  const deleteCommentMut = useMutation({
    mutationFn: (commentId: string) => api.delete(`${prefix}/stand-updates/comments/${commentId}`),
    onSuccess: invalidate,
  });

  async function handleUpload(updateId: string, files: FileList) {
    setUploadingId(updateId);
    const fd = new FormData();
    Array.from(files).forEach(f => fd.append('photos', f));
    try {
      await api.post(`${prefix}/stand-updates/${updateId}/photos`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      invalidate();
    } finally {
      setUploadingId(null);
    }
  }

  const stageLabel = (key: string) => stages.find(s => s.key === key)?.label ?? key;

  if (isLoading) return (
    <div className="flex items-center justify-center py-16 text-gray-400">
      <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      Carregando atualizações...
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800 font-outer-sans">Acompanhamento do Stand</h3>
          <p className="text-xs text-gray-500 font-outer-sans mt-0.5">
            {updates.length} atualização{updates.length !== 1 ? 'ões' : ''} · {updates.filter(u => u.published).length} publicada{updates.filter(u => u.published).length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); }}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg transition-colors font-outer-sans"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nova Atualização
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm space-y-3">
          <h4 className="text-sm font-semibold text-gray-700 font-outer-sans">Nova Atualização</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 font-outer-sans mb-1 block">Etapa</label>
              <select
                value={form.stage}
                onChange={e => setForm(p => ({ ...p, stage: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 font-outer-sans focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                {stages.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-outer-sans mb-1 block">Título</label>
              <input
                type="text"
                placeholder="Ex: Estrutura metálica montada"
                value={form.title}
                onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 font-outer-sans focus:outline-none focus:ring-2 focus:ring-red-300"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 font-outer-sans mb-1 block">Descrição (opcional)</label>
            <textarea
              rows={2}
              placeholder="Detalhes sobre o progresso..."
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 font-outer-sans focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
            />
          </div>

          {/* Fotos */}
          <div>
            <label className="text-xs text-gray-500 font-outer-sans mb-1.5 block">Fotos (opcional)</label>
            <input
              ref={newPhotosInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={e => {
                if (e.target.files) setPendingFiles(prev => [...prev, ...Array.from(e.target.files!)]);
                e.target.value = '';
              }}
            />
            {pendingFiles.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                {pendingFiles.map((f, i) => (
                  <div key={i} className="relative group">
                    <img
                      src={URL.createObjectURL(f)}
                      alt={f.name}
                      className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      onClick={() => setPendingFiles(prev => prev.filter((_, idx) => idx !== i))}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label
              onClick={() => newPhotosInputRef.current?.click()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-red-400 hover:text-red-600 cursor-pointer transition-colors font-outer-sans"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              {pendingFiles.length > 0 ? `${pendingFiles.length} foto${pendingFiles.length !== 1 ? 's' : ''} selecionada${pendingFiles.length !== 1 ? 's' : ''} · adicionar mais` : 'Selecionar fotos'}
            </label>
          </div>

          <div className="flex items-center gap-2 justify-end pt-1">
            <button
              onClick={() => { setShowForm(false); setPendingFiles([]); }}
              className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-outer-sans"
            >
              Cancelar
            </button>
            <button
              onClick={() => createMut.mutate(form)}
              disabled={!form.title.trim() || createMut.isPending}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors font-outer-sans"
            >
              {createMut.isPending ? 'Criando...' : `Criar${pendingFiles.length > 0 ? ` + ${pendingFiles.length} foto${pendingFiles.length !== 1 ? 's' : ''}` : ''}`}
            </button>
          </div>
        </div>
      )}

      {/* Updates list */}
      {updates.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-sm font-outer-sans">Nenhuma atualização ainda</p>
          <p className="text-xs mt-1 font-outer-sans">Crie a primeira para o cliente acompanhar o stand</p>
        </div>
      )}

      <div className="space-y-3">
        {updates.map(update => {
          const expanded = expandedId === update.id;
          const editing = editingId === update.id;
          const stageColor = STAGE_COLORS[update.stage] ?? 'bg-gray-100 text-gray-700 border-gray-200';

          return (
            <div key={update.id} className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              {/* Update header */}
              <div className="flex items-start gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border font-outer-sans ${stageColor}`}>
                      {stageLabel(update.stage)}
                    </span>
                    {update.published
                      ? <span className="text-[10px] font-semibold text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-outer-sans">Publicado</span>
                      : <span className="text-[10px] font-semibold text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full font-outer-sans">Rascunho</span>
                    }
                    {update.comments.filter(c => c.authorRole === 'cliente').length > 0 && (
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full font-outer-sans flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg> {update.comments.filter(c => c.authorRole === 'cliente').length} msg do cliente
                      </span>
                    )}
                  </div>

                  {editing ? (
                    <div className="mt-2 space-y-2">
                      <input
                        type="text"
                        defaultValue={update.title}
                        id={`edit-title-${update.id}`}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 font-outer-sans focus:outline-none focus:ring-2 focus:ring-red-300"
                      />
                      <textarea
                        rows={2}
                        defaultValue={update.description ?? ''}
                        id={`edit-desc-${update.id}`}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm text-gray-700 font-outer-sans focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            const title = (document.getElementById(`edit-title-${update.id}`) as HTMLInputElement)?.value;
                            const description = (document.getElementById(`edit-desc-${update.id}`) as HTMLTextAreaElement)?.value;
                            updateMut.mutate({ id: update.id, data: { title, description } });
                          }}
                          className="px-3 py-1 bg-red-700 text-white text-xs rounded-lg font-outer-sans"
                        >
                          Salvar
                        </button>
                        <button onClick={() => setEditingId(null)} className="px-3 py-1 text-gray-600 text-xs rounded-lg hover:bg-gray-100 font-outer-sans">
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-sm font-semibold text-gray-800 font-outer-sans">{update.title}</p>
                      {update.description && <p className="mt-0.5 text-xs text-gray-500 font-outer-sans">{update.description}</p>}
                    </>
                  )}

                  <p className="mt-1.5 text-[10px] text-gray-400 font-outer-sans">
                    {update.author.name} · {new Date(update.createdAt).toLocaleDateString('pt-BR')}
                    {update.publishedAt && ` · publicado em ${new Date(update.publishedAt).toLocaleDateString('pt-BR')}`}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => updateMut.mutate({ id: update.id, data: { published: !update.published } })}
                    className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg border transition-colors font-outer-sans ${
                      update.published
                        ? 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        : 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {update.published ? 'Despublicar' : 'Publicar'}
                  </button>
                  <button onClick={() => setEditingId(editing ? null : update.id)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={async () => { const ok = await confirm({ title: 'Remover atualização', message: 'Remover esta atualização?', confirmText: 'Remover' }); if (ok) deleteMut.mutate(update.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setExpandedId(expanded ? null : update.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Photos strip */}
              {update.photos.length > 0 && (
                <div className="px-4 pb-3 flex gap-2 overflow-x-auto">
                  {update.photos.map(photo => (
                    <div key={photo.id} className="relative flex-shrink-0 group">
                      <img
                        src={photo.url}
                        alt={photo.caption ?? ''}
                        className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        onClick={() => deletePhotoMut.mutate(photo.id)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-600 text-white rounded-full text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Upload photos */}
              <div className="px-4 pb-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files?.length && handleUpload(update.id, e.target.files)}
                  id={`upload-${update.id}`}
                />
                <label
                  htmlFor={`upload-${update.id}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-xs text-gray-500 hover:border-red-400 hover:text-red-600 cursor-pointer transition-colors font-outer-sans ${uploadingId === update.id ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  {uploadingId === update.id ? 'Enviando...' : 'Adicionar fotos'}
                </label>
              </div>

              {/* Client messages — always visible */}
              {update.comments.filter(c => c.authorRole === 'cliente').length > 0 && (
                <div className="border-t border-blue-100 px-4 py-3 space-y-2 bg-blue-50/40">
                  <p className="text-[11px] font-semibold text-blue-700 font-outer-sans flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Mensagens do cliente ({update.comments.filter(c => c.authorRole === 'cliente').length})
                  </p>
                  {update.comments.filter(c => c.authorRole === 'cliente').map(c => (
                    <div key={c.id} className="flex items-start gap-2 group">
                      <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white bg-blue-500">
                        {c.authorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 bg-white rounded-lg px-2.5 py-1.5 border border-blue-200">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-gray-700 font-outer-sans">{c.authorName}</span>
                          {c.isApproval && <span className="text-[10px] text-green-700 bg-green-50 border border-green-200 px-1.5 rounded-full font-outer-sans">✓ Aprovação</span>}
                          <span className="text-[10px] text-gray-400 font-outer-sans ml-auto">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <p className="text-xs text-gray-700 font-outer-sans mt-0.5">{c.content}</p>
                      </div>
                      <button
                        onClick={() => deleteCommentMut.mutate(c.id)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Expanded: all comments + admin reply */}
              {expanded && (
                <div className="border-t border-gray-100 px-4 py-3 space-y-3 bg-gray-50/50">
                  {update.comments.filter(c => c.authorRole !== 'cliente').length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-gray-600 font-outer-sans">Respostas da equipe</p>
                      <div className="space-y-2">
                        {update.comments.filter(c => c.authorRole !== 'cliente').map(c => (
                          <div key={c.id} className="flex items-start gap-2 group">
                            <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[9px] font-bold text-white bg-red-700">
                              {c.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 bg-white rounded-lg px-2.5 py-1.5 border border-gray-200">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[11px] font-semibold text-gray-700 font-outer-sans">{c.authorName}</span>
                                <span className="text-[10px] text-gray-400 font-outer-sans ml-auto">{new Date(c.createdAt).toLocaleDateString('pt-BR')}</span>
                              </div>
                              <p className="text-xs text-gray-600 font-outer-sans mt-0.5">{c.content}</p>
                            </div>
                            <button
                              onClick={() => deleteCommentMut.mutate(c.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-300 hover:text-red-500 transition-all"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Responder ao cliente..."
                      value={commentText[update.id] ?? ''}
                      onChange={e => setCommentText(prev => ({ ...prev, [update.id]: e.target.value }))}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && commentText[update.id]?.trim()) {
                          commentMut.mutate({ id: update.id, content: commentText[update.id] });
                        }
                      }}
                      className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 font-outer-sans focus:outline-none focus:ring-2 focus:ring-red-300"
                    />
                    <button
                      onClick={() => commentText[update.id]?.trim() && commentMut.mutate({ id: update.id, content: commentText[update.id] })}
                      className="px-3 py-1.5 bg-red-700 text-white text-xs rounded-lg font-outer-sans hover:bg-red-800 transition-colors"
                    >
                      Enviar
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
