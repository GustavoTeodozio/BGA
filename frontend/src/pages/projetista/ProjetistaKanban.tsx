import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import type { Task, TaskStatus } from '../../types/task';
import { TaskCard } from '../../components/KanbanCard';
import { TaskModal } from '../../components/TaskModal';

const ColumnIcon = ({ type }: { type: TaskStatus }) => {
  const iconClass = "w-5 h-5 text-white";
  switch (type) {
    case 'BACKLOG':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      );
    case 'IN_PRODUCTION':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'FOR_APPROVAL':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'SCHEDULED':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'PUBLISHED':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
  }
};

const columns: { id: TaskStatus; title: string; color: string; gradient: string }[] = [
  { id: 'BACKLOG',       title: 'Solicitado',  color: 'bg-gray-50 border-gray-300',       gradient: 'from-gray-700 to-gray-900' },
  { id: 'IN_PRODUCTION', title: 'Em Produção', color: 'bg-blue-50 border-blue-300',        gradient: 'from-blue-600 to-blue-800' },
  { id: 'FOR_APPROVAL',  title: 'Aprovação',   color: 'bg-amber-50 border-amber-300',      gradient: 'from-amber-600 to-amber-800' },
  { id: 'SCHEDULED',     title: 'Montagem',    color: 'bg-gray-50 border-gray-400',        gradient: 'from-gray-600 to-gray-900' },
  { id: 'PUBLISHED',     title: 'Concluído',   color: 'bg-green-50 border-green-300',      gradient: 'from-green-700 to-green-900' },
];

let touchGhost: HTMLElement | null = null;

export function ProjetistaKanban() {
  const queryClient = useQueryClient();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showNewTaskModal, setShowNewTaskModal] = useState<TaskStatus | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const touchDragTask = useRef<Task | null>(null);
  const columnRefs = useRef<Partial<Record<TaskStatus, HTMLDivElement>>>({});

  const { data, isLoading } = useQuery({
    queryKey: ['projetista', 'tasks'],
    queryFn: async () => {
      const response = await api.get('/projetista/tasks?perPage=100');
      return response.data;
    },
  });

  const updatePositionsMutation = useMutation({
    mutationFn: async (updates: { id: string; position: number; status: TaskStatus }[]) => {
      await api.post('/projetista/tasks/positions', { updates });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetista', 'tasks'] });
    },
  });

  const groupedTasks = useCallback((): Record<TaskStatus, Task[]> => {
    const empty = { BACKLOG: [], IN_PRODUCTION: [], FOR_APPROVAL: [], SCHEDULED: [], PUBLISHED: [] };
    if (!data?.items) return empty;
    const grouped: Record<TaskStatus, Task[]> = { ...empty };
    data.items.forEach((task: Task) => { grouped[task.status].push(task); });
    Object.keys(grouped).forEach((s) => { grouped[s as TaskStatus].sort((a, b) => a.position - b.position); });
    return grouped;
  }, [data]);

  const handleDragStart = (task: Task) => setDraggedTask(task);
  const handleDragOver = (e: React.DragEvent, column: TaskStatus) => { e.preventDefault(); setDragOverColumn(column); };
  const handleDragLeave = () => setDragOverColumn(null);

  const moveTask = useCallback((task: Task, targetStatus: TaskStatus) => {
    const allTasks = groupedTasks();
    const sourceColumn = allTasks[task.status];
    const destColumn = allTasks[targetStatus];

    if (task.status === targetStatus) {
      updatePositionsMutation.mutate(sourceColumn.map((t, i) => ({ id: t.id, position: i, status: t.status })));
    } else {
      const newSource = sourceColumn.filter((t) => t.id !== task.id);
      const newDest = [...destColumn, task];
      updatePositionsMutation.mutate([
        ...newSource.map((t, i) => ({ id: t.id, position: i, status: t.status })),
        ...newDest.map((t, i) => ({ id: t.id, position: i, status: targetStatus })),
      ]);
    }
  }, [groupedTasks, updatePositionsMutation]);

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    setDragOverColumn(null);
    if (!draggedTask) return;
    moveTask(draggedTask, targetStatus);
    setDraggedTask(null);
  };

  const getColumnAtPoint = (x: number, y: number): TaskStatus | null => {
    for (const [status, el] of Object.entries(columnRefs.current)) {
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) return status as TaskStatus;
    }
    return null;
  };

  const handleTouchStart = (e: React.TouchEvent, task: Task) => {
    if (e.touches.length !== 1) return;
    touchDragTask.current = task;
    setDraggedTask(task);
    const touch = e.touches[0];
    const sourceEl = e.currentTarget as HTMLElement;
    const clone = sourceEl.cloneNode(true) as HTMLElement;
    clone.style.cssText = `position:fixed;left:${touch.clientX - sourceEl.offsetWidth / 2}px;top:${touch.clientY - 30}px;width:${sourceEl.offsetWidth}px;opacity:0.85;pointer-events:none;z-index:9999;transform:rotate(2deg) scale(1.03);box-shadow:0 20px 40px rgba(0,0,0,0.2);border-radius:12px;`;
    document.body.appendChild(clone);
    touchGhost = clone;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragTask.current) return;
    e.preventDefault();
    const touch = e.touches[0];
    if (touchGhost) {
      touchGhost.style.left = `${touch.clientX - touchGhost.offsetWidth / 2}px`;
      touchGhost.style.top = `${touch.clientY - 30}px`;
    }
    setDragOverColumn(getColumnAtPoint(touch.clientX, touch.clientY));
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchGhost) { document.body.removeChild(touchGhost); touchGhost = null; }
    const task = touchDragTask.current;
    touchDragTask.current = null;
    setDraggedTask(null);
    setDragOverColumn(null);
    if (!task) return;
    const touch = e.changedTouches[0];
    const col = getColumnAtPoint(touch.clientX, touch.clientY);
    if (col) moveTask(task, col);
  };

  const grouped = groupedTasks();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
          <p className="text-gray-600 font-outer-sans">Carregando Kanban...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <p className="text-gray-600 font-outer-sans text-sm md:text-base">Organize o fluxo de trabalho dos seus projetos</p>
          <button
            onClick={() => setShowNewTaskModal('BACKLOG')}
            className="group px-4 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold font-outer-sans shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center gap-2 text-sm w-full sm:w-auto"
          >
            <svg className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Tarefa
          </button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {columns.map((col) => (
            <div key={col.id} className={`p-2 sm:p-3 rounded-xl bg-white border-2 ${col.color.split(' ')[1]} transition-all duration-300 hover:shadow-md`}>
              <div className="flex items-center justify-between mb-1">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md sm:rounded-lg bg-gradient-to-br ${col.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                  <ColumnIcon type={col.id} />
                </div>
                <span className="text-lg sm:text-2xl font-bold text-gray-700">{grouped[col.id]?.length || 0}</span>
              </div>
              <p className="text-[10px] sm:text-xs font-semibold text-gray-700 font-outer-sans truncate">{col.title}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-6 -mx-3 px-3 sm:-mx-6 sm:px-6 snap-x snap-mandatory">
        {columns.map((column) => (
          <div
            key={column.id}
            ref={(el) => { if (el) columnRefs.current[column.id] = el; }}
            onDragOver={(e) => handleDragOver(e, column.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.id)}
            className={`snap-start shrink-0 w-[260px] sm:w-[280px] lg:shrink lg:flex-1 lg:w-auto lg:min-w-0 rounded-2xl border-2 p-3 sm:p-4 min-h-[200px] md:min-h-[400px] transition-all duration-300 backdrop-blur-sm ${column.color} ${
              dragOverColumn === column.id ? 'shadow-2xl scale-[1.01] ring-4 ring-gray-900 ring-opacity-30' : 'shadow-sm hover:shadow-md'
            }`}
          >
            <div className="mb-3 sm:mb-4 pb-3 sm:pb-4 border-b-2 border-gray-200">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <div className={`w-7 h-7 sm:w-9 sm:h-9 lg:w-10 lg:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${column.gradient} flex items-center justify-center shadow-md flex-shrink-0`}>
                  <ColumnIcon type={column.id} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 font-outer-sans text-xs sm:text-sm md:text-base truncate">{column.title}</h3>
                  <span className="text-xs text-gray-500 font-outer-sans">
                    {grouped[column.id]?.length || 0} {grouped[column.id]?.length === 1 ? 'tarefa' : 'tarefas'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowNewTaskModal(column.id)}
                className="w-full py-1.5 sm:py-2 rounded-lg bg-white hover:bg-gray-900 border-2 border-dashed border-gray-300 hover:border-transparent flex items-center justify-center gap-1.5 sm:gap-2 text-gray-600 hover:text-white font-semibold text-xs sm:text-sm transition-all duration-300 group font-outer-sans"
              >
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="hidden sm:inline">Adicionar Tarefa</span>
                <span className="sm:hidden">+ Add</span>
              </button>
            </div>

            <div className="space-y-2 sm:space-y-3">
              {grouped[column.id]?.map((task) => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={() => handleDragStart(task)}
                  onTouchStart={(e) => handleTouchStart(e, task)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onClick={() => setSelectedTask(task)}
                  className={`cursor-move touch-none select-none ${draggedTask?.id === task.id ? 'opacity-40' : ''}`}
                >
                  <TaskCard task={task} isDragging={draggedTask?.id === task.id} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {(selectedTask || showNewTaskModal) && (
        <TaskModal
          task={selectedTask}
          initialStatus={showNewTaskModal}
          apiPrefix="/projetista"
          onClose={() => { setSelectedTask(null); setShowNewTaskModal(null); }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['projetista', 'tasks'] });
            setSelectedTask(null);
            setShowNewTaskModal(null);
          }}
        />
      )}
    </div>
  );
}
