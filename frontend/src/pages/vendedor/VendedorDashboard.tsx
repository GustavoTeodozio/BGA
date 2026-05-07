import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/auth.store';
import { UserAvatar } from '../../components/UserAvatar';
import { VendedorSidebar } from '../../components/vendedor/VendedorSidebar';
import { VendedorHome } from './VendedorHome';
import { VendedorClients } from './VendedorClients';
import { VendedorNotes } from './VendedorNotes';
import { VendedorBudgets } from './VendedorBudgets';
import { VendedorSales } from './VendedorSales';
import { VendedorStands } from './VendedorStands';
import { CRMPipeline } from '../admin/CRMPipeline';
import { CRMAgenda } from '../admin/CRMAgenda';

const PAGE_TITLES: Record<string, string> = {
  '/vendedor':            'Dashboard',
  '/vendedor/crm':        'CRM Pipeline',
  '/vendedor/crm-agenda': 'Agenda CRM',
  '/vendedor/clients':    'Clientes',
  '/vendedor/notes':      'Anotações',
  '/vendedor/budgets':    'Orçamentos',
  '/vendedor/sales':      'Vendas',
  '/vendedor/stands':     'Stands',
};

const s = { className: 'w-[18px] h-[18px]', fill: 'none' as const, stroke: 'currentColor', viewBox: '0 0 24 24' };
const p = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 2 };

const PAGE_ICONS: Record<string, JSX.Element> = {
  '/vendedor':            <svg {...s}><path {...p} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
  '/vendedor/crm':        <svg {...s}><path {...p} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>,
  '/vendedor/crm-agenda': <svg {...s}><path {...p} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  '/vendedor/clients':    <svg {...s}><path {...p} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  '/vendedor/notes':      <svg {...s}><path {...p} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  '/vendedor/budgets':    <svg {...s}><path {...p} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>,
  '/vendedor/sales':      <svg {...s}><path {...p} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  '/vendedor/stands':     <svg {...s}><path {...p} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
};

export function VendedorDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const getPageInfo = () => {
    const path = location.pathname;
    // Exact match first
    if (PAGE_TITLES[path]) return { title: PAGE_TITLES[path], icon: PAGE_ICONS[path] };
    // Prefix match (longest first)
    const match = Object.keys(PAGE_TITLES)
      .filter(k => k !== '/vendedor' && path.startsWith(k))
      .sort((a, b) => b.length - a.length)[0];
    if (match) return { title: PAGE_TITLES[match], icon: PAGE_ICONS[match] };
    return { title: 'Dashboard', icon: PAGE_ICONS['/vendedor'] };
  };

  const { title: pageTitle, icon: pageIcon } = getPageInfo();

  return (
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: '#f8fafc' }}>

      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `
          linear-gradient(to right, rgba(26,54,93,0.035) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(26,54,93,0.035) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px',
      }} />

      <VendedorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content — offset by sidebar width (w-60 = 240px) */}
      <div className="flex-1 md:ml-60 relative min-w-0 flex flex-col">

        {/* ── Top bar ── */}
        <header className="sticky top-0 z-30 border-b border-gray-200/80"
          style={{ background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div className="flex items-center justify-between h-14 px-3 md:px-5 gap-3">

            {/* Left: hamburger + page title */}
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Hamburger mobile */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors flex-shrink-0"
                aria-label="Abrir menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              {/* Page icon + title */}
              <div className="hidden md:flex items-center gap-2 min-w-0">
                <span className="text-gray-500 flex-shrink-0">{pageIcon}</span>
                <div className="w-px h-4 bg-gray-200 flex-shrink-0" />
                <h2 className="text-[15px] font-semibold text-gray-800 font-outer-sans truncate">{pageTitle}</h2>
              </div>
              <h2 className="md:hidden text-[15px] font-semibold text-gray-800 font-outer-sans truncate">{pageTitle}</h2>
            </div>

            {/* Right: user chip + logout */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {user && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-blue-100 bg-blue-50/80">
                  <UserAvatar size={6} />
                  <span className="text-[13px] font-medium text-gray-700 font-outer-sans max-w-[120px] truncate">{user.name}</span>
                  <span className="text-[10px] text-blue-400 font-outer-sans border-l border-blue-200 pl-2">Vendedor</span>
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

        {/* ── Page content ── */}
        <main className="flex-1 relative py-5 px-3 md:py-8 md:px-6">
          <Routes>
            <Route index element={<VendedorHome />} />
            <Route path="crm" element={<CRMPipeline />} />
            <Route path="crm-agenda" element={<CRMAgenda />} />
            <Route path="clients" element={<VendedorClients />} />
            <Route path="notes" element={<VendedorNotes />} />
            <Route path="budgets" element={<VendedorBudgets />} />
            <Route path="sales" element={<VendedorSales />} />
            <Route path="stands" element={<VendedorStands />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
