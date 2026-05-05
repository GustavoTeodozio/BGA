import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

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
  photos: Photo[];
  comments: Comment[];
  author?: { id: string; name: string; avatar?: string };
}

const _si = (d: string, extra?: string) => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
    {extra && <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={extra} />}
  </svg>
);

const STAGE_META: Record<string, { label: string; icon: JSX.Element; color: string; bg: string }> = {
  pre_montagem: { label: 'Pré-montagem',  icon: _si('M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z'), color: 'text-gray-700',   bg: 'bg-gray-100 border-gray-300' },
  estrutura:    { label: 'Estrutura',     icon: _si('M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4'), color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-300' },
  montagem:     { label: 'Montagem',      icon: _si('M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', 'M15 12a3 3 0 11-6 0 3 3 0 016 0z'), color: 'text-amber-700',  bg: 'bg-amber-50 border-amber-300' },
  acabamento:   { label: 'Acabamentos',   icon: _si('M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01'), color: 'text-orange-700', bg: 'bg-orange-50 border-orange-300' },
  finalizacao:  { label: 'Finalização',   icon: _si('M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'), color: 'text-purple-700', bg: 'bg-purple-50 border-purple-300' },
  entrega:      { label: 'Stand Pronto',  icon: _si('M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'), color: 'text-green-700',  bg: 'bg-green-50 border-green-300' },
};

export function StandProgress() {
  const qc = useQueryClient();
  const [lightbox, setLightbox] = useState<{ photos: Photo[]; idx: number } | null>(null);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const { data: updates = [], isLoading } = useQuery<StandUpdate[]>({
    queryKey: ['client-stand-updates'],
    queryFn: async () => (await api.get('/client/stand-updates')).data,
  });

  const commentMut = useMutation({
    mutationFn: ({ id, content, isApproval }: { id: string; content: string; isApproval?: boolean }) =>
      api.post(`/client/stand-updates/${id}/comments`, { content, isApproval }),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ['client-stand-updates'] });
      setCommentText(prev => ({ ...prev, [id]: '' }));
    },
  });

  const toggleComments = (id: string) => {
    setExpandedComments(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-24 text-gray-400">
      <svg className="w-6 h-6 animate-spin mr-2" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
      </svg>
      <span className="font-outer-sans">Carregando atualizações...</span>
    </div>
  );

  if (updates.length === 0) return (
    <div className="max-w-2xl mx-auto py-16 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center">
        <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
      </div>
      <h3 className="text-base font-semibold text-gray-700 font-outer-sans">Nenhuma atualização ainda</h3>
      <p className="text-sm text-gray-400 font-outer-sans mt-1">
        Em breve você poderá acompanhar o progresso do seu stand aqui.
      </p>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Page header */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 font-outer-sans">Acompanhamento do Stand</h2>
        <p className="text-sm text-gray-500 font-outer-sans mt-0.5">
          Acompanhe cada etapa da montagem do seu stand em tempo real.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gradient-to-b from-red-200 via-amber-200 to-green-200 hidden md:block" />

        <div className="space-y-5">
          {updates.map((update, idx) => {
            const meta = STAGE_META[update.stage] ?? { label: update.stage, icon: _si('M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', 'M15 11a3 3 0 11-6 0 3 3 0 016 0z'), color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' };
            const showComments = expandedComments.has(update.id);

            return (
              <div key={update.id} className="md:pl-14 relative">
                {/* Timeline dot */}
                <div className={`absolute left-2.5 top-5 w-5 h-5 rounded-full border-2 flex items-center justify-center text-[11px] hidden md:flex ${
                  idx === updates.length - 1 ? 'bg-green-100 border-green-400' : 'bg-white border-red-300'
                }`}>
                  {idx === updates.length - 1
                    ? <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    : idx + 1
                  }
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Stage badge + title */}
                  <div className="px-5 pt-4 pb-3">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${meta.bg} ${meta.color} font-outer-sans`}>
                        <span>{meta.icon}</span>
                        {meta.label}
                      </span>
                      {update.publishedAt && (
                        <span className="text-[11px] text-gray-400 font-outer-sans">
                          {new Date(update.publishedAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <h3 className="text-[15px] font-semibold text-gray-800 font-outer-sans">{update.title}</h3>
                    {update.description && (
                      <p className="text-sm text-gray-500 font-outer-sans mt-0.5">{update.description}</p>
                    )}

                    {/* Autor */}
                    {update.author && (
                      <div className="flex items-center gap-2 mt-2.5">
                        {update.author.avatar
                          ? <img src={update.author.avatar} alt={update.author.name} className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                          : <div className="w-6 h-6 rounded-full bg-gradient-to-br from-red-700 to-red-500 flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0">
                              {update.author.name.charAt(0).toUpperCase()}
                            </div>
                        }
                        <span className="text-xs text-gray-500 font-outer-sans">
                          Enviado por <span className="font-semibold text-gray-700">{update.author.name}</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Photo grid */}
                  {update.photos.length > 0 && (
                    <div className={`px-5 pb-4 grid gap-2 ${
                      update.photos.length === 1 ? 'grid-cols-1' :
                      update.photos.length === 2 ? 'grid-cols-2' :
                      'grid-cols-3'
                    }`}>
                      {update.photos.map((photo, pi) => (
                        <button
                          key={photo.id}
                          onClick={() => setLightbox({ photos: update.photos, idx: pi })}
                          className="aspect-video bg-gray-100 rounded-xl overflow-hidden border border-gray-200 hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={photo.url}
                            alt={photo.caption ?? `Foto ${pi + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Comments toggle */}
                  <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                    <button
                      onClick={() => toggleComments(update.id)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 font-outer-sans transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      {update.comments.length > 0
                        ? `${update.comments.length} comentário${update.comments.length !== 1 ? 's' : ''}`
                        : 'Comentar'
                      }
                      <svg className={`w-3 h-3 ml-0.5 transition-transform ${showComments ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showComments && (
                      <div className="mt-3 space-y-3">
                        {/* Existing comments */}
                        {update.comments.map(c => (
                          <div key={c.id} className="flex items-start gap-2.5">
                            <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white ${c.authorRole === 'cliente' ? 'bg-blue-500' : 'bg-red-700'}`}>
                              {c.authorName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 border border-gray-200">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-xs font-semibold text-gray-700 font-outer-sans">{c.authorName}</span>
                                {c.isApproval && (
                                  <span className="text-[10px] bg-green-50 border border-green-200 text-green-700 px-1.5 py-0.5 rounded-full font-outer-sans">Aprovação</span>
                                )}
                                <span className="text-[10px] text-gray-400 font-outer-sans ml-auto">
                                  {new Date(c.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 font-outer-sans">{c.content}</p>
                            </div>
                          </div>
                        ))}

                        {/* Add comment */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            placeholder="Escreva um comentário..."
                            value={commentText[update.id] ?? ''}
                            onChange={e => setCommentText(prev => ({ ...prev, [update.id]: e.target.value }))}
                            onKeyDown={e => {
                              if (e.key === 'Enter' && commentText[update.id]?.trim()) {
                                commentMut.mutate({ id: update.id, content: commentText[update.id] });
                              }
                            }}
                            className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 font-outer-sans focus:outline-none focus:ring-2 focus:ring-red-200"
                          />
                          <button
                            onClick={() => commentText[update.id]?.trim() &&
                              commentMut.mutate({ id: update.id, content: commentText[update.id] })
                            }
                            disabled={!commentText[update.id]?.trim() || commentMut.isPending}
                            className="px-4 py-2 bg-red-700 hover:bg-red-800 disabled:opacity-50 text-white text-sm rounded-xl font-outer-sans transition-colors"
                          >
                            Enviar
                          </button>
                        </div>

                        {/* Quick approval button */}
                        <button
                          onClick={() => commentMut.mutate({ id: update.id, content: 'Aprovado! ✅', isApproval: true })}
                          className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors font-outer-sans"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Aprovar esta etapa
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/70 hover:text-white p-2 rounded-full hover:bg-white/10"
            onClick={() => setLightbox(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {lightbox.idx > 0 && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10"
              onClick={e => { e.stopPropagation(); setLightbox(prev => prev && { ...prev, idx: prev.idx - 1 }); }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <img
            src={lightbox.photos[lightbox.idx].url}
            alt=""
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
            onClick={e => e.stopPropagation()}
          />

          {lightbox.idx < lightbox.photos.length - 1 && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white p-3 rounded-full hover:bg-white/10"
              onClick={e => { e.stopPropagation(); setLightbox(prev => prev && { ...prev, idx: prev.idx + 1 }); }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
            {lightbox.photos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setLightbox(prev => prev && { ...prev, idx: i }); }}
                className={`w-2 h-2 rounded-full transition-all ${i === lightbox.idx ? 'bg-white scale-125' : 'bg-white/40'}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
