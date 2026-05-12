import { useState, useCallback } from 'react';
import api from '../api/client';

export type SidebarRole = 'admin' | 'vendedor' | 'projetista';

export const ADMIN_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',    description: 'Visão geral' },
  { key: 'stand',       label: 'Stands',       description: 'Fotos e atualizações' },
  { key: 'crm',        label: 'Pipeline CRM', description: 'Funil de vendas' },
  { key: 'crm-agenda', label: 'Agenda CRM',   description: 'Atividades do dia' },
  { key: 'clients',    label: 'Clientes',     description: 'Gestão de clientes' },
  { key: 'notes',      label: 'Anotações',    description: 'Todas as anotações' },
  { key: 'budgets',    label: 'Orçamentos',   description: 'Todos os orçamentos' },
  { key: 'sales',      label: 'Vendas',       description: 'Todas as vendas' },
  { key: 'projects',   label: 'Projetos',     description: 'Todos os projetos' },
  { key: 'team',       label: 'Equipe',       description: 'Vendedores e projetistas' },
  { key: 'employees',  label: 'Funcionários', description: 'Equipe de montagem' },
  { key: 'ceniq',      label: 'Ceniq IA',     description: 'Design de stands com IA' },
  { key: 'settings',   label: 'Configurações', description: 'Perfil e API' },
] as const;

export const VENDEDOR_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',    description: 'Visão geral' },
  { key: 'crm',        label: 'CRM Pipeline', description: 'Funil de vendas' },
  { key: 'crm-agenda', label: 'Agenda CRM',   description: 'Atividades do dia' },
  { key: 'stands',     label: 'Stands',       description: 'Fotos e atualizações' },
  { key: 'clients',    label: 'Clientes',     description: 'Cadastrar e visualizar' },
  { key: 'notes',      label: 'Anotações',    description: 'Suas anotações' },
  { key: 'budgets',    label: 'Orçamentos',   description: 'Criar e gerenciar' },
  { key: 'sales',      label: 'Vendas',       description: 'Histórico de vendas' },
  { key: 'projects',   label: 'Projetos',     description: 'Direcionar para projetista' },
] as const;

export const PROJETISTA_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', description: 'Visão geral' },
  { key: 'notes',     label: 'Anotações', description: 'Suas anotações' },
  { key: 'projects',  label: 'Projetos',  description: 'Gerenciar projetos' },
  { key: 'kanban',    label: 'Kanban',    description: 'Fluxo de tarefas' },
  { key: 'ceniq',     label: 'Ceniq IA',  description: 'Design de stands com IA' },
] as const;

const ALWAYS_VISIBLE: Record<SidebarRole, string[]> = {
  admin:      ['dashboard', 'settings'],
  vendedor:   ['dashboard'],
  projetista: ['dashboard'],
};

const CACHE_KEY = (role: SidebarRole) => `sidebar_config_${role}`;

function defaultVisible(role: SidebarRole): string[] {
  if (role === 'admin')      return ADMIN_ITEMS.map(i => i.key as string);
  if (role === 'vendedor')   return VENDEDOR_ITEMS.map(i => i.key as string);
  if (role === 'projetista') return PROJETISTA_ITEMS.map(i => i.key as string);
  return [];
}

function mergeForced(role: SidebarRole, keys: string[]): string[] {
  return Array.from(new Set([...ALWAYS_VISIBLE[role], ...keys]));
}

// ── Cache local (usado enquanto o banco não responde) ─────────────────────

export function loadVisibleKeys(role: SidebarRole): string[] {
  try {
    const raw = localStorage.getItem(CACHE_KEY(role));
    if (!raw) return defaultVisible(role);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultVisible(role);
    return mergeForced(role, parsed);
  } catch {
    return defaultVisible(role);
  }
}

function cacheVisibleKeys(role: SidebarRole, keys: string[]) {
  localStorage.setItem(CACHE_KEY(role), JSON.stringify(mergeForced(role, keys)));
}

// ── API ───────────────────────────────────────────────────────────────────

type PreferencesPayload = { sidebarConfig?: Partial<Record<SidebarRole, string[]>> };

export async function fetchPreferencesFromDB(): Promise<PreferencesPayload> {
  try {
    const r = await api.get('/admin/preferences');
    return (r.data as PreferencesPayload) ?? {};
  } catch {
    return {};
  }
}

export async function savePreferencesToDB(prefs: PreferencesPayload): Promise<void> {
  await api.patch('/admin/preferences', { preferences: prefs });
}

// Carrega do banco e sincroniza o cache local
export async function syncPreferencesFromDB(): Promise<void> {
  const prefs = await fetchPreferencesFromDB();
  if (prefs.sidebarConfig) {
    for (const role of ['admin', 'vendedor', 'projetista'] as SidebarRole[]) {
      const keys = prefs.sidebarConfig[role];
      if (Array.isArray(keys)) {
        cacheVisibleKeys(role, keys);
      }
    }
    window.dispatchEvent(new Event('sidebar-config-changed'));
  }
}

export function isAlwaysVisible(role: SidebarRole, key: string): boolean {
  return ALWAYS_VISIBLE[role].includes(key);
}

export function saveVisibleKeys(role: SidebarRole, keys: string[]) {
  const merged = mergeForced(role, keys);
  cacheVisibleKeys(role, merged);
}

export function useSidebarConfig(role: SidebarRole) {
  const [visible, setVisible] = useState<string[]>(() => loadVisibleKeys(role));

  const toggle = useCallback((key: string) => {
    if (isAlwaysVisible(role, key)) return;
    setVisible(prev => {
      const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
      saveVisibleKeys(role, next);
      return next;
    });
  }, [role]);

  const isVisible = useCallback((key: string) => visible.includes(key), [visible]);

  const reset = useCallback(() => {
    const def = defaultVisible(role);
    saveVisibleKeys(role, def);
    setVisible(def);
  }, [role]);

  return { visible, isVisible, toggle, reset };
}
