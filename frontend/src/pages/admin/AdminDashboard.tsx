import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { AdminSidebar } from '../../components/admin/AdminSidebar';
import { AdminDashboardHome } from './AdminDashboardHome';
import { KanbanBoard } from './KanbanBoard';
import { ClientManagement } from './ClientManagement';
import { ClientDetails } from './ClientDetails';
import { Settings } from './Settings';
import { AdminNotes } from './AdminNotes';
import { AdminBudgets } from './AdminBudgets';
import { AdminProjects } from './AdminProjects';
import { TeamManagement } from './TeamManagement';
import { CRMPipeline } from './CRMPipeline';
import { CRMAgenda } from './CRMAgenda';
import { BgaIA } from '../client/BgaIA';
import { StandManagement } from './StandManagement';
import { AdminEmployees } from './AdminEmployees';

const PAGE_TITLES: Record<string, string> = {
  '/admin':               'Dashboard',
  '/admin/kanban':        'Kanban',
  '/admin/stand':         'Acompanhamento de Stand',
  '/admin/crm':           'Pipeline',
  '/admin/crm-agenda':    'Agenda',
  '/admin/clients':       'Clientes',
  '/admin/notes':         'Anotações',
  '/admin/budgets':       'Orçamentos',
  '/admin/projects':      'Projetos',
  '/admin/team':          'Equipe',
  '/admin/employees':     'Funcionários',
  '/admin/ceniq':         'Ceniq IA',
  '/admin/settings':      'Configurações',
};

const s = { className: 'w-[18px] h-[18px]', fill: 'none' as const, stroke: 'currentColor', viewBox: '0 0 24 24' };
const p = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 2 };

const PAGE_ICONS: Record<string, JSX.Element> = {
  '/admin':            <svg {...s}><path {...p} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  '/admin/kanban':     <svg {...s}><path {...p} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v7a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v12a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 17a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1v-2z" /></svg>,
  '/admin/stand':      <svg {...s}><path {...p} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  '/admin/crm':        <svg {...s}><path {...p} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  '/admin/crm-agenda': <svg {...s}><path {...p} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  '/admin/clients':    <svg {...s}><path {...p} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  '/admin/notes':      <svg {...s}><path {...p} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  '/admin/budgets':    <svg {...s}><path {...p} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  '/admin/projects':   <svg {...s}><path {...p} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  '/admin/team':       <svg {...s}><path {...p} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  '/admin/employees':  <svg {...s}><path {...p} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6a4 4 0 11-8 0 4 4 0 018 0zM12 21a21.968 21.968 0 01-7.5-1.325" /></svg>,
  '/admin/ceniq':      <svg {...s}><path {...p} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>,
  '/admin/settings':   <svg {...s}><path {...p} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path {...p} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
};

export function AdminDashboard() {
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
      .filter(k => k !== '/admin' && path.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    if (match) return { title: PAGE_TITLES[match], icon: PAGE_ICONS[match] };
    return { title: 'Dashboard', icon: PAGE_ICONS['/admin'] };
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

      <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

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
            <Route index element={<AdminDashboardHome />} />
            <Route path="kanban" element={<KanbanBoard />} />
            <Route path="stand" element={<StandManagement />} />
            <Route path="crm" element={<CRMPipeline />} />
            <Route path="crm-agenda" element={<CRMAgenda />} />
            <Route path="clients" element={<ClientManagement />} />
            <Route path="clients/:clientId" element={<ClientDetails />} />
            <Route path="notes" element={<AdminNotes />} />
            <Route path="budgets" element={<AdminBudgets />} />
            <Route path="projects" element={<AdminProjects />} />
            <Route path="team" element={<TeamManagement />} />
            <Route path="employees" element={<AdminEmployees />} />
            <Route path="ceniq" element={<BgaIA endpoint="/admin/ceniq" />} />
            <Route path="settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
