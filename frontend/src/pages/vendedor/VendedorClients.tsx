import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

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
  CANCELLED: 'bg-red-50 text-red-700 border-red-200',
};

const emptyForm = {
  tenantName: '',
  businessName: '',
  cpfCnpj: '',
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

export function VendedorClients() {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(emptyForm);
  const [logoPreviews, setLogoPreviews] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ['vendedor', 'clients'],
    queryFn: async () => {
      const r = await api.get('/vendedor/clients');
      return Array.isArray(r.data) ? r.data : [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const fd = new FormData();
      fd.append('tenantName', data.tenantName);
      fd.append('businessName', data.businessName);
      fd.append('contactName', data.contactName);
      fd.append('contactEmail', data.contactEmail);
      fd.append('password', data.password);
      if (data.cpfCnpj) fd.append('cpfCnpj', data.cpfCnpj);
      if (data.contactPhone) fd.append('contactPhone', data.contactPhone);
      if (data.address) fd.append('address', data.address);
      if (data.customPlanDescription) fd.append('customPlanDescription', data.customPlanDescription);
      if (data.contractMonths) fd.append('contractMonths', data.contractMonths);
      if (data.dueDate) fd.append('dueDate', data.dueDate);
      data.logos.forEach((file) => fd.append('logos', file));
      const r = await api.post('/vendedor/clients', fd);
      return r.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['vendedor', 'clients'] });
      setShowForm(false);
      setFormData(emptyForm);
      setLogoPreviews([]);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
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

  const filtered = clients.filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const name = (c.clients?.businessName || c.name || '').toLowerCase();
    const email = (c.clients?.mainEmail || c.email || '').toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <p className="text-gray-500 text-sm font-outer-sans">Cadastre e gerencie seus clientes</p>
        <div className="flex gap-3">
          <div className="relative flex-1 sm:w-64">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
            />
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-outer-sans whitespace-nowrap"
          >
            <svg className={`w-4 h-4 transition-transform duration-200 ${showForm ? 'rotate-45' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancelar' : 'Novo Cliente'}
          </button>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-lg p-6 mb-6 animate-slide-up">
          <h2 className="text-lg font-bold text-gray-800 font-outer-sans mb-5">Cadastrar Novo Cliente</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Nome completo / Razão social *</label>
                <input
                  type="text" required
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
                  placeholder="Ex: Empresa Ltda"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">CPF / CNPJ</label>
                <input
                  type="text"
                  value={formData.cpfCnpj}
                  onChange={(e) => setFormData({ ...formData, cpfCnpj: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
                  placeholder="000.000.000-00 ou 00.000.000/0001-00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Responsável pelo contato *</label>
                <input
                  type="text" required
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
                  placeholder="Nome do responsável"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">E-mail *</label>
                <input
                  type="email" required
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
                  placeholder="email@empresa.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Telefone</label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Identificador do cliente *</label>
                <input
                  type="text" required
                  value={formData.tenantName}
                  onChange={(e) => setFormData({ ...formData, tenantName: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
                  placeholder="Ex: empresa-ltda (sem espaços)"
                />
                <p className="text-xs text-gray-400 mt-1 font-outer-sans">Usado para identificar o cliente no sistema</p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Endereço completo</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
                  placeholder="Rua, número, bairro, cidade, estado, CEP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Evento / Feira</label>
                <input
                  type="text"
                  value={formData.contractMonths}
                  onChange={(e) => setFormData({ ...formData, contractMonths: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
                  placeholder="Ex: Agrishow 2025, Expo Fênix..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Data do evento</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Senha de acesso *</label>
                <input
                  type="password" required minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent font-outer-sans"
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Logos da empresa</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleLogoChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-outer-sans"
                />
                <p className="text-xs text-gray-400 mt-1 font-outer-sans">Envie todos os formatos: com fundo, sem fundo, etc.</p>
                {logoPreviews.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-3">
                    {logoPreviews.map((preview, i) => (
                      <div key={i} className="relative group">
                        <img src={preview} alt={`Logo ${i + 1}`} className="w-20 h-20 object-cover rounded-lg border-2 border-white shadow-md" />
                        <button
                          type="button"
                          onClick={() => removeLogoPreview(i)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >×</button>
                        {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-blue-600 text-white px-1 rounded font-outer-sans">Principal</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormData(emptyForm); setLogoPreviews([]); }}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 font-outer-sans"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 font-outer-sans disabled:opacity-50"
              >
                {createMutation.isPending ? 'Cadastrando...' : 'Cadastrar Cliente'}
              </button>
            </div>
            {createMutation.isError && (
              <p className="text-red-500 text-sm font-outer-sans">Erro ao cadastrar. Tente novamente.</p>
            )}
          </form>
        </div>
      )}

      {/* Client list */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <p className="text-gray-400 text-lg font-outer-sans">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
          {!search && (
            <button onClick={() => setShowForm(true)} className="mt-4 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl text-sm font-semibold font-outer-sans">
              Cadastrar Primeiro Cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((client: any, i: number) => {
            const profile = client.clients;
            const clientStatus = profile?.clientStatus ?? 'ACTIVE';
            return (
              <div key={client.id} className="bg-white rounded-2xl border border-gray-100 hover:shadow-md transition-all duration-200 p-5 animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
                <div className="flex gap-4 items-start">
                  {/* Logos */}
                  {profile?.logoUrls?.length > 0 ? (
                    <div className="flex gap-2 flex-shrink-0">
                      {profile.logoUrls.slice(0, 2).map((url: string, idx: number) => (
                        <img key={idx} src={url} alt="" className="w-12 h-12 object-cover rounded-lg border" />
                      ))}
                    </div>
                  ) : profile?.logoUrl ? (
                    <img src={profile.logoUrl} alt="" className="w-12 h-12 object-cover rounded-lg border flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-600 font-bold text-lg font-outer-sans">
                        {(profile?.businessName || client.name || '?').charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <h3 className="font-bold text-gray-800 font-outer-sans">{profile?.businessName || client.name || 'Sem nome'}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border font-outer-sans ${CLIENT_STATUS_COLORS[clientStatus]}`}>
                        {CLIENT_STATUS_LABELS[clientStatus]}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0.5 text-sm mt-2">
                      {profile?.mainContact && (
                        <div className="flex gap-1">
                          <span className="text-blue-600 font-semibold font-outer-sans text-xs">Contato:</span>
                          <span className="font-outer-sans text-xs text-gray-600 truncate">{profile.mainContact}</span>
                        </div>
                      )}
                      {profile?.mainEmail && (
                        <div className="flex gap-1">
                          <span className="text-blue-600 font-semibold font-outer-sans text-xs">Email:</span>
                          <span className="font-outer-sans text-xs text-gray-600 truncate">{profile.mainEmail}</span>
                        </div>
                      )}
                      {profile?.mainPhone && (
                        <div className="flex gap-1">
                          <span className="text-blue-600 font-semibold font-outer-sans text-xs">Tel:</span>
                          <span className="font-outer-sans text-xs text-gray-600">{profile.mainPhone}</span>
                        </div>
                      )}
                      {profile?.cpfCnpj && (
                        <div className="flex gap-1">
                          <span className="text-blue-600 font-semibold font-outer-sans text-xs">CPF/CNPJ:</span>
                          <span className="font-outer-sans text-xs text-gray-600">{profile.cpfCnpj}</span>
                        </div>
                      )}
                      {profile?.contractMonths && (
                        <div className="flex gap-1">
                          <span className="text-blue-600 font-semibold font-outer-sans text-xs">Evento:</span>
                          <span className="font-outer-sans text-xs text-gray-600 truncate">{profile.contractMonths}</span>
                        </div>
                      )}
                      {profile?.dueDate && (
                        <div className="flex gap-1">
                          <span className="text-blue-600 font-semibold font-outer-sans text-xs">Data evento:</span>
                          <span className="font-outer-sans text-xs text-gray-600">{new Date(profile.dueDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>

                    <p className="text-[10px] text-gray-400 mt-2 font-outer-sans">
                      Cadastrado em: {client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
