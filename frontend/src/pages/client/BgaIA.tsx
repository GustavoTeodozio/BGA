import { useState, useRef, useEffect, useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import api from '../../api/client';
import { StandViewer, type StandData, type StandComponent, type ComponentType } from '../../components/client/StandViewer';

// ── Default stand ─────────────────────────────────────────────────────────
const DEFAULT_STAND: StandData = {
  width: 8, depth: 6,
  wallColor: '#f0ede8', floorColor: '#d4c9b0', accentColor: '#7a1a2e',
  brandName: 'BGA STANDS',
  components: [
    { id: '1', type: 'panel_led', col: 1,   row: 0.15, w: 4,   d: 0.2, h: 2.5, color: '#1a1a2e' },
    { id: '2', type: 'tv',        col: 5.8, row: 0.15, w: 1.5, d: 0.3, h: 1.5, color: '#111' },
    { id: '3', type: 'balcao',    col: 5.5, row: 4.5,  w: 2,   d: 0.8, h: 1.1, color: '#4a3728' },
    { id: '4', type: 'totem',     col: 0.3, row: 0.3,  w: 0.6, d: 0.6, h: 2.2, color: '#7a1a2e' },
    { id: '5', type: 'totem',     col: 0.3, row: 4.8,  w: 0.6, d: 0.6, h: 2.2, color: '#7a1a2e' },
    { id: '6', type: 'cadeira',   col: 3,   row: 3.5,  w: 0.8, d: 0.8, h: 0.9, color: '#555' },
    { id: '7', type: 'cadeira',   col: 4.2, row: 3.5,  w: 0.8, d: 0.8, h: 0.9, color: '#555' },
  ],
};

// ── Component catalog ─────────────────────────────────────────────────────
interface ComponentTemplate {
  type: ComponentType;
  label: string;
  emoji: string;
  section: string;
  defaults: Omit<StandComponent, 'id' | 'type'>;
}

const COMPONENT_CATALOG: ComponentTemplate[] = [
  { type: 'forma_caixa',   label: 'Caixa/Retângulo', emoji: '⬜', section: 'Formas',     defaults: { col: 2,   row: 2,   w: 2,    d: 1,    h: 1,    color: '#4a6fa5' } },
  { type: 'forma_cubo',    label: 'Cubo/Quadrado',   emoji: '🔲', section: 'Formas',     defaults: { col: 2,   row: 2,   w: 1,    d: 1,    h: 1,    color: '#5a8a5a' } },
  { type: 'forma_cilindro',label: 'Cilindro/Círculo',emoji: '⭕', section: 'Formas',     defaults: { col: 2,   row: 2,   w: 1,    d: 1,    h: 1.2,  color: '#a05050' } },
  { type: 'balcao',        label: 'Balcão',        emoji: '🗂️', section: 'Mobiliário', defaults: { col: 1,   row: 3,   w: 2,    d: 0.8,  h: 1.1,  color: '#4a3728' } },
  { type: 'counter_curvo', label: 'Counter Curvo', emoji: '〰️', section: 'Mobiliário', defaults: { col: 2,   row: 2.5, w: 2.5,  d: 1.5,  h: 1.1,  color: '#1a1a2e' } },
  { type: 'recepcao',      label: 'Recepção',      emoji: '🏢', section: 'Mobiliário', defaults: { col: 1,   row: 0.5, w: 3,    d: 1.2,  h: 1.1,  color: '#2a2a3a' } },
  { type: 'mesa',          label: 'Mesa',          emoji: '🪑', section: 'Mobiliário', defaults: { col: 2,   row: 2,   w: 1.2,  d: 0.8,  h: 0.75, color: '#8b7355' } },
  { type: 'mesa_redonda',  label: 'Mesa Redonda',  emoji: '⭕', section: 'Mobiliário', defaults: { col: 2,   row: 2,   w: 0.9,  d: 0.9,  h: 0.75, color: '#c8d8e8' } },
  { type: 'cadeira',       label: 'Cadeira',       emoji: '💺', section: 'Mobiliário', defaults: { col: 2,   row: 3,   w: 0.7,  d: 0.7,  h: 0.9,  color: '#555555' } },
  { type: 'poltrona',      label: 'Poltrona',      emoji: '🛋', section: 'Mobiliário', defaults: { col: 2,   row: 2.5, w: 0.9,  d: 0.85, h: 0.95, color: '#6b4a3a' } },
  { type: 'banqueta',      label: 'Banqueta',      emoji: '🍺', section: 'Mobiliário', defaults: { col: 2,   row: 3,   w: 0.55, d: 0.55, h: 0.8,  color: '#888888' } },
  { type: 'puff',          label: 'Puff',          emoji: '🔵', section: 'Mobiliário', defaults: { col: 2,   row: 3,   w: 0.7,  d: 0.7,  h: 0.42, color: '#c084fc' } },
  { type: 'sofa',          label: 'Sofá',          emoji: '🛋', section: 'Mobiliário', defaults: { col: 2,   row: 2.5, w: 2,    d: 0.9,  h: 0.85, color: '#6b7280' } },
  { type: 'vitrine',       label: 'Vitrine',       emoji: '🪟', section: 'Mobiliário', defaults: { col: 1,   row: 1,   w: 1,    d: 0.5,  h: 1.4,  color: '#e2e8f0' } },
  { type: 'prateleira',    label: 'Prateleira',    emoji: '📚', section: 'Mobiliário', defaults: { col: 1,   row: 0.2, w: 2,    d: 0.4,  h: 1.8,  color: '#a8896a' } },
  { type: 'expositor',     label: 'Expositor',     emoji: '🛒', section: 'Mobiliário', defaults: { col: 1,   row: 0.2, w: 1.5,  d: 0.55, h: 1.8,  color: '#9b8060' } },
  { type: 'panel_led',     label: 'Painel LED',    emoji: '💡', section: 'Mídia',      defaults: { col: 1,   row: 0.1, w: 4,    d: 0.2,  h: 2.5,  color: '#1a1a2e' } },
  { type: 'video_wall',    label: 'Video Wall',    emoji: '🖥', section: 'Mídia',      defaults: { col: 1,   row: 0.1, w: 3,    d: 0.15, h: 2.0,  color: '#0033cc' } },
  { type: 'tv',            label: 'TV/Monitor',    emoji: '📺', section: 'Mídia',      defaults: { col: 1,   row: 0.1, w: 1.5,  d: 0.3,  h: 1.5,  color: '#111111' } },
  { type: 'totem',         label: 'Totem',         emoji: '🏛', section: 'Mídia',      defaults: { col: 0.3, row: 0.3, w: 0.6,  d: 0.6,  h: 2.2,  color: '#7a1a2e' } },
  { type: 'kiosk_digital', label: 'Kiosk Digital', emoji: '📲', section: 'Mídia',      defaults: { col: 1,   row: 1,   w: 0.7,  d: 0.45, h: 1.6,  color: '#2563eb' } },
  { type: 'neon_sign',     label: 'Letreiro Neon', emoji: '✨', section: 'Mídia',      defaults: { col: 1,   row: 0.1, w: 2,    d: 0.08, h: 0.7,  color: '#f472b6' } },
  { type: 'banner',        label: 'Banner',        emoji: '📋', section: 'Mídia',      defaults: { col: 0.1, row: 1,   w: 0.8,  d: 0.1,  h: 2.1,  color: '#dc2626' } },
  { type: 'carpet',        label: 'Carpete',       emoji: '▪',  section: 'Mídia',      defaults: { col: 0.5, row: 0.5, w: 3,    d: 2,    h: 0.02, color: '#dc2626' } },
  { type: 'planta',        label: 'Planta',        emoji: '🌱', section: 'Mídia',      defaults: { col: 0.5, row: 0.5, w: 0.6,  d: 0.6,  h: 1.2,  color: '#22c55e' } },
  { type: 'arvore_grande', label: 'Árvore Grande', emoji: '🌳', section: 'Mídia',      defaults: { col: 0.5, row: 0.5, w: 1,    d: 1,    h: 2.2,  color: '#16a34a' } },
  { type: 'arco',          label: 'Arco/Portal',   emoji: '🏗', section: 'Estrutura',  defaults: { col: 2,   row: 0,   w: 4,    d: 0.4,  h: 3.0,  color: '#1a1a1a' } },
  { type: 'pilar',         label: 'Pilar',         emoji: '🏛', section: 'Estrutura',  defaults: { col: 0.5, row: 0.5, w: 0.3,  d: 0.3,  h: 3.0,  color: '#333333' } },
  { type: 'viga',          label: 'Viga',          emoji: '━',  section: 'Estrutura',  defaults: { col: 0,   row: 1,   w: 6,    d: 0.25, h: 0.18, color: '#222222', yOffset: 2.85 } },
  { type: 'teto_painel',   label: 'Teto',          emoji: '▬',  section: 'Estrutura',  defaults: { col: 0,   row: 0,   w: 6,    d: 4,    h: 0.14, color: '#1a1a2e', yOffset: 2.86 } },
  { type: 'luminaria',     label: 'Luminária',     emoji: '💡', section: 'Suspenso',   defaults: { col: 3,   row: 2,   w: 0.6,  d: 0.6,  h: 0.85, color: '#555555', yOffset: 2.2 } },
  { type: 'track_spot',    label: 'Track Spot',    emoji: '💫', section: 'Suspenso',   defaults: { col: 2,   row: 1,   w: 1.8,  d: 0.08, h: 0.06, color: '#333333', yOffset: 2.8 } },
  { type: 'suspensao_logo',label: 'Logo Suspenso', emoji: '🏷', section: 'Suspenso',   defaults: { col: 2,   row: 1,   w: 2.5,  d: 0.15, h: 0.6,  color: '#710505', yOffset: 2.45 } },
];

const CATALOG_SECTIONS = ['Formas', 'Mobiliário', 'Mídia', 'Estrutura', 'Suspenso'] as const;
const TYPE_EMOJI: Record<string, string> = Object.fromEntries(COMPONENT_CATALOG.map(c => [c.type, c.emoji]));
const TYPE_LABEL: Record<string, string> = Object.fromEntries(COMPONENT_CATALOG.map(c => [c.type, c.label]));

// ── History (localStorage) ────────────────────────────────────────────────
interface HistoryEntry { id: string; ts: number; prompt: string; stand: StandData; }
const HISTORY_KEY = 'ceniq_history';
const HISTORY_MAX = 30;
function loadHistory(): HistoryEntry[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistory(entries: HistoryEntry[]) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(entries.slice(0, HISTORY_MAX)));
}
function addHistory(prompt: string, stand: StandData) {
  saveHistory([{ id: Date.now().toString(), ts: Date.now(), prompt, stand }, ...loadHistory()]);
}

// ── Chat types ────────────────────────────────────────────────────────────
interface Message { role: 'user' | 'assistant'; content: string; stand?: StandData; }
const EXAMPLE_PROMPTS = [
  'Stand 6x4m tech, azul, painel LED e dois totens na entrada',
  'Stand 8x6m alimentação, tema natural, balcão na frente',
  'Stand 4x4m startup, branco minimalista, detalhes verdes',
];

// ── Toolbar icons (SVG inline) ────────────────────────────────────────────
const IsoIcon = () => (
  <svg viewBox="0 0 18 18" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round">
    <path d="M9 2 L16 6 L16 12 L9 16 L2 12 L2 6 Z" />
    <line x1="9" y1="2" x2="9" y2="9" />
    <line x1="2" y1="6" x2="9" y2="9" />
    <line x1="16" y1="6" x2="9" y2="9" />
  </svg>
);
const TopIcon = () => (
  <svg viewBox="0 0 18 18" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="3" y="3" width="12" height="12" rx="1.5" />
    <line x1="9" y1="3" x2="9" y2="15" strokeDasharray="2 1.5" />
    <line x1="3" y1="9" x2="15" y2="9" strokeDasharray="2 1.5" />
    <circle cx="9" cy="9" r="1.2" fill="currentColor" stroke="none" />
  </svg>
);
const FrontIcon = () => (
  <svg viewBox="0 0 18 18" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="2" y="5" width="10" height="8" rx="1" />
    <line x1="12" y1="5" x2="16" y2="3" />
    <line x1="12" y1="13" x2="16" y2="11" />
    <line x1="16" y1="3" x2="16" y2="11" strokeDasharray="2 1.5" />
  </svg>
);
const SideIcon = () => (
  <svg viewBox="0 0 18 18" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4">
    <rect x="6" y="5" width="10" height="8" rx="1" />
    <line x1="6" y1="5" x2="2" y2="3" />
    <line x1="6" y1="13" x2="2" y2="11" />
    <line x1="2" y1="3" x2="2" y2="11" strokeDasharray="2 1.5" />
  </svg>
);
const FitIcon = () => (
  <svg viewBox="0 0 18 18" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d="M3 7V3h4M11 3h4v4M15 11v4h-4M7 15H3v-4" />
    <rect x="5.5" y="5.5" width="7" height="7" rx="1" />
  </svg>
);
const UndoIcon = () => (
  <svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M4 7H12a4 4 0 010 8H8" />
    <polyline points="4,4 4,7 7,7" />
  </svg>
);
const RedoIcon = () => (
  <svg viewBox="0 0 18 18" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
    <path d="M14 7H6a4 4 0 000 8h4" />
    <polyline points="14,4 14,7 11,7" />
  </svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg viewBox="0 0 16 16" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8"
    style={{ transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}>
    <polyline points="5,4 9,8 5,12" />
  </svg>
);

// ── Section header (accordion) ────────────────────────────────────────────
function SectionHeader({ label, open, onToggle, count }: {
  label: string; open: boolean; onToggle: () => void; count?: number;
}) {
  return (
    <button
      onClick={onToggle}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 6,
        padding: '8px 12px', background: 'rgba(255,255,255,0.04)',
        border: 'none', borderBottom: '1px solid rgba(255,255,255,0.06)',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      <ChevronIcon open={open} />
      <span style={{ flex: 1, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: 'inherit' }}>
        {label}
      </span>
      {count !== undefined && (
        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{count}</span>
      )}
    </button>
  );
}

// ── Toolbar button ─────────────────────────────────────────────────────────
function TBtn({ active, onClick, title, children }: {
  active?: boolean; onClick: () => void; title: string; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 36, height: 36, borderRadius: 7, border: 'none', cursor: 'pointer',
        background: active ? 'rgba(122,26,46,0.85)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.48)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.12s, color 0.12s',
        outline: 'none',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
interface BgaIAProps { endpoint?: string; }

export function BgaIA({ endpoint = '/client/ceniq' }: BgaIAProps) {
  useAuthStore();

  // ── Stand state ──────────────────────────────────────────────────────────
  const [currentStand, setCurrentStand] = useState<StandData>(DEFAULT_STAND);
  const [displayStand, setDisplayStand] = useState<StandData>(DEFAULT_STAND);
  const animTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [selectedComp, setSelectedComp] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null);
  const [cameraPreset, setCameraPreset] = useState('iso');
  const [rightOpen, setRightOpen] = useState(true);
  const [showAI, setShowAI] = useState(false);
  const [aiTab, setAiTab] = useState<'chat' | 'history'>('chat');
  const [compSearch, setCompSearch] = useState('');
  const [sec, setSec] = useState({ components: true, stand: false, selected: true });
  const toggleSec = (k: keyof typeof sec) => setSec(s => ({ ...s, [k]: !s[k] }));

  // ── Chat state ───────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: 'Olá! Sou o Ceniq. Descreva seu stand e gero a visualização 3D em segundos.',
    stand: DEFAULT_STAND,
  }]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ── Undo/Redo ─────────────────────────────────────────────────────────────
  const undoRef = useRef<StandData[]>([]);
  const redoRef = useRef<StandData[]>([]);
  const [histBits, setHistBits] = useState({ u: 0, r: 0 });
  const currentRef = useRef(currentStand);
  useEffect(() => { currentRef.current = currentStand; }, [currentStand]);

  const recordUndo = useCallback((snap: StandData) => {
    undoRef.current = [...undoRef.current.slice(-49), snap];
    redoRef.current = [];
    setHistBits({ u: undoRef.current.length, r: 0 });
  }, []);

  const undo = useCallback(() => {
    if (!undoRef.current.length) return;
    const prev = undoRef.current.at(-1)!;
    redoRef.current = [currentRef.current, ...redoRef.current.slice(0, 49)];
    undoRef.current = undoRef.current.slice(0, -1);
    setHistBits({ u: undoRef.current.length, r: redoRef.current.length });
    if (animTimerRef.current) { clearInterval(animTimerRef.current); animTimerRef.current = null; }
    setCurrentStand(prev);
    setDisplayStand(prev);
  }, []);

  const redo = useCallback(() => {
    if (!redoRef.current.length) return;
    const next = redoRef.current[0];
    undoRef.current = [...undoRef.current.slice(-49), currentRef.current];
    redoRef.current = redoRef.current.slice(1);
    setHistBits({ u: undoRef.current.length, r: redoRef.current.length });
    if (animTimerRef.current) { clearInterval(animTimerRef.current); animTimerRef.current = null; }
    setCurrentStand(next);
    setDisplayStand(next);
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName);
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); }
      if (e.ctrlKey && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) { e.preventDefault(); redo(); }
      if (!isInput && selectedComp) {
        if (e.key === 'Delete' || e.key === 'Backspace') removeComponent(selectedComp);
        if (e.key === 'Escape') setSelectedComp(null);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [undo, redo, selectedComp]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── History ───────────────────────────────────────────────────────────────
  useEffect(() => { setHistory(loadHistory()); }, []);

  // ── Animation ─────────────────────────────────────────────────────────────
  const animateBuild = useCallback((newStand: StandData) => {
    if (animTimerRef.current) clearInterval(animTimerRef.current);
    setDisplayStand({ ...newStand, components: [] });
    const comps = newStand.components;
    if (!comps.length) return;
    let i = 0;
    animTimerRef.current = setInterval(() => {
      i++;
      setDisplayStand(prev => ({ ...prev, components: comps.slice(0, i) }));
      if (i >= comps.length) { clearInterval(animTimerRef.current!); animTimerRef.current = null; }
    }, 320);
  }, []);
  useEffect(() => () => { if (animTimerRef.current) clearInterval(animTimerRef.current); }, []);

  // ── AI mutation ───────────────────────────────────────────────────────────
  const mutation = useMutation({
    mutationFn: async (prompt: string) => {
      const hist = messages
        .filter((m, i) => !(m.role === 'assistant' && i === 0))
        .map(m => ({ role: m.role, content: m.content }));
      const r = await api.post(endpoint, { prompt, history: hist });
      return { ...r.data as { stand: StandData; message: string }, prompt };
    },
    onSuccess: ({ stand, message, prompt }) => {
      recordUndo(currentRef.current);
      setMessages(prev => [...prev, { role: 'assistant', content: message || stand.summary || 'Stand gerado!', stand }]);
      setCurrentStand(stand);
      animateBuild(stand);
      addHistory(prompt, stand);
      setHistory(loadHistory());
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    },
    onError: (err: any) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: err.response?.data?.message || 'Erro ao conectar ao Ceniq.',
      }]);
    },
  });

  const handleSend = () => {
    const text = input.trim();
    if (!text || mutation.isPending) return;
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    mutation.mutate(text);
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
  };

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = `stand-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  // ── Component operations ──────────────────────────────────────────────────
  const addComponent = (tpl: ComponentTemplate) => {
    recordUndo(currentRef.current);
    const id = `m${Date.now()}`;
    const newComp: StandComponent = { id, type: tpl.type, ...tpl.defaults };
    const updated = { ...currentStand, components: [...currentStand.components, newComp] };
    setCurrentStand(updated);
    setDisplayStand(updated);
    setSelectedComp(id);
    setSec(s => ({ ...s, selected: true }));
  };

  const removeComponent = (id: string) => {
    recordUndo(currentRef.current);
    const updated = { ...currentStand, components: currentStand.components.filter(c => c.id !== id) };
    setCurrentStand(updated);
    setDisplayStand(updated);
    if (selectedComp === id) setSelectedComp(null);
  };

  const updateComp = (id: string, field: keyof StandComponent, value: string | number) => {
    if (animTimerRef.current) { clearInterval(animTimerRef.current); animTimerRef.current = null; }
    const updated = {
      ...currentStand,
      components: currentStand.components.map(c => c.id === id ? { ...c, [field]: value } : c),
    };
    setCurrentStand(updated);
    setDisplayStand(updated);
  };

  const updateCompPosition = (id: string, col: number, row: number) => {
    if (animTimerRef.current) { clearInterval(animTimerRef.current); animTimerRef.current = null; }
    setCurrentStand(prev => {
      const next = { ...prev, components: prev.components.map(c => c.id === id ? { ...c, col, row } : c) };
      setDisplayStand(next);
      return next;
    });
  };

  type StandConfigField = 'width' | 'depth' | 'wallHeight' | 'wallColor' | 'floorColor' | 'accentColor' | 'brandName' | 'wallConfig';
  const updateStandConfig = (field: StandConfigField, value: string | number | null) => {
    recordUndo(currentRef.current);
    if (animTimerRef.current) { clearInterval(animTimerRef.current); animTimerRef.current = null; }
    setCurrentStand(prev => {
      const next = { ...prev, [field]: value };
      setDisplayStand(next);
      return next;
    });
  };

  // ── Context menu operations ───────────────────────────────────────────────
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [contextMenu]);

  const handleContextMenu = (id: string, x: number, y: number) => {
    setContextMenu({ id, x, y });
    setSelectedComp(id);
    setSec(s => ({ ...s, selected: true }));
  };

  const duplicateComponent = (id: string) => {
    const comp = currentStand.components.find(c => c.id === id);
    if (!comp) return;
    recordUndo(currentRef.current);
    const newComp: StandComponent = {
      ...comp, id: `m${Date.now()}`,
      col: Math.min(comp.col + 0.5, currentStand.width - comp.w),
      row: Math.min(comp.row + 0.5, currentStand.depth - comp.d),
    };
    const updated = { ...currentStand, components: [...currentStand.components, newComp] };
    setCurrentStand(updated);
    setDisplayStand(updated);
    setSelectedComp(newComp.id);
  };

  const centerComponent = (id: string) => {
    const comp = currentStand.components.find(c => c.id === id);
    if (!comp) return;
    updateCompPosition(id, Math.max(0, (currentStand.width - comp.w) / 2), Math.max(0, (currentStand.depth - comp.d) / 2));
  };

  const shiftCompHeight = (id: string, delta: number) => {
    const comp = currentStand.components.find(c => c.id === id);
    if (!comp) return;
    updateComp(id, 'yOffset', Math.max(0, Math.min(8, (comp.yOffset ?? 0) + delta)));
  };

  const handleResize = (id: string, updates: Partial<StandComponent>) => {
    if (animTimerRef.current) { clearInterval(animTimerRef.current); animTimerRef.current = null; }
    setCurrentStand(prev => {
      const next = { ...prev, components: prev.components.map(c => c.id === id ? { ...c, ...updates } : c) };
      setDisplayStand(next);
      return next;
    });
  };

  const restoreHistory = (entry: HistoryEntry) => {
    recordUndo(currentRef.current);
    setCurrentStand(entry.stand);
    animateBuild(entry.stand);
    setShowAI(false);
  };

  const clearHistory = () => { saveHistory([]); setHistory([]); };

  const selected = selectedComp ? currentStand.components.find(c => c.id === selectedComp) : null;

  // ── Filtered catalog ──────────────────────────────────────────────────────
  const filteredCatalog = compSearch.trim()
    ? COMPONENT_CATALOG.filter(t => t.label.toLowerCase().includes(compSearch.toLowerCase()) || t.section.toLowerCase().includes(compSearch.toLowerCase()))
    : COMPONENT_CATALOG;

  // ── Render ────────────────────────────────────────────────────────────────
  const S = {
    topBar: { height: 44, background: '#17152a', borderBottom: '1px solid rgba(255,255,255,0.07)' } as React.CSSProperties,
    leftBar: { width: 42, background: '#1a1826', borderRight: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' as const, alignItems: 'center', padding: '4px 3px', gap: 2, flexShrink: 0 },
    rightPanel: { width: 268, background: '#1a1826', borderLeft: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' as const, flexShrink: 0, overflowY: 'auto' as const },
    divider: { height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 6px' } as React.CSSProperties,
  };

  const inputStyle: React.CSSProperties = {
    background: '#13111a', border: '1px solid rgba(255,255,255,0.14)', color: '#fff',
    borderRadius: 6, padding: '4px 8px', fontSize: 12, width: '100%', colorScheme: 'dark' as any,
    outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div
      className="animate-fade-in -mx-4 md:-mx-6 -my-6 md:-my-8"
      style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column', background: '#13111a', overflow: 'hidden' }}
    >
      {/* ════════ TOP BAR ════════ */}
      <div style={{ ...S.topBar, display: 'flex', alignItems: 'center', gap: 4, padding: '0 10px', flexShrink: 0 }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#710505', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg style={{ width: 13, height: 13, color: '#fff' }} fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2z" />
            </svg>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', fontFamily: 'inherit' }}>
            Ceniq <span style={{ color: 'rgba(255,255,255,0.35)', fontWeight: 400 }}>by BGA</span>
          </span>
        </div>

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: 1 }}>
          <TBtn onClick={undo} title="Desfazer (Ctrl+Z)" active={false}>
            <span style={{ opacity: histBits.u > 0 ? 1 : 0.3 }}><UndoIcon /></span>
          </TBtn>
          <TBtn onClick={redo} title="Refazer (Ctrl+Y)" active={false}>
            <span style={{ opacity: histBits.r > 0 ? 1 : 0.3 }}><RedoIcon /></span>
          </TBtn>
        </div>

        {/* Stand dimensions indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4, padding: '3px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
          <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
            {currentStand.width}×{currentStand.depth}m
          </span>
          {currentStand.components.length > 0 && (
            <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', fontFamily: 'monospace' }}>
              · {currentStand.components.length} obj
            </span>
          )}
        </div>

        <div style={{ flex: 1 }} />

        {/* Live indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontFamily: 'inherit' }}>3D ao vivo</span>
        </div>

        {/* Export */}
        <TBtn onClick={handleExport} title="Exportar PNG">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" viewBox="0 0 18 18">
            <path d="M3 13v2h12v-2M9 3v8M6 8l3 3 3-3" />
          </svg>
        </TBtn>

        {/* AI Chat toggle */}
        <button
          onClick={() => setShowAI(v => !v)}
          title="Ceniq IA — gerar com inteligência artificial"
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px',
            borderRadius: 7, border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            background: showAI ? '#710505' : 'rgba(122,26,46,0.5)',
            color: '#fff', fontSize: 12, fontWeight: 600,
            transition: 'background 0.15s',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
          Ceniq IA
        </button>

        {/* Right panel toggle */}
        <TBtn onClick={() => setRightOpen(v => !v)} title="Painel de componentes" active={rightOpen}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" viewBox="0 0 18 18">
            <rect x="2" y="2" width="14" height="14" rx="2" />
            <line x1="11" y1="2" x2="11" y2="16" />
          </svg>
        </TBtn>
      </div>

      {/* ════════ MAIN AREA ════════ */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>

        {/* ── LEFT TOOLBAR ── */}
        <div style={S.leftBar}>
          {/* Camera views */}
          {([
            { preset: 'iso',   icon: IsoIcon,   title: 'Isométrica (padrão)' },
            { preset: 'top',   icon: TopIcon,   title: 'Vista Superior' },
            { preset: 'front', icon: FrontIcon, title: 'Vista Frontal' },
            { preset: 'side',  icon: SideIcon,  title: 'Vista Lateral' },
          ] as const).map(({ preset, icon: Icon, title }) => (
            <TBtn key={preset} active={cameraPreset === preset} onClick={() => setCameraPreset(preset)} title={title}>
              <Icon />
            </TBtn>
          ))}

          <div style={S.divider} />

          {/* Fit all */}
          <TBtn onClick={() => setCameraPreset(`iso_${Date.now()}`)} title="Resetar câmera" active={false}>
            <FitIcon />
          </TBtn>

          <div style={{ flex: 1 }} />

          {/* Keyboard hints at bottom */}
          <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.18)', textAlign: 'center', lineHeight: 1.6, paddingBottom: 4, fontFamily: 'monospace' }}>
            <div>Del</div>
            <div>Esc</div>
          </div>
        </div>

        {/* ── 3D VIEWPORT ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <StandViewer
            stand={displayStand}
            cameraPreset={cameraPreset}
            className="w-full h-full"
            selectedId={selectedComp ?? undefined}
            onSelect={(id) => { setSelectedComp(id); setSec(s => ({ ...s, selected: true })); }}
            onPositionChange={updateCompPosition}
            onContextMenu={handleContextMenu}
            onResize={handleResize}
          />

          {/* Drag hint */}
          {!selectedComp && currentStand.components.length > 0 && (
            <div style={{
              position: 'absolute', bottom: 12, left: '50%', transform: 'translateX(-50%)',
              padding: '5px 12px', borderRadius: 20, pointerEvents: 'none',
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'inherit' }}>
                Clique para selecionar · Arrastar para mover · Botão direito para opções
              </span>
            </div>
          )}

          {/* Selected object HUD */}
          {selected && (
            <div style={{
              position: 'absolute', top: 10, left: 10,
              padding: '5px 10px', borderRadius: 8,
              background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,136,68,0.35)',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ fontSize: 14 }}>{TYPE_EMOJI[selected.type] || '📦'}</span>
              <div>
                <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: '#ff9966', fontFamily: 'inherit' }}>
                  {TYPE_LABEL[selected.type] || selected.type}
                </p>
                <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'monospace' }}>
                  {selected.w}×{selected.d}×{selected.h}m{(selected.yOffset ?? 0) > 0 ? ` · ↑${selected.yOffset}m` : ''}
                </p>
              </div>
              <button
                onClick={() => setSelectedComp(null)}
                style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', padding: 0, fontSize: 14, lineHeight: 1 }}
              >×</button>
            </div>
          )}

          {/* Context menu */}
          {contextMenu && (() => {
            const ctxComp = currentStand.components.find(c => c.id === contextMenu.id);
            if (!ctxComp) return null;
            const _mi = (d: string) => <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} /></svg>;
            const menuItems = [
              { icon: _mi('M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z'), label: 'Selecionar / Editar',   action: () => { setSelectedComp(contextMenu.id); setSec(s => ({ ...s, selected: true })); } },
              { icon: _mi('M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z'),           label: 'Duplicar',               action: () => duplicateComponent(contextMenu.id) },
              { icon: _mi('M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7'),                                                                                                     label: 'Centralizar no stand',   action: () => centerComponent(contextMenu.id) },
              { icon: _mi('M5 10l7-7m0 0l7 7m-7-7v18'),                                                                                                           label: 'Subir 0,25 m',           action: () => shiftCompHeight(contextMenu.id, 0.25) },
              { icon: _mi('M19 14l-7 7m0 0l-7-7m7 7V3'),                                                                                                          label: 'Descer 0,25 m',          action: () => shiftCompHeight(contextMenu.id, -0.25) },
              { icon: _mi('M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'),    label: 'Remover',                action: () => removeComponent(contextMenu.id), danger: true },
            ];
            const isPrimitive  = ['forma_caixa', 'forma_cubo', 'forma_cilindro'].includes(ctxComp.type);
            const hasCurve     = isPrimitive;
            const isCylinder   = ctxComp.type === 'forma_cilindro';
            return (
              <div
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'fixed',
                  left: Math.min(contextMenu.x, window.innerWidth - 230),
                  top: Math.min(contextMenu.y, window.innerHeight - (isPrimitive ? 400 : 290)),
                  zIndex: 9999,
                  background: 'linear-gradient(180deg, #1e1c2e 0%, #17152a 100%)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12, minWidth: 218,
                  boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '9px 14px 7px', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10, margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Objeto</p>
                  <p style={{ color: '#fff', fontSize: 13, fontWeight: 600, margin: '2px 0 0', fontFamily: 'inherit' }}>
                    {TYPE_EMOJI[ctxComp.type] || '📦'} {TYPE_LABEL[ctxComp.type] || ctxComp.type}
                  </p>
                  {(ctxComp.yOffset ?? 0) > 0 && (
                    <p style={{ color: 'rgba(255,200,100,0.65)', fontSize: 10, margin: '2px 0 0' }}>↕ {(ctxComp.yOffset ?? 0).toFixed(2)} m do chão</p>
                  )}
                </div>

                {/* ── Curvature section — only for box primitives ── */}
                {hasCurve && (
                  <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,150,0,0.04)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 7 }}>
                      <span style={{ fontSize: 13, marginRight: 6 }}>〜</span>
                      <span style={{ fontSize: 12, color: 'rgba(255,150,0,0.9)', fontWeight: 600, fontFamily: 'inherit', flex: 1 }}>Curvar forma</span>
                      <span style={{ fontSize: 12, color: '#ff9500', fontFamily: 'monospace', fontWeight: 700 }}>{ctxComp.curvature ?? 0}°</span>
                    </div>
                    <input
                      type="range"
                      min={0} max={340} step={5}
                      value={ctxComp.curvature ?? 0}
                      onChange={e => handleResize(ctxComp.id, { curvature: parseInt(e.target.value) })}
                      style={{ width: '100%', accentColor: '#ff9500', cursor: 'pointer', display: 'block' }}
                    />
                    {/* Preset buttons */}
                    <div style={{ display: 'flex', gap: 4, marginTop: 7 }}>
                      {(isCylinder
                        ? [{ v: 0, l: 'Cheio' }, { v: 90, l: '3/4' }, { v: 180, l: '½' }, { v: 270, l: '¼' }]
                        : [{ v: 0, l: 'Reto' }, { v: 45, l: '45°' }, { v: 90, l: '90°' }, { v: 180, l: '180°' }, { v: 270, l: '270°' }]
                      ).map(({ v, l }) => (
                        <button
                          key={v}
                          onClick={() => handleResize(ctxComp.id, { curvature: v })}
                          style={{
                            flex: 1, padding: '4px 0', fontSize: 10, borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                            background: (ctxComp.curvature ?? 0) === v ? 'rgba(255,150,0,0.25)' : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${(ctxComp.curvature ?? 0) === v ? 'rgba(255,150,0,0.55)' : 'rgba(255,255,255,0.09)'}`,
                            color: (ctxComp.curvature ?? 0) === v ? '#ffaa33' : 'rgba(255,255,255,0.45)',
                          }}
                        >
                          {l}
                        </button>
                      ))}
                    </div>
                    {isCylinder && (
                      <p style={{ margin: '5px 0 0', fontSize: 9, color: 'rgba(255,150,0,0.45)', fontFamily: 'inherit' }}>
                        0° = círculo completo · 180° = metade · 270° = quarto
                      </p>
                    )}
                  </div>
                )}

                {menuItems.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => { item.action(); setContextMenu(null); }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                      padding: '8px 14px', background: 'none', border: 'none',
                      color: (item as any).danger ? '#f87171' : 'rgba(255,255,255,0.82)',
                      fontSize: 13, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                      borderBottom: i < menuItems.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = (item as any).danger ? 'rgba(248,113,113,0.1)' : 'rgba(255,255,255,0.07)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
                  >
                    <span style={{ fontSize: 15, minWidth: 20 }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            );
          })()}

          {/* AI loading */}
          {mutation.isPending && (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(0,0,0,0.45)', pointerEvents: 'none',
            }}>
              <div style={{ background: '#1a1826', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '14px 24px', textAlign: 'center' }}>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 8 }}>
                  {[0, 150, 300].map(d => (
                    <div key={d} style={{ width: 8, height: 8, borderRadius: '50%', background: '#9b2020', animation: `bounce 0.9s ${d}ms infinite` }} />
                  ))}
                </div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, margin: 0, fontFamily: 'inherit' }}>Ceniq gerando stand...</p>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        {rightOpen && (
          <div style={S.rightPanel}>

            {/* ── COMPONENTS section ── */}
            <SectionHeader label="Componentes" open={sec.components} onToggle={() => toggleSec('components')} count={COMPONENT_CATALOG.length} />
            {sec.components && (
              <div style={{ padding: '8px 10px' }}>
                {/* Search */}
                <input
                  value={compSearch}
                  onChange={e => setCompSearch(e.target.value)}
                  placeholder="Buscar componente..."
                  style={{ ...inputStyle, marginBottom: 8 }}
                />

                {compSearch.trim() ? (
                  /* flat results when searching */
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {filteredCatalog.map(tpl => (
                      <button
                        key={tpl.type}
                        onClick={() => addComponent(tpl)}
                        title={tpl.defaults.yOffset ? `Suspenso a ${tpl.defaults.yOffset}m` : tpl.label}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '5px 8px', borderRadius: 7,
                          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                          color: 'rgba(255,255,255,0.8)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                          whiteSpace: 'nowrap',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(122,26,46,0.45)'; e.currentTarget.style.borderColor = 'rgba(155,32,32,0.5)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
                      >
                        <span style={{ fontSize: 13 }}>{tpl.emoji}</span>
                        <span>{tpl.label}</span>
                        {tpl.defaults.yOffset ? <span style={{ fontSize: 8, color: 'rgba(255,200,100,0.55)' }}>↑</span> : null}
                      </button>
                    ))}
                    {filteredCatalog.length === 0 && (
                      <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, margin: '4px 0', fontFamily: 'inherit' }}>Nenhum resultado.</p>
                    )}
                  </div>
                ) : (
                  /* grouped by section */
                  CATALOG_SECTIONS.map(sectionName => {
                    const items = COMPONENT_CATALOG.filter(t => t.section === sectionName);
                    return (
                      <div key={sectionName} style={{ marginBottom: 10 }}>
                        <p style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px', fontFamily: 'inherit' }}>
                          {sectionName === 'Suspenso' ? '↑ ' : sectionName === 'Formas' ? '◼ ' : ''}{sectionName}
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                          {items.map(tpl => (
                            <button
                              key={tpl.type}
                              onClick={() => addComponent(tpl)}
                              title={tpl.defaults.yOffset ? `${tpl.label} — suspenso a ${tpl.defaults.yOffset}m` : tpl.label}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                padding: '4px 7px', borderRadius: 6,
                                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.09)',
                                color: 'rgba(255,255,255,0.72)', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                                whiteSpace: 'nowrap', transition: 'background 0.1s',
                              }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(122,26,46,0.4)'; e.currentTarget.style.borderColor = '#9b2020'; e.currentTarget.style.color = '#fff'; }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; }}
                            >
                              <span style={{ fontSize: 12 }}>{tpl.emoji}</span>
                              <span>{tpl.label}</span>
                              {tpl.defaults.yOffset ? <span style={{ fontSize: 8, color: 'rgba(255,200,100,0.5)' }}>↑</span> : null}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* ── STAND section ── */}
            <SectionHeader label="Stand" open={sec.stand} onToggle={() => toggleSec('stand')} />
            {sec.stand && (
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Dimensions */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {([
                    { key: 'width',      label: 'Largura',  min: 2, max: 30, step: 0.5 },
                    { key: 'depth',      label: 'Prof.',    min: 2, max: 30, step: 0.5 },
                    { key: 'wallHeight', label: 'Alt. par.', min: 1.5, max: 6, step: 0.25 },
                  ] as const).map(({ key, label, min, max, step }) => (
                    <div key={key} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'inherit' }}>{label}</span>
                      <input
                        type="number"
                        value={key === 'wallHeight' ? (currentStand.wallHeight ?? 3) : currentStand[key]}
                        min={min} max={max} step={step}
                        onChange={e => updateStandConfig(key, parseFloat(e.target.value) || min)}
                        style={{ ...inputStyle, width: '100%', padding: '4px 6px' }}
                      />
                    </div>
                  ))}
                </div>

                {/* Wall config */}
                <div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'inherit', display: 'block', marginBottom: 4 }}>Paredes</span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {([
                      { v: 'open',   l: 'Aberto' },
                      { v: '1wall',  l: '1 par.' },
                      { v: '2walls', l: 'L' },
                      { v: '3walls', l: 'U' },
                    ] as const).map(opt => (
                      <button
                        key={opt.v}
                        onClick={() => updateStandConfig('wallConfig', opt.v)}
                        style={{
                          flex: 1, padding: '4px 0', fontSize: 10, borderRadius: 5, cursor: 'pointer', fontFamily: 'inherit',
                          background: (currentStand.wallConfig ?? '2walls') === opt.v ? '#710505' : 'rgba(255,255,255,0.06)',
                          border: `1px solid ${(currentStand.wallConfig ?? '2walls') === opt.v ? '#9b2020' : 'rgba(255,255,255,0.1)'}`,
                          color: (currentStand.wallConfig ?? '2walls') === opt.v ? '#fff' : 'rgba(255,255,255,0.5)',
                        }}
                      >{opt.l}</button>
                    ))}
                  </div>
                </div>

                {/* Brand name */}
                <div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4, fontFamily: 'inherit' }}>Nome da marca</span>
                  <input
                    type="text"
                    value={currentStand.brandName || ''}
                    onChange={e => updateStandConfig('brandName', e.target.value || null)}
                    placeholder="BGA STANDS"
                    style={inputStyle}
                  />
                </div>

                {/* Colors */}
                <div>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6, fontFamily: 'inherit' }}>Cores</span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {([
                      { key: 'wallColor',   label: 'Parede'   },
                      { key: 'floorColor',  label: 'Piso'     },
                      { key: 'accentColor', label: 'Destaque' },
                    ] as const).map(({ key, label }) => (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input
                          type="color"
                          value={/^#[0-9A-Fa-f]{3,6}$/.test(currentStand[key] ?? '') ? currentStand[key]! : '#888888'}
                          onChange={e => updateStandConfig(key, e.target.value)}
                          style={{ width: 28, height: 22, border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4, cursor: 'pointer', padding: 1, background: 'transparent', colorScheme: 'dark' as any, flexShrink: 0 }}
                        />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: 'inherit', flex: 1 }}>{label}</span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{currentStand[key]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── ENTITY INFO (selected object) ── */}
            {selected && (
              <>
                <SectionHeader
                  label={`${TYPE_EMOJI[selected.type] || '📦'} ${TYPE_LABEL[selected.type] || selected.type}`}
                  open={sec.selected}
                  onToggle={() => toggleSec('selected')}
                />
                {sec.selected && (
                  <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Position + size grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 5 }}>
                      {([
                        { key: 'col',     label: 'X',      step: 0.1 },
                        { key: 'row',     label: 'Z',      step: 0.1 },
                        { key: 'yOffset', label: '↕ Alt.', step: 0.25, min: 0, max: 8 },
                        { key: 'w',       label: 'Larg.',  step: 0.1, min: 0.1 },
                        { key: 'd',       label: 'Prof.',  step: 0.1, min: 0.1 },
                        { key: 'h',       label: 'Alt.',   step: 0.1, min: 0.05 },
                      ] as const).map(({ key, label, step, min, max }) => (
                        <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'inherit' }}>{label}</span>
                          <input
                            type="number"
                            value={selected[key] ?? 0}
                            min={min ?? undefined} max={max ?? undefined} step={step}
                            onChange={e => updateComp(selected.id, key, parseFloat(e.target.value) || 0)}
                            style={{ ...inputStyle, padding: '3px 6px', textAlign: 'right' }}
                            onFocus={e => (e.target.style.borderColor = '#9b2e38')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.14)')}
                          />
                        </div>
                      ))}
                    </div>

                    {/* Curvature slider — for all primitive shapes */}
                    {selected && ['forma_caixa', 'forma_cubo', 'forma_cilindro'].includes(selected.type) && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span style={{ fontSize: 9, color: 'rgba(255,150,0,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: 'inherit' }}>
                            🟠 {selected.type === 'forma_cilindro' ? 'Fatiar' : 'Curvar'}
                          </span>
                          <span style={{ fontSize: 11, color: 'rgba(255,150,0,0.85)', fontFamily: 'monospace' }}>
                            {selected.curvature ?? 0}°
                          </span>
                        </div>
                        <input
                          type="range"
                          min={0} max={340} step={5}
                          value={selected.curvature ?? 0}
                          onChange={e => updateComp(selected.id, 'curvature', parseInt(e.target.value))}
                          style={{ width: '100%', accentColor: '#ff9500', cursor: 'pointer' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                          <span>Plano</span>
                          <span>Semicírculo 180°</span>
                          <span>340°</span>
                        </div>
                      </div>
                    )}

                    {/* Color */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 2 }}>
                      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', fontFamily: 'inherit' }}>Cor</span>
                      <input
                        type="color"
                        value={/^#[0-9A-Fa-f]{3,6}$/.test(selected.color ?? '') ? selected.color : '#888888'}
                        onChange={e => updateComp(selected.id, 'color', e.target.value)}
                        style={{ width: 28, height: 22, border: '1px solid rgba(255,255,255,0.18)', borderRadius: 4, cursor: 'pointer', padding: 1, background: 'transparent', colorScheme: 'dark' as any }}
                      />
                      <code style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', flex: 1 }}>{selected.color}</code>
                      <button
                        onClick={() => removeComponent(selected.id)}
                        style={{ fontSize: 10, color: '#f87171', background: 'none', border: '1px solid rgba(248,113,113,0.25)', borderRadius: 5, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
                      >
                        Remover
                      </button>
                    </div>

                    {/* Hint */}
                    <div style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(255,136,68,0.08)', border: '1px solid rgba(255,136,68,0.18)' }}>
                      <p style={{ margin: 0, fontSize: 10, color: 'rgba(255,160,100,0.75)', fontFamily: 'inherit' }}>
                        Arraste na cena 3D · Grade 0,25 m · Del para remover
                      </p>
                    </div>
                    {selected && ['forma_caixa', 'forma_cubo', 'forma_cilindro'].includes(selected.type) && (
                      <div style={{ padding: '5px 8px', borderRadius: 6, background: 'rgba(100,180,255,0.07)', border: '1px solid rgba(100,180,255,0.2)' }}>
                        <p style={{ margin: 0, fontSize: 10, color: 'rgba(140,200,255,0.8)', fontFamily: 'inherit' }}>
                          🔴 Larg · 🔵 Prof · 🟢 Alt · 🟠 {selected.type === 'forma_cilindro' ? 'Fatiar' : 'Curvar'} — alças 3D e clique direito
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* ── Active objects list ── */}
            {currentStand.components.length > 0 && (
              <div style={{ padding: '8px 10px 10px', borderTop: '1px solid rgba(255,255,255,0.06)', marginTop: 4 }}>
                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 6px', fontFamily: 'inherit' }}>
                  Cena · {currentStand.components.length} objeto{currentStand.components.length !== 1 ? 's' : ''}
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, maxHeight: 90, overflowY: 'auto' }}>
                  {currentStand.components.map(c => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedComp(selectedComp === c.id ? null : c.id); setSec(s => ({ ...s, selected: true })); }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 3,
                        padding: '3px 7px', borderRadius: 5, fontSize: 10, cursor: 'pointer', fontFamily: 'inherit',
                        background: selectedComp === c.id ? 'rgba(122,26,46,0.5)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${selectedComp === c.id ? 'rgba(155,32,32,0.6)' : 'rgba(255,255,255,0.09)'}`,
                        color: selectedComp === c.id ? '#fff' : 'rgba(255,255,255,0.55)',
                      }}
                    >
                      <span style={{ fontSize: 11 }}>{TYPE_EMOJI[c.type] || '📦'}</span>
                      <span style={{ maxWidth: 56, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {TYPE_LABEL[c.type] || c.type}
                      </span>
                      <span
                        onClick={e => { e.stopPropagation(); removeComponent(c.id); }}
                        style={{ color: '#f87171', opacity: 0.5, cursor: 'pointer', marginLeft: 1, fontSize: 12, lineHeight: 1 }}
                        onMouseEnter={e => { (e.target as HTMLElement).style.opacity = '1'; }}
                        onMouseLeave={e => { (e.target as HTMLElement).style.opacity = '0.5'; }}
                      >×</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ════════ AI CHAT OVERLAY ════════ */}
      {showAI && (
        <div
          style={{
            position: 'fixed',
            right: rightOpen ? 268 + 12 : 12,
            bottom: 12,
            width: 348,
            height: 470,
            zIndex: 1200,
            background: '#fff',
            borderRadius: 16,
            boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            border: '1px solid rgba(0,0,0,0.08)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'right 0.2s',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #f1f1f1', flexShrink: 0, background: '#fff' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: '#710505', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg style={{ width: 13, height: 13, color: '#fff' }} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2z" />
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#1a1a1a', fontFamily: 'inherit' }}>Ceniq IA</p>
              <p style={{ margin: 0, fontSize: 10, color: '#888' }}>Gere stands com inteligência artificial</p>
            </div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 2, marginRight: 4 }}>
              {(['chat', 'history'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setAiTab(t)}
                  style={{
                    padding: '3px 8px', borderRadius: 5, border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'inherit',
                    background: aiTab === t ? '#f5e8e8' : 'transparent',
                    color: aiTab === t ? '#9b2020' : '#888',
                    fontWeight: aiTab === t ? 700 : 400,
                  }}
                >
                  {t === 'chat'
                    ? <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                    : <svg style={{ width: 14, height: 14 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  }
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowAI(false)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#aaa', fontSize: 18, lineHeight: 1, padding: '0 2px' }}
            >×</button>
          </div>

          {/* Chat tab */}
          {aiTab === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {messages.map((msg, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, flexDirection: msg.role === 'user' ? 'row-reverse' : 'row' }}>
                    {msg.role === 'assistant' && (
                      <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#9b2020,#710505)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>C</div>
                    )}
                    <div style={{
                      maxWidth: '80%', padding: '8px 12px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      background: msg.role === 'user' ? '#9b2020' : '#f5f5f5',
                      color: msg.role === 'user' ? '#fff' : '#333',
                      fontSize: 13, lineHeight: 1.5, fontFamily: 'inherit',
                    }}>
                      {msg.content}
                      {msg.stand && (
                        <p style={{ margin: '4px 0 0', fontSize: 10, opacity: 0.6, fontWeight: 600 }}>
                          {msg.stand.width}×{msg.stand.depth}m · {msg.stand.components.length} elem.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {messages.length <= 1 && (
                <div style={{ padding: '0 14px 8px', flexShrink: 0 }}>
                  <p style={{ fontSize: 10, color: '#aaa', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'inherit' }}>Sugestões</p>
                  {EXAMPLE_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => setInput(p)}
                      style={{
                        width: '100%', textAlign: 'left', fontSize: 12, color: '#555',
                        background: '#f9f9f9', border: '1px solid #eee', borderRadius: 8,
                        padding: '7px 10px', marginBottom: 5, cursor: 'pointer', fontFamily: 'inherit',
                        lineHeight: 1.4,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fdf0f0'; e.currentTarget.style.color = '#9b2020'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#f9f9f9'; e.currentTarget.style.color = '#555'; }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ padding: '10px 12px', borderTop: '1px solid #f1f1f1', background: '#fafafa', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
                  <textarea
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                    placeholder="Descreva seu stand..."
                    rows={2}
                    style={{
                      flex: 1, padding: '8px 10px', borderRadius: 10, border: '1px solid #e5e5e5',
                      background: '#fff', fontSize: 13, resize: 'none', fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || mutation.isPending}
                    style={{
                      width: 36, height: 36, borderRadius: 10, border: 'none', cursor: 'pointer',
                      background: input.trim() && !mutation.isPending ? '#9b2020' : '#ddd',
                      color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0, transition: 'background 0.15s',
                    }}
                  >
                    <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24">
                      <path d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
                <p style={{ fontSize: 10, color: '#bbb', textAlign: 'center', margin: '5px 0 0', fontFamily: 'inherit' }}>Enter para enviar · Shift+Enter nova linha</p>
              </div>
            </>
          )}

          {/* History tab */}
          {aiTab === 'history' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {history.length === 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: 20, textAlign: 'center' }}>
                  <svg style={{ width: 32, height: 32, marginBottom: 8, opacity: 0.35 }} fill="none" stroke="#888" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                  <p style={{ color: '#888', fontSize: 13, margin: 0, fontFamily: 'inherit' }}>Nenhum stand gerado ainda.</p>
                </div>
              ) : (
                <div style={{ padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 11, color: '#aaa', fontFamily: 'inherit' }}>{history.length} stands salvos</span>
                    <button onClick={clearHistory} style={{ fontSize: 11, color: '#e97070', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Limpar</button>
                  </div>
                  {history.map(entry => (
                    <button
                      key={entry.id}
                      onClick={() => restoreHistory(entry)}
                      style={{
                        width: '100%', textAlign: 'left', background: '#fff',
                        border: '1px solid #eee', borderRadius: 10, padding: '10px 12px',
                        marginBottom: 6, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'box-shadow 0.15s',
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)'; e.currentTarget.style.borderColor = '#f5c0c0'; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = '#eee'; }}
                    >
                      <p style={{ margin: '0 0 4px', fontSize: 12, fontWeight: 600, color: '#333', lineHeight: 1.3 }}>{entry.prompt}</p>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span style={{ fontSize: 10, padding: '2px 6px', background: '#fdf0f0', color: '#9b2020', borderRadius: 20, fontWeight: 700 }}>{entry.stand.width}×{entry.stand.depth}m</span>
                        <span style={{ fontSize: 10, color: '#aaa' }}>{entry.stand.components.length} elem.</span>
                        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#ccc' }}>{new Date(entry.ts).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
