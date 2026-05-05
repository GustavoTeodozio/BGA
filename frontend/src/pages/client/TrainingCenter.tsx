import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '../../api/client';
import { fixImageUrl } from '../../utils/helpers';
import { convertToEmbedUrl, isVideoUrl } from '../../utils/video-helpers';

interface TrainingTrack {
  id: string;
  title: string;
  description?: string;
  level?: string;
  coverImageUrl?: string;
  introVideoUrl?: string;
  modules: TrainingModule[];
}

interface TrainingModule {
  id: string;
  title: string;
  summary?: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  type: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  resourceUrl?: string;
  duration?: number;
}

// Ícones SVG minimalistas
const BookIcon = () => (
  <svg className="w-8 h-8 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
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
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const LinkIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
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

export function TrainingCenter() {
  const [expandedTracks, setExpandedTracks] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<TrainingTrack | null>(null);
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>('all');

  const { data: tracks, isLoading, error } = useQuery({
    queryKey: ['training', 'tracks'],
    queryFn: async () => {
      console.log('[TrainingCenter] Buscando treinamentos...');
      const response = await api.get('/client/training/tracks');
      console.log('[TrainingCenter] Treinamentos recebidos:', response.data);
      return response.data;
    },
  });

  // Filtrar tracks por nível
  const filteredTracks = tracks?.filter((track: TrainingTrack) => {
    if (selectedLevel === 'all') return true;
    return track.level?.toLowerCase() === selectedLevel.toLowerCase();
  });

  // Contar cursos por nível
  const countByLevel = (level: string) => {
    if (!tracks) return 0;
    if (level === 'all') return tracks.length;
    return tracks.filter((track: TrainingTrack) => 
      track.level?.toLowerCase() === level.toLowerCase()
    ).length;
  };

  console.log('[TrainingCenter] Estado:', { tracks, isLoading, error });
  
  // Log detalhado das trilhas para debug
  if (tracks) {
    tracks.forEach((track: TrainingTrack) => {
      console.log('[TrainingCenter] Trilha:', {
        id: track.id,
        title: track.title,
        introVideoUrl: track.introVideoUrl,
        modules: track.modules.length,
      });
    });
  }

  const saveProgressMutation = useMutation({
    mutationFn: async ({ lessonId, progress }: { lessonId: string; progress: number }) => {
      const response = await api.post('/client/training/progress', { lessonId, progress });
      return response.data;
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

  const handleLessonClick = (lesson: Lesson) => {
    console.log('[TrainingCenter] Aula selecionada:', lesson);
    setSelectedLesson(lesson);
    // Salvar progresso ao iniciar aula
    if (lesson.videoUrl) {
      saveProgressMutation.mutate({ lessonId: lesson.id, progress: 0 });
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  // Quando um curso é selecionado, automaticamente seleciona a primeira aula disponível
  useEffect(() => {
    if (selectedTrack && !selectedLesson) {
      // Buscar a primeira aula do primeiro módulo que tenha aulas
      for (const module of selectedTrack.modules) {
        if (module.lessons && module.lessons.length > 0) {
          const firstLesson = module.lessons[0];
          setSelectedLesson(firstLesson);
          break;
        }
      }
    }
  }, [selectedTrack]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mb-4"></div>
          <p className="text-gray-600 font-outer-sans">Carregando cursos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('[TrainingCenter] Erro ao carregar treinamentos:', error);
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center">
          <p className="text-wine-600 font-outer-sans mb-2">Erro ao carregar cursos</p>
          <p className="text-gray-600 font-outer-sans text-sm">{error instanceof Error ? error.message : 'Erro desconhecido'}</p>
        </div>
      </div>
    );
  }

  // Função para encontrar próxima/anterior aula
  const getAllLessons = (track: TrainingTrack): Lesson[] => {
    const lessons: Lesson[] = [];
    track.modules.forEach(module => {
      if (module.lessons) {
        lessons.push(...module.lessons);
      }
    });
    return lessons;
  };

  const getCurrentLessonIndex = () => {
    if (!selectedTrack || !selectedLesson) return -1;
    const allLessons = getAllLessons(selectedTrack);
    return allLessons.findIndex(l => l.id === selectedLesson.id);
  };

  const getNextLesson = () => {
    if (!selectedTrack || !selectedLesson) return null;
    const allLessons = getAllLessons(selectedTrack);
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      return allLessons[currentIndex + 1];
    }
    return null;
  };

  const getPreviousLesson = () => {
    if (!selectedTrack || !selectedLesson) return null;
    const allLessons = getAllLessons(selectedTrack);
    const currentIndex = getCurrentLessonIndex();
    if (currentIndex > 0) {
      return allLessons[currentIndex - 1];
    }
    return null;
  };

  // Se houver um curso selecionado, mostrar tela de detalhes
  if (selectedTrack) {
    const nextLesson = getNextLesson();
    const previousLesson = getPreviousLesson();
    const currentIndex = getCurrentLessonIndex();
    const totalLessons = getAllLessons(selectedTrack).length;

    return (
      <div className="px-4 py-6 sm:px-0 animate-fade-in">
        {/* Botão voltar */}
        <button
          onClick={() => {
            setSelectedTrack(null);
            setIsPlayingVideo(false);
            setSelectedLesson(null);
          }}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors font-outer-sans group"
        >
          <ChevronRightIcon className="rotate-180 group-hover:-translate-x-1 transition-transform" />
          <span>Voltar para cursos</span>
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Conteúdo principal - Vídeo e informações */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header do curso */}
            <div className="bg-gradient-to-r from-wine-50 to-gold-50 rounded-xl p-6 border border-wine-100">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2 font-outer-sans">{selectedTrack.title}</h1>
              <div className="flex items-center gap-4 mb-4">
                <p className="text-gray-600 font-outer-sans">Por <span className="font-semibold text-wine-600">BGA STANDS</span></p>
                {selectedTrack.level && (
                  <span className="px-3 py-1 bg-wine-100 text-wine-700 rounded-full text-xs font-semibold font-outer-sans">
                    {selectedTrack.level}
                  </span>
                )}
              </div>
              {selectedTrack.description && (
                <p className="text-gray-700 font-outer-sans leading-relaxed">{selectedTrack.description}</p>
              )}
            </div>

            {/* Vídeo da Aula Selecionada */}
            {selectedLesson && (selectedLesson.videoUrl || (selectedLesson.resourceUrl && isVideoUrl(selectedLesson.resourceUrl))) && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Header da aula */}
                <div className="bg-gradient-to-r from-wine-600 to-gold-500 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-white mb-1 font-outer-sans">{selectedLesson.title}</h2>
                      {currentIndex >= 0 && (
                        <p className="text-white/80 text-sm font-outer-sans">
                          Aula {currentIndex + 1} de {totalLessons}
                        </p>
                      )}
                    </div>
                    {selectedLesson.duration && (
                      <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                        <span className="text-white text-sm font-semibold font-outer-sans">{formatDuration(selectedLesson.duration)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Vídeo */}
                <div className="aspect-video bg-gray-900">
                  {(() => {
                    const videoUrl = selectedLesson.videoUrl || (isVideoUrl(selectedLesson.resourceUrl || '') ? selectedLesson.resourceUrl : null);
                    if (!videoUrl) return null;
                    
                    const embedUrl = convertToEmbedUrl(videoUrl);
                    if (embedUrl) {
                      return (
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      );
                    }
                    return null;
                  })()}
                </div>

                {/* Descrição e ações */}
                <div className="p-6">
                  {selectedLesson.description && (
                    <p className="text-gray-700 mb-4 font-outer-sans leading-relaxed">{selectedLesson.description}</p>
                  )}
                  
                  {/* Navegação entre aulas */}
                  <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => previousLesson && handleLessonClick(previousLesson)}
                      disabled={!previousLesson}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all font-outer-sans ${
                        previousLesson
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ChevronRightIcon className="rotate-180" />
                      <span>Anterior</span>
                    </button>

                    {selectedLesson.resourceUrl && !isVideoUrl(selectedLesson.resourceUrl) && (
                      <a
                        href={selectedLesson.resourceUrl}
                        className="px-4 py-2 bg-gradient-to-r from-wine-600 to-gold-500 text-white rounded-lg font-semibold hover:from-wine-700 hover:to-gold-600 transition-all font-outer-sans flex items-center gap-2"
                      >
                        <LinkIcon />
                        <span>
                          {selectedLesson.type === 'LINK' ? 'Acessar Link' : 
                           selectedLesson.type === 'ARTICLE' ? 'Ler Artigo' : 
                           'Abrir Recurso'}
                        </span>
                      </a>
                    )}

                    <button
                      onClick={() => nextLesson && handleLessonClick(nextLesson)}
                      disabled={!nextLesson}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all font-outer-sans ${
                        nextLesson
                          ? 'bg-gradient-to-r from-wine-600 to-gold-500 text-white hover:from-wine-700 hover:to-gold-600'
                          : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <span>Próxima</span>
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mensagem se não houver aula selecionada */}
            {!selectedLesson && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-wine-100 to-gold-100 flex items-center justify-center mx-auto mb-4">
                  <PlayIcon />
                </div>
                <p className="text-gray-600 font-outer-sans text-lg">Selecione uma aula para começar</p>
              </div>
            )}
          </div>

          {/* Sidebar - Módulos */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-24 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-1 font-outer-sans">Conteúdo do Curso</h3>
                <p className="text-sm text-gray-500 font-outer-sans">{totalLessons} {totalLessons === 1 ? 'aula' : 'aulas'}</p>
              </div>
              <div className="space-y-4">
                {selectedTrack.modules.length > 0 ? (
                  selectedTrack.modules.map((module: TrainingModule, moduleIndex: number) => (
                    <div key={module.id} className="border border-gray-200 rounded-xl overflow-hidden hover:border-wine-300 hover:shadow-md transition-all">
                      {/* Header do módulo */}
                      <div className="bg-gradient-to-r from-gold-50 to-wine-50 p-4 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0 shadow-md">
                            <span className="text-white text-sm font-bold font-outer-sans">{moduleIndex + 1}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 font-outer-sans">{module.title}</h4>
                            {module.summary && (
                              <p className="text-xs text-gray-600 font-outer-sans mt-1 line-clamp-1">{module.summary}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Aulas do módulo */}
                      {module.lessons && module.lessons.length > 0 && (
                        <div className="p-2 space-y-1">
                          {module.lessons.map((lesson: Lesson, lessonIndex: number) => {
                            const isActive = selectedLesson?.id === lesson.id;
                            return (
                              <button
                                key={lesson.id}
                                onClick={() => handleLessonClick(lesson)}
                                className={`w-full text-left p-3 rounded-lg transition-all group ${
                                  isActive
                                    ? 'bg-gradient-to-r from-wine-100 to-gold-100 border-2 border-wine-400 shadow-sm'
                                    : 'hover:bg-wine-50 border border-transparent hover:border-wine-200'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                                    isActive
                                      ? 'bg-gradient-to-br from-wine-500 to-gold-500 text-white shadow-md scale-110'
                                      : 'bg-gradient-to-br from-wine-100 to-gold-100 text-gray-700 group-hover:scale-105'
                                  }`}>
                                    {isActive ? (
                                      <PlayIcon />
                                    ) : lesson.type === 'VIDEO' ? (
                                      <VideoIcon />
                                    ) : lesson.type === 'LINK' ? (
                                      <LinkIcon />
                                    ) : (
                                      <PlayIcon />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-semibold font-outer-sans truncate ${
                                      isActive ? 'text-wine-700' : 'text-gray-800'
                                    }`}>
                                      {lesson.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                      {lesson.duration && (
                                        <p className="text-xs text-gray-500 font-outer-sans">{formatDuration(lesson.duration)}</p>
                                      )}
                                      {isActive && (
                                        <span className="text-xs text-wine-600 font-semibold font-outer-sans">• Assistindo</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 font-outer-sans">Nenhum módulo disponível</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-wine-600 to-gold-500 bg-clip-text text-transparent mb-2 font-outer-sans">
          Centro de Treinamento
        </h1>
        <p className="text-gray-600 font-outer-sans">Acesse seus cursos e aulas disponíveis</p>
      </div>

      {/* Filtros de Nível */}
      <div className="mb-6 flex flex-wrap gap-3">
        <button
          onClick={() => setSelectedLevel('all')}
          className={`px-5 py-2.5 rounded-xl font-semibold font-outer-sans transition-all duration-300 flex items-center gap-2 ${
            selectedLevel === 'all'
              ? 'bg-gradient-to-r from-wine-600 to-indigo-600 text-white shadow-lg shadow-wine-500/30 scale-105'
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-wine-300 hover:shadow-md hover:scale-105'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          Todos
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            selectedLevel === 'all' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
          }`}>
            {countByLevel('all')}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevel('iniciante')}
          className={`px-5 py-2.5 rounded-xl font-semibold font-outer-sans transition-all duration-300 flex items-center gap-2 ${
            selectedLevel === 'iniciante'
              ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 scale-105'
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-green-300 hover:shadow-md hover:scale-105'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Iniciante
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            selectedLevel === 'iniciante' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
          }`}>
            {countByLevel('iniciante')}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevel('intermediário')}
          className={`px-5 py-2.5 rounded-xl font-semibold font-outer-sans transition-all duration-300 flex items-center gap-2 ${
            selectedLevel === 'intermediário'
              ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105'
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md hover:scale-105'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Intermediário
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            selectedLevel === 'intermediário' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
          }`}>
            {countByLevel('intermediário')}
          </span>
        </button>

        <button
          onClick={() => setSelectedLevel('avançado')}
          className={`px-5 py-2.5 rounded-xl font-semibold font-outer-sans transition-all duration-300 flex items-center gap-2 ${
            selectedLevel === 'avançado'
              ? 'bg-gradient-to-r from-gold-500 to-wine-600 text-white shadow-lg shadow-gold-500/30 scale-105'
              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-gold-300 hover:shadow-md hover:scale-105'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Avançado
          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            selectedLevel === 'avançado' ? 'bg-white/20' : 'bg-gray-100 text-gray-600'
          }`}>
            {countByLevel('avançado')}
          </span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Cursos */}
        <div className="lg:col-span-2 space-y-6">
          {filteredTracks && filteredTracks.length > 0 ? (
            filteredTracks.map((track: TrainingTrack) => (
              <div 
                key={track.id} 
                className="relative rounded-2xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer group animate-slide-up"
                onClick={() => setSelectedTrack(track)}
              >
                {/* Card com imagem de capa */}
                <div className="relative h-64 md:h-80">
                  {/* Priorizar imagem de capa se disponível */}
                  {track.coverImageUrl ? (
                    <>
                      <img
                        src={fixImageUrl(track.coverImageUrl)}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent && !parent.querySelector('.fallback-gradient')) {
                            const fallback = document.createElement('div');
                            fallback.className = 'fallback-gradient absolute inset-0 bg-gradient-to-br from-wine-600 via-wine-700 to-gold-500';
                            parent.appendChild(fallback);
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    </>
                  ) : track.introVideoUrl ? (
                    // Fallback: usar vídeo do YouTube se não houver imagem
                    <div className="relative w-full h-full">
                      {(() => {
                        const embedUrl = convertToEmbedUrl(track.introVideoUrl!);
                        if (embedUrl) {
                          // Para YouTube, usar thumbnail
                          if (embedUrl.includes('youtube.com/embed/')) {
                            const videoId = embedUrl.split('/embed/')[1]?.split('?')[0];
                            if (videoId) {
                              const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
                              return (
                                <>
                                  <img
                                    src={thumbnailUrl}
                                    alt={track.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                      const parent = target.parentElement;
                                      if (parent && !parent.querySelector('.fallback-gradient')) {
                                        const fallback = document.createElement('div');
                                        fallback.className = 'fallback-gradient absolute inset-0 bg-gradient-to-br from-wine-600 via-wine-700 to-gold-500';
                                        parent.appendChild(fallback);
                                      }
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                                </>
                              );
                            }
                          }
                          // Para Vimeo, usar iframe
                          return (
                            <>
                              <iframe
                                src={embedUrl + (embedUrl.includes('?') ? '&' : '?') + 'autoplay=0&controls=0&mute=1'}
                                className="w-full h-full pointer-events-none"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                                style={{ pointerEvents: 'none' }}
                              ></iframe>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                            </>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  ) : (
                    // Fallback final: gradiente
                    <>
                      <div className="absolute inset-0 bg-gradient-to-br from-wine-600 via-wine-700 to-gold-500"></div>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    </>
                  )}
                  
                  {/* Conteúdo sobreposto */}
                  <div className="absolute inset-0 flex flex-col justify-end p-6 z-10">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 font-outer-sans drop-shadow-lg">
                      {track.title}
                    </h3>
                    {track.description && (
                      <p className="text-white/90 text-sm md:text-base font-outer-sans mb-3 line-clamp-2 drop-shadow">
                        {track.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3">
                      {track.level && (
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full text-xs font-semibold font-outer-sans border border-white/30">
                          {track.level}
                        </span>
                      )}
                      <span className="text-white/80 text-xs font-outer-sans">
                        {track.modules.length} {track.modules.length === 1 ? 'módulo' : 'módulos'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Botão de play sobreposto (apenas se não houver imagem de capa) */}
                  {!track.coverImageUrl && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/50">
                        <PlayIcon />
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ))
          ) : (
            <div className="card-gradient text-center py-16 animate-slide-up">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-wine-100 to-gold-100 flex items-center justify-center mx-auto mb-4">
                <BookIcon />
              </div>
              <p className="text-gray-600 mb-2 text-lg font-medium font-outer-sans">
                {selectedLevel === 'all' 
                  ? 'Nenhum curso disponível ainda.'
                  : `Nenhum curso de nível ${selectedLevel} disponível.`
                }
              </p>
              <p className="text-gray-500 text-sm font-outer-sans">
                {selectedLevel === 'all'
                  ? 'Os cursos aparecerão aqui quando forem disponibilizados pelo administrador.'
                  : 'Tente selecionar outro nível para ver mais cursos.'
                }
              </p>
            </div>
          )}
        </div>

        {/* Player de Vídeo/Aula */}
        {selectedLesson && (
          <div className="lg:col-span-1">
            <div className="card-interactive sticky top-24 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800 font-outer-sans text-lg">{selectedLesson.title}</h3>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <XIcon />
                </button>
              </div>

              {selectedLesson.description && (
                <p className="text-sm text-gray-600 mb-4 font-outer-sans">{selectedLesson.description}</p>
              )}

              {/* Exibir vídeo se tiver videoUrl ou se resourceUrl for um vídeo */}
              {(selectedLesson.videoUrl || (selectedLesson.resourceUrl && isVideoUrl(selectedLesson.resourceUrl))) && (
                <div className="mb-4">
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3">
                    {(() => {
                      // Priorizar videoUrl, mas se não tiver e resourceUrl for vídeo, usar resourceUrl
                      const videoUrl = selectedLesson.videoUrl || (isVideoUrl(selectedLesson.resourceUrl || '') ? selectedLesson.resourceUrl : null);
                      if (!videoUrl) return null;
                      
                      const embedUrl = convertToEmbedUrl(videoUrl);
                      if (embedUrl) {
                        return (
                          <iframe
                            src={embedUrl}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          ></iframe>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              )}

              {/* Mostrar botão de recurso apenas se não for vídeo do YouTube/Vimeo */}
              {selectedLesson.resourceUrl && !isVideoUrl(selectedLesson.resourceUrl) && (
                <a
                  href={selectedLesson.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary w-full flex items-center justify-center gap-2 font-outer-sans"
                >
                  <LinkIcon />
                  <span>
                    {selectedLesson.type === 'LINK' ? 'Acessar Link' : 
                     selectedLesson.type === 'ARTICLE' ? 'Ler Artigo' : 
                     'Abrir Recurso'}
                  </span>
                </a>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2 text-sm text-gray-600 font-outer-sans">
                  <span className="px-2 py-1 bg-wine-100 text-wine-700 rounded text-xs font-semibold">
                    {selectedLesson.type}
                  </span>
                  {selectedLesson.duration && (
                    <span className="text-gray-500">{formatDuration(selectedLesson.duration)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
