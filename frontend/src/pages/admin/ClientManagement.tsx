import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useDialog } from '../../components/ConfirmDialog';

// Ícones SVG minimalistas
const UserIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
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

const LockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const UnlockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const SettingsIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);


const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const StatusDotIcon = ({ status }: { status: string }) => {
  const color =
    status === 'ACTIVE' ? 'bg-green-500' :
    status === 'PAUSED' ? 'bg-yellow-500' :
    'bg-wine-500';
  return <span className={`inline-block w-2 h-2 rounded-full ${color} mr-1.5`} />;
};

const PLAN_LABELS: Record<string, string> = {
  START: 'Básico',
  MASTER: 'Intermediário',
  PREMIUM: 'Premium',
  CUSTOM: 'Personalizado',
};

const CLIENT_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  CANCELLED: 'Cancelado',
};

const CLIENT_STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-50 text-green-700 border-green-200',
  PAUSED: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  CANCELLED: 'bg-wine-50 text-wine-700 border-wine-200',
};

const emptyForm = {
  tenantName: '',
  businessName: '',
  cpfCnpj: '',
  segment: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  customPlanDescription: '',
  contractMonths: '',
  dueDate: '',
  password: '',
  logos: [] as File[],
};

export function ClientManagement() {
  const { confirm } = useDialog();
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<{ id: string; name: string } | null>(null);
  const [clientForStatus, setClientForStatus] = useState<{ id: string; name: string; clientStatus: string } | null>(null);
  const [newClientStatus, setNewClientStatus] = useState<'ACTIVE' | 'PAUSED' | 'CANCELLED'>('ACTIVE');
  const [statusReason, setStatusReason] = useState('');
  const [formData, setFormData] = useState(emptyForm);
  const [logoPreviews, setLogoPreviews] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PAUSED' | 'CANCELLED'>('ALL');

  const queryClient = useQueryClient();

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['admin', 'clients'],
    queryFn: async () => {
      const response = await api.get('/admin/clients');
      return Array.isArray(response.data) ? response.data : [];
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const fd = new FormData();
      fd.append('tenantName', data.tenantName);
      fd.append('businessName', data.businessName);
      fd.append('contactName', data.contactName);
      fd.append('contactEmail', data.contactEmail);
      fd.append('password', data.password);
      if (data.cpfCnpj) fd.append('cpfCnpj', data.cpfCnpj);
      if (data.segment) fd.append('segment', data.segment);
      if (data.contactPhone) fd.append('contactPhone', data.contactPhone);
      if (data.address) fd.append('address', data.address);
      if (data.customPlanDescription) fd.append('customPlanDescription', data.customPlanDescription);
      if (data.contractMonths) fd.append('contractMonths', data.contractMonths);
      if (data.dueDate) fd.append('dueDate', data.dueDate);
      data.logos.forEach((file) => fd.append('logos', file));

      const response = await api.post('/auth/register', fd);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setShowForm(false);
      setFormData(emptyForm);
      setLogoPreviews([]);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ clientId, isActive }: { clientId: string; isActive: boolean }) => {
      const response = await api.patch(`/admin/clients/${clientId}/status`, { isActive });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });
    },
  });

  const updateClientStatusMutation = useMutation({
    mutationFn: async ({ clientId, clientStatus, statusReason }: { clientId: string; clientStatus: string; statusReason?: string }) => {
      const response = await api.patch(`/admin/clients/${clientId}/client-status`, { clientStatus, statusReason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setShowStatusModal(false);
      setClientForStatus(null);
      setStatusReason('');
    },
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      const response = await api.delete(`/admin/clients/${clientId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setShowDeleteModal(false);
      setClientToDelete(null);
    },
  });


  const handleToggleStatus = async (clientId: string, currentStatus: boolean) => {
    const ok = await confirm({
      title: currentStatus ? 'Bloquear cliente' : 'Desbloquear cliente',
      message: `Tem certeza que deseja ${currentStatus ? 'bloquear' : 'desbloquear'} o acesso deste cliente?`,
      confirmText: currentStatus ? 'Bloquear' : 'Desbloquear',
    });
    if (ok) updateStatusMutation.mutate({ clientId, isActive: !currentStatus });
  };


  const handleStatusClick = (client: any) => {
    setClientForStatus({
      id: client.id,
      name: client.name || client.clients?.businessName || 'Cliente',
      clientStatus: client.clients?.clientStatus ?? 'ACTIVE',
    });
    setNewClientStatus(client.clients?.clientStatus ?? 'ACTIVE');
    setStatusReason(client.clients?.statusReason ?? '');
    setShowStatusModal(true);
  };


  const handleSaveStatus = () => {
    if (!clientForStatus) return;
    updateClientStatusMutation.mutate({
      clientId: clientForStatus.id,
      clientStatus: newClientStatus,
      statusReason: newClientStatus !== 'ACTIVE' ? statusReason : undefined,
    });
  };

  const handleDeleteClick = (client: any) => {
    setClientToDelete({ id: client.id, name: client.name });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) deleteClientMutation.mutate(clientToDelete.id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClientMutation.mutate(formData);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    setFormData((prev) => ({ ...prev, logos: [...prev.logos, ...files] }));
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreviews((prev) => [...prev, reader.result as string]);
      reader.readAsDataURL(file);
    });
  };

  const removeLogoPreview = (index: number) => {
    setFormData((prev) => ({ ...prev, logos: prev.logos.filter((_, i) => i !== index) }));
    setLogoPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const filteredClients = Array.isArray(clients)
    ? clients.filter((c: any) => {
        if (statusFilter === 'ALL') return true;
        return c.clients?.clientStatus === statusFilter;
      })
    : [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] animate-fade-in">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wine-600 mb-4"></div>
          <p className="text-gray-600">Carregando clientes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:px-0 animate-fade-in">
        <div className="card-gradient text-center py-12">
          <div className="w-16 h-16 rounded-full bg-wine-100 flex items-center justify-center mx-auto mb-4">
            <WarningIcon />
          </div>
          <p className="text-wine-600 mb-4 font-medium">Erro ao carregar clientes. Tente novamente.</p>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Recarregar
          </button>
        </div>
      </div>
    );
  }

  const allClients = Array.isArray(clients) ? clients : [];
  const activeCount = allClients.filter((c: any) => c.clients?.clientStatus === 'ACTIVE' || !c.clients?.clientStatus).length;
  const pausedCount = allClients.filter((c: any) => c.clients?.clientStatus === 'PAUSED').length;
  const cancelledCount = allClients.filter((c: any) => c.clients?.clientStatus === 'CANCELLED').length;

  return (
    <div className="px-4 py-6 sm:px-0 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-start gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-wine-600 to-gold-500 bg-clip-text text-transparent mb-1 md:mb-2 font-outer-sans leading-tight">
            Gestão de Clientes
          </h1>
          <p className="text-sm md:text-base text-gray-600 font-outer-sans">Gerencie e cadastre novos clientes</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary flex items-center gap-2 font-outer-sans flex-shrink-0 text-sm md:text-base"
        >
          {showForm ? <XIcon /> : <PlusIcon />}
          <span className="hidden sm:inline">{showForm ? 'Cancelar' : 'Cadastrar Cliente'}</span>
          <span className="sm:hidden">{showForm ? 'Cancelar' : 'Novo'}</span>
        </button>
      </div>

      {/* Status summary pills */}
      <div className="flex flex-wrap gap-3 mb-6">
        {(['ALL', 'ACTIVE', 'PAUSED', 'CANCELLED'] as const).map((s) => {
          const count = s === 'ALL' ? allClients.length : s === 'ACTIVE' ? activeCount : s === 'PAUSED' ? pausedCount : cancelledCount;
          const label = s === 'ALL' ? 'Todos' : CLIENT_STATUS_LABELS[s];
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-all font-outer-sans ${
                statusFilter === s
                  ? 'bg-wine-600 text-white border-wine-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-wine-300'
              }`}
            >
              {s !== 'ALL' && <StatusDotIcon status={s} />}
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Cadastro Form */}
      {showForm && (
        <div className="card-gradient mb-6 animate-slide-up">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wine-500 to-wine-600 flex items-center justify-center shadow-lg">
              <UserIcon />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 font-outer-sans">Cadastrar Novo Cliente</h2>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              {/* Nome completo / Razão social */}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Nome completo / Razão social *</label>
                <input
                  type="text" required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="input"
                  placeholder="Ex: Empresa Ltda"
                />
              </div>

              {/* CPF / CNPJ */}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">CPF / CNPJ</label>
                <input
                  type="text"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  className="input"
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                />
              </div>

              {/* Responsável pelo contato */}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Responsável pelo contato *</label>
                <input
                  type="text" required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="input"
                  placeholder="Nome do responsável"
                />
              </div>

              {/* E-mail */}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">E-mail *</label>
                <input
                  type="email" required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="input"
                  placeholder="email@empresa.com"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Telefone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="input"
                  placeholder="(00) 00000-0000"
                />
              </div>

              {/* Identificador (slug) */}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Identificador do cliente *</label>
                <input
                  type="text" required
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  className="input"
                  placeholder="Ex: empresa-ltda (sem espaços)"
                />
                <p className="text-xs text-gray-500 mt-1 font-outer-sans">Usado para identificar o cliente no sistema</p>
              </div>

              {/* Endereço completo */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 font-outer-sans">Endereço completo</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="input"
                  placeholder="Rua, número, bairro, cidade, estado, CEP"
                />
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 font-outer-sans">Observações / Descrição do projeto</label>
                <textarea
                  value={formData.customPlanDescription}
                  onChange={(e) => setFormData({ ...formData, customPlanDescription: e.target.value })}
                  className="input"
                  rows={3}
                  placeholder="Descreva os materiais, dimensões, estrutura e serviços incluídos..."
                />
              </div>

              {/* Evento / Feira */}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Evento / Feira</label>
                <input
                  type="text"
                  value={formData.contractMonths}
                  onChange={(e) => setFormData({ ...formData, contractMonths: e.target.value })}
                  className="input"
                  placeholder="Ex: Agrishow 2025, Expo Fênix..."
                />
              </div>

              {/* Data do evento */}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Data do evento</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="input"
                />
              </div>

              {/* Senha */}
              <div>
                <label className="block text-sm font-medium mb-1 font-outer-sans">Senha de acesso *</label>
                <input
                  type="password" required minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="input"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              {/* Logos */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1 font-outer-sans">
                  Logos da empresa (pode enviar vários formatos)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleLogoChange}
                  className="input"
                />
                <p className="text-xs text-gray-500 mt-1 font-outer-sans">
                  Envie todos os formatos: com fundo, sem fundo, preto e branco, etc.
                </p>
                {logoPreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {logoPreviews.map((preview, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={preview}
                          alt={`Logo ${i + 1}`}
                          className="w-24 h-24 object-cover rounded-lg border-2 border-white shadow-md"
                        />
                        <button
                          type="button"
                          onClick={() => removeLogoPreview(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-wine-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </button>
                        {i === 0 && (
                          <span className="absolute bottom-1 left-1 text-xs bg-wine-600 text-white px-1 rounded font-outer-sans">
                            Principal
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={createClientMutation.isPending}
                className="btn btn-primary font-outer-sans"
              >
                {createClientMutation.isPending ? 'Cadastrando...' : 'Cadastrar Cliente'}
              </button>
            </div>
            {createClientMutation.isError && (
              <div className="text-wine-600 text-sm font-outer-sans">
                Erro ao cadastrar cliente. Tente novamente.
              </div>
            )}
          </form>
        </div>
      )}

      {/* Lista de clientes */}
      <div className="grid grid-cols-1 gap-6">
        {filteredClients.length > 0 ? (
          filteredClients.map((client: any, index: number) => {
            const profile = client.clients;
            const clientStatus = profile?.clientStatus ?? 'ACTIVE';
            return (
              <div
                key={client.id}
                className={`card-interactive animate-slide-up ${client.isActive === false ? 'opacity-75 border-2 border-wine-200' : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex justify-between items-start gap-4">
                  {/* Logos */}
                  <div className="flex-shrink-0 flex gap-2">
                    {profile?.logoUrls?.length > 0 ? (
                      profile.logoUrls.slice(0, 3).map((url: string, i: number) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Logo ${i + 1}`}
                          className={`w-14 h-14 object-cover rounded-lg border ${client.isActive === false ? 'opacity-50' : ''}`}
                        />
                      ))
                    ) : profile?.logoUrl ? (
                      <img
                        src={profile.logoUrl}
                        alt={client.name}
                        className={`w-14 h-14 object-cover rounded-lg border ${client.isActive === false ? 'opacity-50' : ''}`}
                      />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-800 font-outer-sans">
                        {profile?.businessName || client.name || 'Sem nome'}
                      </h3>
                      {/* Status do negócio */}
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border flex items-center font-outer-sans ${CLIENT_STATUS_COLORS[clientStatus]}`}>
                        <StatusDotIcon status={clientStatus} />
                        {CLIENT_STATUS_LABELS[clientStatus]}
                      </span>
                      {/* Acesso bloqueado */}
                      {client.isActive === false && (
                        <span className="px-2.5 py-0.5 bg-wine-100 text-wine-800 rounded-full text-xs font-semibold border border-wine-200 font-outer-sans">
                          ACESSO BLOQUEADO
                        </span>
                      )}
                    </div>

                    {profile ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-1 text-sm">
                        {profile.cpfCnpj && (
                          <div className="flex gap-1">
                            <span className="text-wine-600 font-semibold font-outer-sans">CPF/CNPJ:</span>
                            <span className="font-outer-sans truncate">{profile.cpfCnpj}</span>
                          </div>
                        )}
                        <div className="flex gap-1">
                          <span className="text-wine-600 font-semibold font-outer-sans">Contato:</span>
                          <span className="font-outer-sans truncate">{profile.mainContact}</span>
                        </div>
                        <div className="flex gap-1">
                          <span className="text-wine-600 font-semibold font-outer-sans">Email:</span>
                          <span className="font-outer-sans truncate">{profile.mainEmail}</span>
                        </div>
                        {profile.mainPhone && (
                          <div className="flex gap-1">
                            <span className="text-wine-600 font-semibold font-outer-sans">Telefone:</span>
                            <span className="font-outer-sans">{profile.mainPhone}</span>
                          </div>
                        )}
                        {profile.address && (
                          <div className="flex gap-1 sm:col-span-2">
                            <span className="text-wine-600 font-semibold font-outer-sans">Endereço:</span>
                            <span className="font-outer-sans truncate">{profile.address}</span>
                          </div>
                        )}
                        {profile.contractMonths && (
                          <div className="flex gap-1">
                            <span className="text-wine-600 font-semibold font-outer-sans">Evento:</span>
                            <span className="font-outer-sans truncate">{profile.contractMonths}</span>
                          </div>
                        )}
                        {profile.dueDate && (
                          <div className="flex gap-1">
                            <span className="text-wine-600 font-semibold font-outer-sans">Data do evento:</span>
                            <span className="font-outer-sans">{new Date(profile.dueDate).toLocaleDateString('pt-BR')}</span>
                          </div>
                        )}
                        {(clientStatus === 'PAUSED' || clientStatus === 'CANCELLED') && profile.statusReason && (
                          <div className="flex gap-1 sm:col-span-2 lg:col-span-3">
                            <span className="text-gold-600 font-semibold font-outer-sans">Motivo:</span>
                            <span className="font-outer-sans text-gold-700">{profile.statusReason}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 italic font-outer-sans">Perfil do cliente não configurado</p>
                    )}

                    <p className="text-xs text-gray-400 mt-2 font-outer-sans">
                      Cadastrado em:{' '}
                      {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <div className="flex flex-wrap justify-end gap-2">
                      {/* Mudar status do negócio */}
                      <button
                        onClick={() => handleStatusClick(client)}
                        className="btn btn-secondary text-xs flex items-center gap-1 font-outer-sans"
                        title="Alterar status do contrato"
                      >
                        <StatusDotIcon status={clientStatus} />
                        <span>Status</span>
                      </button>
                      {/* Bloquear/desbloquear acesso */}
                      <button
                        onClick={() => handleToggleStatus(client.id, client.isActive !== false)}
                        disabled={updateStatusMutation.isPending}
                        className={`btn text-xs flex items-center gap-1 font-outer-sans ${
                          client.isActive !== false
                            ? 'bg-gradient-to-r from-wine-500 to-wine-600 text-white hover:from-wine-600 hover:to-wine-700'
                            : 'btn-primary'
                        }`}
                        title={client.isActive !== false ? 'Bloquear acesso ao sistema' : 'Desbloquear acesso ao sistema'}
                      >
                        {client.isActive !== false ? <LockIcon /> : <UnlockIcon />}
                        <span>{client.isActive !== false ? 'Bloquear' : 'Desbloquear'}</span>
                      </button>
                      <Link
                        to={`/admin/clients/${client.id}`}
                        className="btn btn-secondary text-xs flex items-center gap-1 font-outer-sans"
                      >
                        <SettingsIcon />
                        <span>Gerenciar</span>
                      </Link>
                      <button
                        onClick={() => handleDeleteClick(client)}
                        disabled={deleteClientMutation.isPending}
                        className="btn btn-danger text-xs flex items-center gap-1 font-outer-sans"
                      >
                        <TrashIcon />
                        <span>Excluir</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="card-gradient text-center py-16 animate-slide-up">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-wine-100 to-gold-100 flex items-center justify-center mx-auto mb-4">
              <UsersIcon />
            </div>
            <p className="text-gray-600 mb-2 text-lg font-medium font-outer-sans">
              {statusFilter !== 'ALL' ? `Nenhum cliente ${CLIENT_STATUS_LABELS[statusFilter].toLowerCase()}.` : 'Nenhum cliente cadastrado ainda.'}
            </p>
            {statusFilter === 'ALL' && (
              <button onClick={() => setShowForm(true)} className="btn btn-primary flex items-center gap-2 mx-auto font-outer-sans">
                <PlusIcon />
                <span>Cadastrar Primeiro Cliente</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal: Status do negócio */}
      {showStatusModal && clientForStatus && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 animate-slide-up">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-800 font-outer-sans">Alterar Status do Cliente</h3>
                <button onClick={() => setShowStatusModal(false)} className="text-gray-400 hover:text-gray-600">
                  <XIcon />
                </button>
              </div>
              <p className="text-sm text-gray-500 mt-1 font-outer-sans">{clientForStatus.name}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 font-outer-sans">Status</label>
                <div className="flex gap-3">
                  {(['ACTIVE', 'PAUSED', 'CANCELLED'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setNewClientStatus(s)}
                      className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-all font-outer-sans ${
                        newClientStatus === s
                          ? s === 'ACTIVE' ? 'bg-green-500 text-white border-green-500'
                          : s === 'PAUSED' ? 'bg-yellow-500 text-white border-yellow-500'
                          : 'bg-wine-500 text-white border-wine-500'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {CLIENT_STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
              </div>
              {newClientStatus !== 'ACTIVE' && (
                <div>
                  <label className="block text-sm font-medium mb-2 font-outer-sans">
                    Motivo {newClientStatus === 'CANCELLED' ? '(cancelamento)' : '(pausa)'}
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="input"
                    rows={3}
                    placeholder="Descreva o motivo..."
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2 border-t border-gray-200">
                <button
                  onClick={() => setShowStatusModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors font-outer-sans"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveStatus}
                  disabled={updateClientStatusMutation.isPending}
                  className="flex-1 px-4 py-2 bg-gradient-to-r from-wine-600 to-gold-500 text-white rounded-lg font-semibold hover:from-wine-700 hover:to-gold-600 transition-all font-outer-sans flex items-center justify-center gap-2"
                >
                  {updateClientStatusMutation.isPending ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Salvando...</span></>
                  ) : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Excluir */}
      {showDeleteModal && clientToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4 border border-wine-200 animate-scale-in">
            <div className="flex items-center gap-3 mb-4">
              <WarningIcon />
              <h2 className="text-2xl font-bold text-wine-600 font-outer-sans">Confirmar Exclusão</h2>
            </div>
            <p className="text-gray-700 mb-4 font-outer-sans">
              Tem certeza que deseja excluir o cliente <strong>{clientToDelete.name}</strong>?
            </p>
            <div className="bg-wine-50 border border-wine-200 rounded-lg p-4 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <WarningIcon />
                <h3 className="font-bold text-wine-800 font-outer-sans">ATENÇÃO: Esta ação é IRREVERSÍVEL!</h3>
              </div>
              <ul className="text-sm text-wine-700 space-y-1 list-disc list-inside font-outer-sans">
                <li>Todos os dados do cliente serão <strong>permanentemente excluídos</strong></li>
                <li>Todos os <strong>projetos e arquivos</strong> serão perdidos</li>
                <li>Todos os <strong>orçamentos</strong> serão removidos</li>
                <li>Todo o <strong>histórico</strong> será deletado</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setClientToDelete(null); }}
                className="btn btn-secondary font-outer-sans"
                disabled={deleteClientMutation.isPending}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteClientMutation.isPending}
                className="btn btn-danger flex items-center gap-2 font-outer-sans"
              >
                {deleteClientMutation.isPending ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div><span>Excluindo...</span></>
                ) : (
                  <><TrashIcon /><span>Sim, Excluir Permanentemente</span></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
