import { useState, useEffect, useCallback } from 'react';
import api from '../../api/client';
import { CrmConfigModal, useCrmConfig, ICON_DEFS, SvgIcon } from '../../components/CrmConfigModal';
import type { CrmActType } from '../../components/CrmConfigModal';

const DEFAULT_ACT_TYPES: CrmActType[] = [
  { key: 'LIGACAO',   label: 'Ligação',   color: '#3b82f6', icon: 'phone' },
  { key: 'REUNIAO',   label: 'Reunião',   color: '#8b5cf6', icon: 'users' },
  { key: 'VISITA',    label: 'Visita',    color: '#10b981', icon: 'building' },
  { key: 'EMAIL',     label: 'E-mail',    color: '#f59e0b', icon: 'mail' },
  { key: 'WHATSAPP',  label: 'WhatsApp',  color: '#22c55e', icon: 'chat' },
  { key: 'FOLLOW_UP', label: 'Follow-up', color: '#f97316', icon: 'refresh' },
  { key: 'OUTRO',     label: 'Outro',     color: '#64748b', icon: 'document' },
];

function ActIcon({ iconKey, size = 18, color = 'currentColor' }: { iconKey: string; size?: number; color?: string }) {
  if (ICON_DEFS[iconKey]) return <SvgIcon icon={iconKey} size={size} color={color} />;
  return (
    <svg style={{ width: size, height: size }} fill="none" stroke={color} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

interface ActivityWithOpp {
  id: string; type: string; title: string; notes?: string;
  dueDate?: string; status: 'PENDENTE' | 'CONCLUIDO' | 'CANCELADO';
  opportunityId: string;
  opportunity: { title: string; clientName: string; assignedToName?: string };
}
interface AgendaData {
  overdue: ActivityWithOpp[];
  today: ActivityWithOpp[];
  tomorrow: ActivityWithOpp[];
}
interface Opportunity {
  id: string;
  title: string;
  clientName: string;
}

function fmtTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (d.getHours() === 0 && d.getMinutes() === 0) return '';
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ─── Styles ────────────────────────────────────────────────────────────────

function AgendaStyles() {
  return (
    <style>{`
      @keyframes ag-fade-up {
        from { opacity: 0; transform: translateY(12px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes ag-gradient {
        0%,100% { background-position: 0% 50%; }
        50%      { background-position: 100% 50%; }
      }
      @keyframes ag-skeleton {
        0%   { background-position: -200% 0; }
        100% { background-position:  200% 0; }
      }
      @keyframes ag-beam {
        0%   { transform: translateX(-120%) skewX(-20deg); }
        100% { transform: translateX(500%)  skewX(-20deg); }
      }
      @keyframes ag-pulse {
        0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.35); }
        50%      { box-shadow: 0 0 0 7px rgba(239,68,68,0); }
      }
      @keyframes ag-check-pop {
        0%   { transform: scale(0.5); opacity: 0; }
        60%  { transform: scale(1.25); }
        100% { transform: scale(1); opacity: 1; }
      }
      @keyframes ag-modal-in {
        from { opacity: 0; transform: scale(0.95) translateY(10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }

      .ag-title {
        background: linear-gradient(135deg, #1a1a2e 0%, #710505 40%, #c9962a 60%, #710505 80%, #1a1a2e 100%);
        background-size: 300% 300%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: ag-gradient 6s ease infinite;
      }
      .ag-row { transition: transform 0.18s ease, box-shadow 0.18s ease; }
      .ag-row:hover { transform: translateX(4px); box-shadow: 0 4px 16px rgba(0,0,0,0.07); }
      .ag-done-row { transition: opacity 0.3s; }
      .ag-complete-btn {
        position: relative; overflow: hidden;
        transition: all 0.18s ease;
      }
      .ag-complete-btn::after {
        content: '';
        position: absolute; inset: 0; width: 35%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
        animation: ag-beam 2.5s ease-in-out infinite;
        pointer-events: none;
      }
      .ag-complete-btn:hover { transform: scale(1.04); box-shadow: 0 4px 14px rgba(16,185,129,0.4); }
      .ag-skeleton {
        background: linear-gradient(90deg, #f1f5f9 25%, #e8edf3 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: ag-skeleton 1.4s ease-in-out infinite;
        border-radius: 10px;
      }
      .ag-fade-up { animation: ag-fade-up 0.38s ease-out forwards; }
      .ag-overdue-pulse { animation: ag-pulse 2s ease-out infinite; }
      .ag-check { animation: ag-check-pop 0.4s ease-out forwards; }
      .ag-modal-in { animation: ag-modal-in 0.22s ease-out forwards; }

      .ag-input {
        width: 100%; padding: 10px 13px;
        border: 1.5px solid #e2e8f0; border-radius: 10px;
        font-size: 13px; color: #1a1a2e; background: #fff;
        outline: none; transition: border-color 0.15s;
        box-sizing: border-box;
      }
      .ag-input:focus { border-color: #710505; }
      .ag-label { font-size: 12px; font-weight: 600; color: #475569; margin-bottom: 5px; display: block; }
      .ag-type-btn {
        display: flex; flex-direction: column; align-items: center; gap: 5px;
        padding: 10px 8px; border-radius: 10px; border: 1.5px solid #e2e8f0;
        background: #fff; cursor: pointer; transition: all 0.15s; font-size: 11px;
        color: #64748b; font-weight: 600; min-width: 60px;
      }
      .ag-type-btn:hover { border-color: #710505; color: #710505; background: #fff5f5; }
      .ag-type-btn.selected { border-color: #710505; background: #fff5f5; color: #710505; }
    `}</style>
  );
}

// ─── Skeleton ──────────────────────────────────────────────────────────────

function AgendaSkeleton() {
  return (
    <div>
      {[3, 2, 1].map((count, si) => (
        <div key={si} style={{ marginBottom: 28 }}>
          <div className="ag-skeleton" style={{ width: 120, height: 22, marginBottom: 14 }} />
          {Array.from({ length: count }).map((_, i) => (
            <div key={i} className="ag-skeleton" style={{ height: 70, marginBottom: 8, opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Activity Row ──────────────────────────────────────────────────────────

function ActivityRow({ act, onComplete, accentColor, actTypes }: {
  act: ActivityWithOpp;
  onComplete: (oppId: string, actId: string) => void;
  accentColor: string;
  actTypes: CrmActType[];
}) {
  const done = act.status === 'CONCLUIDO';
  const time = fmtTime(act.dueDate);
  const actDef = actTypes.find(t => t.key === act.type);

  return (
    <div className={done ? 'ag-done-row' : 'ag-row'}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '14px 16px 14px 20px',
        background: done ? 'linear-gradient(135deg, #f0fdf4, #ecfdf5)' : '#fff',
        borderRadius: 12, marginBottom: 8,
        border: `1px solid ${done ? '#bbf7d0' : '#eef0f3'}`,
        borderLeft: done ? `3px solid #10b981` : `3px solid ${accentColor}`,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        opacity: done ? 0.72 : 1,
        position: 'relative', overflow: 'hidden',
      }}>

      <div style={{
        fontSize: 22, flexShrink: 0, width: 40, height: 40,
        background: done ? 'rgba(16,185,129,0.08)' : `${accentColor}10`,
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {done
          ? <svg style={{ width: 20, height: 20 }} fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          : <ActIcon iconKey={actDef?.icon ?? 'document'} size={20} color={accentColor} />
        }
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontSize: 13, fontWeight: done ? 400 : 600, color: done ? '#6b7280' : '#1a1a2e', textDecoration: done ? 'line-through' : 'none' }}>
            {act.title}
          </span>
          <span style={{ fontSize: 10, background: `${accentColor}15`, color: accentColor, borderRadius: 5, padding: '2px 7px', fontWeight: 700, letterSpacing: '0.03em' }}>
            {actDef?.label ?? act.type}
          </span>
          {time && (
            <span style={{ fontSize: 11, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
              <svg style={{ width: 11, height: 11 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> {time}
            </span>
          )}
        </div>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
          <span style={{ fontWeight: 500, color: '#64748b' }}>{act.opportunity.clientName}</span>
          {' · '}
          <span>{act.opportunity.title}</span>
        </p>
        {act.notes && <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 3 }}>{act.notes}</p>}
      </div>

      {!done ? (
        <button className="ag-complete-btn" onClick={() => onComplete(act.opportunityId, act.id)}
          style={{
            flexShrink: 0, background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#fff', border: 'none', borderRadius: 9,
            padding: '7px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
          }}>
          Concluir
        </button>
      ) : (
        <span className="ag-check" style={{ flexShrink: 0, fontSize: 13, color: '#10b981', fontWeight: 700, background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 8 }}>
          ✓ Feito
        </span>
      )}
    </div>
  );
}

// ─── Section ───────────────────────────────────────────────────────────────

function Section({ title, color, icon, items, onComplete, delay = 0, actTypes }: {
  title: string; color: string; icon: JSX.Element;
  items: ActivityWithOpp[];
  onComplete: (oppId: string, actId: string) => void;
  delay?: number;
  actTypes: CrmActType[];
}) {
  return (
    <div className="ag-fade-up" style={{ marginBottom: 32, animationDelay: `${delay}s` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{items.length} atividade{items.length !== 1 ? 's' : ''}</p>
        </div>
        {items.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: 12, background: color, color: '#fff', borderRadius: 20, padding: '2px 10px', fontWeight: 700, boxShadow: `0 2px 8px ${color}55` }}>
            {items.length}
          </span>
        )}
      </div>
      <div style={{ height: 1, background: `linear-gradient(90deg, ${color}40, transparent)`, marginBottom: 12 }} />
      {items.length === 0 ? (
        <div style={{ padding: '16px 20px', background: '#fafafa', borderRadius: 12, border: '1px dashed #e2e8f0', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: '#cbd5e1', margin: 0 }}>Nenhuma atividade. 🎉</p>
        </div>
      ) : (
        items.map((a, i) => (
          <div key={a.id} className="ag-fade-up" style={{ animationDelay: `${delay + i * 0.06}s` }}>
            <ActivityRow act={a} onComplete={onComplete} accentColor={color} actTypes={actTypes} />
          </div>
        ))
      )}
    </div>
  );
}

// ─── New Activity Modal ─────────────────────────────────────────────────────

function NewActivityModal({ onClose, onSaved, actTypes }: { onClose: () => void; onSaved: () => void; actTypes: CrmActType[] }) {
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [oppSearch, setOppSearch] = useState('');
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [showOppList, setShowOppList] = useState(false);
  const [type, setType] = useState(actTypes[0]?.key ?? 'LIGACAO');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/crm/opportunities').then(r => setOpps(r.data)).catch(() => {});
  }, []);

  const filteredOpps = opps.filter(o =>
    o.title.toLowerCase().includes(oppSearch.toLowerCase()) ||
    o.clientName.toLowerCase().includes(oppSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!selectedOpp) { setError('Selecione uma oportunidade.'); return; }
    if (!title.trim()) { setError('Informe o título da atividade.'); return; }
    setError('');
    setSaving(true);
    try {
      let dueDateISO: string | undefined;
      if (dueDate) {
        dueDateISO = dueTime ? `${dueDate}T${dueTime}:00` : `${dueDate}T00:00:00`;
      }
      await api.post(`/crm/opportunities/${selectedOpp.id}/activities`, {
        type,
        title: title.trim(),
        notes: notes.trim() || undefined,
        dueDate: dueDateISO,
      });
      onSaved();
      onClose();
    } catch {
      setError('Erro ao salvar. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="ag-modal-in" style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 520, boxShadow: '0 24px 60px rgba(0,0,0,0.18)', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: 0 }}>Nova Atividade</h2>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>Adicione uma atividade à sua agenda</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}>
            <svg style={{ width: 20, height: 20 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', maxHeight: '70vh', overflowY: 'auto' }}>

          {/* Tipo */}
          <div style={{ marginBottom: 18 }}>
            <label className="ag-label">Tipo de atividade</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {actTypes.map(t => (
                <button
                  key={t.key}
                  className={`ag-type-btn${type === t.key ? ' selected' : ''}`}
                  onClick={() => setType(t.key)}
                  type="button"
                >
                  <span style={{ color: type === t.key ? t.color : '#94a3b8' }}>
                    <ActIcon iconKey={t.icon} size={18} color={type === t.key ? t.color : '#94a3b8'} />
                  </span>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Título */}
          <div style={{ marginBottom: 14 }}>
            <label className="ag-label">Título <span style={{ color: '#ef4444' }}>*</span></label>
            <input
              className="ag-input"
              placeholder="Ex: Ligar para confirmar reunião"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          {/* Oportunidade */}
          <div style={{ marginBottom: 14, position: 'relative' }}>
            <label className="ag-label">Oportunidade <span style={{ color: '#ef4444' }}>*</span></label>
            {selectedOpp ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', border: '1.5px solid #710505', borderRadius: 10, background: '#fff5f5' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{selectedOpp.title}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{selectedOpp.clientName}</p>
                </div>
                <button onClick={() => { setSelectedOpp(null); setOppSearch(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                  <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <>
                <input
                  className="ag-input"
                  placeholder="Buscar oportunidade ou cliente..."
                  value={oppSearch}
                  onChange={e => { setOppSearch(e.target.value); setShowOppList(true); }}
                  onFocus={() => setShowOppList(true)}
                />
                {showOppList && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 10, maxHeight: 200, overflowY: 'auto', marginTop: 4 }}>
                    {filteredOpps.length === 0 ? (
                      <p style={{ padding: '12px 14px', fontSize: 13, color: '#94a3b8', margin: 0 }}>Nenhuma oportunidade encontrada.</p>
                    ) : filteredOpps.map(o => (
                      <button
                        key={o.id}
                        type="button"
                        onClick={() => { setSelectedOpp(o); setShowOppList(false); setOppSearch(''); }}
                        style={{ width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: '1px solid #f8fafc' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fafc')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                      >
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>{o.title}</p>
                        <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{o.clientName}</p>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Data e hora */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label className="ag-label">Data</label>
              <input className="ag-input" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
            <div>
              <label className="ag-label">Horário</label>
              <input className="ag-input" type="time" value={dueTime} onChange={e => setDueTime(e.target.value)} />
            </div>
          </div>

          {/* Notas */}
          <div style={{ marginBottom: 6 }}>
            <label className="ag-label">Observações</label>
            <textarea
              className="ag-input"
              style={{ resize: 'vertical', minHeight: 72 }}
              placeholder="Anotações opcionais..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          {error && (
            <p style={{ fontSize: 12, color: '#ef4444', margin: '8px 0 0', fontWeight: 500 }}>{error}</p>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px 20px', borderTop: '1px solid #f1f5f9', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '9px 20px', borderRadius: 10, border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: '9px 22px', borderRadius: 10, border: 'none', background: saving ? '#ccc' : 'linear-gradient(135deg, #710505, #a00000)', color: '#fff', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', boxShadow: '0 2px 8px rgba(113,5,5,0.3)' }}
          >
            {saving ? 'Salvando...' : 'Criar Atividade'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── History Tab ───────────────────────────────────────────────────────────

interface HistoryItem extends ActivityWithOpp {
  doneAt?: string;
  createdAt: string;
}
interface HistoryData {
  activities: HistoryItem[];
  total: number;
  page: number;
  pages: number;
}

function HistoryTab({ actTypes }: { actTypes: CrmActType[] }) {
  const [data, setData]       = useState<HistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [type, setType]       = useState('');
  const [status, setStatus]   = useState('');
  const [from, setFrom]       = useState('');
  const [to, setTo]           = useState('');

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (search) params.set('search', search);
      if (type)   params.set('type', type);
      if (status) params.set('status', status);
      if (from)   params.set('from', from);
      if (to)     params.set('to', to);
      const res = await api.get<HistoryData>(`/crm/history?${params}`);
      setData(res.data);
      setPage(p);
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  }, [search, type, status, from, to]);

  useEffect(() => { load(1); }, [load]);

  const statusColor = (s: string) =>
    s === 'CONCLUIDO' ? { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a', label: 'Concluído' } :
    s === 'CANCELADO' ? { bg: '#fef2f2', border: '#fecaca', text: '#dc2626', label: 'Cancelado' } :
                        { bg: '#fff7ed', border: '#fed7aa', text: '#ea580c', label: 'Pendente'  };

  return (
    <div>
      {/* Filtros */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        <div style={{ position: 'relative', flex: '1 1 200px' }}>
          <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#94a3b8' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input
            className="ag-input" style={{ paddingLeft: 32 }}
            placeholder="Buscar atividade, cliente..."
            value={search} onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="ag-input" style={{ flex: '0 1 140px' }} value={type} onChange={e => setType(e.target.value)}>
          <option value="">Todos os tipos</option>
          {actTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
        <select className="ag-input" style={{ flex: '0 1 140px' }} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="CONCLUIDO">Concluído</option>
          <option value="CANCELADO">Cancelado</option>
        </select>
        <input className="ag-input" style={{ flex: '0 1 140px' }} type="date" value={from} onChange={e => setFrom(e.target.value)} placeholder="De" title="De" />
        <input className="ag-input" style={{ flex: '0 1 140px' }} type="date" value={to}   onChange={e => setTo(e.target.value)}   placeholder="Até" title="Até" />
      </div>

      {/* Tabela */}
      {loading ? (
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ag-skeleton" style={{ height: 64, marginBottom: 8, opacity: 1 - i * 0.15 }} />
          ))}
        </div>
      ) : !data || data.activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: '#fafafa', borderRadius: 14, border: '1px dashed #e2e8f0' }}>
          <svg style={{ width: 40, height: 40, marginBottom: 10, opacity: 0.3 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
          <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>Nenhuma atividade encontrada.</p>
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
            {data.total} atividade{data.total !== 1 ? 's' : ''} encontrada{data.total !== 1 ? 's' : ''}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {data.activities.map(act => {
              const sc = statusColor(act.status);
              const time = act.doneAt
                ? new Date(act.doneAt).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : act.dueDate
                  ? new Date(act.dueDate).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  : '—';

              return (
                <div key={act.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', background: '#fff', borderRadius: 12,
                  border: '1px solid #eef0f3', borderLeft: `3px solid ${sc.border}`,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: `${sc.bg}`, border: `1px solid ${sc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: sc.text }}>
                    <ActIcon iconKey={actTypes.find(t => t.key === act.type)?.icon ?? 'document'} size={18} color={sc.text} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e' }}>{act.title}</span>
                      <span style={{ fontSize: 10, background: '#f1f5f9', color: '#64748b', borderRadius: 5, padding: '2px 7px', fontWeight: 600 }}>
                        {actTypes.find(t => t.key === act.type)?.label ?? act.type}
                      </span>
                      <span style={{ fontSize: 10, background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 5, padding: '2px 7px', fontWeight: 700 }}>
                        {sc.label}
                      </span>
                    </div>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>
                      <span style={{ fontWeight: 500, color: '#64748b' }}>{act.opportunity.clientName}</span>
                      {' · '}{act.opportunity.title}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>{act.status === 'CONCLUIDO' ? 'Concluído em' : 'Data'}</p>
                    <p style={{ fontSize: 12, color: '#475569', fontWeight: 500, margin: '2px 0 0' }}>{time}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Paginação */}
          {data.pages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20 }}>
              <button
                disabled={page <= 1}
                onClick={() => load(page - 1)}
                style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1 }}
              >← Anterior</button>
              <span style={{ fontSize: 13, color: '#94a3b8' }}>Página {page} de {data.pages}</span>
              <button
                disabled={page >= data.pages}
                onClick={() => load(page + 1)}
                style={{ padding: '7px 14px', borderRadius: 9, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 600, cursor: page >= data.pages ? 'not-allowed' : 'pointer', opacity: page >= data.pages ? 0.4 : 1 }}
              >Próxima →</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export function CRMAgenda() {
  const [tab, setTab]         = useState<'agenda' | 'history'>('agenda');
  const [agenda, setAgenda]   = useState<AgendaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const { config, setConfig } = useCrmConfig();
  const actTypes = config?.actTypes ?? DEFAULT_ACT_TYPES;

  const load = useCallback(async () => {
    try {
      const res = await api.get<AgendaData>('/crm/agenda');
      setAgenda(res.data);
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleComplete = async (oppId: string, actId: string) => {
    try {
      await api.post(`/crm/opportunities/${oppId}/activities/${actId}/complete`, {});
      load();
    } catch {/* ignore */}
  };

  const today = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const totalPending = agenda ? agenda.overdue.length + agenda.today.length : 0;

  return (
    <>
      <AgendaStyles />

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 className="ag-title" style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
              Agenda
            </h1>
            <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3, textTransform: 'capitalize' }}>
              {today}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowConfig(true)} title="Configurar tipos de atividade" style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 12,
              padding: '10px 14px', cursor: 'pointer', color: '#64748b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#e2e8f0'; e.currentTarget.style.color = '#1a1a2e'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#64748b'; }}
            >
              <svg style={{ width: 18, height: 18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            {tab === 'agenda' && (
              <button
                onClick={() => setShowModal(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 18px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #710505, #a00000)',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(113,5,5,0.35)',
                }}
              >
                <svg style={{ width: 16, height: 16 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                </svg>
                Nova Atividade
              </button>
            )}
          </div>
        </div>

        {/* Abas */}
        <div style={{ display: 'flex', gap: 4, marginTop: 18, borderBottom: '2px solid #f1f5f9' }}>
          {([
            { key: 'agenda',  label: 'Agenda', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { key: 'history', label: 'Histórico', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '9px 16px', background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: tab === t.key ? 700 : 500,
              color: tab === t.key ? '#710505' : '#94a3b8',
              borderBottom: tab === t.key ? '2px solid #710505' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.15s',
            }}>
              <svg style={{ width: 15, height: 15 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} />
              </svg>
              {t.label}
            </button>
          ))}
        </div>

        {/* Banner só na aba agenda */}
        {tab === 'agenda' && totalPending > 0 && (
          <div className="ag-overdue-pulse ag-fade-up" style={{
            marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, #fff7ed, #fef3c7)',
            border: '1px solid #fde68a', borderLeft: '4px solid #f59e0b',
            borderRadius: 10, padding: '10px 16px',
          }}>
            <svg style={{ width: 18, height: 18, flexShrink: 0 }} fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            <span style={{ fontSize: 13, color: '#92400e', fontWeight: 600 }}>
              {totalPending} atividade{totalPending > 1 ? 's' : ''} pendente{totalPending > 1 ? 's' : ''} para hoje
            </span>
          </div>
        )}
        {tab === 'agenda' && totalPending === 0 && !loading && agenda && (
          <div className="ag-fade-up" style={{
            marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'linear-gradient(135deg, #f0fdf4, #ecfdf5)',
            border: '1px solid #bbf7d0', borderLeft: '4px solid #10b981',
            borderRadius: 10, padding: '10px 16px',
          }}>
            <svg style={{ width: 18, height: 18, flexShrink: 0 }} fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <span style={{ fontSize: 13, color: '#065f46', fontWeight: 600 }}>Nenhuma pendência para hoje!</span>
          </div>
        )}
      </div>

      {/* ── Content ── */}
      {tab === 'agenda' ? (
        loading ? <AgendaSkeleton /> : agenda ? (
          <>
            <Section title="Atrasadas" color="#ef4444" icon={<svg style={{width:18,height:18}} fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} items={agenda.overdue}  onComplete={handleComplete} delay={0}    actTypes={actTypes} />
            <Section title="Hoje"      color="#f59e0b" icon={<svg style={{width:18,height:18}} fill="none" stroke="#f59e0b" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>} items={agenda.today}    onComplete={handleComplete} delay={0.08} actTypes={actTypes} />
            <Section title="Amanhã"    color="#3b82f6" icon={<svg style={{width:18,height:18}} fill="none" stroke="#3b82f6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>} items={agenda.tomorrow} onComplete={handleComplete} delay={0.16} actTypes={actTypes} />
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: 48, color: '#cbd5e1' }}>
            <p style={{ fontSize: 14 }}>Erro ao carregar a agenda.</p>
          </div>
        )
      ) : (
        <HistoryTab actTypes={actTypes} />
      )}

      {/* ── Modal ── */}
      {showModal && (
        <NewActivityModal
          onClose={() => setShowModal(false)}
          onSaved={() => { load(); }}
          actTypes={actTypes}
        />
      )}

      {/* ── Config Modal ── */}
      {showConfig && (
        <CrmConfigModal
          onClose={() => setShowConfig(false)}
          onSaved={cfg => { setConfig(cfg); setShowConfig(false); }}
        />
      )}
    </>
  );
}
