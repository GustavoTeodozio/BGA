import type { Task } from '../types/task';

const priorityColors = {
  LOW: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300',
  MEDIUM: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border-blue-300',
  HIGH: 'bg-gradient-to-r from-gold-100 to-yellow-100 text-gold-700 border-gold-300',
  URGENT: 'bg-gradient-to-r from-wine-100 to-pink-100 text-wine-700 border-wine-300 animate-pulse',
};

const PriorityIcon = ({ priority }: { priority: string }) => {
  const iconClass = "w-3.5 h-3.5";
  
  switch (priority) {
    case 'LOW':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M5 11h14v2H5z" />
        </svg>
      );
    case 'MEDIUM':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 10l7-7m0 0l7 7m-7-7v18" />
        </svg>
      );
    case 'HIGH':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" />
        </svg>
      );
    case 'URGENT':
      return (
        <svg className={iconClass} fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      );
    default:
      return null;
  }
};

const CategoryIcon = ({ category }: { category: string }) => {
  const iconClass = "w-5 h-5 text-white";
  
  switch (category) {
    case 'BRIEFING':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    case 'PROJETO_3D':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'ORCAMENTO':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    case 'APROVACAO_CLIENTE':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    case 'PRODUCAO':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'LOGISTICA':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      );
    case 'MONTAGEM':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      );
    case 'EVENTO':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'DESMONTAGEM':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      );
    case 'DESIGN':
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      );
    default:
      return (
        <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
  }
};

const categoryColors: Record<string, string> = {
  BRIEFING: 'from-gray-500 to-gray-600',
  PROJETO_3D: 'from-indigo-500 to-blue-600',
  ORCAMENTO: 'from-gold-500 to-yellow-600',
  APROVACAO_CLIENTE: 'from-green-500 to-emerald-600',
  PRODUCAO: 'from-blue-500 to-cyan-600',
  LOGISTICA: 'from-orange-500 to-amber-600',
  MONTAGEM: 'from-wine-500 to-wine-700',
  EVENTO: 'from-wine-600 to-gold-500',
  DESMONTAGEM: 'from-gray-400 to-gray-600',
  DESIGN: 'from-pink-500 to-rose-600',
  OTHER: 'from-gray-500 to-gray-600',
};

interface TaskCardProps {
  task: Task;
  isDragging: boolean;
}

export function TaskCard({ task, isDragging }: TaskCardProps) {
  const completedChecklist = task.checklists?.filter(item => item.isCompleted).length || 0;
  const totalChecklist = task.checklists?.length || 0;
  const checklistProgress = totalChecklist > 0 ? (completedChecklist / totalChecklist) * 100 : 0;

  return (
    <div
      className={`bg-white rounded-xl p-4 shadow-md border-2 border-gray-200 cursor-pointer transition-all duration-300 hover:shadow-xl hover:border-wine-400 hover:-translate-y-1 ${
        isDragging ? 'rotate-6 scale-110 shadow-2xl opacity-80 ring-4 ring-wine-400 ring-opacity-50' : ''
      }`}
    >
      {/* Priority & Category */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-3 py-1 rounded-full text-xs font-bold border-2 flex items-center gap-1.5 shadow-sm ${priorityColors[task.priority]}`}>
          <PriorityIcon priority={task.priority} />
          {task.priority === 'LOW' && 'Baixa'}
          {task.priority === 'MEDIUM' && 'Média'}
          {task.priority === 'HIGH' && 'Alta'}
          {task.priority === 'URGENT' && 'Urgente'}
        </span>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${categoryColors[task.category] || categoryColors.OTHER} flex items-center justify-center shadow-md`}>
          <CategoryIcon category={task.category} />
        </div>
      </div>

      {/* Title */}
      <h4 className="font-bold text-gray-800 text-sm mb-2 font-outer-sans line-clamp-2">
        {task.title}
      </h4>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2 font-outer-sans">
          {task.description}
        </p>
      )}

      {/* Checklist Progress */}
      {totalChecklist > 0 && (
        <div className="mb-3 p-2 bg-gradient-to-r from-wine-50 to-gold-50 rounded-lg border border-wine-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-700 font-semibold font-outer-sans flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              {completedChecklist}/{totalChecklist} tarefas
            </span>
            <span className="text-xs font-bold text-wine-600 bg-white px-2 py-0.5 rounded-full">
              {Math.round(checklistProgress)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 shadow-inner">
            <div
              className="bg-gradient-to-r from-wine-500 to-gold-500 h-2 rounded-full transition-all duration-500 shadow-lg"
              style={{ width: `${checklistProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Tags */}
      {task.tags && (
        <div className="flex flex-wrap gap-1 mb-3">
          {task.tags.split(',').slice(0, 3).map((tag, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-wine-50 text-wine-600 rounded text-xs font-outer-sans">
              #{tag.trim()}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t-2 border-gray-100">
        {/* Assignee */}
        {(task.assigneeName || task.assignee) ? (
          <div className="flex items-center gap-2 px-2 py-1 bg-gradient-to-r from-wine-50 to-gold-50 rounded-lg border border-wine-200">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-wine-500 to-gold-500 flex items-center justify-center text-white text-xs font-bold shadow-md ring-2 ring-white">
              {(task.assigneeName || task.assignee?.name || '?').charAt(0).toUpperCase()}
            </div>
            <span className="text-xs font-semibold text-gray-700 font-outer-sans truncate max-w-[80px]">
              {(task.assigneeName || task.assignee?.name || '').split(' ')[0]}
            </span>
          </div>
        ) : (
          <div className="text-xs text-gray-400 font-outer-sans italic flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> Sem responsável</div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-2">
          {task.comments && task.comments.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {task.comments.length}
            </span>
          )}
          {task.attachments && task.attachments.length > 0 && (
            <span className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-600 rounded-lg border border-green-200 text-xs font-semibold">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {task.attachments.length}
            </span>
          )}
        </div>
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className="mt-3 pt-3 border-t-2 border-gray-100">
          <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-50 to-gold-50 rounded-lg border border-amber-200">
            <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs font-semibold text-amber-700 font-outer-sans">
              {new Date(task.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          </div>
        </div>
      )}

      {/* Metrics Preview */}
      {task.metrics && task.metrics.spent && (
        <div className="mt-3 pt-3 border-t-2 border-gray-100">
          <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <span className="text-xs font-semibold text-green-700 font-outer-sans flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Investido
            </span>
            <span className="font-bold text-green-600 text-sm">
              R$ {task.metrics.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

