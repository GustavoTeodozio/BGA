import { useState, useEffect } from 'react';
import api from '../../api/client';
import { useToast } from '../../hooks/useToast';
import { useAuthStore } from '../../store/auth.store';

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  lastLoginAt?: string | null;
}

const ROLE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  ADMIN: { label: 'Admin', color: 'text-wine-700', bg: 'bg-wine-100' },
  VENDEDOR: { label: 'Vendedor', color: 'text-blue-700', bg: 'bg-blue-100' },
  PROJETISTA: { label: 'Projetista', color: 'text-green-700', bg: 'bg-green-100' },
  CLIENT: { label: 'Cliente', color: 'text-gray-700', bg: 'bg-gray-100' },
};

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'VENDEDOR', label: 'Vendedor' },
  { value: 'PROJETISTA', label: 'Projetista' },
];

const UserPlusIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
  </svg>
);

const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const AlertIcon = () => (
  <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const EMPTY_FORM = { name: '', email: '', password: '', role: 'VENDEDOR' };

export function AdminManagement() {
  const { success, error: showError } = useToast();
  const { user: currentUser } = useAuthStore();
  const [users, setUsers] = useState<TeamUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<TeamUser | null>(null);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users');
      setUsers(Array.isArray(response.data) ? response.data : []);
    } catch (err: any) {
      setUsers([]);
      showError(err.response?.data?.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const response = await api.post('/admin/admins', formData);
      success(`${ROLE_OPTIONS.find(r => r.value === formData.role)?.label} criado com sucesso!`);
      setUsers([response.data, ...users]);
      setShowForm(false);
      setFormData(EMPTY_FORM);
    } catch (err: any) {
      const data = err.response?.data;
      const msg = data?.errors?.map((e: any) => e.message).join(', ') || data?.message || 'Erro ao criar usuário';
      showError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (u: TeamUser) => {
    setUserToDelete(u);
    setShowDeleteModal(true);
    setConfirmationCode('');
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete || confirmationCode !== '2112') {
      showError('Código de confirmação inválido.');
      return;
    }
    try {
      await api.delete(`/admin/admins/${userToDelete.id}`, { data: { confirmationCode: '2112' } });
      success('Usuário removido com sucesso!');
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Erro ao remover usuário');
    }
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR');

  const filteredUsers = filterRole === 'ALL'
    ? users.filter(u => u.role !== 'CLIENT')
    : users.filter(u => u.role === filterRole);

  const counts = {
    ALL: users.filter(u => u.role !== 'CLIENT').length,
    ADMIN: users.filter(u => u.role === 'ADMIN').length,
    VENDEDOR: users.filter(u => u.role === 'VENDEDOR').length,
    PROJETISTA: users.filter(u => u.role === 'PROJETISTA').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800 font-outer-sans">Equipe</h3>
          <p className="text-sm text-gray-500 font-outer-sans mt-0.5">Admins, vendedores e projetistas</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setFormData(EMPTY_FORM); }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-wine-600 hover:bg-wine-700 text-white text-sm font-semibold rounded-lg transition-colors font-outer-sans shadow"
        >
          <UserPlusIcon />
          Novo Usuário
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {(['ALL', 'ADMIN', 'VENDEDOR', 'PROJETISTA'] as const).map(role => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors font-outer-sans ${
              filterRole === role
                ? 'bg-wine-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {role === 'ALL' ? 'Todos' : ROLE_MAP[role].label} ({counts[role]})
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-gray-800 font-outer-sans">Novo Usuário</h4>
            <button
              onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); }}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-2 font-outer-sans">Tipo de usuário</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormData(f => ({ ...f, role: opt.value }))}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all font-outer-sans ${
                      formData.role === opt.value
                        ? 'bg-wine-600 text-white border-wine-600 shadow'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-wine-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Nome completo</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                  placeholder="Nome do usuário"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                  placeholder="email@exemplo.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">Senha</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                placeholder="Mínimo 6 caracteres"
                required
                minLength={6}
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => { setShowForm(false); setFormData(EMPTY_FORM); }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors font-outer-sans"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-wine-600 hover:bg-wine-700 text-white rounded-lg text-sm font-semibold transition-colors font-outer-sans disabled:opacity-60"
              >
                {saving ? 'Criando...' : `Criar ${ROLE_OPTIONS.find(r => r.value === formData.role)?.label}`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="text-center py-10">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-wine-600"></div>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <p className="text-gray-400 font-outer-sans text-sm">Nenhum usuário nesta categoria</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase font-outer-sans">Usuário</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase font-outer-sans hidden sm:table-cell">E-mail</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase font-outer-sans">Tipo</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-500 text-xs uppercase font-outer-sans hidden md:table-cell">Criado em</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                          u.role === 'ADMIN' ? 'bg-gradient-to-br from-wine-500 to-wine-700' :
                          u.role === 'VENDEDOR' ? 'bg-gradient-to-br from-blue-500 to-blue-700' :
                          'bg-gradient-to-br from-green-500 to-green-700'
                        }`}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 font-outer-sans text-sm truncate">{u.name}</p>
                          <p className="text-xs text-gray-400 font-outer-sans sm:hidden truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-500 font-outer-sans hidden sm:table-cell">{u.email}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-semibold font-outer-sans ${ROLE_MAP[u.role]?.bg} ${ROLE_MAP[u.role]?.color}`}>
                        {ROLE_MAP[u.role]?.label || u.role}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs font-outer-sans hidden md:table-cell">{formatDate(u.createdAt)}</td>
                    <td className="py-3 px-4 text-right">
                      {u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteClick(u)}
                          className="text-gray-300 hover:text-wine-600 transition-colors p-1"
                          title="Remover usuário"
                        >
                          <TrashIcon />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-start gap-4 mb-4">
              <AlertIcon />
              <div>
                <h3 className="text-lg font-bold text-gray-900 font-outer-sans mb-1">Remover usuário</h3>
                <p className="text-sm text-gray-600 font-outer-sans">
                  Remover <strong>{userToDelete.name}</strong> ({ROLE_MAP[userToDelete.role]?.label})?
                  O acesso será revogado imediatamente.
                </p>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-gray-600 mb-1 font-outer-sans">
                Código de confirmação
              </label>
              <input
                type="password"
                value={confirmationCode}
                onChange={e => setConfirmationCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-wine-300 font-outer-sans"
                placeholder="••••"
                maxLength={4}
                autoFocus
              />
              <p className="text-xs text-gray-400 mt-1 font-outer-sans">Digite o código de segurança para confirmar</p>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setShowDeleteModal(false); setUserToDelete(null); }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors font-outer-sans"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={confirmationCode !== '2112'}
                className="px-4 py-2 bg-wine-600 hover:bg-wine-700 text-white rounded-lg text-sm font-semibold transition-colors font-outer-sans disabled:opacity-40"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
