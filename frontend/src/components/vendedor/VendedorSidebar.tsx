import { useRef, useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserAvatar } from '../UserAvatar';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/client';
import { loadVisibleKeys } from '../../hooks/useSidebarConfig';

interface VendedorSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function VendedorSidebar({ isOpen, onClose }: VendedorSidebarProps) {
  const location = useLocation();
  const { user, updateUser } = useAuthStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => loadVisibleKeys('vendedor'));

  useEffect(() => {
    const onStorage = () => setVisibleKeys(loadVisibleKeys('vendedor'));
    window.addEventListener('storage', onStorage);
    window.addEventListener('sidebar-config-changed', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sidebar-config-changed', onStorage);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/vendedor') return location.pathname === '/vendedor';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setEditAvatar(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/vendedor/profile', { name: editName, avatar: editAvatar || null });
      updateUser({ name: data.name, avatar: data.avatar ?? undefined });
      setShowProfileModal(false);
    } finally {
      setSaving(false);
    }
  };

  // ── Ícones ──────────────────────────────────────────────────────────────
  const DashboardIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const CRMIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const AgendaIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const KanbanIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" />
    </svg>
  );

  const ClientsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  );

  const NotesIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const BudgetIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
  );

  const SalesIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  const ProjectsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  const StandsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const allMenuItems = [
    { key: 'dashboard',  path: '/vendedor',             label: 'Dashboard',    icon: DashboardIcon, description: 'Visão geral' },
    { key: 'crm',        path: '/vendedor/crm',         label: 'CRM Pipeline', icon: CRMIcon,       description: 'Funil de vendas' },
    { key: 'crm-agenda', path: '/vendedor/crm-agenda',  label: 'Agenda CRM',   icon: AgendaIcon,    description: 'Atividades do dia' },
    { key: 'stands',     path: '/vendedor/stands',      label: 'Stands',       icon: StandsIcon,    description: 'Fotos e atualizações' },
    { key: 'clients',    path: '/vendedor/clients',     label: 'Clientes',     icon: ClientsIcon,   description: 'Cadastrar e visualizar' },
    { key: 'notes',      path: '/vendedor/notes',       label: 'Anotações',    icon: NotesIcon,     description: 'Suas anotações' },
    { key: 'budgets',    path: '/vendedor/budgets',     label: 'Orçamentos',   icon: BudgetIcon,    description: 'Criar e gerenciar' },
    { key: 'sales',      path: '/vendedor/sales',       label: 'Vendas',       icon: SalesIcon,     description: 'Histórico de vendas' },
    { key: 'projects',   path: '/vendedor/projects',    label: 'Projetos',     icon: ProjectsIcon,  description: 'Direcionar para projetista' },
  ];

  const menuItems = allMenuItems.filter(i => visibleKeys.includes(i.key));

  const sections = [
    { label: null,       items: menuItems.filter(i => ['dashboard'].includes(i.key)) },
    { label: 'CRM',      items: menuItems.filter(i => ['crm', 'crm-agenda', 'stands'].includes(i.key)) },
    { label: 'TRABALHO', items: menuItems.filter(i => ['clients', 'notes', 'budgets', 'sales', 'projects'].includes(i.key)) },
  ].filter(s => s.items.length > 0);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-60 z-50 flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:z-40`}
        style={{
          background: 'linear-gradient(180deg, #043a1a 0%, #065c28 40%, #054d21 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
          <Link to="/vendedor" onClick={onClose} className="flex items-center gap-3 group min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shadow-lg">
              <img src="/LOGO.png" alt="BGA" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate font-outer-sans">BGA STANDS</p>
              <p className="text-green-300/70 text-[10px] font-outer-sans">Painel Vendedor</p>
            </div>
          </Link>
          <button onClick={onClose} className="md:hidden text-green-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Status badge ── */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/15 border border-green-400/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0"></span>
            <span className="text-[11px] font-semibold text-green-200 font-outer-sans">Vendedor · Online</span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
          {sections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-3' : ''}>
              {section.label && (
                <p className="text-[9px] font-bold text-green-400/50 uppercase tracking-widest px-3 mb-1.5 font-outer-sans">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150
                      ${active
                        ? 'bg-gradient-to-r from-green-500/90 to-green-600/90 text-white shadow-md shadow-green-900/40'
                        : 'text-green-200/80 hover:bg-white/8 hover:text-white'
                      }`}
                  >
                    {active && <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-green-300 rounded-r-full" />}
                    <div className={`relative z-10 flex-shrink-0 transition-transform duration-150
                      ${active ? 'text-white' : 'text-green-300 group-hover:text-white group-hover:scale-110'}`}>
                      <item.icon />
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <div className={`text-[13px] font-semibold truncate font-outer-sans leading-tight
                        ${active ? 'text-white' : 'text-green-100'}`}>
                        {item.label}
                      </div>
                      <div className={`text-[10px] truncate font-outer-sans leading-tight
                        ${active ? 'text-green-100/80' : 'text-green-400/60'}`}>
                        {item.description}
                      </div>
                    </div>
                    {active && (
                      <svg className="w-3 h-3 text-green-200 flex-shrink-0 relative z-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* ── Footer ── */}
        <div className="px-3 py-3 border-t border-white/8">
          <button
            onClick={() => { setEditName(user?.name || ''); setEditAvatar(user?.avatar || ''); setShowProfileModal(true); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-left"
          >
            <UserAvatar size={6} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-green-200 font-semibold truncate font-outer-sans">{user?.name || 'Vendedor'}</p>
              <p className="text-[10px] text-green-400/60 font-outer-sans">Clique para editar perfil</p>
            </div>
            <svg className="w-3.5 h-3.5 text-green-400/60 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
        </div>
      </aside>

      {/* ── Profile Modal ── */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowProfileModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-scale-in">
            <h3 className="text-base font-bold text-gray-800 font-outer-sans mb-5">Editar perfil</h3>

            <div className="flex flex-col items-center mb-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center cursor-pointer ring-4 ring-green-100 hover:ring-green-300 transition-all relative group"
              >
                {editAvatar
                  ? <img src={editAvatar} alt="avatar" className="w-full h-full object-cover" />
                  : <svg className="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                }
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2 font-outer-sans">Clique para alterar a foto</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1.5">Nome</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-green-500 focus:outline-none text-sm font-outer-sans transition-colors"
                placeholder="Seu nome"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowProfileModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold font-outer-sans text-sm hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={saving}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold font-outer-sans text-sm hover:from-green-700 hover:to-green-800 transition-all shadow-md disabled:opacity-60"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
