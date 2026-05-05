import { useState, useEffect } from 'react';
import api from '../api/client';

// ─── Types ─────────────────────────────────────────────────────────────────

export interface CrmStage {
  key: string; label: string; color: string; icon: string;
}
export interface CrmActType {
  key: string; label: string; color: string; icon: string;
}
export interface CrmConfig {
  stages: CrmStage[];
  actTypes: CrmActType[];
}

// ─── Preset palette & icons ────────────────────────────────────────────────

const COLORS = [
  '#64748b','#3b82f6','#8b5cf6','#ec4899','#f59e0b',
  '#f97316','#10b981','#22c55e','#ef4444','#06b6d4',
  '#710505','#1d4ed8','#7c3aed','#b45309','#0f766e',
];

const ICON_DEFS: Record<string, string> = {
  user:      'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
  users:     'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
  phone:     'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z',
  mail:      'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
  chat:      'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
  document:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  clock:     'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  check:     'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
  x:         'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
  star:      'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  lightning: 'M13 10V3L4 14h7v7l9-11h-7z',
  refresh:   'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
  flag:      'M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9',
  building:  'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  chart:     'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
  trophy:    'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  handshake: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

const ICON_KEYS = Object.keys(ICON_DEFS);

function SvgIcon({ icon, size = 16, color = 'currentColor' }: { icon: string; size?: number; color?: string }) {
  return (
    <svg width={size} height={size} fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={ICON_DEFS[icon] ?? ICON_DEFS.document} />
    </svg>
  );
}

// ─── Row editor ────────────────────────────────────────────────────────────

function RowEditor({ item, onChange, onDelete, canDelete }: {
  item: CrmStage | CrmActType;
  onChange: (updated: typeof item) => void;
  onDelete: () => void;
  canDelete: boolean;
}) {
  const [showIcons, setShowIcons] = useState(false);
  const [showColors, setShowColors] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
      {/* Icon picker */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => { setShowIcons(v => !v); setShowColors(false); }}
          title="Escolher ícone"
          style={{ width: 36, height: 36, borderRadius: 9, border: `2px solid ${item.color}40`, background: `${item.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <SvgIcon icon={item.icon} size={16} color={item.color} />
        </button>
        {showIcons && (
          <div style={{ position: 'absolute', top: 40, left: 0, zIndex: 100, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 10, display: 'grid', gridTemplateColumns: 'repeat(5, 32px)', gap: 4, width: 200 }}>
            {ICON_KEYS.map(k => (
              <button
                key={k}
                type="button"
                onClick={() => { onChange({ ...item, icon: k }); setShowIcons(false); }}
                title={k}
                style={{ width: 32, height: 32, borderRadius: 7, border: item.icon === k ? `2px solid ${item.color}` : '1.5px solid #e2e8f0', background: item.icon === k ? `${item.color}15` : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <SvgIcon icon={k} size={14} color={item.icon === k ? item.color : '#94a3b8'} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Color picker */}
      <div style={{ position: 'relative' }}>
        <button
          type="button"
          onClick={() => { setShowColors(v => !v); setShowIcons(false); }}
          title="Escolher cor"
          style={{ width: 28, height: 28, borderRadius: 7, border: '2px solid #e2e8f0', background: item.color, cursor: 'pointer', flexShrink: 0 }}
        />
        {showColors && (
          <div style={{ position: 'absolute', top: 34, left: 0, zIndex: 100, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 10, display: 'flex', flexWrap: 'wrap', gap: 6, width: 180 }}>
            {COLORS.map(c => (
              <button
                key={c}
                type="button"
                onClick={() => { onChange({ ...item, color: c }); setShowColors(false); }}
                style={{ width: 28, height: 28, borderRadius: 7, background: c, border: item.color === c ? '3px solid #1a1a2e' : '2px solid transparent', cursor: 'pointer' }}
              />
            ))}
            <input
              type="color"
              value={item.color}
              onChange={e => onChange({ ...item, color: e.target.value })}
              title="Cor personalizada"
              style={{ width: 28, height: 28, borderRadius: 7, border: '1.5px solid #e2e8f0', cursor: 'pointer', padding: 0 }}
            />
          </div>
        )}
      </div>

      {/* Label */}
      <input
        value={item.label}
        onChange={e => onChange({ ...item, label: e.target.value })}
        style={{ flex: 1, padding: '7px 10px', border: '1.5px solid #e2e8f0', borderRadius: 9, fontSize: 13, color: '#1a1a2e', outline: 'none' }}
        onFocus={e => (e.currentTarget.style.borderColor = '#710505')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e2e8f0')}
        placeholder="Nome do campo"
      />

      {/* Delete */}
      <button
        type="button"
        onClick={onDelete}
        disabled={!canDelete}
        title="Remover"
        style={{ width: 30, height: 30, borderRadius: 8, border: '1.5px solid #fecaca', background: '#fff', color: '#ef4444', cursor: canDelete ? 'pointer' : 'not-allowed', opacity: canDelete ? 1 : 0.3, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
      >
        <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
}

// ─── Main Modal ─────────────────────────────────────────────────────────────

export function CrmConfigModal({ onClose, onSaved }: { onClose: () => void; onSaved: (cfg: CrmConfig) => void }) {
  const [tab, setTab]         = useState<'stages' | 'types'>('stages');
  const [stages, setStages]   = useState<CrmStage[]>([]);
  const [actTypes, setActTypes] = useState<CrmActType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);

  useEffect(() => {
    api.get<CrmConfig>('/crm/config').then(r => {
      setStages(r.data.stages);
      setActTypes(r.data.actTypes);
    }).finally(() => setLoading(false));
  }, []);

  const addStage = () => setStages(prev => [...prev, { key: `stage_${Date.now()}`, label: 'Novo Estágio', color: '#64748b', icon: 'flag' }]);
  const addType  = () => setActTypes(prev => [...prev, { key: `type_${Date.now()}`,  label: 'Novo Tipo',    color: '#64748b', icon: 'document' }]);

  const handleSave = async () => {
    if (stages.length < 1) return;
    setSaving(true);
    try {
      const { data } = await api.patch<CrmConfig>('/crm/config', { stages, actTypes });
      onSaved(data);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 540, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid #f1f5f9', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Configurar campos do CRM</h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0' }}>Personalize estágios e tipos de atividade</p>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
              <svg width={20} height={20} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 4 }}>
            {([
              { key: 'stages', label: 'Estágios do Pipeline' },
              { key: 'types',  label: 'Tipos de Atividade' },
            ] as const).map(t => (
              <button key={t.key} onClick={() => setTab(t.key)} style={{
                padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
                color: tab === t.key ? '#710505' : '#94a3b8',
                borderBottom: tab === t.key ? '2px solid #710505' : '2px solid transparent',
                marginBottom: -1,
              }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
          {loading ? (
            <div style={{ padding: '32px 0', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Carregando...</div>
          ) : tab === 'stages' ? (
            <>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                Defina as etapas do funil de vendas. A ordem é a mesma que aparece no Pipeline.
              </p>
              {stages.map((s, i) => (
                <RowEditor
                  key={s.key}
                  item={s}
                  onChange={updated => setStages(prev => prev.map((x, xi) => xi === i ? updated : x))}
                  onDelete={() => setStages(prev => prev.filter((_, xi) => xi !== i))}
                  canDelete={stages.length > 1}
                />
              ))}
              <button
                type="button" onClick={addStage}
                style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, border: '1.5px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}
              >
                <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Adicionar estágio
              </button>
            </>
          ) : (
            <>
              <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>
                Defina os tipos de atividade disponíveis na Agenda e no Pipeline.
              </p>
              {actTypes.map((t, i) => (
                <RowEditor
                  key={t.key}
                  item={t}
                  onChange={updated => setActTypes(prev => prev.map((x, xi) => xi === i ? updated : x))}
                  onDelete={() => setActTypes(prev => prev.filter((_, xi) => xi !== i))}
                  canDelete={actTypes.length > 1}
                />
              ))}
              <button
                type="button" onClick={addType}
                style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 9, border: '1.5px dashed #cbd5e1', background: '#f8fafc', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', width: '100%', justifyContent: 'center' }}
              >
                <svg width={14} height={14} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
                Adicionar tipo
              </button>
            </>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave} disabled={saving || loading}
            style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: saving ? '#ccc' : 'linear-gradient(135deg, #710505, #a00000)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(113,5,5,0.3)' }}
          >
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Hook to load config ────────────────────────────────────────────────────

export function useCrmConfig() {
  const [config, setConfig] = useState<CrmConfig | null>(null);

  useEffect(() => {
    api.get<CrmConfig>('/crm/config').then(r => setConfig(r.data)).catch(() => {});
  }, []);

  return { config, setConfig };
}

export { ICON_DEFS, SvgIcon };
