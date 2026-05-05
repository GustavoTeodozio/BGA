import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { useDialog } from '../../components/ConfirmDialog';

const ROLE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Administrador', color: 'text-wine-700', bg: 'bg-wine-100' },
  VENDEDOR: { label: 'Vendedor', color: 'text-blue-700', bg: 'bg-blue-100' },
  PROJETISTA: { label: 'Projetista', color: 'text-purple-700', bg: 'bg-purple-100' },
  CLIENT: { label: 'Cliente', color: 'text-green-700', bg: 'bg-green-100' },
};

export function TeamManagement() {
  const { alert } = useDialog();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'VENDEDOR' });

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin', 'users'],
    queryFn: async () => { const r = await api.get('/admin/users'); return r.data; },
  });

  const createMut = useMutation({
    mutationFn: (data: any) => api.post('/admin/admins', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin', 'users'] }); setShowModal(false); },
    onError: (err: any) => alert({ title: 'Erro', message: err.response?.data?.message || 'Erro ao criar usuário', type: 'alert' }),
  });

  const teamMembers = users.filter((u: any) => u.role !== 'CLIENT');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMut.mutate(form);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-6">
        <div>
          <p className="text-gray-500 text-sm font-outer-sans">Gerencie vendedores, projetistas e administradores</p>
        </div>
        <button onClick={() => { setForm({ name: '', email: '', password: '', role: 'VENDEDOR' }); setShowModal(true); }}
          className="px-4 py-2.5 bg-gradient-to-r from-wine-500 to-wine-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg hover:shadow-wine-500/25 transition-all duration-200 flex items-center gap-2 font-outer-sans whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Novo Membro
        </button>
      </div>

      {/* Role summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { role: 'ADMIN',      icon: <svg className="w-6 h-6 text-wine-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg> },
          { role: 'VENDEDOR',   icon: <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg> },
          { role: 'PROJETISTA', icon: <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> },
        ].map((r) => {
          const count = teamMembers.filter((u: any) => u.role === r.role).length;
          return (
            <div key={r.role} className="stat-card">
              <div className="relative z-10 flex items-center gap-3">
                {r.icon}
                <div>
                  <p className="text-2xl font-bold text-gray-800 font-outer-sans">{count}</p>
                  <p className="text-xs text-gray-500 font-outer-sans">{ROLE_MAP[r.role].label}(s)</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[200px]"><div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-wine-600"></div></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map((u: any) => (
            <div key={u.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${
                  u.role === 'ADMIN' ? 'from-wine-500 to-wine-600' :
                  u.role === 'VENDEDOR' ? 'from-blue-500 to-blue-600' :
                  'from-purple-500 to-purple-600'
                } flex items-center justify-center text-white text-sm font-bold`}>
                  {u.name?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-800 text-sm font-outer-sans truncate">{u.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{u.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_MAP[u.role]?.bg} ${ROLE_MAP[u.role]?.color}`}>
                  {ROLE_MAP[u.role]?.label}
                </span>
                <span className={`text-xs ${u.isActive ? 'text-green-500' : 'text-red-500'}`}>
                  {u.isActive ? '● Ativo' : '● Inativo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-800 font-outer-sans">Novo Membro da Equipe</h2>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Nome *</label>
                  <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Senha *</label>
                  <input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 font-outer-sans">Função *</label>
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans">
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="PROJETISTA">Projetista</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>
              </div>
              <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 font-outer-sans">Cancelar</button>
                <button type="submit" disabled={createMut.isPending}
                  className="px-6 py-2.5 bg-gradient-to-r from-wine-500 to-wine-600 text-white rounded-xl text-sm font-semibold hover:shadow-lg transition-all duration-200 font-outer-sans disabled:opacity-50">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
