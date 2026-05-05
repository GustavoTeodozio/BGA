import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { fixImageUrl } from '../../utils/helpers';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/Toast';
import { useDialog } from '../../components/ConfirmDialog';

// Ícones SVG minimalistas
const FolderIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'IMAGE':
      return <ImageIcon />;
    case 'VIDEO':
      return <VideoIcon />;
    case 'DOCUMENT':
      return <DocumentIcon />;
    default:
      return <FolderIcon />;
  }
};

export function MediaLibrary() {
  const { confirm } = useDialog();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [rejectionNote, setRejectionNote] = useState<{ [key: string]: string }>({});
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['media'],
    queryFn: async () => {
      console.log('[MediaLibrary] Buscando mídias...');
      const response = await api.get('/client/media');
      const items = response.data.items ?? [];
      console.log(`[MediaLibrary] total=${response.data.total} items=${items.length}`);
      if (items.length > 0) {
        console.log('[MediaLibrary] primeiro item tenantId:', items[0].tenantId, '| status:', items[0].status);
      }
      return response.data;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      await api.post(`/client/media/${mediaId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      toast.success('Conteúdo aprovado com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao aprovar conteúdo. Tente novamente.');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ mediaId, note }: { mediaId: string; note?: string }) => {
      await api.post(`/client/media/${mediaId}/reject`, { rejectionNote: note });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media'] });
      setShowRejectModal(null);
      setRejectionNote({});
      toast.info('Conteúdo recusado. A equipe foi notificada.');
    },
    onError: () => {
      toast.error('Erro ao recusar conteúdo. Tente novamente.');
    },
  });

  const handleApprove = async (mediaId: string) => {
    const ok = await confirm({ title: 'Aprovar conteúdo', message: 'Deseja aprovar este conteúdo?', confirmText: 'Aprovar', type: 'warning' });
    if (ok) approveMutation.mutate(mediaId);
  };

  const handleReject = (mediaId: string) => {
    setShowRejectModal(mediaId);
  };

  const confirmReject = (mediaId: string) => {
    rejectMutation.mutate({ mediaId, note: rejectionNote[mediaId] });
  };

  const getStatusBadge = (status: string, rejectionNote?: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-xs font-bold font-outer-sans border-2 border-green-400 flex items-center gap-2 shadow-md">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
            Aprovado
          </span>
        );
      case 'REJECTED':
        return (
          <span 
            className="px-4 py-2 bg-gradient-to-r from-wine-500 to-rose-600 text-white rounded-xl text-xs font-bold font-outer-sans border-2 border-wine-400 flex items-center gap-2 cursor-help shadow-md" 
            title={rejectionNote || 'Conteúdo recusado'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Recusado
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-4 py-2 bg-gradient-to-r from-amber-400 to-gold-500 text-white rounded-xl text-xs font-bold font-outer-sans border-2 border-amber-300 flex items-center gap-2 shadow-md animate-pulse">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Aguardando sua Aprovação
          </span>
        );
    }
  };

  console.log('[MediaLibrary] Estado:', { data, isLoading, error });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mb-4"></div>
          <p className="text-gray-600 font-outer-sans">Carregando conteúdos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-wine-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-wine-500/30">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-wine-600 to-indigo-600 bg-clip-text text-transparent font-outer-sans">
              Biblioteca de Mídias
            </h1>
            <p className="text-gray-600 font-outer-sans flex items-center gap-2 mt-1">
              <svg className="w-4 h-4 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Baixe e visualize os conteúdos disponíveis
            </p>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {(data?.items || []).map((media: any, index: number) => {
          const imageUrl = media.type === 'IMAGE' ? fixImageUrl(media.fileUrl) : null;
          const videoUrl = media.type === 'VIDEO' ? fixImageUrl(media.fileUrl) : null;
          
          return (
            <div 
              key={media.id} 
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 animate-slide-up border-2 border-transparent hover:border-wine-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image Preview */}
              {imageUrl ? (
                <>
                  <div className="relative mb-4 rounded-t-2xl overflow-hidden bg-gradient-to-br from-wine-100 to-indigo-100 h-56">
                    <img 
                      src={imageUrl} 
                      alt={media.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                    {/* Overlay gradiente sutil */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    
                    {/* Badge de tipo */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-bold text-wine-700">Imagem</span>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <h3 className="font-bold text-gray-800 mb-2 font-outer-sans text-xl truncate">{media.title}</h3>
                    {media.description && (
                      <p className="text-sm text-gray-600 font-outer-sans line-clamp-2 mb-4">{media.description}</p>
                    )}
                  </div>
                </>
              ) : videoUrl ? (
                <>
                  {/* Video Preview */}
                  <div className="relative mb-4 rounded-t-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 h-56">
                    <video
                      src={videoUrl}
                      className="w-full h-full object-cover"
                      controls={true}
                      preload="metadata"
                      playsInline
                    >
                      Seu navegador não suporta a tag de vídeo.
                    </video>
                    {/* Badge de tipo */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs font-bold text-gold-700">Vídeo</span>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <h3 className="font-bold text-gray-800 mb-2 font-outer-sans text-xl truncate">{media.title}</h3>
                    {media.description && (
                      <p className="text-sm text-gray-600 font-outer-sans line-clamp-2 mb-4">{media.description}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="relative h-56 bg-gradient-to-br from-wine-50 via-indigo-50 to-wine-100 rounded-t-2xl flex items-center justify-center mb-4">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-wine-500 to-indigo-600 flex items-center justify-center shadow-2xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                      {getTypeIcon(media.type)}
                    </div>
                    {/* Badge de tipo */}
                    <div className="absolute top-3 left-3 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="text-xs font-bold text-green-700">Documento</span>
                    </div>
                  </div>
                  <div className="px-5 pb-5">
                    <h3 className="font-bold text-gray-800 mb-2 font-outer-sans text-xl truncate">{media.title}</h3>
                    {media.description && (
                      <p className="text-sm text-gray-600 font-outer-sans line-clamp-2 mb-4">{media.description}</p>
                    )}
                  </div>
                </>
              )}

            {/* Tags */}
            <div className="px-5 pb-4">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                {getStatusBadge(media.approvalStatus, media.rejectionNote)}
                {media.category && (
                  <span className="px-3 py-1.5 bg-gradient-to-r from-wine-50 to-indigo-50 text-wine-700 rounded-full text-xs font-bold font-outer-sans border-2 border-wine-200 shadow-sm">
                    {media.category}
                  </span>
                )}
              </div>
            </div>

            {/* Approval Actions */}
            {media.approvalStatus === 'PENDING' && (
              <div className="px-5 pb-4">
                <div className="flex gap-3 p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-xl border-2 border-amber-200">
                  <button
                    onClick={() => handleApprove(media.id)}
                    disabled={approveMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-sm flex items-center justify-center gap-2 font-bold font-outer-sans disabled:opacity-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <CheckIcon />
                    <span>Aprovar</span>
                  </button>
                  <button
                    onClick={() => handleReject(media.id)}
                    disabled={rejectMutation.isPending}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-wine-500 to-rose-600 hover:from-wine-600 hover:to-rose-700 text-white text-sm flex items-center justify-center gap-2 font-bold font-outer-sans disabled:opacity-50 rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                  >
                    <XIcon />
                    <span>Recusar</span>
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="px-5 pb-5">
              <div className="flex gap-3">
                <a
                  href={fixImageUrl(media.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 hover:text-gray-900 text-sm flex items-center justify-center gap-2 font-bold font-outer-sans rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border-2 border-gray-300"
                >
                  <EyeIcon />
                  <span>Visualizar</span>
                </a>
                <button
                onClick={async () => {
                  const url = fixImageUrl(media.fileUrl);
                  try {
                    // Para vídeos e arquivos grandes, usar fetch para garantir download
                    const response = await fetch(url, {
                      method: 'GET',
                      headers: {
                        'Accept': '*/*',
                      },
                    });
                    
                    if (!response.ok) {
                      throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    
                    const blob = await response.blob();
                    const blobUrl = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = blobUrl;
                    
                    // Extrair extensão do arquivo da URL ou usar tipo de mídia
                    const urlParts = media.fileUrl.split('.');
                    const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1] : 
                      (media.type === 'VIDEO' ? 'mp4' : 
                       media.type === 'IMAGE' ? 'jpg' : 
                       media.type === 'DOCUMENT' ? 'pdf' : 'bin');
                    
                    link.download = `${media.title || 'download'}.${extension}`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(blobUrl);
                  } catch (error) {
                    console.error('Erro ao fazer download:', error);
                    // Fallback para link direto
                    const link = document.createElement('a');
                    link.href = url;
                    const urlParts = media.fileUrl.split('.');
                    const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1] : 
                      (media.type === 'VIDEO' ? 'mp4' : 
                       media.type === 'IMAGE' ? 'jpg' : 
                       media.type === 'DOCUMENT' ? 'pdf' : 'bin');
                    link.download = `${media.title || 'download'}.${extension}`;
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-wine-600 to-indigo-600 hover:from-wine-700 hover:to-indigo-700 text-white text-sm flex items-center justify-center gap-2 font-bold font-outer-sans rounded-xl shadow-md hover:shadow-lg transition-all duration-300"
              >
                <DownloadIcon />
                <span>Download</span>
              </button>
              </div>
              
              {/* Date */}
              {media.createdAt && (
                <div className="flex items-center gap-2 mt-4 text-xs text-gray-500 font-outer-sans">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Disponível desde {new Date(media.createdAt).toLocaleDateString('pt-BR')}
                </div>
              )}
            </div>
          </div>
          );
        })}
        
        {(!data?.items || data.items.length === 0) && (
          <div className="col-span-full bg-gradient-to-br from-wine-50 via-indigo-50 to-wine-100 rounded-2xl text-center py-20 animate-slide-up border-2 border-wine-200 shadow-lg">
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-wine-500 to-indigo-600 flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-gray-700 mb-3 text-xl font-bold font-outer-sans">
              Nenhum conteúdo disponível ainda
            </p>
            <p className="text-gray-600 text-base font-outer-sans max-w-md mx-auto">
              Os conteúdos aparecerão aqui quando forem disponibilizados pela equipe
            </p>
          </div>
        )}
      </div>

      {/* Modal de Recusa */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-slide-up border-2 border-wine-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-wine-500 to-rose-600 flex items-center justify-center shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-800 font-outer-sans">
                Recusar Conteúdo
              </h3>
            </div>
            
            <p className="text-gray-600 mb-4 font-outer-sans">
              Deseja adicionar um motivo para a recusa? Isso ajudará nossa equipe a entender melhor suas preferências.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-bold text-gray-700 mb-2 font-outer-sans">
                Motivo da Recusa (opcional)
              </label>
              <textarea
                value={rejectionNote[showRejectModal] || ''}
                onChange={(e) => setRejectionNote({ ...rejectionNote, [showRejectModal]: e.target.value })}
                placeholder="Ex: As cores não condizem com nossa identidade visual..."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-wine-500 focus:border-wine-500 font-outer-sans text-sm"
                rows={4}
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionNote({});
                }}
                className="flex-1 px-5 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold font-outer-sans transition-all duration-300 border-2 border-gray-300"
                disabled={rejectMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={() => confirmReject(showRejectModal)}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-wine-500 to-rose-600 hover:from-wine-600 hover:to-rose-700 text-white rounded-xl font-bold font-outer-sans transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50"
                disabled={rejectMutation.isPending}
              >
                {rejectMutation.isPending ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Recusando...
                  </span>
                ) : (
                  'Confirmar Recusa'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      {toast.toasts.map((t) => (
        <Toast
          key={t.id}
          message={t.message}
          type={t.type}
          onClose={() => toast.removeToast(t.id)}
        />
      ))}
    </div>
  );
}
