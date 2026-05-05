import { Link, useLocation } from 'react-router-dom';
import { UserAvatar } from '../UserAvatar';

interface ProjetistaSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProjetistaSidebar({ isOpen, onClose }: ProjetistaSidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/projetista') return location.pathname === '/projetista';
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const DashboardIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );

  const NotesIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const ProjectsIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );

  const CeniqIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  );

  const sections = [
    { label: null,        items: [{ path: '/projetista',          label: 'Dashboard', icon: DashboardIcon, description: 'Visão geral' }] },
    { label: 'TRABALHO',  items: [
      { path: '/projetista/notes',    label: 'Anotações', icon: NotesIcon,    description: 'Suas anotações' },
      { path: '/projetista/projects', label: 'Projetos',  icon: ProjectsIcon, description: 'Gerenciar projetos' },
    ]},
    { label: 'FERRAMENTAS', items: [
      { path: '/projetista/ceniq', label: 'Ceniq IA', icon: CeniqIcon, description: 'Design de stands com IA' },
    ]},
  ];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={onClose} />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-60 z-50 flex flex-col transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:z-40`}
        style={{
          background: 'linear-gradient(180deg, #2d1648 0%, #4a1d6a 40%, #3d1759 100%)',
          boxShadow: '4px 0 24px rgba(0,0,0,0.25)',
        }}
      >
        {/* ── Logo ── */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/8">
          <Link to="/projetista" onClick={onClose} className="flex items-center gap-3 group min-w-0">
            <div className="flex-shrink-0 w-9 h-9 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center shadow-lg">
              <img src="/LOGO.png" alt="BGA" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }} />
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-sm leading-tight truncate font-outer-sans">BGA STANDS</p>
              <p className="text-purple-300/70 text-[10px] font-outer-sans">Painel Projetista</p>
            </div>
          </Link>
          <button onClick={onClose} className="md:hidden text-purple-300 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Status badge ── */}
        <div className="px-4 pt-3 pb-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse flex-shrink-0"></span>
            <span className="text-[11px] font-semibold text-purple-200 font-outer-sans">Projetista · Online</span>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto space-y-0.5">
          {sections.map((section, si) => (
            <div key={si} className={si > 0 ? 'mt-3' : ''}>
              {section.label && (
                <p className="text-[9px] font-bold text-purple-300/40 uppercase tracking-widest px-3 mb-1.5 font-outer-sans">
                  {section.label}
                </p>
              )}
              {section.items.map((item) => {
                const active = isActive(item.path);
                return (
                  <Link key={item.path} to={item.path} onClick={onClose}
                    className={`group relative flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150
                      ${active
                        ? 'bg-gradient-to-r from-purple-500/80 to-purple-600/80 text-white shadow-md shadow-black/20'
                        : 'text-purple-200/80 hover:bg-white/8 hover:text-white'
                      }`}
                  >
                    {active && <div className="absolute left-0 top-1 bottom-1 w-0.5 bg-purple-300 rounded-r-full" />}

                    <div className={`relative z-10 flex-shrink-0 transition-transform duration-150
                      ${active ? 'text-white' : 'text-purple-300 group-hover:text-white group-hover:scale-110'}`}>
                      <item.icon />
                    </div>

                    <div className="flex-1 min-w-0 relative z-10">
                      <div className={`text-[13px] font-semibold truncate font-outer-sans leading-tight
                        ${active ? 'text-white' : 'text-purple-100'}`}>
                        {item.label}
                      </div>
                      <div className={`text-[10px] truncate font-outer-sans leading-tight
                        ${active ? 'text-purple-100/80' : 'text-purple-400/60'}`}>
                        {item.description}
                      </div>
                    </div>

                    {active && (
                      <svg className="w-3 h-3 text-purple-200 flex-shrink-0 relative z-10" fill="currentColor" viewBox="0 0 20 20">
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
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5">
            <UserAvatar size={6} />
            <div className="min-w-0 flex-1">
              <p className="text-[11px] text-purple-200 font-semibold truncate font-outer-sans">Projetista</p>
              <p className="text-[10px] text-purple-400/60 font-outer-sans">Acesso ao projeto</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
