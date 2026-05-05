import { useState, useEffect } from 'react';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../api/client';
import type { Task, TaskStatus, TaskCategory, TaskPriority } from '../types/task';
import { useDialog } from './ConfirmDialog';

interface TaskModalProps {
  task: Task | null;
  initialStatus?: TaskStatus | null;
  onClose: () => void;
  onSuccess: () => void;
  apiPrefix?: string;
}

const CATEGORIES: { value: TaskCategory; label: string }[] = [
  { value: 'BRIEFING', label: 'Briefing' },
  { value: 'PROJETO_3D', label: 'Projeto 3D' },
  { value: 'ORCAMENTO', label: 'Orçamento' },
  { value: 'APROVACAO_CLIENTE', label: 'Aprovação do Cliente' },
  { value: 'PRODUCAO', label: 'Produção' },
  { value: 'LOGISTICA', label: 'Logística' },
  { value: 'MONTAGEM', label: 'Montagem' },
  { value: 'EVENTO', label: 'Evento' },
  { value: 'DESMONTAGEM', label: 'Desmontagem' },
  { value: 'DESIGN', label: 'Design' },
  { value: 'OTHER', label: 'Outro' },
];

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'LOW', label: 'Baixa', color: 'bg-gray-100 text-gray-700' },
  { value: 'MEDIUM', label: 'Média', color: 'bg-blue-100 text-blue-700' },
  { value: 'HIGH', label: 'Alta', color: 'bg-gold-100 text-gold-700' },
  { value: 'URGENT', label: 'Urgente', color: 'bg-wine-100 text-wine-700' },
];

export function TaskModal({ task: initialTask, initialStatus, onClose, onSuccess, apiPrefix = '/admin' }: TaskModalProps) {
  const queryClient = useQueryClient();
  const { confirm, alert } = useDialog();
  const isAdmin = apiPrefix === '/admin';
  const [activeTab, setActiveTab] = useState<'details' | 'checklist' | 'comments' | 'metrics'>('details');
  const [clientTenantId, setClientTenantId] = useState<string>(initialTask?.clientTenantId ?? '');
  
  // Buscar dados atualizados da task se já existe
  const { data: fetchedTask, refetch } = useQuery({
    queryKey: ['task', initialTask?.id],
    queryFn: async () => {
      if (!initialTask?.id) return null;
      console.log('[TaskModal] Buscando task:', initialTask.id);
      const response = await api.get(`${apiPrefix}/tasks/${initialTask.id}`);
      console.log('[TaskModal] Task recebida:', response.data);
      return response.data;
    },
    enabled: !!initialTask?.id,
    staleTime: 0, // Sempre considerar dados antigos
    refetchOnMount: true,
  });

  // Usar task atualizada ou inicial
  const task = fetchedTask || initialTask;

  // Fetch registered clients (admin only, for linking)
  const { data: clientsData } = useQuery({
    queryKey: ['admin', 'clients'],
    queryFn: async () => {
      const r = await api.get('/admin/clients');
      return r.data as { id: string; name: string }[];
    },
    enabled: isAdmin,
  });
  
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    category: task?.category || 'OTHER' as TaskCategory,
    priority: task?.priority || 'MEDIUM' as TaskPriority,
    status: task?.status || initialStatus || 'BACKLOG' as TaskStatus,
    assigneeName: task?.assigneeName || task?.assignee?.name || '',
    tags: task?.tags || '',
    dueDate: task?.dueDate?.split('T')[0] || '',
    scheduledAt: task?.scheduledAt?.split('T')[0] || '',
  });

  // Atualizar formData quando task mudar
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        category: task.category || 'OTHER' as TaskCategory,
        priority: task.priority || 'MEDIUM' as TaskPriority,
        status: task.status || initialStatus || 'BACKLOG' as TaskStatus,
        assigneeName: task.assigneeName || task.assignee?.name || '',
        tags: task.tags || '',
        dueDate: task.dueDate?.split('T')[0] || '',
        scheduledAt: task.scheduledAt?.split('T')[0] || '',
      });
      setClientTenantId(task.clientTenantId ?? '');
    }
  }, [task, initialStatus]);

  const [newComment, setNewComment] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Limpar dados: converter strings vazias para undefined
      const cleanedData: any = {
        title: formData.title,
        description: formData.description || undefined,
        category: formData.category,
        priority: formData.priority,
        status: formData.status,
        assigneeName: formData.assigneeName || undefined,
        tags: formData.tags || undefined,
        dueDate: formData.dueDate || undefined,
        scheduledAt: formData.scheduledAt || undefined,
      };
      if (isAdmin) {
        cleanedData.clientTenantId = clientTenantId || null;
      }
      
      console.log('[TaskModal] Salvando task com dados:', cleanedData);
      if (task) {
        const response = await api.patch(`${apiPrefix}/tasks/${task.id}`, cleanedData);
        console.log('[TaskModal] Task atualizada:', response.data);
        return response.data;
      } else {
        const response = await api.post(`${apiPrefix}/tasks`, cleanedData);
        console.log('[TaskModal] Task criada:', response.data);
        return response.data;
      }
    },
    onSuccess: async () => {
      // Refetch imediato
      if (task?.id) {
        await refetch();
      }
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onSuccess();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (task) {
        await api.delete(`${apiPrefix}/tasks/${task.id}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onSuccess();
    },
  });

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Excluir tarefa',
      message: 'Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.',
      confirmText: 'Excluir',
      cancelText: 'Cancelar',
    });
    if (ok) deleteMutation.mutate();
  };

  const addCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      await api.post(`${apiPrefix}/tasks/${task?.id}/comments`, { content });
    },
    onSuccess: async () => {
      setNewComment('');
      // Refetch imediato
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const addChecklistMutation = useMutation({
    mutationFn: async (title: string) => {
      console.log('[TaskModal] Adicionando item checklist:', title);
      const response = await api.post(`${apiPrefix}/tasks/${task?.id}/checklist`, { title });
      console.log('[TaskModal] Item adicionado:', response.data);
      return response.data;
    },
    onSuccess: async () => {
      setNewChecklistItem('');
      // Refetch imediato forçado
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const toggleChecklistMutation = useMutation({
    mutationFn: async ({ itemId, isCompleted }: { itemId: string; isCompleted: boolean }) => {
      console.log('[TaskModal] Toggle checklist:', { itemId, isCompleted });
      const response = await api.patch(`${apiPrefix}/tasks/checklist/${itemId}`, { isCompleted });
      console.log('[TaskModal] Toggle sucesso:', response.data);
      return response.data;
    },
    onSuccess: async () => {
      // Refetch imediato forçado
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`${apiPrefix}/tasks/checklist/${itemId}`);
    },
    onSuccess: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: string) => {
      await api.delete(`${apiPrefix}/tasks/comments/${commentId}`);
    },
    onSuccess: async () => {
      await refetch();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl sm:rounded-2xl max-w-4xl w-full shadow-2xl animate-slide-up max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-wine-50 to-gold-50">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 font-outer-sans">
            {task ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors flex-shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-4 border-b-2 border-gray-200 flex gap-2 sm:gap-3 overflow-x-auto bg-gray-50 scrollbar-hide">
          {[
            { 
              id: 'details', 
              label: 'Detalhes', 
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            },
            { 
              id: 'checklist', 
              label: 'Checklist', 
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
            },
            { 
              id: 'comments', 
              label: 'Comentários', 
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
            },
            { 
              id: 'metrics', 
              label: 'Métricas', 
              icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3 sm:px-5 py-2 sm:py-3 font-bold font-outer-sans rounded-t-xl transition-all duration-300 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap text-sm sm:text-base ${
                activeTab === tab.id
                  ? 'bg-white text-wine-600 border-t-4 border-x-2 border-wine-600 shadow-lg transform scale-105 -mb-0.5'
                  : 'text-gray-600 hover:text-wine-600 hover:bg-white hover:bg-opacity-50'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-outer-sans">Título</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans placeholder:text-gray-500"
                  placeholder="Ex: Montagem stand Feira de Tecnologia"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-outer-sans">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans placeholder:text-gray-500"
                  placeholder="Descreva os detalhes da tarefa..."
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-outer-sans">Nome do Responsável</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={formData.assigneeName}
                    onChange={(e) => setFormData({ ...formData, assigneeName: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans placeholder:text-gray-500"
                    placeholder="Ex: João Silva, Maria Santos"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-outer-sans">Categoria</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as TaskCategory })}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-outer-sans">Prioridade</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans"
                  >
                    {PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-outer-sans">Data Limite</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2 font-outer-sans">Agendamento</label>
                  <input
                    type="date"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 font-outer-sans">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans placeholder:text-gray-500"
                  placeholder="Ex: urgente, Q4, lançamento"
                />
              </div>

              {isAdmin && clientsData && clientsData.length > 0 && (
                <div className="border-t border-gray-100 pt-4 mt-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1 font-outer-sans">
                    Direcionar ao Cliente
                  </label>
                  <p className="text-xs text-gray-400 mb-2 font-outer-sans">O cliente selecionado poderá acompanhar esta tarefa no painel dele.</p>
                  <select
                    value={clientTenantId}
                    onChange={(e) => setClientTenantId(e.target.value)}
                    className="w-full px-4 py-3 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans"
                  >
                    <option value="">— Sem cliente vinculado —</option>
                    {clientsData.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  {clientTenantId && (
                    <p className="text-xs text-emerald-600 mt-1.5 font-outer-sans flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block"></span>
                      Vinculado — cliente verá esta tarefa no dashboard.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Checklist Tab */}
          {activeTab === 'checklist' && task && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newChecklistItem}
                  onChange={(e) => setNewChecklistItem(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && newChecklistItem.trim() && !addChecklistMutation.isPending) {
                      addChecklistMutation.mutate(newChecklistItem);
                    }
                  }}
                  disabled={addChecklistMutation.isPending}
                  className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans disabled:opacity-50 placeholder:text-gray-500"
                  placeholder="Adicionar novo item..."
                />
                <button
                  onClick={() => newChecklistItem.trim() && addChecklistMutation.mutate(newChecklistItem)}
                  disabled={!newChecklistItem.trim() || addChecklistMutation.isPending}
                  className="btn btn-primary disabled:opacity-50 min-w-[100px]"
                >
                  {addChecklistMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>...</span>
                    </div>
                  ) : (
                    'Adicionar'
                  )}
                </button>
              </div>

              <div className="space-y-2">
                {task?.checklists?.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all group">
                    <label className="flex items-center gap-3 flex-1 cursor-pointer">
                      <div className="relative flex items-center flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={item.isCompleted}
                          onChange={(e) => {
                            const newChecked = e.target.checked;
                            toggleChecklistMutation.mutate({ itemId: item.id, isCompleted: newChecked });
                          }}
                          disabled={toggleChecklistMutation.isPending}
                          className="peer w-5 h-5 border-2 border-gray-300 rounded checked:bg-wine-600 checked:border-wine-600 focus:ring-2 focus:ring-wine-500 cursor-pointer transition-all appearance-none disabled:opacity-50"
                        />
                        {/* Checkmark SVG - aparece quando marcado */}
                        <svg 
                          className={`w-3.5 h-3.5 text-white absolute left-0.5 top-0.5 pointer-events-none transition-all duration-200 ${item.isCompleted ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`} 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.5} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className={`flex-1 font-outer-sans transition-all duration-200 ${item.isCompleted ? 'line-through text-gray-500' : 'text-gray-800 group-hover:text-wine-600'}`}>
                        {item.title}
                      </span>
                    </label>
                    <button
                      onClick={async () => {
                        const ok = await confirm({ title: 'Excluir item', message: 'Deseja excluir este item?', confirmText: 'Excluir' });
                        if (ok) deleteChecklistMutation.mutate(item.id);
                      }}
                      disabled={deleteChecklistMutation.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-wine-100 text-wine-600 transition-all disabled:opacity-50"
                      title="Excluir item"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))}
                {(!task?.checklists || task.checklists.length === 0) && (
                  <p className="text-center text-gray-500 py-8 font-outer-sans">Nenhum item ainda</p>
                )}
                
                {/* Loading indicator */}
                {(addChecklistMutation.isPending || toggleChecklistMutation.isPending) && (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2 text-wine-600">
                      <div className="w-5 h-5 border-2 border-wine-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-outer-sans">Atualizando...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Comments Tab */}
          {activeTab === 'comments' && task && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && newComment.trim() && !addCommentMutation.isPending) {
                      e.preventDefault();
                      addCommentMutation.mutate(newComment);
                    }
                  }}
                  rows={3}
                  disabled={addCommentMutation.isPending}
                  className="flex-1 px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 font-outer-sans disabled:opacity-50 placeholder:text-gray-500"
                  placeholder="Escreva um comentário... (Enter para enviar, Shift+Enter para quebrar linha)"
                />
                <button
                  onClick={() => newComment.trim() && addCommentMutation.mutate(newComment)}
                  disabled={!newComment.trim() || addCommentMutation.isPending}
                  className="btn btn-primary self-start min-w-[100px]"
                >
                  {addCommentMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>...</span>
                    </div>
                  ) : (
                    'Enviar'
                  )}
                </button>
              </div>

              <div className="space-y-3">
                {task?.comments?.map((comment) => (
                  <div key={comment.id} className="p-4 bg-gray-50 rounded-lg group hover:bg-gray-100 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-wine-500 to-gold-500 flex items-center justify-center text-white text-sm font-bold shadow-md">
                          {comment.user.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800 text-sm font-outer-sans">{comment.user.name}</p>
                          <p className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          const ok = await confirm({ title: 'Excluir comentário', message: 'Deseja excluir este comentário?', confirmText: 'Excluir' });
                          if (ok) deleteCommentMutation.mutate(comment.id);
                        }}
                        disabled={deleteCommentMutation.isPending}
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-wine-100 text-wine-600 transition-all disabled:opacity-50"
                        title="Excluir comentário"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <p className="text-gray-700 font-outer-sans">{comment.content}</p>
                  </div>
                ))}
                {(!task?.comments || task.comments.length === 0) && (
                  <p className="text-center text-gray-500 py-8 font-outer-sans">Nenhum comentário ainda</p>
                )}
                
                {/* Loading indicator */}
                {(addCommentMutation.isPending || deleteCommentMutation.isPending) && (
                  <div className="flex items-center justify-center py-4">
                    <div className="flex items-center gap-2 text-wine-600">
                      <div className="w-5 h-5 border-2 border-wine-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-outer-sans">Processando...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && task && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
              <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-green-700 font-bold font-outer-sans">Orçamento</p>
                </div>
                <p className="text-3xl font-black text-green-600">
                  R$ {(task.metrics?.budget || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-5 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-blue-700 font-bold font-outer-sans">Investido</p>
                </div>
                <p className="text-3xl font-black text-blue-600">
                  R$ {(task.metrics?.spent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-5 bg-gradient-to-br from-wine-50 to-pink-50 rounded-xl border-2 border-wine-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <p className="text-sm text-wine-700 font-bold font-outer-sans">Leads</p>
                </div>
                <p className="text-3xl font-black text-wine-600">
                  {task.metrics?.leadsActual || 0} / {task.metrics?.leadGoal || 0}
                </p>
              </div>
              <div className="p-5 bg-gradient-to-br from-gold-50 to-yellow-50 rounded-xl border-2 border-gold-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <svg className="w-6 h-6 text-gold-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-sm text-gold-700 font-bold font-outer-sans">ROAS</p>
                </div>
                <p className="text-3xl font-black text-gold-600">
                  {task.metrics?.roas ? `${task.metrics.roas.toFixed(2)}x` : '-'}
                </p>
              </div>
              
              {/* Additional Metrics */}
              <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mt-2">
                <div className="p-4 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-lg border border-indigo-200">
                  <p className="text-xs text-indigo-600 font-semibold mb-1 font-outer-sans flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Impressões
                  </p>
                  <p className="text-xl font-bold text-indigo-700">
                    {(task.metrics?.impressions || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-teal-50 to-green-50 rounded-lg border border-teal-200">
                  <p className="text-xs text-teal-600 font-semibold mb-1 font-outer-sans flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                    </svg>
                    Cliques
                  </p>
                  <p className="text-xl font-bold text-teal-700">
                    {(task.metrics?.clicks || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                  <p className="text-xs text-pink-600 font-semibold mb-1 font-outer-sans flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                    Conversões
                  </p>
                  <p className="text-xl font-bold text-pink-700">
                    {(task.metrics?.conversions || 0).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-gray-50">
          <div className="order-2 sm:order-1">
            {task && (
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="w-full sm:w-auto px-4 py-2 bg-wine-50 hover:bg-wine-100 text-wine-600 hover:text-wine-700 border-2 border-wine-200 hover:border-wine-300 rounded-lg font-semibold font-outer-sans transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 text-sm sm:text-base"
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span className="hidden sm:inline">{deleteMutation.isPending ? 'Excluindo...' : 'Excluir Tarefa'}</span>
                <span className="sm:hidden">{deleteMutation.isPending ? 'Excluindo...' : 'Excluir'}</span>
              </button>
            )}
          </div>
          <div className="flex gap-2 sm:gap-3 order-1 sm:order-2">
            <button onClick={onClose} className="btn btn-secondary font-outer-sans flex-1 sm:flex-none text-sm sm:text-base">
              Cancelar
            </button>
            <button
              onClick={() => saveMutation.mutate()}
              disabled={!formData.title || saveMutation.isPending}
              className="btn btn-primary font-outer-sans flex-1 sm:flex-none text-sm sm:text-base"
            >
              {saveMutation.isPending ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

