import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { UserAvatar } from '../../components/UserAvatar';
import { ProjetistaSidebar } from '../../components/projetista/ProjetistaSidebar';
import { ProjetistaHome } from './ProjetistaHome';
import { ProjetistaNotes } from './ProjetistaNotes';
import { ProjetistaProjects } from './ProjetistaProjects';
import { BgaIA } from '../client/BgaIA';

const PAGE_TITLES: Record<string, string> = {
  '/projetista':          'Dashboard',
  '/projetista/notes':    'Anotações',
  '/projetista/projects': 'Projetos',
  '/projetista/ceniq':    'Ceniq IA',
};

const s = { className: 'w-[18px] h-[18px]', fill: 'none' as const, stroke: 'currentColor', viewBox: '0 0 24 24' };
const p = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 2 };

const PAGE_ICONS: Record<string, JSX.Element> = {
  '/projetista':          <svg {...s}><path {...p} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  '/projetista/notes':    <svg {...s}><path {...p} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  '/projetista/projects': <svg {...s}><path {...p} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  '/projetista/ceniq':    <svg {...s}><path {...p} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
};

export function ProjetistaDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const getPageInfo = () => {
    const path = location.pathname;
    if (PAGE_TITLES[path]) return { title: PAGE_TITLES[path], icon: PAGE_ICONS[path] };
    const match = Object.keys(PAGE_TITLES)
      .filter(k => k !== '/projetista' && path.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    if (match) return { title: PAGE_TITLES[match], icon: PAGE_ICONS[match] };
    return { title: 'Dashboard', icon: PAGE_ICONS['/projetista'] };
  };

  const { title: pageTitle, icon: pageIcon } = getPageInfo();

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: '#f8fafc' }}>

      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(to right, rgba(26,54,93,0.035) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(26,54,93,0.035) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }} />

      <ProjetistaSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 md:ml-60 relative min-w-0 flex flex-col">

        <header className="sticky top-0 z-30 border-b border-gray-200/80"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between h-14 px-3 md:px-5 gap-3">

            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Abrir menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div className="hidden md:flex items-center gap-2 min-w-0">
                <span className="text-gray-500 flex-shrink-0">{pageIcon}</span>
                <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
                <h2 className="text-[15px] font-semibold text-gray-800 font-outer-sans truncate">{pageTitle}</h2>
              </div>
              <h2 className="md:hidden text-[15px] font-semibold text-gray-800 font-outer-sans truncate">{pageTitle}</h2>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-100 bg-purple-50/80">
                  <UserAvatar size={6} />
                  <span className="text-[13px] font-medium text-gray-700 font-outer-sans max-w-[120px] truncate">{user.name}</span>
                  <span className="text-[10px] text-purple-400 font-outer-sans border-l border-purple-200 pl-2">Projetista</span>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[13px] font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 border border-transparent hover:border-red-100 transition-all duration-150 font-outer-sans"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 relative py-5 px-3 md:py-8 md:px-6">
          <Routes>
            <Route index element={<ProjetistaHome />} />
            <Route path="notes" element={<ProjetistaNotes />} />
            <Route path="projects" element={<ProjetistaProjects />} />
            <Route path="ceniq" element={<BgaIA endpoint="/projetista/ceniq" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
