import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

// ── Types ─────────────────────────────────────────────────────────────────

interface EmployeeAttendance {
  id: string;
  employeeId: string;
  date: string;
  present: boolean;
  notes?: string | null;
}

interface EmployeeAdvance {
  id: string;
  employeeId: string;
  amount: string;
  date: string;
  notes?: string | null;
  createdAt: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  phone?: string | null;
  cpf?: string | null;
  rg?: string | null;
  birthDate?: string | null;
  address?: string | null;
  email?: string | null;
  dailyRate: string;
  notes?: string | null;
  photoUrl?: string | null;
  docFrontUrl?: string | null;
  docBackUrl?: string | null;
  createdAt: string;
  attendances: EmployeeAttendance[];
  advances: EmployeeAdvance[];
}

// ── Helpers ───────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  role: '',
  phone: '',
  cpf: '',
  rg: '',
  birthDate: '',
  address: '',
  email: '',
  dailyRate: '0',
  notes: '',
};

const EMPTY_ADVANCE = { amount: '', date: '', notes: '' };

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return d.toLocaleDateString('pt-BR');
}

function currentMonthYear() {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function exportPresencasCSV(employees: Employee[], month: number, year: number) {
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const monthLabel = `${String(month).padStart(2, '0')}/${year}`;

  const getPresent = (emp: Employee, day: number): boolean => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const att = emp.attendances.find((a) => {
      const d = new Date(a.date);
      const aStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      return aStr === dateStr;
    });
    return att?.present === true;
  };

  const dayHeaders = days.map((d) => `Dia ${d}`).join(';');
  const header = `Funcionario;Cargo;Diaria;${dayHeaders};Total Dias;Bruto;Vales;A Receber`;

  const rows = employees.map((emp) => {
    const dailyRate = parseFloat(emp.dailyRate) || 0;
    const dayCols = days.map((d) => (getPresent(emp, d) ? 'P' : '')).join(';');
    const presentTotal = days.filter((d) => getPresent(emp, d)).length;
    const monthAdvances = emp.advances
      .filter((adv) => {
        const d = new Date(adv.date);
        return d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;
      })
      .reduce((sum, adv) => sum + parseFloat(String(adv.amount)), 0);
    const gross = presentTotal * dailyRate;
    const net = gross - monthAdvances;

    const fmt = (v: number) => v.toFixed(2).replace('.', ',');

    return [
      emp.name,
      emp.role || '',
      fmt(dailyRate),
      dayCols,
      presentTotal,
      fmt(gross),
      fmt(monthAdvances),
      fmt(net),
    ].join(';');
  });

  const csv = '﻿' + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `presencas_${monthLabel.replace('/', '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function calcStats(emp: Employee, month: number, year: number) {
  const presentDays = emp.attendances.filter((a) => {
    const d = new Date(a.date);
    return a.present && d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;
  }).length;

  const totalAdvances = emp.advances
    .filter((a) => {
      const d = new Date(a.date);
      return d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;
    })
    .reduce((sum, a) => sum + Number(a.amount), 0);

  const toReceive = presentDays * Number(emp.dailyRate) - totalAdvances;
  return { presentDays, totalAdvances, toReceive };
}

const MONTH_NAMES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

// ── Icons ─────────────────────────────────────────────────────────────────

const s = { className: 'w-[18px] h-[18px]', fill: 'none' as const, stroke: 'currentColor', viewBox: '0 0 24 24' };
const p = { strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, strokeWidth: 2 };

// ── Employee Form Modal ────────────────────────────────────────────────────

interface EmployeeModalProps {
  employee: Employee | null;
  onClose: () => void;
  onSaved: () => void;
}

function EmployeeModal({ employee, onClose, onSaved }: EmployeeModalProps) {
  const [form, setForm] = useState({
    ...EMPTY_FORM,
    ...(employee
      ? {
          name: employee.name,
          role: employee.role,
          phone: employee.phone || '',
          cpf: employee.cpf || '',
          rg: employee.rg || '',
          birthDate: employee.birthDate ? employee.birthDate.split('T')[0] : '',
          address: employee.address || '',
          email: employee.email || '',
          dailyRate: employee.dailyRate,
          notes: employee.notes || '',
        }
      : {}),
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Nome é obrigatório.'); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        dailyRate: Number(form.dailyRate) || 0,
        birthDate: form.birthDate || null,
        email: form.email || null,
        phone: form.phone || null,
        cpf: form.cpf || null,
        rg: form.rg || null,
        address: form.address || null,
        notes: form.notes || null,
      };
      if (employee) {
        await api.patch(`/admin/employees/${employee.id}`, payload);
      } else {
        await api.post('/admin/employees', payload);
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar funcionário.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-800 font-outer-sans">
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h3>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <svg {...s}><path {...p} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-outer-sans">{error}</div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Nome *</label>
              <input
                value={form.name}
                onChange={set('name')}
                required
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans transition-colors"
                placeholder="Nome completo"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Cargo *</label>
              <input
                value={form.role}
                onChange={set('role')}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans transition-colors"
                placeholder="Ex: Montador, Eletricista"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Telefone</label>
              <input
                value={form.phone}
                onChange={set('phone')}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans transition-colors"
                placeholder="(11) 99999-9999"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">CPF</label>
              <input
                value={form.cpf}
                onChange={set('cpf')}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans transition-colors"
                placeholder="000.000.000-00"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">RG</label>
              <input
                value={form.rg}
                onChange={set('rg')}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans transition-colors"
                placeholder="00.000.000-0"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Data de Nascimento</label>
              <input
                type="date"
                value={form.birthDate}
                onChange={set('birthDate')}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={set('email')}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans transition-colors"
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Diária (R$)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.dailyRate}
                onChange={set('dailyRate')}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans transition-colors"
                placeholder="0,00"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Endereço</label>
              <input
                value={form.address}
                onChange={set('address')}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans transition-colors"
                placeholder="Rua, número, bairro, cidade"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Observações</label>
              <textarea
                value={form.notes}
                onChange={set('notes')}
                rows={3}
                className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans transition-colors resize-none"
                placeholder="Observações gerais..."
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold font-outer-sans text-sm hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-xl bg-wine-600 hover:bg-wine-700 text-white font-semibold font-outer-sans text-sm transition-all shadow-md disabled:opacity-60"
            >
              {saving ? 'Salvando...' : employee ? 'Salvar Alterações' : 'Criar Funcionário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Tab: Funcionários ─────────────────────────────────────────────────────

interface TabFuncionariosProps {
  employees: Employee[];
  month: number;
  year: number;
  onEdit: (emp: Employee) => void;
  onDelete: (emp: Employee) => void;
  onNew: () => void;
}

function TabFuncionarios({ employees, month, year, onEdit, onDelete, onNew }: TabFuncionariosProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500 font-outer-sans">{employees.length} funcionário(s) cadastrado(s)</p>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-wine-600 hover:bg-wine-700 text-white text-sm font-semibold font-outer-sans transition-all shadow-sm"
        >
          <svg {...s}><path {...p} d="M12 4v16m8-8H4" /></svg>
          Novo Funcionário
        </button>
      </div>

      {employees.length === 0 ? (
        <div className="text-center py-16 text-gray-400 font-outer-sans">
          <svg className="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <p className="text-sm">Nenhum funcionário cadastrado.</p>
          <p className="text-xs mt-1">Clique em "Novo Funcionário" para começar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const { presentDays, totalAdvances, toReceive } = calcStats(emp, month, year);
            return (
              <div
                key={emp.id}
                className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                onClick={() => onEdit(emp)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-wine-600 to-wine-700 flex items-center justify-center flex-shrink-0">
                      {emp.photoUrl
                        ? <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" />
                        : <span className="text-white font-bold text-sm font-outer-sans">{emp.name.charAt(0).toUpperCase()}</span>
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 font-outer-sans truncate">{emp.name}</p>
                      <p className="text-xs text-gray-500 font-outer-sans truncate">{emp.role || 'Sem cargo'}</p>
                    </div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(emp); }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-all"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="border-t border-gray-50 pt-3 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-outer-sans">
                    <span className="text-gray-500">Diária</span>
                    <span className="font-semibold text-gray-700">{formatCurrency(Number(emp.dailyRate))}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-outer-sans">
                    <span className="text-gray-500">Dias ({MONTH_NAMES[month - 1]})</span>
                    <span className="font-semibold text-gray-700">{presentDays} dias</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-outer-sans">
                    <span className="text-gray-500">Vales</span>
                    <span className="font-semibold text-red-500">- {formatCurrency(totalAdvances)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs font-outer-sans border-t border-gray-100 pt-1.5 mt-1.5">
                    <span className="text-gray-600 font-semibold">A receber</span>
                    <span className={`font-bold ${toReceive >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(Math.max(0, toReceive))}
                    </span>
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

// ── Tab: Presenças ────────────────────────────────────────────────────────

interface TabPresencasProps {
  employees: Employee[];
  month: number;
  year: number;
  onMonthChange: (m: number, y: number) => void;
}

function TabPresencas({ employees, month, year, onMonthChange }: TabPresencasProps) {
  const qc = useQueryClient();
  const daysInMonth = getDaysInMonth(year, month);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const toggleAttendance = async (employeeId: string, day: number, current: boolean | undefined) => {
    const date = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    try {
      await api.post(`/admin/employees/${employeeId}/attendance`, {
        date,
        present: current === true ? false : true,
      });
      qc.invalidateQueries({ queryKey: ['admin', 'employees'] });
    } catch {
      // silent
    }
  };

  const getPresence = (emp: Employee, day: number): EmployeeAttendance | undefined => {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return emp.attendances.find((a) => {
      const d = new Date(a.date);
      const aStr = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      return aStr === dateStr;
    });
  };

  const prevMonth = () => {
    if (month === 1) onMonthChange(12, year - 1);
    else onMonthChange(month - 1, year);
  };
  const nextMonth = () => {
    if (month === 12) onMonthChange(1, year + 1);
    else onMonthChange(month + 1, year);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-bold text-gray-700 font-outer-sans min-w-[120px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => exportPresencasCSV(employees, month, year)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-green-200 bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors font-outer-sans"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exportar Excel
        </button>
      </div>

      {employees.length === 0 ? (
        <p className="text-center text-sm text-gray-400 font-outer-sans py-12">Nenhum funcionário cadastrado.</p>
      ) : (
        <div className="space-y-3">
          {employees.map((emp) => {
            const presentTotal = emp.attendances.filter((a) => {
              const d = new Date(a.date);
              return a.present && d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;
            }).length;

            const monthAdvances = emp.advances.filter((adv) => {
              const d = new Date(adv.date);
              return d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;
            }).reduce((sum, adv) => sum + adv.amount, 0);
            const grossAmount = presentTotal * (emp.dailyRate || 0);
            const netAmount = grossAmount - monthAdvances;

            return (
              <div key={emp.id} className="bg-white rounded-xl border border-gray-100 p-4">
                {/* Header: nome + totalizador */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-wine-600 flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold font-outer-sans">{emp.name.charAt(0)}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800 font-outer-sans">{emp.name}</p>
                      <p className="text-xs text-gray-400 font-outer-sans">{emp.role || 'Sem cargo'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-outer-sans">Diária</p>
                      <p className="text-xs font-semibold text-gray-600 font-outer-sans">
                        {(emp.dailyRate || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-outer-sans">Dias</p>
                      <p className="text-xs font-bold text-wine-600 font-outer-sans">{presentTotal}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-outer-sans">Vales</p>
                      <p className="text-xs font-semibold text-red-500 font-outer-sans">
                        -{monthAdvances.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-gray-400 font-outer-sans">A receber</p>
                      <p className={`text-sm font-bold font-outer-sans ${netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {netAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Day buttons — scrollable on mobile */}
                <div className="overflow-x-auto pb-1">
                  <div className="flex gap-1 min-w-max">
                    {days.map((day) => {
                      const att = getPresence(emp, day);
                      const isPresent = att?.present === true;
                      const isAbsent = att?.present === false;
                      return (
                        <button
                          key={day}
                          onClick={() => toggleAttendance(emp.id, day, att?.present)}
                          title={`Dia ${day}`}
                          className={`w-7 h-7 rounded-lg text-[11px] font-bold font-outer-sans transition-all border flex-shrink-0
                            ${isPresent
                              ? 'bg-green-500 text-white border-green-500 hover:bg-green-600'
                              : isAbsent
                                ? 'bg-red-100 text-red-500 border-red-200 hover:bg-red-200'
                                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                            }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Cálculo detalhado + legenda */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mt-2">
                  <div className="flex items-center gap-3 text-[10px] text-gray-400 font-outer-sans">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-green-500 inline-block" /> Presente</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-gray-200 inline-block" /> Não marcado</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-outer-sans">
                    {presentTotal} dias × {(emp.dailyRate || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} − vales = <span className={`font-semibold ${netAmount >= 0 ? 'text-green-600' : 'text-red-500'}`}>{netAmount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Tab: Vales ────────────────────────────────────────────────────────────

interface TabValesProps {
  employees: Employee[];
  month: number;
  year: number;
  onMonthChange: (m: number, y: number) => void;
}

function TabVales({ employees, month, year, onMonthChange }: TabValesProps) {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [form, setForm] = useState(EMPTY_ADVANCE);
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const allAdvances = employees.flatMap((emp) =>
    emp.advances
      .filter((a) => {
        const d = new Date(a.date);
        return d.getUTCMonth() + 1 === month && d.getUTCFullYear() === year;
      })
      .map((a) => ({ ...a, employeeName: emp.name }))
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalVales = allAdvances.reduce((sum, a) => sum + Number(a.amount), 0);

  const deleteMut = useMutation({
    mutationFn: (advanceId: string) => api.delete(`/admin/employees/advances/${advanceId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'employees'] }),
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) { setFormError('Selecione um funcionário.'); return; }
    if (!form.amount || Number(form.amount) <= 0) { setFormError('Informe o valor do vale.'); return; }
    if (!form.date) { setFormError('Informe a data.'); return; }
    setSaving(true);
    setFormError('');
    try {
      await api.post(`/admin/employees/${selectedEmployee}/advances`, {
        amount: Number(form.amount),
        date: form.date,
        notes: form.notes || null,
      });
      qc.invalidateQueries({ queryKey: ['admin', 'employees'] });
      setShowModal(false);
      setForm(EMPTY_ADVANCE);
      setSelectedEmployee('');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erro ao registrar vale.');
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => { if (month === 1) onMonthChange(12, year - 1); else onMonthChange(month - 1, year); };
  const nextMonth = () => { if (month === 12) onMonthChange(1, year + 1); else onMonthChange(month + 1, year); };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-bold text-gray-700 font-outer-sans min-w-[120px] text-center">
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-wine-600 hover:bg-wine-700 text-white text-sm font-semibold font-outer-sans transition-all shadow-sm"
        >
          <svg {...s}><path {...p} d="M12 4v16m8-8H4" /></svg>
          Registrar Vale
        </button>
      </div>

      {allAdvances.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
          <span className="text-sm font-semibold text-amber-700 font-outer-sans">Total de vales no mês</span>
          <span className="text-sm font-bold text-amber-700 font-outer-sans">{formatCurrency(totalVales)}</span>
        </div>
      )}

      {allAdvances.length === 0 ? (
        <p className="text-center text-sm text-gray-400 font-outer-sans py-12">Nenhum vale registrado neste mês.</p>
      ) : (
        <div className="space-y-2">
          {allAdvances.map((advance) => (
            <div key={advance.id} className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-800 font-outer-sans">{advance.employeeName}</p>
                <p className="text-xs text-gray-400 font-outer-sans">{formatDate(advance.date)}{advance.notes ? ` · ${advance.notes}` : ''}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-red-600 font-outer-sans">{formatCurrency(Number(advance.amount))}</span>
                <button
                  onClick={() => deleteMut.mutate(advance.id)}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md animate-scale-in">
            <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-800 font-outer-sans">Registrar Vale</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                <svg {...s}><path {...p} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAdd} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-outer-sans">{formError}</div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Funcionário *</label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans"
                >
                  <option value="">Selecione...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Valor (R$) *</label>
                <input
                  type="number" min="0.01" step="0.01"
                  value={form.amount}
                  onChange={(e) => setForm(f => ({ ...f, amount: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Data *</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm(f => ({ ...f, date: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1">Observação</label>
                <input
                  value={form.notes}
                  onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-xl border-2 border-gray-200 focus:border-wine-600 focus:outline-none text-sm font-outer-sans"
                  placeholder="Opcional..."
                />
              </div>
              <div className="flex gap-3 pt-1">
                <button
                  type="button" onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold font-outer-sans text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit" disabled={saving}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-wine-600 hover:bg-wine-700 text-white font-semibold font-outer-sans text-sm disabled:opacity-60"
                >
                  {saving ? 'Salvando...' : 'Registrar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab: Credenciais ──────────────────────────────────────────────────────

interface TabCredenciaisProps {
  employees: Employee[];
  onUploaded: () => void;
}

function TabCredenciais({ employees, onUploaded }: TabCredenciaisProps) {
  const photoRef = useRef<HTMLInputElement>(null);
  const docFrontRef = useRef<HTMLInputElement>(null);
  const docBackRef = useRef<HTMLInputElement>(null);
  const [activeEmp, setActiveEmp] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  const handleUpload = async (employeeId: string, type: 'photo' | 'doc', side?: 'front' | 'back') => {
    let input: HTMLInputElement | null = null;
    if (type === 'photo') input = photoRef.current;
    else if (side === 'front') input = docFrontRef.current;
    else input = docBackRef.current;

    if (!input) return;
    setActiveEmp(employeeId);
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploading(`${employeeId}-${type}-${side ?? ''}`);
      try {
        const fd = new FormData();
        if (type === 'photo') {
          fd.append('photo', file);
          await api.post(`/admin/employees/${employeeId}/photo`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        } else {
          fd.append('doc', file);
          await api.post(`/admin/employees/${employeeId}/doc?side=${side}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        }
        onUploaded();
      } catch {
        // silent
      } finally {
        setUploading(null);
        input!.value = '';
      }
    };
    input.click();
  };

  return (
    <div>
      <input ref={photoRef} type="file" accept="image/*" className="hidden" />
      <input ref={docFrontRef} type="file" accept="image/*,.pdf" className="hidden" />
      <input ref={docBackRef} type="file" accept="image/*,.pdf" className="hidden" />

      {employees.length === 0 ? (
        <p className="text-center text-sm text-gray-400 font-outer-sans py-12">Nenhum funcionário cadastrado.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {employees.map((emp) => {
            const isLoading = (key: string) => uploading === key;
            return (
              <div key={emp.id} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg transition-all duration-200">
                {/* Photo */}
                <div className="flex flex-col items-center mb-4">
                  <div
                    className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-wine-600 to-wine-700 flex items-center justify-center mb-2 ring-2 ring-wine-100 cursor-pointer hover:ring-wine-400 transition-all"
                    onClick={() => handleUpload(emp.id, 'photo')}
                  >
                    {emp.photoUrl
                      ? <img src={emp.photoUrl} alt={emp.name} className="w-full h-full object-cover" />
                      : <span className="text-white font-bold text-xl font-outer-sans">{emp.name.charAt(0).toUpperCase()}</span>
                    }
                  </div>
                  <p className="text-sm font-bold text-gray-800 font-outer-sans text-center">{emp.name}</p>
                  <p className="text-xs text-gray-400 font-outer-sans">{emp.role || 'Sem cargo'}</p>
                </div>

                {/* Credentials */}
                <div className="space-y-1.5 text-xs font-outer-sans border-t border-gray-50 pt-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">CPF</span>
                    <span className="text-gray-700 font-medium">{emp.cpf || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">RG</span>
                    <span className="text-gray-700 font-medium">{emp.rg || '—'}</span>
                  </div>
                </div>

                {/* Document uploads */}
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-outer-sans">Foto</span>
                    <button
                      onClick={() => handleUpload(emp.id, 'photo')}
                      disabled={!!uploading}
                      className={`text-[11px] px-2.5 py-1 rounded-lg font-outer-sans font-semibold transition-colors
                        ${emp.photoUrl ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                      {isLoading(`${emp.id}-photo-`) ? 'Enviando...' : emp.photoUrl ? 'Alterar' : 'Enviar'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-outer-sans">Doc. Frente</span>
                    <div className="flex items-center gap-1">
                      {emp.docFrontUrl && (
                        <a href={emp.docFrontUrl} target="_blank" rel="noreferrer"
                          className="text-[11px] px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-outer-sans font-semibold"
                          onClick={e => e.stopPropagation()}>Ver</a>
                      )}
                      <button
                        onClick={() => handleUpload(emp.id, 'doc', 'front')}
                        disabled={!!uploading}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-outer-sans font-semibold transition-colors
                          ${emp.docFrontUrl ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {isLoading(`${emp.id}-doc-front`) ? 'Enviando...' : emp.docFrontUrl ? 'Alterar' : 'Enviar'}
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-outer-sans">Doc. Verso</span>
                    <div className="flex items-center gap-1">
                      {emp.docBackUrl && (
                        <a href={emp.docBackUrl} target="_blank" rel="noreferrer"
                          className="text-[11px] px-2 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-outer-sans font-semibold"
                          onClick={e => e.stopPropagation()}>Ver</a>
                      )}
                      <button
                        onClick={() => handleUpload(emp.id, 'doc', 'back')}
                        disabled={!!uploading}
                        className={`text-[11px] px-2.5 py-1 rounded-lg font-outer-sans font-semibold transition-colors
                          ${emp.docBackUrl ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                      >
                        {isLoading(`${emp.id}-doc-back`) ? 'Enviando...' : emp.docBackUrl ? 'Alterar' : 'Enviar'}
                      </button>
                    </div>
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

// ── Main Page ─────────────────────────────────────────────────────────────

type TabKey = 'funcionarios' | 'presencas' | 'vales' | 'credenciais';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'funcionarios', label: 'Funcionários' },
  { key: 'presencas', label: 'Presenças' },
  { key: 'vales', label: 'Vales' },
  { key: 'credenciais', label: 'Credenciais' },
];

export function AdminEmployees() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('funcionarios');
  const [showModal, setShowModal] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const { month: curMonth, year: curYear } = currentMonthYear();
  const [month, setMonth] = useState(curMonth);
  const [year, setYear] = useState(curYear);

  const { data: employees = [], isLoading } = useQuery<Employee[]>({
    queryKey: ['admin', 'employees'],
    queryFn: async () => {
      const r = await api.get('/admin/employees');
      return r.data;
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/employees/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'employees'] }),
  });

  const handleEdit = (emp: Employee) => {
    setEditEmployee(emp);
    setShowModal(true);
  };

  const handleNew = () => {
    setEditEmployee(null);
    setShowModal(true);
  };

  const handleDelete = async (emp: Employee) => {
    if (!window.confirm(`Remover o funcionário "${emp.name}"? Esta ação não pode ser desfeita.`)) return;
    deleteMut.mutate(emp.id);
  };

  const handleMonthChange = (m: number, y: number) => {
    setMonth(m);
    setYear(y);
  };

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-100 p-1 flex gap-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 px-3 py-2 rounded-lg text-sm font-semibold font-outer-sans transition-all
              ${activeTab === tab.key
                ? 'bg-wine-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-100 p-5">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-wine-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {activeTab === 'funcionarios' && (
              <TabFuncionarios
                employees={employees}
                month={month}
                year={year}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onNew={handleNew}
              />
            )}
            {activeTab === 'presencas' && (
              <TabPresencas
                employees={employees}
                month={month}
                year={year}
                onMonthChange={handleMonthChange}
              />
            )}
            {activeTab === 'vales' && (
              <TabVales
                employees={employees}
                month={month}
                year={year}
                onMonthChange={handleMonthChange}
              />
            )}
            {activeTab === 'credenciais' && (
              <TabCredenciais
                employees={employees}
                onUploaded={() => qc.invalidateQueries({ queryKey: ['admin', 'employees'] })}
              />
            )}
          </>
        )}
      </div>

      {/* Employee Modal */}
      {showModal && (
        <EmployeeModal
          employee={editEmployee}
          onClose={() => setShowModal(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ['admin', 'employees'] })}
        />
      )}
    </div>
  );
}
