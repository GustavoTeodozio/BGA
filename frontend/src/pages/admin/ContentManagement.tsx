import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { fixImageUrl } from '../../utils/helpers';
import { useDialog } from '../../components/ConfirmDialog';

interface Media {
  id: string;
  title: string;
  description?: string;
  category?: string;
  type: string;
  fileUrl: string;
  createdAt: string;
  tenant?: {
    id: string;
    name: string;
    clients?: {
      businessName: string;
      id: string;
    } | null;
  };
}

// Ícones SVG minimalistas
const FolderIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
  </svg>
);

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-5 h-5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-5 h-5 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const BuildingIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

export function ContentManagement() {
  const { confirm, alert } = useDialog();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: '',
    title: '',
    description: '',
    category: '',
    type: 'IMAGE',
    file: null as File | null,
  });

  const queryClient = useQueryClient();

  // Buscar clientes para seleção
  const { data: clients } = useQuery({
    queryKey: ['admin', 'clients'],
    queryFn: async () => {
      const response = await api.get('/admin/clients');
      return response.data;
    },
  });

  const { data: media, isLoading } = useQuery({
    queryKey: ['admin', 'media'],
    queryFn: async () => {
      const response = await api.get('/admin/media');
      return response.data;
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await api.post('/admin/media', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
      setShowForm(false);
      setFormData({
        tenantId: '',
        title: '',
        description: '',
        category: '',
        type: 'IMAGE',
        file: null,
      });
    },
  });

  const [deletingMediaId, setDeletingMediaId] = useState<string | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (mediaId: string) => {
      setDeletingMediaId(mediaId);
      const response = await api.delete(`/admin/media/${mediaId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
      setDeletingMediaId(null);
    },
    onError: () => {
      setDeletingMediaId(null);
    },
  });

  const handleDelete = async (mediaId: string, title: string) => {
    const ok = await confirm({ title: 'Excluir conteúdo', message: `Tem certeza que deseja excluir o conteúdo "${title}"?`, confirmText: 'Excluir' });
    if (ok) deleteMutation.mutate(mediaId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.file) {
      await alert({ title: 'Arquivo obrigatório', message: 'Selecione um arquivo', type: 'warning' });
      return;
    }
    if (!formData.tenantId) {
      await alert({ title: 'Cliente obrigatório', message: 'Selecione um cliente', type: 'warning' });
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('file', formData.file);
    formDataToSend.append('title', formData.title);
    formDataToSend.append('tenantId', formData.tenantId);
    if (formData.description) {
      formDataToSend.append('description', formData.description);
    }
    if (formData.category) {
      formDataToSend.append('category', formData.category);
    }
    formDataToSend.append('type', formData.type);

    console.log('[ContentManagement] Enviando FormData:', {
      tenantId: formData.tenantId,
      title: formData.title,
      type: formData.type,
    });

    uploadMutation.mutate(formDataToSend);
  };

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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-wine-600 to-gold-500 bg-clip-text text-transparent mb-1 md:mb-2 font-outer-sans leading-tight">
            Gestão de Conteúdos
          </h1>
          <p className="text-gray-600 font-outer-sans">Upload e gestão de mídias e materiais de marketing para clientes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2 font-outer-sans"
        >
          {showForm ? <XIcon /> : <UploadIcon />}
          <span>{showForm ? 'Cancelar' : 'Upload de Conteúdo'}</span>
        </button>
      </div>

      {showForm && (
        <div className="card-gradient mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
              <UploadIcon />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-outer-sans">Upload de Conteúdo</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 font-outer-sans">
                Cliente *
              </label>
              <select
                required
                value={formData.tenantId}
                onChange={(e) =>
                  setFormData({ ...formData, tenantId: e.target.value })
                }
                className="input font-outer-sans"
              >
                <option value="">Selecione um cliente</option>
                {clients?.map((client: any) => (
                  <option key={client.id} value={client.id}>
                    {client.clients?.businessName || client.name || 'Cliente'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-outer-sans">
                Título *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="input font-outer-sans"
                placeholder="Nome do conteúdo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-outer-sans">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="input font-outer-sans"
                rows={3}
                placeholder="Descreva o conteúdo..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">
                  Categoria
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="input font-outer-sans"
                  placeholder="Ex: Marketing, Vendas, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">
                  Tipo de Arquivo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                  className="input font-outer-sans"
                >
                  <option value="IMAGE">Imagem</option>
                  <option value="VIDEO">Vídeo</option>
                  <option value="DOCUMENT">Documento</option>
                  <option value="OTHER">Outro</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-outer-sans">
                Arquivo *
              </label>
              <input
                type="file"
                required
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFormData({ ...formData, file });
                  }
                }}
                className="input font-outer-sans"
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={uploadMutation.isPending}
                className="btn btn-primary flex items-center gap-2 font-outer-sans"
              >
                {uploadMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon />
                    <span>Upload</span>
                  </>
                )}
              </button>
            </div>
          </form>
          {uploadMutation.isError && (
            <div className="mt-4 text-wine-600 font-outer-sans">
              Erro ao fazer upload. Tente novamente.
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {media?.items?.map((item: Media, index: number) => {
          const imageUrl = item.type === 'IMAGE' ? fixImageUrl(item.fileUrl) : null;
          const videoUrl = item.type === 'VIDEO' ? fixImageUrl(item.fileUrl) : null;
          
          return (
            <div 
              key={item.id} 
              className="card-interactive animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Image Preview */}
              {imageUrl ? (
                <>
                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                    <img 
                      src={imageUrl} 
                      alt={item.title}
                      className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-800 mb-1 font-outer-sans text-lg truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 font-outer-sans line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </>
              ) : videoUrl ? (
                <>
                  {/* Video Preview */}
                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-900 relative group/video">
                    <video
                      src={videoUrl}
                      className="w-full h-48 object-cover"
                      controls={true}
                      preload="metadata"
                      playsInline
                    >
                      Seu navegador não suporta a tag de vídeo.
                    </video>
                    {/* Badge indicando que é vídeo */}
                    <div className="absolute top-2 right-2 px-2 py-1 bg-black bg-opacity-70 rounded text-white text-xs font-semibold font-outer-sans flex items-center gap-1">
                      <PlayIcon />
                      <span>Vídeo</span>
                    </div>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-800 mb-1 font-outer-sans text-lg truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 font-outer-sans line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-wine-100 to-gold-100 flex items-center justify-center flex-shrink-0 shadow-md border border-wine-200">
                    {getTypeIcon(item.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-800 mb-1 font-outer-sans truncate text-base">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-gray-500 mb-2 font-outer-sans line-clamp-2">{item.description}</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Informação da Empresa */}
              {item.tenant?.clients?.businessName && (
                <div className="mb-3 p-2.5 bg-gradient-to-r from-wine-50 to-gold-50 rounded-lg border border-wine-200 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wine-500 to-wine-600 flex items-center justify-center flex-shrink-0">
                    <BuildingIcon />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-600 font-outer-sans mb-0.5">Enviado para:</p>
                    <p className="text-sm font-semibold text-wine-700 font-outer-sans truncate">
                      {item.tenant.clients.businessName}
                    </p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-2 mb-4">
                {item.category && (
                  <span className="px-2.5 py-1 bg-wine-50 text-wine-700 rounded-full text-xs font-semibold font-outer-sans border border-wine-200">
                    {item.category}
                  </span>
                )}
                <span className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold font-outer-sans">
                  {item.type}
                </span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <a
                  href={fixImageUrl(item.fileUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary text-sm flex-1 flex items-center justify-center gap-1.5 font-outer-sans"
                >
                  <EyeIcon />
                  <span>Ver</span>
                </a>
                <button
                  onClick={async () => {
                    const url = fixImageUrl(item.fileUrl);
                    try {
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
                      
                      const urlParts = item.fileUrl.split('.');
                      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1] : 
                        (item.type === 'VIDEO' ? 'mp4' : 
                         item.type === 'IMAGE' ? 'jpg' : 
                         item.type === 'DOCUMENT' ? 'pdf' : 'bin');
                      
                      link.download = `${item.title || 'download'}.${extension}`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      window.URL.revokeObjectURL(blobUrl);
                    } catch (error) {
                      console.error('Erro ao fazer download:', error);
                      const link = document.createElement('a');
                      link.href = url;
                      const urlParts = item.fileUrl.split('.');
                      const extension = urlParts.length > 1 ? urlParts[urlParts.length - 1] : 
                        (item.type === 'VIDEO' ? 'mp4' : 
                         item.type === 'IMAGE' ? 'jpg' : 
                         item.type === 'DOCUMENT' ? 'pdf' : 'bin');
                      link.download = `${item.title || 'download'}.${extension}`;
                      link.target = '_blank';
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }
                  }}
                  className="btn btn-secondary text-sm flex items-center gap-1.5 font-outer-sans"
                >
                  <DownloadIcon />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id, item.title)}
                  disabled={deletingMediaId === item.id}
                  className="btn btn-danger text-sm flex items-center gap-1.5 font-outer-sans px-3"
                  title="Excluir"
                >
                  {deletingMediaId === item.id ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <TrashIcon />
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-3 font-outer-sans">
                {new Date(item.createdAt).toLocaleDateString('pt-BR')}
              </p>
            </div>
          );
        })}
        {(!media?.items || media.items.length === 0) && (
          <div className="card-gradient text-center py-16 col-span-3 animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-100 to-wine-100 flex items-center justify-center mx-auto mb-4">
              <FolderIcon />
            </div>
            <p className="text-gray-600 mb-2 text-lg font-medium font-outer-sans">
              Nenhum conteúdo enviado ainda.
            </p>
            <p className="text-gray-500 text-sm font-outer-sans">
              Use o botão acima para fazer upload do seu primeiro conteúdo
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
