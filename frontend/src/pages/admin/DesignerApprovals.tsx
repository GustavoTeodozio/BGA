import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { fixImageUrl } from '../../utils/helpers';

// Ícones SVG
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
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ImageIcon = () => (
  <svg className="w-6 h-6 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-6 h-6 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      return <ImageIcon />;
  }
};

export function DesignerApprovals() {
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  const { data: pendingData, isLoading: pendingLoading } = useQuery({
    queryKey: ['approvals', 'pending'],
    queryFn: async () => {
      const response = await api.get('/admin/media/approvals/pending');
      return response.data;
    },
  });

  const { data: approvedData, isLoading: approvedLoading } = useQuery({
    queryKey: ['approvals', 'approved'],
    queryFn: async () => {
      const response = await api.get('/admin/media/approvals/approved');
      return response.data;
    },
    enabled: activeTab === 'approved',
  });

  const { data: rejectedData, isLoading: rejectedLoading } = useQuery({
    queryKey: ['approvals', 'rejected'],
    queryFn: async () => {
      const response = await api.get('/admin/media/approvals/rejected');
      return response.data;
    },
    enabled: activeTab === 'rejected',
  });

  const getCurrentData = () => {
    switch (activeTab) {
      case 'pending':
        return pendingData;
      case 'approved':
        return approvedData;
      case 'rejected':
        return rejectedData;
      default:
        return null;
    }
  };

  const isLoading = () => {
    switch (activeTab) {
      case 'pending':
        return pendingLoading;
      case 'approved':
        return approvedLoading;
      case 'rejected':
        return rejectedLoading;
      default:
        return false;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-semibold font-outer-sans border border-green-200 flex items-center gap-1">
            <CheckIcon />
            Aprovado
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-3 py-1.5 bg-wine-50 text-wine-700 rounded-full text-xs font-semibold font-outer-sans border border-wine-200 flex items-center gap-1">
            <XIcon />
            Recusado
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full text-xs font-semibold font-outer-sans border border-yellow-200 flex items-center gap-1">
            <ClockIcon />
            Aguardando
          </span>
        );
    }
  };

  const currentData = getCurrentData();

  return (
    <div className="p-6 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-wine-600 to-gold-500 bg-clip-text text-transparent mb-1 md:mb-2 font-outer-sans leading-tight">
          Designer - Aprovações
        </h1>
        <p className="text-gray-600 font-outer-sans">
          Acompanhe as aprovações e recusas de conteúdo pelos clientes
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-6 py-3 rounded-xl font-semibold font-outer-sans transition-all duration-200 ${
            activeTab === 'pending'
              ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg shadow-yellow-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <ClockIcon />
            <span>Aguardando</span>
            {pendingData?.total > 0 && (
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                {pendingData.total}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`px-6 py-3 rounded-xl font-semibold font-outer-sans transition-all duration-200 ${
            activeTab === 'approved'
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckIcon />
            <span>Aprovados</span>
            {approvedData?.total > 0 && (
              <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs">
                {approvedData.total}
              </span>
            )}
          </div>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`px-6 py-3 rounded-xl font-semibold font-outer-sans transition-all duration-200 ${
            activeTab === 'rejected'
              ? 'bg-gradient-to-r from-wine-500 to-wine-600 text-white shadow-lg shadow-wine-500/30'
              : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <XIcon />
            <span>Recusados</span>
            {rejectedData?.total > 0 && (
              <span className="px-2 py-0.5 bg-wine-100 text-wine-800 rounded-full text-xs">
                {rejectedData.total}
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Content */}
      {isLoading() ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mb-4"></div>
            <p className="text-gray-600 font-outer-sans">Carregando...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(currentData?.items || []).map((media: any, index: number) => {
            const imageUrl = media.type === 'IMAGE' ? fixImageUrl(media.fileUrl) : null;
            const videoUrl = media.type === 'VIDEO' ? fixImageUrl(media.fileUrl) : null;

            return (
              <div
                key={media.id}
                className="card-interactive animate-slide-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Image/Video Preview */}
                {imageUrl ? (
                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-100">
                    <img
                      src={imageUrl}
                      alt={media.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                ) : videoUrl ? (
                  <div className="mb-4 rounded-lg overflow-hidden bg-gray-900">
                    <video
                      src={videoUrl}
                      className="w-full h-48 object-cover"
                      controls={false}
                      preload="metadata"
                    />
                  </div>
                ) : (
                  <div className="mb-4 flex items-center justify-center h-48 rounded-lg bg-gradient-to-br from-wine-100 to-gold-100">
                    {getTypeIcon(media.type)}
                  </div>
                )}

                {/* Content Info */}
                <div className="mb-4">
                  <h3 className="font-bold text-gray-800 mb-1 font-outer-sans text-lg truncate">
                    {media.title}
                  </h3>
                  {media.description && (
                    <p className="text-sm text-gray-500 font-outer-sans line-clamp-2">
                      {media.description}
                    </p>
                  )}
                </div>

                {/* Client Info */}
                <div className="mb-4 p-3 bg-wine-50 rounded-lg border border-wine-100">
                  <p className="text-xs text-wine-600 font-semibold font-outer-sans mb-1">
                    Cliente
                  </p>
                  <p className="text-sm text-gray-800 font-outer-sans font-medium">
                    {media.tenant?.clients?.businessName || 'N/A'}
                  </p>
                </div>

                {/* Status and Category */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  {getStatusBadge(media.approvalStatus)}
                  {media.category && (
                    <span className="px-3 py-1.5 bg-wine-50 text-wine-700 rounded-full text-xs font-semibold font-outer-sans border border-wine-200">
                      {media.category}
                    </span>
                  )}
                  <span className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-semibold font-outer-sans">
                    {media.type}
                  </span>
                </div>

                {/* Rejection Note */}
                {media.rejectionNote && (
                  <div className="mb-4 p-3 bg-wine-50 rounded-lg border border-wine-100">
                    <p className="text-xs text-wine-600 font-semibold font-outer-sans mb-1">
                      Motivo da Recusa
                    </p>
                    <p className="text-sm text-gray-700 font-outer-sans">
                      {media.rejectionNote}
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div className="pt-4 border-t border-gray-100 space-y-1">
                  <p className="text-xs text-gray-500 font-outer-sans">
                    Enviado: {new Date(media.createdAt).toLocaleString('pt-BR')}
                  </p>
                  {media.approvedAt && (
                    <p className="text-xs text-gray-500 font-outer-sans">
                      {media.approvalStatus === 'APPROVED' ? 'Aprovado' : 'Recusado'} em:{' '}
                      {new Date(media.approvedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                  {media.approvedBy && (
                    <p className="text-xs text-gray-500 font-outer-sans">
                      Por: {media.approvedBy.name}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {(!currentData?.items || currentData.items.length === 0) && (
            <div className="col-span-full card-gradient text-center py-16">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-wine-100 to-gold-100 flex items-center justify-center mx-auto mb-4">
                {activeTab === 'pending' && <ClockIcon />}
                {activeTab === 'approved' && <CheckIcon />}
                {activeTab === 'rejected' && <XIcon />}
              </div>
              <p className="text-gray-600 mb-2 text-lg font-medium font-outer-sans">
                Nenhum conteúdo {activeTab === 'pending' ? 'aguardando aprovação' : activeTab === 'approved' ? 'aprovado' : 'recusado'} ainda.
              </p>
              <p className="text-gray-500 text-sm font-outer-sans">
                Os conteúdos aparecerão aqui conforme os clientes tomarem suas decisões.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

