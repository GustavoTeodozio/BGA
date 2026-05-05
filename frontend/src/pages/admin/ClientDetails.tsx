import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { StandUpdatesManager } from './StandUpdatesManager';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativo',
  PAUSED: 'Pausado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800 border-green-200',
  PAUSED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  CANCELLED: 'bg-wine-100 text-wine-800 border-wine-200',
};

type Tab = 'profile' | 'updates';

export function ClientDetails() {
  const { clientId } = useParams<{ clientId: string }>();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [editMode, setEditMode] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [profileForm, setProfileForm] = useState({
    businessName: '',
    cpfCnpj: '',
    segment: '',
    mainContact: '',
    mainEmail: '',
    mainPhone: '',
    address: '',
    website: '',
  });

  const queryClient = useQueryClient();

  const { data: client, isLoading: clientLoading } = useQuery({
    queryKey: ['admin', 'client', clientId],
    queryFn: async () => {
      const response = await api.get('/admin/clients');
      return response.data.find((c: any) => c.id === clientId);
    },
    enabled: !!clientId,
  });

  useEffect(() => {
    if (client?.clients) {
      const p = client.clients;
      setProfileForm({
        businessName: p.businessName ?? '',
        cpfCnpj: p.cpfCnpj ?? '',
        segment: p.segment ?? '',
        mainContact: p.mainContact ?? '',
        mainEmail: p.mainEmail ?? '',
        mainPhone: p.mainPhone ?? '',
        address: p.address ?? '',
        website: p.website ?? '',
      });
    }
  }, [client]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof profileForm) => {
      const payload: any = { ...data };
      const response = await api.patch(`/admin/clients/${clientId}/profile`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'client', clientId] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'clients'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      setEditMode(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileForm);
  };

  const inputClass = 'w-full px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wine-500 focus:border-wine-500 text-sm font-outer-sans';
  const readonlyClass = 'w-full px-3 py-2 bg-gray-50 text-gray-800 border border-gray-200 rounded-lg text-sm font-outer-sans';

  if (clientLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-wine-600"></div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="card-gradient text-center py-12">
          <p className="text-gray-500 mb-4 font-outer-sans">Cliente não encontrado</p>
          <Link to="/admin/clients" className="btn btn-primary font-outer-sans">Voltar para Clientes</Link>
        </div>
      </div>
    );
  }

  const profile = client.clients;
  const allLogos: string[] = profile?.logoUrls?.length > 0 ? profile.logoUrls : profile?.logoUrl ? [profile.logoUrl] : [];

  return (
    <div className="px-4 py-6 sm:px-0 animate-fade-in">
      {/* Back */}
      <Link to="/admin/clients" className="inline-flex items-center gap-1.5 text-wine-600 hover:text-wine-800 mb-5 text-sm font-semibold font-outer-sans transition-colors">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Voltar para Clientes
      </Link>

      {/* Header do cliente */}
      <div className="card-gradient mb-6">
        <div className="flex flex-wrap items-start gap-4">
          {allLogos.length > 0 && (
            <div className="flex gap-2 flex-wrap">
              {allLogos.map((url, i) => (
                <img key={i} src={url} alt={`Logo ${i + 1}`} className="w-16 h-16 object-cover rounded-xl border-2 border-white shadow-md" />
              ))}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <h1 className="text-2xl font-black bg-gradient-to-r from-wine-600 to-gold-500 bg-clip-text text-transparent font-outer-sans">
                {profile?.businessName || client.name}
              </h1>
              {profile?.clientStatus && (
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border font-outer-sans ${STATUS_COLORS[profile.clientStatus]}`}>
                  {STATUS_LABELS[profile.clientStatus]}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-gray-600 font-outer-sans">
              {profile?.mainContact && <span className="flex items-center gap-1"><svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>{profile.mainContact}</span>}
              {profile?.mainEmail && <span className="flex items-center gap-1"><svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>{profile.mainEmail}</span>}
              {profile?.mainPhone && <span className="flex items-center gap-1"><svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{profile.mainPhone}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6 overflow-x-auto">
        <nav className="flex gap-1 min-w-max">
          {([
            { id: 'profile', label: 'Dados do Cliente', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg> },
            { id: 'updates', label: 'Stand', icon: <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> },
          ] as { id: Tab; label: string; icon: JSX.Element }[]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all font-outer-sans flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-wine-500 text-wine-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* ===== ABA: DADOS DO CLIENTE ===== */}
      {activeTab === 'profile' && (
        <div className="card-gradient animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 font-outer-sans">Informações do Cliente</h2>
            <div className="flex gap-2">
              {saveSuccess && (
                <span className="text-green-600 text-sm font-semibold font-outer-sans flex items-center gap-1">
                  ✓ Salvo com sucesso
                </span>
              )}
              {!editMode ? (
                <button onClick={() => setEditMode(true)} className="btn btn-primary text-sm font-outer-sans flex items-center gap-1.5">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Editar
                </button>
              ) : (
                <button onClick={() => setEditMode(false)} className="btn btn-secondary text-sm font-outer-sans">
                  Cancelar
                </button>
              )}
            </div>
          </div>

          <form onSubmit={handleProfileSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide font-outer-sans">Nome completo / Razão social</label>
                {editMode
                  ? <input type="text" value={profileForm.businessName} onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })} className={inputClass} />
                  : <p className={readonlyClass}>{profile?.businessName || '—'}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide font-outer-sans">CPF / CNPJ</label>
                {editMode
                  ? <input type="text" value={profileForm.cpfCnpj} onChange={(e) => setProfileForm({ ...profileForm, cpfCnpj: e.target.value })} className={inputClass} placeholder="000.000.000-00" />
                  : <p className={readonlyClass}>{profile?.cpfCnpj || '—'}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide font-outer-sans">Responsável pelo contato</label>
                {editMode
                  ? <input type="text" value={profileForm.mainContact} onChange={(e) => setProfileForm({ ...profileForm, mainContact: e.target.value })} className={inputClass} />
                  : <p className={readonlyClass}>{profile?.mainContact || '—'}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide font-outer-sans">E-mail</label>
                {editMode
                  ? <input type="email" value={profileForm.mainEmail} onChange={(e) => setProfileForm({ ...profileForm, mainEmail: e.target.value })} className={inputClass} />
                  : <p className={readonlyClass}>{profile?.mainEmail || '—'}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide font-outer-sans">Telefone</label>
                {editMode
                  ? <input type="tel" value={profileForm.mainPhone} onChange={(e) => setProfileForm({ ...profileForm, mainPhone: e.target.value })} className={inputClass} placeholder="(00) 00000-0000" />
                  : <p className={readonlyClass}>{profile?.mainPhone || '—'}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide font-outer-sans">Segmento</label>
                {editMode
                  ? <input type="text" value={profileForm.segment} onChange={(e) => setProfileForm({ ...profileForm, segment: e.target.value })} className={inputClass} />
                  : <p className={readonlyClass}>{profile?.segment || '—'}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide font-outer-sans">Endereço completo</label>
                {editMode
                  ? <input type="text" value={profileForm.address} onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })} className={inputClass} placeholder="Rua, número, bairro, cidade, estado, CEP" />
                  : <p className={readonlyClass}>{profile?.address || '—'}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide font-outer-sans">Website</label>
                {editMode
                  ? <input type="text" value={profileForm.website} onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })} className={inputClass} placeholder="https://..." />
                  : <p className={readonlyClass}>{profile?.website || '—'}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide font-outer-sans">Status</label>
                <p className={readonlyClass}>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[profile?.clientStatus ?? 'ACTIVE']}`}>
                    {STATUS_LABELS[profile?.clientStatus ?? 'ACTIVE']}
                  </span>
                  {profile?.statusReason && <span className="ml-2 text-gray-500 text-xs">({profile.statusReason})</span>}
                </p>
              </div>

            </div>

            {allLogos.length > 0 && (
              <div className="mt-6">
                <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide font-outer-sans">Logos cadastradas</label>
                <div className="flex flex-wrap gap-3">
                  {allLogos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Logo ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border-2 border-gray-200 shadow-sm" />
                      {i === 0 && <span className="absolute bottom-1 left-1 text-xs bg-wine-600 text-white px-1 rounded font-outer-sans">Principal</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {editMode && (
              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setEditMode(false)} className="btn btn-secondary font-outer-sans">
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={updateProfileMutation.isPending}
                  className="btn btn-primary font-outer-sans flex items-center gap-2"
                >
                  {updateProfileMutation.isPending ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Salvando...</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Salvar alterações</>
                  )}
                </button>
              </div>
            )}
            {updateProfileMutation.isError && (
              <p className="mt-3 text-wine-600 text-sm font-outer-sans">Erro ao salvar. Tente novamente.</p>
            )}
          </form>
        </div>
      )}

      {/* ===== ABA: STAND ===== */}
      {activeTab === 'updates' && clientId && (
        <div className="animate-fade-in">
          <StandUpdatesManager clientId={clientId} />
        </div>
      )}
    </div>
  );
}
