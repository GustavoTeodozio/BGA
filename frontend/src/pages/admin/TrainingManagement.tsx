import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { fixImageUrl } from '../../utils/helpers';
import { useDialog } from '../../components/ConfirmDialog';

interface TrainingTrack {
  id: string;
  tenantId: string;
  title: string;
  description?: string;
  level?: string;
  coverImageUrl?: string;
  introVideoUrl?: string;
  introVideoFileUrl?: string;
  order: number;
  isPublished: boolean;
  modules: TrainingModule[];
}

interface TrainingModule {
  id: string;
  trackId: string;
  title: string;
  summary?: string;
  order: number;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description?: string;
  type: string;
  videoUrl?: string;
  resourceUrl?: string;
  duration?: number;
  order: number;
  isPublished: boolean;
}

// Converte URL do YouTube/Vimeo para URL de embed
function getEmbedUrl(url: string): string | null {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
  return null;
}

// Ícones SVG minimalistas
const BookIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const PlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const XIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronDownIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const ChevronRightIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const VideoIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SpinnerIcon = () => (
  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
);

export function TrainingManagement() {
  const { confirm, alert } = useDialog();
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [showTrackForm, setShowTrackForm] = useState(false);
  const [showModuleForm, setShowModuleForm] = useState(false);
  const [showLessonForm, setShowLessonForm] = useState(false);
  const [, setSelectedTrackId] = useState<string | null>(null);
  const [, setSelectedModuleId] = useState<string | null>(null);
  const [viewingLesson, setViewingLesson] = useState<Lesson | null>(null);

  const queryClient = useQueryClient();

  // Buscar tracks (globais para todos os clientes)
  const { data: tracks, isLoading } = useQuery({
    queryKey: ['admin', 'training', 'tracks'],
    queryFn: async () => {
      const response = await api.get('/admin/training/tracks');
      return response.data;
    },
  });

  // Form states
  const [trackForm, setTrackForm] = useState({
    title: '',
    description: '',
    level: '',
    coverFile: null as File | null,
    videoUrl: '',
    isPublished: true,
  });

  const [moduleForm, setModuleForm] = useState({
    trackId: '',
    title: '',
    summary: '',
  });

  const [lessonForm, setLessonForm] = useState({
    moduleId: '',
    title: '',
    description: '',
    type: 'VIDEO' as 'VIDEO' | 'ARTICLE' | 'LINK' | 'LIVE',
    videoUrl: '',
    thumbnailFile: null as File | null,
    resourceUrl: '',
    duration: '',
    isPublished: true,
    useAutoThumbnail: true,
  });

  // Mutations
  const createTrackMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Adicionar campos de texto
      Object.keys(data).forEach((key) => {
        if (key !== 'coverFile') {
          if (data[key] !== null && data[key] !== undefined && data[key] !== '') {
            formData.append(key, data[key]);
          }
        }
      });
      
      // Adicionar arquivo de capa
      if (data.coverFile) {
        formData.append('cover', data.coverFile);
      }
      
      const response = await api.post('/admin/training/tracks', formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'training', 'tracks'] });
      setShowTrackForm(false);
      setTrackForm({ title: '', description: '', level: '', coverFile: null, videoUrl: '', isPublished: true });
    },
  });

  const createModuleMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await api.post('/admin/training/modules', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'training', 'tracks'] });
      setShowModuleForm(false);
      setModuleForm({ trackId: '', title: '', summary: '' });
    },
  });

  const createLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('[TrainingManagement] Criando aula com dados:', data);
      
      const formData = new FormData();
      
      // Adicionar campos de texto
      Object.keys(data).forEach((key) => {
        if (key !== 'thumbnailFile' && key !== 'useAutoThumbnail') {
          if (data[key] !== null && data[key] !== undefined) {
            // Converter boolean para string
            if (typeof data[key] === 'boolean') {
              formData.append(key, data[key].toString());
            } else if (data[key] !== '') {
              formData.append(key, data[key]);
            }
          }
        }
      });
      
      // Adicionar arquivos (apenas thumbnail)
      if (data.thumbnailFile) {
        formData.append('thumbnail', data.thumbnailFile);
      }
      
      console.log('[TrainingManagement] FormData enviado:', {
        moduleId: formData.get('moduleId'),
        title: formData.get('title'),
        type: formData.get('type'),
        videoUrl: formData.get('videoUrl'),
        isPublished: formData.get('isPublished'),
      });
      
      const response = await api.post('/admin/training/lessons', formData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'training', 'tracks'] });
      setShowLessonForm(false);
      setLessonForm({
        moduleId: '',
        title: '',
        description: '',
        type: 'VIDEO',
        videoUrl: '',
        thumbnailFile: null,
        resourceUrl: '',
        duration: '',
        isPublished: true,
        useAutoThumbnail: true,
      });
    },
  });

  const deleteTrackMutation = useMutation({
    mutationFn: async (trackId: string) => {
      await api.delete(`/admin/training/tracks/${trackId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'training', 'tracks'] });
    },
  });

  const deleteModuleMutation = useMutation({
    mutationFn: async (moduleId: string) => {
      await api.delete(`/admin/training/modules/${moduleId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'training', 'tracks'] });
    },
  });

  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: string) => {
      await api.delete(`/admin/training/lessons/${lessonId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'training', 'tracks'] });
    },
  });

  const toggleTrack = (trackId: string) => {
    const newSet = new Set(expandedTracks);
    if (newSet.has(trackId)) {
      newSet.delete(trackId);
    } else {
      newSet.add(trackId);
    }
    setExpandedTracks(newSet);
  };

  const toggleModule = (moduleId: string) => {
    const newSet = new Set(expandedModules);
    if (newSet.has(moduleId)) {
      newSet.delete(moduleId);
    } else {
      newSet.add(moduleId);
    }
    setExpandedModules(newSet);
  };

  const handleCreateTrack = (e: React.FormEvent) => {
    e.preventDefault();
    createTrackMutation.mutate(trackForm);
  };

  const handleCreateModule = (e: React.FormEvent) => {
    e.preventDefault();
    createModuleMutation.mutate(moduleForm);
  };

  const handleCreateLesson = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validar se é VIDEO e não tem videoUrl
    if (lessonForm.type === 'VIDEO' && !lessonForm.videoUrl) {
      await alert({ title: 'Campo obrigatório', message: 'URL do vídeo é obrigatória quando o tipo é VIDEO', type: 'warning' });
      return;
    }
    
    const data: any = {
      ...lessonForm,
      // Usuário informa em minutos; backend armazena em segundos
      duration: lessonForm.duration ? parseInt(lessonForm.duration) * 60 : undefined,
    };
    
    // Se usar thumbnail automático e tiver videoUrl, não enviar thumbnailFile
    if (lessonForm.useAutoThumbnail && lessonForm.videoUrl) {
      data.thumbnailFile = null;
    }
    
    // Remover videoFile se existir (não é mais usado)
    delete data.videoFile;
    
    createLessonMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mb-4"></div>
          <p className="text-gray-600 font-outer-sans">Carregando treinamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-wine-600 to-gold-500 bg-clip-text text-transparent mb-1 md:mb-2 font-outer-sans leading-tight">
            Gestão de Treinamentos
          </h1>
          <p className="text-gray-600 font-outer-sans">Crie e gerencie cursos e aulas globais para todos os clientes</p>
        </div>
        <button
          onClick={() => setShowTrackForm(!showTrackForm)}
          className="btn btn-primary flex items-center gap-2 font-outer-sans"
        >
          {showTrackForm ? <XIcon /> : <PlusIcon />}
          <span>{showTrackForm ? 'Cancelar' : 'Criar Trilha'}</span>
        </button>
      </div>

      {/* Form Criar Trilha */}
      {showTrackForm && (
        <div className="card-gradient mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wine-500 to-wine-600 flex items-center justify-center shadow-lg">
              <BookIcon />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-outer-sans">Criar Nova Trilha de Treinamento</h2>
          </div>
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 font-outer-sans">
              <strong>ℹ️ Nota:</strong> Esta trilha será disponibilizada para <strong>todos os clientes</strong> automaticamente.
            </p>
          </div>
          <form onSubmit={handleCreateTrack} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1 font-outer-sans">Título *</label>
              <input
                type="text"
                required
                value={trackForm.title}
                onChange={(e) => setTrackForm({ ...trackForm, title: e.target.value })}
                className="input font-outer-sans"
                placeholder="Ex: Curso de Marketing Digital"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-outer-sans">Descrição</label>
              <textarea
                value={trackForm.description}
                onChange={(e) => setTrackForm({ ...trackForm, description: e.target.value })}
                className="input font-outer-sans"
                rows={3}
                placeholder="Descreva a trilha de treinamento..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-outer-sans">Capa da Trilha</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setTrackForm({ ...trackForm, coverFile: file });
                  }
                }}
                className="input font-outer-sans"
              />
              {trackForm.coverFile && (
                <div className="mt-3">
                  <img
                    src={URL.createObjectURL(trackForm.coverFile)}
                    alt="Preview da capa"
                    className="w-full h-48 object-cover rounded-lg border border-gray-200 shadow-md"
                  />
                  <p className="text-xs text-gray-500 mt-1 font-outer-sans">
                    Preview da capa
                  </p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Nível</label>
                <select
                  value={trackForm.level}
                  onChange={(e) => setTrackForm({ ...trackForm, level: e.target.value })}
                  className="input font-outer-sans"
                >
                  <option value="">Selecione o nível</option>
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  checked={trackForm.isPublished}
                  onChange={(e) => setTrackForm({ ...trackForm, isPublished: e.target.checked })}
                  className="w-4 h-4 text-wine-600 rounded focus:ring-wine-500"
                />
                <label className="text-sm font-medium font-outer-sans">Publicado</label>
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={createTrackMutation.isPending}
                className="btn btn-primary flex items-center gap-2 font-outer-sans"
              >
                {createTrackMutation.isPending ? (
                  <>
                    <SpinnerIcon />
                    <span>Criando...</span>
                  </>
                ) : (
                  'Criar Trilha'
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de Trilhas */}
      <div className="space-y-4">
        {tracks && tracks.length > 0 ? (
          tracks.map((track: TrainingTrack) => (
            <div key={track.id} className="card animate-slide-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => toggleTrack(track.id)}
                    className="text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {expandedTracks.has(track.id) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                  </button>
                  {track.coverImageUrl ? (
                    <img
                      src={fixImageUrl(track.coverImageUrl)}
                      alt={track.title}
                      className="w-16 h-16 rounded-lg object-cover border border-gray-200 shadow-sm"
                      onError={(e) => {
                        // Fallback para ícone se a imagem não carregar
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.fallback-icon')) {
                          const fallback = document.createElement('div');
                          fallback.className = 'fallback-icon w-16 h-16 rounded-lg bg-gradient-to-br from-wine-500 to-wine-600 flex items-center justify-center';
                          fallback.innerHTML = '<svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>';
                          parent.appendChild(fallback);
                        }
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-wine-500 to-wine-600 flex items-center justify-center">
                      <BookIcon />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 font-outer-sans">{track.title}</h3>
                    {track.description && (
                      <p className="text-sm text-gray-500 font-outer-sans">{track.description}</p>
                    )}
                    {track.level && (
                      <span className="text-xs text-wine-600 font-semibold font-outer-sans mt-1 inline-block">
                        {track.level}
                      </span>
                    )}
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold font-outer-sans border ${
                      track.isPublished
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-gray-50 text-gray-700 border-gray-200'
                    }`}
                  >
                    {track.isPublished ? 'Publicado' : 'Rascunho'}
                  </span>
                  <button
                    onClick={async () => {
                      const ok = await confirm({ title: 'Excluir trilha', message: 'Tem certeza que deseja excluir esta trilha? Todos os clientes perderão acesso a este curso.', confirmText: 'Excluir' });
                      if (ok) {
                        deleteTrackMutation.mutate(track.id);
                      }
                    }}
                    disabled={deleteTrackMutation.isPending}
                    className="btn btn-danger text-sm flex items-center gap-1.5 font-outer-sans"
                  >
                    <TrashIcon />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedTrackId(track.id);
                      setModuleForm({ trackId: track.id, title: '', summary: '' });
                      setShowModuleForm(true);
                    }}
                    className="btn btn-primary text-sm flex items-center gap-1.5 font-outer-sans"
                  >
                    <PlusIcon />
                    <span>Módulo</span>
                  </button>
                </div>
              </div>

              {/* Módulos */}
              {expandedTracks.has(track.id) && (
                <div className="mt-4 ml-8 space-y-3 border-l-2 border-wine-200 pl-4">
                  {track.modules.map((module: TrainingModule) => (
                    <div key={module.id} className="bg-wine-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            onClick={() => toggleModule(module.id)}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                          >
                            {expandedModules.has(module.id) ? <ChevronDownIcon /> : <ChevronRightIcon />}
                          </button>
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center">
                            <span className="text-white text-xs font-bold font-outer-sans">M</span>
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-800 font-outer-sans">{module.title}</h4>
                            {module.summary && (
                              <p className="text-sm text-gray-600 font-outer-sans">{module.summary}</p>
                            )}
                          </div>
                          <button
                            onClick={async () => {
                              const ok = await confirm({ title: 'Excluir módulo', message: 'Tem certeza que deseja excluir este módulo?', confirmText: 'Excluir' });
                              if (ok) deleteModuleMutation.mutate(module.id);
                            }}
                            disabled={deleteModuleMutation.isPending}
                            className="btn btn-danger text-sm flex items-center gap-1.5 font-outer-sans"
                          >
                            <TrashIcon />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedModuleId(module.id);
                              setLessonForm({
                                moduleId: module.id,
                                title: '',
                                description: '',
                                type: 'VIDEO',
                                videoUrl: '',
                                thumbnailFile: null,
                                resourceUrl: '',
                                duration: '',
                                isPublished: true,
                                useAutoThumbnail: true,
                              });
                              setShowLessonForm(true);
                            }}
                            className="btn btn-primary text-sm flex items-center gap-1.5 font-outer-sans"
                          >
                            <PlusIcon />
                            <span>Aula</span>
                          </button>
                        </div>
                      </div>

                      {/* Aulas */}
                      {expandedModules.has(module.id) && (
                        <div className="mt-3 ml-8 space-y-2">
                          {module.lessons.map((lesson: Lesson) => (
                            <div key={lesson.id} className="bg-white rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                  <VideoIcon />
                                  <div className="min-w-0">
                                    <h5 className="font-medium text-gray-800 font-outer-sans truncate">{lesson.title}</h5>
                                    {lesson.description && (
                                      <p className="text-xs text-gray-500 font-outer-sans">{lesson.description}</p>
                                    )}
                                    <div className="flex gap-2 mt-1 flex-wrap">
                                      <span className="text-xs text-wine-600 font-semibold font-outer-sans">
                                        {lesson.type}
                                      </span>
                                      {lesson.duration && (
                                        <span className="text-xs text-gray-500 font-outer-sans">
                                          {Math.floor(lesson.duration / 60)}min
                                        </span>
                                      )}
                                      {lesson.videoUrl && (
                                        <span className="text-xs text-green-600 font-outer-sans truncate max-w-[200px]">
                                          {lesson.videoUrl}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {lesson.videoUrl && (
                                    <button
                                      onClick={() => setViewingLesson(lesson)}
                                      className="btn btn-primary text-xs flex items-center gap-1 font-outer-sans"
                                    >
                                      <VideoIcon />
                                      <span>Ver</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={async () => {
                                      const ok = await confirm({ title: 'Excluir aula', message: 'Tem certeza que deseja excluir esta aula?', confirmText: 'Excluir' });
                                      if (ok) {
                                        deleteLessonMutation.mutate(lesson.id);
                                      }
                                    }}
                                    disabled={deleteLessonMutation.isPending}
                                    className="btn btn-danger text-sm flex items-center gap-1.5 font-outer-sans"
                                  >
                                    <TrashIcon />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="card-gradient text-center py-16 animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-wine-100 to-gold-100 flex items-center justify-center mx-auto mb-4">
              <BookIcon />
            </div>
            <p className="text-gray-600 mb-2 text-lg font-medium font-outer-sans">
              Nenhuma trilha de treinamento criada ainda.
            </p>
            <p className="text-gray-500 text-sm font-outer-sans">
              Comece criando sua primeira trilha de treinamento
            </p>
          </div>
        )}
      </div>

      {/* Modal Visualizar Aula */}
      {viewingLesson && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setViewingLesson(null)}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl mx-4 overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
              <div>
                <h2 className="text-lg font-bold text-gray-800 font-outer-sans">{viewingLesson.title}</h2>
                {viewingLesson.description && (
                  <p className="text-sm text-gray-500 font-outer-sans">{viewingLesson.description}</p>
                )}
              </div>
              <button onClick={() => setViewingLesson(null)} className="text-gray-400 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                <XIcon />
              </button>
            </div>

            {/* Player */}
            <div className="bg-black">
              {(() => {
                const embedUrl = getEmbedUrl(viewingLesson.videoUrl || '');
                if (embedUrl) {
                  return (
                    <iframe
                      src={embedUrl}
                      className="w-full"
                      style={{ aspectRatio: '16/9' }}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  );
                }
                // URL não é YouTube/Vimeo — tenta como vídeo direto
                if (viewingLesson.videoUrl) {
                  return (
                    <video
                      src={viewingLesson.videoUrl}
                      controls
                      autoPlay
                      className="w-full"
                      style={{ aspectRatio: '16/9' }}
                    />
                  );
                }
                return (
                  <div className="flex items-center justify-center py-16 text-white font-outer-sans">
                    Nenhum vídeo disponível
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 bg-gray-50 flex items-center gap-4 text-sm text-gray-600 font-outer-sans">
              <span className="px-2 py-0.5 bg-wine-100 text-wine-700 rounded font-semibold">{viewingLesson.type}</span>
              {viewingLesson.duration && <span>{Math.floor(viewingLesson.duration / 60)} minutos</span>}
              {viewingLesson.resourceUrl && (
                <a href={viewingLesson.resourceUrl} target="_blank" rel="noopener noreferrer" className="text-wine-600 hover:underline">
                  Material complementar →
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Módulo */}
      {showModuleForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-wine-200 animate-scale-in">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 font-outer-sans">Criar Módulo</h2>
            <form onSubmit={handleCreateModule} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Título *</label>
                <input
                  type="text"
                  required
                  value={moduleForm.title}
                  onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                  className="input font-outer-sans"
                  placeholder="Nome do módulo"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Resumo</label>
                <textarea
                  value={moduleForm.summary}
                  onChange={(e) => setModuleForm({ ...moduleForm, summary: e.target.value })}
                  className="input font-outer-sans"
                  rows={3}
                  placeholder="Resumo do módulo..."
                />
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModuleForm(false)}
                  className="btn btn-secondary flex-1 font-outer-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createModuleMutation.isPending}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2 font-outer-sans"
                >
                  {createModuleMutation.isPending ? <SpinnerIcon /> : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Aula */}
      {showLessonForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-wine-200 animate-scale-in max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 font-outer-sans">Criar Aula</h2>
            <form onSubmit={handleCreateLesson} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Título *</label>
                <input
                  type="text"
                  required
                  value={lessonForm.title}
                  onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                  className="input font-outer-sans"
                  placeholder="Nome da aula"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Descrição</label>
                <textarea
                  value={lessonForm.description}
                  onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                  className="input font-outer-sans"
                  rows={3}
                  placeholder="Descrição da aula..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Tipo *</label>
                <select
                  required
                  value={lessonForm.type}
                  onChange={(e) =>
                    setLessonForm({ ...lessonForm, type: e.target.value as 'VIDEO' | 'ARTICLE' | 'LINK' | 'LIVE' })
                  }
                  className="input font-outer-sans"
                >
                  <option value="VIDEO">Vídeo</option>
                  <option value="ARTICLE">Artigo</option>
                  <option value="LINK">Link</option>
                  <option value="LIVE">Ao Vivo</option>
                </select>
              </div>
              {lessonForm.type === 'VIDEO' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1 font-outer-sans">
                      URL do Vídeo (YouTube/Vimeo) <span className="text-wine-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={lessonForm.videoUrl}
                      onChange={(e) => setLessonForm({ ...lessonForm, videoUrl: e.target.value })}
                      className="input font-outer-sans"
                      placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1 font-outer-sans">
                      <span className="text-wine-500 font-semibold">Obrigatório:</span> Cole a URL completa do YouTube ou Vimeo. O vídeo será exibido diretamente da plataforma.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 font-outer-sans">Capa/Thumbnail</label>
                    <div className="mb-2">
                      <input
                        type="checkbox"
                        checked={lessonForm.useAutoThumbnail}
                        onChange={(e) => setLessonForm({ ...lessonForm, useAutoThumbnail: e.target.checked })}
                        className="w-4 h-4 text-wine-600 rounded focus:ring-wine-500"
                      />
                      <label className="text-sm font-medium ml-2 font-outer-sans">
                        Gerar automaticamente (YouTube/Vimeo)
                      </label>
                    </div>
                    {!lessonForm.useAutoThumbnail && (
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setLessonForm({ ...lessonForm, thumbnailFile: file });
                          }
                        }}
                        className="input font-outer-sans"
                      />
                    )}
                    {lessonForm.thumbnailFile && (
                      <div className="mt-2">
                        <img
                          src={URL.createObjectURL(lessonForm.thumbnailFile)}
                          alt="Preview"
                          className="w-full h-32 object-cover rounded-lg border border-gray-200"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">URL de Recurso</label>
                <input
                  type="url"
                  value={lessonForm.resourceUrl}
                  onChange={(e) => setLessonForm({ ...lessonForm, resourceUrl: e.target.value })}
                  className="input font-outer-sans"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Duração (minutos)</label>
                <input
                  type="number"
                  value={lessonForm.duration}
                  onChange={(e) => setLessonForm({ ...lessonForm, duration: e.target.value })}
                  className="input font-outer-sans"
                  placeholder="60"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={lessonForm.isPublished}
                  onChange={(e) => setLessonForm({ ...lessonForm, isPublished: e.target.checked })}
                  className="w-4 h-4 text-wine-600 rounded focus:ring-wine-500"
                />
                <label className="text-sm font-medium font-outer-sans">Publicado</label>
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowLessonForm(false)}
                  className="btn btn-secondary flex-1 font-outer-sans"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLessonMutation.isPending}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2 font-outer-sans"
                >
                  {createLessonMutation.isPending ? <SpinnerIcon /> : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

