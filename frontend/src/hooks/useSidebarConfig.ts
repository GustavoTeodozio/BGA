import { useState, useCallback } from 'react';

export type SidebarRole = 'admin' | 'vendedor' | 'projetista';

// All possible item keys per role
export const ADMIN_ITEMS = [
  { key: 'dashboard',   label: 'Dashboard',    description: 'Visão geral' },
  { key: 'stand',       label: 'Stands',       description: 'Fotos e atualizações' },
  { key: 'crm',        label: 'Pipeline CRM', description: 'Funil de vendas' },
  { key: 'crm-agenda', label: 'Agenda CRM',   description: 'Atividades do dia' },
  { key: 'clients',    label: 'Clientes',     description: 'Gestão de clientes' },
  { key: 'notes',      label: 'Anotações',    description: 'Todas as anotações' },
  { key: 'budgets',    label: 'Orçamentos',   description: 'Todos os orçamentos' },
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
] as const;

export const PROJETISTA_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', description: 'Visão geral' },
  { key: 'notes',     label: 'Anotações', description: 'Suas anotações' },
  { key: 'projects',  label: 'Projetos',  description: 'Gerenciar projetos' },
  { key: 'kanban',    label: 'Kanban',    description: 'Fluxo de tarefas' },
  { key: 'ceniq',     label: 'Ceniq IA',  description: 'Design de stands com IA' },
] as const;

// Keys that can never be hidden (always required)
const ALWAYS_VISIBLE: Record<SidebarRole, string[]> = {
  admin:      ['dashboard', 'settings'],
  vendedor:   ['dashboard'],
  projetista: ['dashboard'],
};

function storageKey(role: SidebarRole) {
  return `sidebar_config_${role}`;
}

function defaultVisible(role: SidebarRole): string[] {
  if (role === 'admin')      return ADMIN_ITEMS.map(i => i.key as string);
  if (role === 'vendedor')   return VENDEDOR_ITEMS.map(i => i.key as string);
  if (role === 'projetista') return PROJETISTA_ITEMS.map(i => i.key as string);
  return [];
}

export function loadVisibleKeys(role: SidebarRole): string[] {
  try {
    const raw = localStorage.getItem(storageKey(role));
    if (!raw) return defaultVisible(role);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaultVisible(role);
    // Always include forced-visible items
    const forced = ALWAYS_VISIBLE[role];
    const merged = Array.from(new Set([...forced, ...parsed]));
    return merged;
  } catch {
    return defaultVisible(role);
  }
}

export function saveVisibleKeys(role: SidebarRole, keys: string[]) {
  const forced = ALWAYS_VISIBLE[role];
  const merged = Array.from(new Set([...forced, ...keys]));
  localStorage.setItem(storageKey(role), JSON.stringify(merged));
}

export function isAlwaysVisible(role: SidebarRole, key: string): boolean {
  return ALWAYS_VISIBLE[role].includes(key);
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
