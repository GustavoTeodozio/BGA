import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

interface Campaign {
  id: string;
  name: string;
  objective?: string;
  status: string;
  budgetStrategy?: string;
  dailyBudget?: number;
  lifetimeBudget?: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

// Ícones SVG minimalistas
const MegaphoneIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
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

const PauseIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PlayIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DollarIcon = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export function CampaignsManagement() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    tenantId: '',
    name: '',
    objective: '',
    budgetStrategy: 'DAILY' as 'DAILY' | 'LIFETIME',
    dailyBudget: '',
    lifetimeBudget: '',
    startDate: '',
    endDate: '',
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

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['admin', 'campaigns'],
    queryFn: async () => {
      const response = await api.get('/admin/campaigns');
      return response.data;
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        dailyBudget: data.dailyBudget ? Number(data.dailyBudget) : undefined,
        lifetimeBudget: data.lifetimeBudget
          ? Number(data.lifetimeBudget)
          : undefined,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
      };
      const response = await api.post('/admin/campaigns', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
      setShowForm(false);
      setFormData({
        tenantId: '',
        name: '',
        objective: '',
        budgetStrategy: 'DAILY',
        dailyBudget: '',
        lifetimeBudget: '',
        startDate: '',
        endDate: '',
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const response = await api.patch(`/admin/campaigns/${id}/status`, {
        status,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'campaigns'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCampaignMutation.mutate(formData);
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mb-4"></div>
          <p className="text-gray-600 font-outer-sans">Carregando campanhas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-0 animate-fade-in">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-wine-600 to-gold-500 bg-clip-text text-transparent mb-1 md:mb-2 font-outer-sans leading-tight">
            Gestão de Campanhas
          </h1>
          <p className="text-gray-600 font-outer-sans">Crie e gerencie suas campanhas de marketing</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2 font-outer-sans"
        >
          {showForm ? <XIcon /> : <PlusIcon />}
          <span>{showForm ? 'Cancelar' : 'Criar Campanha'}</span>
        </button>
      </div>

      {showForm && (
        <div className="card-gradient mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg">
              <MegaphoneIcon />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-outer-sans">Criar Nova Campanha</h2>
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
                Nome da Campanha *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input font-outer-sans"
                placeholder="Ex: Campanha de Verão 2025"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 font-outer-sans">
                Objetivo
              </label>
              <textarea
                value={formData.objective}
                onChange={(e) =>
                  setFormData({ ...formData, objective: e.target.value })
                }
                className="input font-outer-sans"
                rows={3}
                placeholder="Descreva o objetivo desta campanha..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">
                  Estratégia de Orçamento
                </label>
                <select
                  value={formData.budgetStrategy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budgetStrategy: e.target.value as 'DAILY' | 'LIFETIME',
                    })
                  }
                  className="input font-outer-sans"
                >
                  <option value="DAILY">Diário</option>
                  <option value="LIFETIME">Total</option>
                </select>
              </div>
              {formData.budgetStrategy === 'DAILY' ? (
                <div>
                  <label className="block text-sm font-medium mb-1 font-outer-sans flex items-center gap-2">
                    <DollarIcon />
                    Orçamento Diário (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.dailyBudget}
                    onChange={(e) =>
                      setFormData({ ...formData, dailyBudget: e.target.value })
                    }
                    className="input font-outer-sans"
                    placeholder="0.00"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium mb-1 font-outer-sans flex items-center gap-2">
                    <DollarIcon />
                    Orçamento Total (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.lifetimeBudget}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        lifetimeBudget: e.target.value,
                      })
                    }
                    className="input font-outer-sans"
                    placeholder="0.00"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans flex items-center gap-2">
                  <CalendarIcon />
                  Data de Início
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) =>
                    setFormData({ ...formData, startDate: e.target.value })
                  }
                  className="input font-outer-sans"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans flex items-center gap-2">
                  <CalendarIcon />
                  Data de Término
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) =>
                    setFormData({ ...formData, endDate: e.target.value })
                  }
                  className="input font-outer-sans"
                />
              </div>
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-200">
              <button
                type="submit"
                disabled={createCampaignMutation.isPending}
                className="btn btn-primary font-outer-sans"
              >
                {createCampaignMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Criando...
                  </>
                ) : (
                  'Criar Campanha'
                )}
              </button>
            </div>
          </form>
          {createCampaignMutation.isError && (
            <div className="mt-4 text-wine-600 font-outer-sans">
              Erro ao criar campanha. Tente novamente.
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {campaigns?.map((campaign: Campaign, index: number) => (
          <div 
            key={campaign.id} 
            className="card-interactive animate-slide-up"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center shadow-lg">
                    <MegaphoneIcon />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-800 font-outer-sans mb-2">{campaign.name}</h3>
                    <span
                      className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold font-outer-sans border ${
                        campaign.status === 'ACTIVE'
                          ? 'bg-green-50 text-green-700 border-green-200'
                          : campaign.status === 'PAUSED'
                          ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                          : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {campaign.status === 'ACTIVE'
                        ? '✓ Ativa'
                        : campaign.status === 'PAUSED'
                        ? '⏸ Pausada'
                        : campaign.status}
                    </span>
                  </div>
                </div>
                {campaign.objective && (
                  <p className="text-sm text-gray-600 mb-4 font-outer-sans">
                    {campaign.objective}
                  </p>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-br from-wine-50 to-gold-50 rounded-lg border border-wine-100">
                  {campaign.dailyBudget && (
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <DollarIcon />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-outer-sans mb-1">Orç. Diário</p>
                        <p className="font-bold text-gray-800 font-outer-sans">R$ {campaign.dailyBudget.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  {campaign.lifetimeBudget && (
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <DollarIcon />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-outer-sans mb-1">Orç. Total</p>
                        <p className="font-bold text-gray-800 font-outer-sans">R$ {campaign.lifetimeBudget.toFixed(2)}</p>
                      </div>
                    </div>
                  )}
                  {campaign.startDate && (
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wine-500 to-wine-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CalendarIcon />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 font-outer-sans mb-1">Início</p>
                        <p className="font-semibold text-gray-800 font-outer-sans text-xs">
                          {new Date(campaign.startDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gold-500 to-gold-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <CalendarIcon />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-outer-sans mb-1">Criada em</p>
                      <p className="font-semibold text-gray-800 font-outer-sans text-xs">
                        {new Date(campaign.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="ml-4 flex flex-col gap-2">
                {campaign.status === 'ACTIVE' && (
                  <button
                    onClick={() => handleStatusChange(campaign.id, 'PAUSED')}
                    disabled={updateStatusMutation.isPending}
                    className="btn bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 text-sm flex items-center gap-1.5 font-outer-sans shadow-lg"
                  >
                    <PauseIcon />
                    <span>Pausar</span>
                  </button>
                )}
                {campaign.status === 'PAUSED' && (
                  <button
                    onClick={() => handleStatusChange(campaign.id, 'ACTIVE')}
                    disabled={updateStatusMutation.isPending}
                    className="btn btn-primary text-sm flex items-center gap-1.5 font-outer-sans"
                  >
                    <PlayIcon />
                    <span>Ativar</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {(!campaigns || campaigns.length === 0) && (
          <div className="card-gradient text-center py-16 animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold-100 to-wine-100 flex items-center justify-center mx-auto mb-4">
              <MegaphoneIcon />
            </div>
            <p className="text-gray-600 mb-2 text-lg font-medium font-outer-sans">
              Nenhuma campanha criada ainda.
            </p>
            <p className="text-gray-500 text-sm font-outer-sans">
              Use o botão acima para criar sua primeira campanha
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
