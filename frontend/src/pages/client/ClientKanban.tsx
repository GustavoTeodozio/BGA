import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import type { Task, TaskStatus } from '../../types/task';

const columns: { id: TaskStatus; title: string; color: string; dot: string }[] = [
  { id: 'BACKLOG',       title: 'Solicitado',   color: 'border-gray-200 bg-gray-50',    dot: 'bg-gray-400' },
  { id: 'IN_PRODUCTION', title: 'Em Produção',  color: 'border-blue-200 bg-blue-50',    dot: 'bg-blue-500' },
  { id: 'FOR_APPROVAL',  title: 'Aprovação',    color: 'border-amber-200 bg-amber-50',  dot: 'bg-amber-500' },
  { id: 'SCHEDULED',     title: 'Montagem',     color: 'border-purple-200 bg-purple-50',dot: 'bg-purple-500' },
  { id: 'PUBLISHED',     title: 'Concluído',    color: 'border-green-200 bg-green-50',  dot: 'bg-green-500' },
];

const PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  LOW:    { label: 'Baixa',   color: 'bg-gray-100 text-gray-600' },
  MEDIUM: { label: 'Média',   color: 'bg-blue-100 text-blue-600' },
  HIGH:   { label: 'Alta',    color: 'bg-amber-100 text-amber-700' },
  URGENT: { label: 'Urgente', color: 'bg-red-100 text-red-700' },
};

export function ClientKanban() {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['client', 'tasks'],
    queryFn: async () => {
      const r = await api.get('/client/tasks?perPage=100');
      return r.data;
    },
  });

  const tasks: Task[] = data?.items || [];

  const grouped: Record<TaskStatus, Task[]> = {
    BACKLOG: [], IN_PRODUCTION: [], FOR_APPROVAL: [], SCHEDULED: [], PUBLISHED: [],
  };
  tasks.forEach((t) => {
    if (grouped[t.status]) grouped[t.status].push(t);
  });
  Object.keys(grouped).forEach((s) => {
    grouped[s as TaskStatus].sort((a, b) => a.position - b.position);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mb-4"></div>
          <p className="text-gray-600 font-outer-sans">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4">
        <p className="text-gray-500 text-sm font-outer-sans">Visualize o andamento das etapas do seu projeto</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-5 gap-2 mb-5">
        {columns.map((col) => (
          <div key={col.id} className={`p-2 sm:p-3 rounded-xl border-2 ${col.color}`}>
            <div className="flex items-center justify-between mb-1">
              <div className={`w-2.5 h-2.5 rounded-full ${col.dot}`} />
              <span className="text-xl font-bold text-gray-700">{grouped[col.id].length}</span>
            </div>
            <p className="text-[10px] sm:text-xs font-semibold text-gray-600 font-outer-sans truncate">{col.title}</p>
          </div>
        ))}
      </div>

      {/* Board */}
      <div className="flex gap-3 overflow-x-auto pb-6 -mx-3 px-3 sm:-mx-6 sm:px-6 snap-x snap-mandatory">
        {columns.map((col) => (
          <div
            key={col.id}
            className={`snap-start shrink-0 w-[260px] sm:w-[280px] lg:shrink lg:flex-1 lg:w-auto lg:min-w-0 rounded-2xl border-2 p-3 sm:p-4 min-h-[200px] ${col.color}`}
          >
            <div className="mb-3 pb-3 border-b border-gray-200">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${col.dot} flex-shrink-0`} />
                <h3 className="font-bold text-gray-800 font-outer-sans text-sm">{col.title}</h3>
                <span className="ml-auto text-xs text-gray-500 font-outer-sans">{grouped[col.id].length}</span>
              </div>
            </div>

            <div className="space-y-2">
              {grouped[col.id].map((task) => {
                const prio = PRIORITY_LABELS[task.priority] || PRIORITY_LABELS.MEDIUM;
                const coverImage = task.attachments?.find(a => a.type?.startsWith('image/'));
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="w-full text-left bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 group"
                  >
                    {coverImage && (
                      <div className="w-full h-28 overflow-hidden bg-gray-100">
                        <img
                          src={coverImage.url}
                          alt={coverImage.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-sm font-semibold text-gray-800 font-outer-sans mb-2 group-hover:text-wine-600 transition-colors">{task.title}</p>
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${prio.color} font-outer-sans`}>{prio.label}</span>
                        {task.dueDate && (
                          <span className="text-[10px] text-gray-400 font-outer-sans">
                            {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                      {task.assigneeName && (
                        <p className="text-[10px] text-gray-400 mt-1.5 font-outer-sans">Resp.: {task.assigneeName}</p>
                      )}
                      {task.attachments && task.attachments.filter(a => a.type?.startsWith('image/')).length > 1 && (
                        <p className="text-[10px] text-wine-500 mt-1 font-outer-sans">
                          +{task.attachments.filter(a => a.type?.startsWith('image/')).length - 1} imagens
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
              {grouped[col.id].length === 0 && (
                <div className="py-6 text-center">
                  <p className="text-xs text-gray-400 font-outer-sans">Nenhuma etapa</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Detail modal */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedTask(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            {/* Image gallery at top */}
            {selectedTask.attachments && selectedTask.attachments.filter(a => a.type?.startsWith('image/')).length > 0 && (
              <div className="relative">
                {selectedTask.attachments.filter(a => a.type?.startsWith('image/')).length === 1 ? (
                  <img
                    src={selectedTask.attachments.find(a => a.type?.startsWith('image/'))!.url}
                    alt="Stand"
                    className="w-full h-56 object-cover rounded-t-2xl"
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-0.5 rounded-t-2xl overflow-hidden" style={{ maxHeight: '220px' }}>
                    {selectedTask.attachments.filter(a => a.type?.startsWith('image/')).slice(0, 4).map((att, i, arr) => (
                      <div key={att.id} className={`overflow-hidden bg-gray-100 ${arr.length === 3 && i === 0 ? 'row-span-2' : ''}`} style={{ height: arr.length === 1 ? '220px' : '109px' }}>
                        <img src={att.url} alt={att.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                      </div>
                    ))}
                    {selectedTask.attachments.filter(a => a.type?.startsWith('image/')).length > 4 && (
                      <div className="relative overflow-hidden bg-gray-200" style={{ height: '109px' }}>
                        <img src={selectedTask.attachments.filter(a => a.type?.startsWith('image/'))[3].url} alt="" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">+{selectedTask.attachments.filter(a => a.type?.startsWith('image/')).length - 3}</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-gray-800 font-outer-sans">{selectedTask.title}</h2>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {(() => {
                      const col = columns.find((c) => c.id === selectedTask.status);
                      return col ? (
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border-2 ${col.color} font-outer-sans`}>{col.title}</span>
                      ) : null;
                    })()}
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold font-outer-sans ${PRIORITY_LABELS[selectedTask.priority]?.color}`}>
                      {PRIORITY_LABELS[selectedTask.priority]?.label}
                    </span>
                  </div>
                </div>
                <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600 flex-shrink-0 p-1">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {selectedTask.description && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1 font-outer-sans">Descrição</p>
                  <p className="text-sm text-gray-700 font-outer-sans whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                {selectedTask.assigneeName && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1 font-outer-sans">Responsável</p>
                    <p className="text-sm text-gray-700 font-outer-sans">{selectedTask.assigneeName}</p>
                  </div>
                )}
                {selectedTask.dueDate && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1 font-outer-sans">Prazo</p>
                    <p className="text-sm text-gray-700 font-outer-sans">{new Date(selectedTask.dueDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                )}
                {selectedTask.category && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1 font-outer-sans">Categoria</p>
                    <p className="text-sm text-gray-700 font-outer-sans">{selectedTask.category.replace(/_/g, ' ')}</p>
                  </div>
                )}
              </div>
              {selectedTask.checklists && selectedTask.checklists.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2 font-outer-sans">Checklist</p>
                  <div className="space-y-2">
                    {selectedTask.checklists.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded flex-shrink-0 flex items-center justify-center border-2 ${item.isCompleted ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}>
                          {item.isCompleted && (
                            <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span className={`text-sm font-outer-sans ${item.isCompleted ? 'line-through text-gray-400' : 'text-gray-700'}`}>{item.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Non-image attachments (PDFs, etc.) */}
              {selectedTask.attachments && selectedTask.attachments.filter(a => !a.type?.startsWith('image/')).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase mb-2 font-outer-sans">Arquivos</p>
                  <div className="space-y-1.5">
                    {selectedTask.attachments.filter(a => !a.type?.startsWith('image/')).map(att => (
                      <a
                        key={att.id}
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl border border-gray-100 hover:bg-wine-50 hover:border-wine-200 transition-colors group"
                      >
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-wine-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-700 font-outer-sans truncate flex-1">{att.name}</span>
                        <svg className="w-3.5 h-3.5 text-gray-300 group-hover:text-wine-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
