import { Link, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/client';
import { loadVisibleKeys } from '../../hooks/useSidebarConfig';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const { user, updateUser } = useAuthStore();
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editAvatar, setEditAvatar] = useState(user?.avatar || '');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => loadVisibleKeys('admin'));

  useEffect(() => {
    const onStorage = () => setVisibleKeys(loadVisibleKeys('admin'));
    window.addEventListener('storage', onStorage);
    window.addEventListener('sidebar-config-changed', onStorage);
    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('sidebar-config-changed', onStorage);
    };
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setEditAvatar(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await api.patch('/admin/profile', { name: editName, avatar: editAvatar || null });
      updateUser({ name: data.name, avatar: data.avatar ?? undefined });
    } finally {
      setSaving(false);
      setShowProfileModal(false);
    }
  };

  const openProfile = () => {
    setEditName(user?.name || '');
    setEditAvatar(user?.avatar || '');
    setShowProfileModal(true);
  };

  const isActive = (path: string) => {
    if (path === '/admin') return location.pathname === '/admin';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // ── Ícones outline ──────────────────────────────────────────────────────
  const DashboardIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
  const KanbanIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" />
    </svg>
  );
  const StandIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
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
  const ProjectsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
  const TeamIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
  const SettingsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
  const EmployeesIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6a4 4 0 11-8 0 4 4 0 018 0zM12 21a21.968 21.968 0 01-7.5-1.325" />
    </svg>
  );
  const CeniqIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );

  const allSections = [
    { label: null,       items: [{ key: 'dashboard', path: '/admin',            label: 'Dashboard',    icon: DashboardIcon, description: 'Visão geral' }] },
    { label: 'TRABALHO', items: [
      { key: 'stand',      path: '/admin/stand',  label: 'Stands',             icon: StandIcon,   description: 'Fotos e atualizações' },
    ]},
    { label: 'CRM',      items: [
      { key: 'crm',        path: '/admin/crm',        label: 'Pipeline', icon: CRMIcon,    description: 'Funil de vendas' },
      { key: 'crm-agenda', path: '/admin/crm-agenda', label: 'Agenda',   icon: AgendaIcon, description: 'Atividades do dia' },
    ]},
    { label: 'GESTÃO', items: [
      { key: 'clients',   path: '/admin/clients',    label: 'Clientes',      icon: ClientsIcon,    description: 'Gestão de clientes' },
      { key: 'notes',     path: '/admin/notes',      label: 'Anotações',     icon: NotesIcon,      description: 'Todas as anotações' },
      { key: 'budgets',   path: '/admin/budgets',    label: 'Orçamentos',    icon: BudgetIcon,     description: 'Todos os orçamentos' },
      { key: 'projects',  path: '/admin/projects',   label: 'Projetos',      icon: ProjectsIcon,   description: 'Todos os projetos' },
      { key: 'team',      path: '/admin/team',       label: 'Equipe',        icon: TeamIcon,       description: 'Vendedores e projetistas' },
      { key: 'employees', path: '/admin/employees',  label: 'Funcionários',  icon: EmployeesIcon,  description: 'Equipe de montagem' },
    ]},
    { label: 'FERRAMENTAS', items: [
      { key: 'ceniq',    path: '/admin/ceniq',    label: 'Ceniq IA',      icon: CeniqIcon,    description: 'Design de stands com IA' },
    ]},
    { label: 'SISTEMA', items: [{ key: 'settings', path: '/admin/settings', label: 'Configurações', icon: SettingsIcon, description: 'Perfil e API' }] },
  ];

  const sections = allSections
    .map(s => ({ ...s, items: s.items.filter(i => visibleKeys.includes(i.key)) }))
    .filter(s => s.items.length > 0);

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-60 z-50 flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:z-40`}
        style={{
          background: 'linear-gradient(180deg, #4a0303 0%, #710505 40%, #5c0404 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
          <Link to="/admin" onClick={onClose} className="flex items-center gap-3 group min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shadow-lg">
              <img src="/LOGO.png" alt="BGA" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate font-outer-sans">BGA STANDS</p>
              <p className="text-red-300/70 text-[10px] font-outer-sans">Painel Admin</p>
            </div>
          </Link>
          <button onClick={onClose} className="md:hidden text-red-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Status badge ── */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></span>
            <span className="text-[11px] font-semibold text-red-200 font-outer-sans">Administrador · Online</span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
          {sections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-3' : ''}>
              {section.label && (
                <p className="text-[9px] font-bold text-red-300/40 uppercase tracking-widest px-3 mb-1.5 font-outer-sans">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} onClick={onClose}
                    className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150
                      ${active
                        ? 'bg-gradient-to-r from-amber-500/80 to-amber-600/80 text-white shadow-md shadow-black/20'
                        : 'text-red-200/80 hover:bg-white/8 hover:text-white'
                      }`}
                  >
                    {active && <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-amber-300 rounded-r-full" />}

                    <div className={`relative z-10 flex-shrink-0 transition-transform duration-150
                      ${active ? 'text-white' : 'text-red-300 group-hover:text-white group-hover:scale-110'}`}>
                      <item.icon />
                    </div>

                    <div className="flex-1 min-w-0 relative z-10">
                      <div className={`text-[13px] font-semibold truncate font-outer-sans leading-tight
                        ${active ? 'text-white' : 'text-red-100'}`}>
                        {item.label}
                      </div>
                      <div className={`text-[10px] truncate font-outer-sans leading-tight
                        ${active ? 'text-amber-100/80' : 'text-red-400/60'}`}>
                        {item.description}
                      </div>
                    </div>

                    {active && (
                      <svg className="w-3 h-3 text-amber-200 flex-shrink-0 relative z-10" fill="currentColor" viewBox="0 0 20 20">
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
            onClick={openProfile}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors group"
          >
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center flex-shrink-0 ring-2 ring-white/10 group-hover:ring-amber-400/40 transition-all">
              {user?.avatar
                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                : <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
              }
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="text-[11px] text-red-200 font-semibold truncate font-outer-sans">{user?.name || 'Administrador'}</p>
            </div>
            <svg className="w-3.5 h-3.5 text-red-400/50 group-hover:text-red-300 flex-shrink-0 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            {/* Avatar */}
            <div className="flex flex-col items-center mb-5">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-20 h-20 rounded-full overflow-hidden bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center cursor-pointer ring-4 ring-amber-100 hover:ring-amber-300 transition-all relative group"
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

            {/* Name */}
            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1.5">Nome</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-amber-400 focus:outline-none text-sm font-outer-sans transition-colors"
                placeholder="Seu nome"
              />
            </div>

            {/* Buttons */}
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
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold font-outer-sans text-sm hover:from-amber-600 hover:to-amber-700 transition-all shadow-md disabled:opacity-60"
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
