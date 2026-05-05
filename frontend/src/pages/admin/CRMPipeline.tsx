import { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { useDialog } from '../../components/ConfirmDialog';
import { useAuthStore } from '../../store/auth.store';
import { CrmConfigModal, useCrmConfig } from '../../components/CrmConfigModal';
import type { CrmStage } from '../../components/CrmConfigModal';

// ─── Types ─────────────────────────────────────────────────────────────────

type Stage = string;

interface Activity {
  id: string; type: string; title: string;
  notes?: string; dueDate?: string;
  status: 'PENDENTE' | 'CONCLUIDO' | 'CANCELADO';
}
interface Client {
  id: string; name: string;
}
interface Opportunity {
  id: string; title: string; clientName: string;
  clientEmail?: string; clientPhone?: string; companyName?: string;
  value: number; probability: number; stage: Stage;
  source?: string; notes?: string; expectedClose?: string;
  assignedToId?: string; assignedToName?: string;
  clientTenantId?: string | null;
  activities: Activity[]; createdAt: string;
}
interface Stats {
  byStage: { stage: Stage; count: number; total: number }[];
  pipelineValue: number; wonValue: number; total: number;
}

// ─── Constants ─────────────────────────────────────────────────────────────

const DEFAULT_STAGES: CrmStage[] = [
  { key: 'LEAD_NOVO',        label: 'Lead Novo',        color: '#64748b', icon: 'user' },
  { key: 'CONTATO_FEITO',    label: 'Contato Feito',    color: '#3b82f6', icon: 'phone' },
  { key: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: '#8b5cf6', icon: 'document' },
  { key: 'NEGOCIACAO',       label: 'Negociação',       color: '#f59e0b', icon: 'chat' },
  { key: 'FECHAMENTO',       label: 'Fechamento',       color: '#f97316', icon: 'clock' },
  { key: 'GANHO',            label: 'Ganho',            color: '#10b981', icon: 'check' },
  { key: 'PERDIDO',          label: 'Perdido',          color: '#ef4444', icon: 'x' },
];

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
const fmtDate = (iso?: string) =>
  iso ? new Date(iso).toLocaleDateString('pt-BR') : '';

// ─── CSS Animations ────────────────────────────────────────────────────────

function CRMStyles() {
  return (
    <style>{`
      @keyframes crm-beam {
        0%   { transform: translateX(-120%) skewX(-20deg); }
        100% { transform: translateX(500%)  skewX(-20deg); }
      }
      @keyframes crm-gradient {
        0%, 100% { background-position: 0% 50%; }
        50%       { background-position: 100% 50%; }
      }
      @keyframes crm-fade-up {
        from { opacity: 0; transform: translateY(14px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes crm-skeleton {
        0%   { background-position: -200% 0; }
        100% { background-position:  200% 0; }
      }
      @keyframes crm-pulse-ring {
        0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.45); }
        70%  { box-shadow: 0 0 0 6px rgba(245,158,11,0); }
        100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
      }
      @keyframes crm-dot-blink {
        0%, 100% { opacity: 1; } 50% { opacity: 0.3; }
      }

      .crm-title {
        background: linear-gradient(135deg, #1a1a2e 0%, #710505 40%, #c9962a 60%, #710505 80%, #1a1a2e 100%);
        background-size: 300% 300%;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: crm-gradient 6s ease infinite;
      }

      .crm-beam-btn {
        position: relative;
        overflow: hidden;
      }
      .crm-beam-btn::after {
        content: '';
        position: absolute;
        inset: 0;
        width: 35%;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
        animation: crm-beam 2.8s ease-in-out infinite;
        pointer-events: none;
      }

      .crm-magic-card {
        position: relative;
        overflow: hidden;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
        cursor: pointer;
      }
      .crm-magic-card::before {
        content: '';
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: radial-gradient(
          480px circle at var(--mx, 50%) var(--my, 50%),
          rgba(113,5,5,0.06) 0%,
          transparent 55%
        );
        opacity: 0;
        transition: opacity 0.35s;
        pointer-events: none;
        z-index: 0;
      }
      .crm-magic-card:hover::before { opacity: 1; }
      .crm-magic-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 10px 28px rgba(0,0,0,0.09), 0 2px 8px rgba(113,5,5,0.05) !important;
      }

      .crm-stat {
        position: relative;
        overflow: hidden;
        transition: transform 0.18s ease, box-shadow 0.18s ease;
      }
      .crm-stat::after {
        content: '';
        position: absolute;
        inset: 0;
        background: linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.22) 50%, transparent 70%);
        transform: translateX(-100%);
        transition: transform 0.55s ease;
        pointer-events: none;
      }
      .crm-stat:hover::after  { transform: translateX(100%); }
      .crm-stat:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important; }

      .crm-skeleton {
        background: linear-gradient(90deg, #f1f5f9 25%, #e8edf3 50%, #f1f5f9 75%);
        background-size: 200% 100%;
        animation: crm-skeleton 1.4s ease-in-out infinite;
        border-radius: 8px;
      }

      .crm-fade-up { animation: crm-fade-up 0.38s ease-out forwards; }

      .crm-pending-badge { animation: crm-pulse-ring 2s ease-out infinite; }

      .crm-dot { animation: crm-dot-blink 1.5s ease-in-out infinite; }

      .crm-input:focus {
        border-color: rgba(113,5,5,0.4) !important;
        box-shadow: 0 0 0 3px rgba(113,5,5,0.08);
        outline: none;
      }
      .crm-col-drop-over {
        background: rgba(113,5,5,0.025) !important;
        border: 1.5px dashed rgba(113,5,5,0.18) !important;
      }
    `}</style>
  );
}

// ─── Animated Counter ──────────────────────────────────────────────────────

function AnimatedNumber({ value, prefix = '' }: { value: string; prefix?: string }) {
  const [displayed, setDisplayed] = useState(value);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      setDisplayed(value);
      prev.current = value;
    }
  }, [value]);

  return (
    <span key={displayed} style={{ display: 'inline-block', animation: 'crm-fade-up 0.35s ease-out' }}>
      {prefix}{displayed}
    </span>
  );
}

// ─── Skeleton Loading ──────────────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {[0, 1, 2, 3].map(i => (
        <div key={i} style={{ flex: '0 0 220px' }}>
          <div className="crm-skeleton" style={{ height: 64, marginBottom: 8 }} />
          {[0, 1].map(j => (
            <div key={j} className="crm-skeleton" style={{ height: 88, marginBottom: 8, opacity: 1 - j * 0.25 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

// ─── Opportunity Modal ─────────────────────────────────────────────────────

function OppModal({ opp, onClose, onSave, onDelete, onAddActivity, onCompleteActivity, clients, stages, actTypes }: {
  opp: Opportunity | null;
  onClose: () => void;
  onSave: (data: Partial<Opportunity>) => void;
  onDelete?: () => void;
  onAddActivity: (oppId: string, data: { type: string; title: string; dueDate?: string }) => void;
  onCompleteActivity: (oppId: string, actId: string) => void;
  clients: Client[];
  stages: CrmStage[];
  actTypes: { key: string; label: string }[];
}) {
  const firstStageKey = stages[0]?.key ?? 'LEAD_NOVO';
  const [form, setForm] = useState<Partial<Opportunity>>(opp ?? { stage: firstStageKey, value: 0, probability: 50 });
  const [selectedClientId, setSelectedClientId] = useState<string>(opp?.clientTenantId ?? '');
  const [actForm, setActForm] = useState({ type: actTypes[0]?.key ?? 'LIGACAO', title: '', dueDate: '' });
  const [tab, setTab] = useState<'info' | 'atividades'>('info');
  const set = (k: keyof Opportunity, v: any) => setForm(p => ({ ...p, [k]: v }));

  const inp: React.CSSProperties = {
    width: '100%', padding: '8px 11px', borderRadius: 8, fontSize: 13,
    border: '1.5px solid #e5e7eb', background: '#fafafa', color: '#111',
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const lbl: React.CSSProperties = { fontSize: 11, color: '#6b7280', marginBottom: 4, display: 'block', fontWeight: 500, letterSpacing: '0.03em' };
  const stageInfo = stages.find(s => s.key === (form.stage ?? firstStageKey)) ?? stages[0] ?? { color: '#64748b', label: '', key: '', icon: '' };;

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="crm-fade-up" style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 620, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)' }}>

        {/* Modal gradient top stripe */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${stageInfo.color}80, ${stageInfo.color}, ${stageInfo.color}80)`, borderRadius: '20px 20px 0 0' }} />

        {/* Header */}
        <div style={{ padding: '20px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontWeight: 700, fontSize: 18, color: '#111', margin: 0 }}>
              {opp ? 'Editar Oportunidade' : 'Nova Oportunidade'}
            </h2>
            {opp && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>ID: {opp.id.slice(0, 8)}…</p>}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: '#f3f4f6', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.15s' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#e5e7eb')}
            onMouseLeave={e => (e.currentTarget.style.background = '#f3f4f6')}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', padding: '14px 24px 0', gap: 4, borderBottom: '1px solid #f1f5f9' }}>
          {(['info', 'atividades'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: '7px 16px', fontSize: 13, fontWeight: tab === t ? 600 : 400,
              color: tab === t ? '#710505' : '#6b7280',
              borderBottom: tab === t ? '2px solid #710505' : '2px solid transparent',
              background: tab === t ? 'rgba(113,5,5,0.04)' : 'transparent',
              border: 'none', cursor: 'pointer', borderRadius: '6px 6px 0 0', transition: 'all 0.15s',
            }}>
              {t === 'info' ? 'Informações' : `Atividades${opp ? ` (${opp.activities.length})` : ''}`}
            </button>
          ))}
        </div>

        <div style={{ padding: '20px 24px 24px' }}>
          {tab === 'info' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Título *</label>
                <input className="crm-input" style={inp} value={form.title ?? ''} onChange={e => set('title', e.target.value)} placeholder="Ex: Stand Expo São Paulo 2025" />
              </div>
              <div><label style={lbl}>Cliente *</label><input className="crm-input" style={inp} value={form.clientName ?? ''} onChange={e => set('clientName', e.target.value)} placeholder="Nome do cliente" /></div>
              <div><label style={lbl}>Empresa</label><input className="crm-input" style={inp} value={form.companyName ?? ''} onChange={e => set('companyName', e.target.value)} placeholder="Empresa" /></div>
              <div><label style={lbl}>E-mail</label><input className="crm-input" style={inp} type="email" value={form.clientEmail ?? ''} onChange={e => set('clientEmail', e.target.value)} placeholder="email@exemplo.com" /></div>
              <div><label style={lbl}>Telefone</label><input className="crm-input" style={inp} value={form.clientPhone ?? ''} onChange={e => set('clientPhone', e.target.value)} placeholder="(11) 99999-9999" /></div>
              <div><label style={lbl}>Valor (R$)</label><input className="crm-input" style={inp} type="number" min={0} value={form.value ?? 0} onChange={e => set('value', parseFloat(e.target.value) || 0)} /></div>
              <div>
                <label style={lbl}>Probabilidade: <strong style={{ color: '#710505' }}>{form.probability ?? 50}%</strong></label>
                <input type="range" min={0} max={100} value={form.probability ?? 50} onChange={e => set('probability', parseInt(e.target.value))}
                  style={{ width: '100%', accentColor: '#710505', cursor: 'pointer' }} />
              </div>
              <div>
                <label style={lbl}>Estágio</label>
                <select className="crm-input" style={{ ...inp, color: stageInfo.color, fontWeight: 600 }} value={form.stage ?? firstStageKey} onChange={e => set('stage', e.target.value)}>
                  {stages.map(s => <option key={s.key} value={s.key} style={{ color: s.color, fontWeight: 600 }}>{s.label}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Previsão de Fechamento</label><input className="crm-input" style={inp} type="date" value={form.expectedClose ? form.expectedClose.split('T')[0] : ''} onChange={e => set('expectedClose', e.target.value || undefined)} /></div>
              <div><label style={lbl}>Origem</label><input className="crm-input" style={inp} value={form.source ?? ''} onChange={e => set('source', e.target.value)} placeholder="Indicação, Feira, Site…" /></div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={lbl}>Observações</label>
                <textarea className="crm-input" style={{ ...inp, minHeight: 76, resize: 'vertical' }} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Informações adicionais…" />
              </div>
              {clients.length > 0 && (
                <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #f1f5f9', paddingTop: 14, marginTop: 2 }}>
                  <label style={lbl}>Direcionar ao Cliente</label>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginBottom: 6 }}>O cliente selecionado poderá acompanhar esta oportunidade no painel dele.</p>
                  <select className="crm-input" style={inp} value={selectedClientId} onChange={e => setSelectedClientId(e.target.value)}>
                    <option value="">— Sem cliente vinculado —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {selectedClientId && (
                    <p style={{ fontSize: 11, color: '#059669', marginTop: 5, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#059669', display: 'inline-block' }} />
                      Vinculado — cliente verá esta oportunidade no dashboard.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {tab === 'atividades' && opp && (
            <div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 14 }}>Registre chamadas, reuniões e follow-ups desta oportunidade.</p>
              <div style={{ background: 'linear-gradient(135deg, #fafafa, #f8f4f4)', border: '1px solid #f0e8e8', borderRadius: 12, padding: 16, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                  <div><label style={lbl}>Tipo</label>
                    <select className="crm-input" style={inp} value={actForm.type} onChange={e => setActForm(p => ({ ...p, type: e.target.value }))}>
                      {actTypes.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
                    </select>
                  </div>
                  <div><label style={lbl}>Data</label>
                    <input className="crm-input" style={inp} type="date" value={actForm.dueDate} onChange={e => setActForm(p => ({ ...p, dueDate: e.target.value }))} />
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl}>Título / Assunto</label>
                  <input className="crm-input" style={inp} value={actForm.title} onChange={e => setActForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Ligar para confirmar proposta" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button className="crm-beam-btn" onClick={() => {
                    if (!actForm.title) return;
                    onAddActivity(opp.id, { type: actForm.type, title: actForm.title, dueDate: actForm.dueDate || undefined });
                    setActForm({ type: 'LIGACAO', title: '', dueDate: '' });
                  }} style={{ background: '#710505', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    + Adicionar
                  </button>
                </div>
              </div>

              {opp.activities.length === 0 && (
                <div style={{ textAlign: 'center', padding: '28px 0', color: '#d1d5db' }}>
                  <svg style={{ width: 32, height: 32, marginBottom: 8, opacity: 0.4 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  <p style={{ fontSize: 13 }}>Nenhuma atividade registrada.</p>
                </div>
              )}
              {opp.activities.map((a, i) => {
                const done = a.status === 'CONCLUIDO';
                return (
                  <div key={a.id} className="crm-fade-up" style={{ animationDelay: `${i * 0.05}s`, display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', background: done ? 'linear-gradient(135deg,#f0fdf4,#ecfdf5)' : '#fff', borderRadius: 10, border: `1px solid ${done ? '#bbf7d0' : '#eee'}`, marginBottom: 8, transition: 'opacity 0.3s', opacity: done ? 0.7 : 1 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, background: '#f1f5f9', borderRadius: 5, padding: '2px 7px', color: '#374151', fontWeight: 600 }}>{actTypes.find(t => t.key === a.type)?.label ?? a.type}</span>
                        {a.dueDate && <span style={{ fontSize: 11, color: '#9ca3af' }}>{fmtDate(a.dueDate)}</span>}
                      </div>
                      <p style={{ fontSize: 13, color: '#111', margin: '4px 0 0', textDecoration: done ? 'line-through' : 'none', fontWeight: done ? 400 : 500 }}>{a.title}</p>
                    </div>
                    {!done
                      ? <button onClick={() => onCompleteActivity(opp.id, a.id)} style={{ flexShrink: 0, background: 'none', border: '1.5px solid #10b981', borderRadius: 7, padding: '4px 12px', fontSize: 11, color: '#10b981', cursor: 'pointer', fontWeight: 600, transition: 'all 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#10b981'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#10b981'; }}>
                          Concluir
                        </button>
                      : <svg style={{ flexShrink: 0, width: 18, height: 18 }} fill="none" stroke="#10b981" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    }
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 22, paddingTop: 16, borderTop: '1px solid #f1f5f9' }}>
            {opp && onDelete
              ? <button onClick={onDelete} style={{ background: 'none', border: '1.5px solid #fca5a5', borderRadius: 9, padding: '8px 16px', fontSize: 13, color: '#ef4444', cursor: 'pointer', fontWeight: 500, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}>
                  Excluir
                </button>
              : <div />
            }
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={onClose} style={{ background: '#f3f4f6', border: 'none', borderRadius: 9, padding: '8px 18px', fontSize: 13, cursor: 'pointer', color: '#374151', fontWeight: 500 }}>Cancelar</button>
              {tab === 'info' && (
                <button className="crm-beam-btn" onClick={() => onSave({ ...form, clientTenantId: selectedClientId || null })} style={{ background: 'linear-gradient(135deg, #710505, #8b0606)', color: '#fff', border: 'none', borderRadius: 9, padding: '8px 22px', fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 12px rgba(113,5,5,0.3)' }}>
                  Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Magic Card ────────────────────────────────────────────────────────────

function OppCard({ opp, onClick, stageColor }: { opp: Opportunity; onClick: () => void; stageColor: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const pendingActs = opp.activities.filter(a => a.status === 'PENDENTE').length;

  const onMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ref.current.style.setProperty('--mx', `${e.clientX - r.left}px`);
    ref.current.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <div ref={ref} onClick={onClick} onMouseMove={onMouseMove} className="crm-magic-card"
      style={{ background: '#fff', borderRadius: 11, padding: '12px 14px 12px 17px', marginBottom: 8, border: '1px solid #eef0f3', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
      {/* Left color strip */}
      <div style={{ position: 'absolute', left: 0, top: 8, bottom: 8, width: 3, background: stageColor, borderRadius: '0 3px 3px 0', opacity: 0.7 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <p style={{ fontSize: 12.5, fontWeight: 600, color: '#1a1a2e', marginBottom: 2, lineHeight: 1.35 }}>{opp.title}</p>
        <p style={{ fontSize: 11, color: '#94a3b8', marginBottom: 9 }}>{opp.clientName}{opp.companyName ? ` · ${opp.companyName}` : ''}</p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#710505' }}>{fmt(opp.value)}</span>
          {pendingActs > 0 && (
            <span className="crm-pending-badge" style={{ fontSize: 10, background: 'linear-gradient(135deg,#fef3c7,#fde68a)', color: '#92400e', borderRadius: 20, padding: '2px 8px', fontWeight: 700 }}>
              {pendingActs} ativ.
            </span>
          )}
        </div>
        {opp.expectedClose && (
          <p style={{ fontSize: 10, color: '#cbd5e1', marginTop: 5, display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg style={{ width: 10, height: 10, flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg> {fmtDate(opp.expectedClose)}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export function CRMPipeline() {
  const { confirm } = useDialog();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpp, setModalOpp] = useState<Opportunity | null | 'new'>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; opp: Opportunity } | null>(null);

  const openCtxMenu = useCallback((e: React.MouseEvent, opp: Opportunity) => {
    e.preventDefault();
    e.stopPropagation();
    const MENU_W = 220;
    const MENU_H = 140;
    const x = e.clientX + MENU_W > window.innerWidth  ? e.clientX - MENU_W : e.clientX + 2;
    const y = e.clientY + MENU_H > window.innerHeight ? e.clientY - MENU_H : e.clientY + 2;
    // Use timeout so the mousedown close-listener (if any) fires first
    setTimeout(() => setCtxMenu({ x, y, opp }), 0);
  }, []);
  const [showConfig, setShowConfig] = useState(false);
  const { config, setConfig } = useCrmConfig();
  const stages = config?.stages ?? DEFAULT_STAGES;
  const actTypes = config?.actTypes ?? [];

  const { data: clients = [] } = useQuery({
    queryKey: ['admin', 'clients'],
    queryFn: async () => {
      const r = await api.get<Client[]>('/admin/clients');
      return r.data;
    },
    enabled: isAdmin,
  });

  const load = useCallback(async () => {
    try {
      const [o, s] = await Promise.all([
        api.get<Opportunity[]>('/crm/opportunities'),
        api.get<Stats>('/crm/stats'),
      ]);
      setOpps(o.data);
      setStats(s.data);
    } catch {/* ignore */} finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
    const { draggableId, destination, source, type } = result;

    // ── Column reorder ──
    if (type === 'COLUMN') {
      if (destination.index === source.index) return;
      const newStages = Array.from(stages);
      const [moved] = newStages.splice(source.index, 1);
      newStages.splice(destination.index, 0, moved);
      setConfig(prev => prev ? { ...prev, stages: newStages } : prev);
      try {
        await api.patch('/crm/config', { stages: newStages });
      } catch {
        setConfig(prev => prev ? { ...prev, stages } : prev);
      }
      return;
    }

    // ── Card move between stages ──
    const newStage = destination.droppableId;
    const opp = opps.find(o => o.id === draggableId);
    if (!opp || opp.stage === newStage) return;
    setOpps(prev => prev.map(o => o.id === draggableId ? { ...o, stage: newStage } : o));
    try {
      await api.patch(`/crm/opportunities/${draggableId}`, { stage: newStage });
      load();
    } catch {
      setOpps(prev => prev.map(o => o.id === draggableId ? { ...o, stage: opp.stage } : o));
    }
  };

  const handleSave = async (data: Partial<Opportunity>) => {
    const editing = modalOpp !== 'new' ? modalOpp : null;
    try {
      editing
        ? await api.patch(`/crm/opportunities/${editing.id}`, data)
        : await api.post('/crm/opportunities', data);
      setModalOpp(null);
      load();
    } catch {/* ignore */}
  };

  const handleDelete = async () => {
    const editing = modalOpp !== 'new' ? modalOpp : null;
    if (!editing) return;
    const ok = await confirm({ title: 'Excluir oportunidade', message: 'Excluir esta oportunidade?', confirmText: 'Excluir' });
    if (!ok) return;
    try {
      await api.delete(`/crm/opportunities/${editing.id}`);
      setModalOpp(null);
      load();
    } catch {/* ignore */}
  };

  const handleAddActivity = async (oppId: string, data: { type: string; title: string; dueDate?: string }) => {
    try {
      await api.post(`/crm/opportunities/${oppId}/activities`, data);
      const res = await api.get<Opportunity>(`/crm/opportunities/${oppId}`);
      setOpps(prev => prev.map(o => o.id === oppId ? res.data : o));
      if (modalOpp !== 'new' && modalOpp?.id === oppId) setModalOpp(res.data);
    } catch {/* ignore */}
  };

  const handleCompleteActivity = async (oppId: string, actId: string) => {
    try {
      await api.post(`/crm/opportunities/${oppId}/activities/${actId}/complete`, {});
      const res = await api.get<Opportunity>(`/crm/opportunities/${oppId}`);
      setOpps(prev => prev.map(o => o.id === oppId ? res.data : o));
      if (modalOpp !== 'new' && modalOpp?.id === oppId) setModalOpp(res.data);
    } catch {/* ignore */}
  };

  useEffect(() => {
    const close = () => setCtxMenu(null);
    // Use click (not mousedown) so it fires after the context-menu timeout
    window.addEventListener('click', close);
    window.addEventListener('scroll', close, true);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, []);

  const handleCtxDelete = async (opp: Opportunity) => {
    setCtxMenu(null);
    const ok = await confirm({ title: 'Excluir oportunidade', message: `Excluir "${opp.title}"? Esta ação não pode ser desfeita.`, confirmText: 'Excluir' });
    if (!ok) return;
    try {
      await api.delete(`/crm/opportunities/${opp.id}`);
      load();
    } catch {/* ignore */}
  };

  const oppsByStage = (stageKey: string) => opps.filter(o => o.stage === stageKey);
  const pipelineTotal = stats ? fmt(stats.pipelineValue) : '—';
  const wonTotal = stats ? fmt(stats.wonValue) : '—';
  const totalOpps = stats ? String(stats.total) : '—';

  return (
    <>
      <CRMStyles />

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="crm-title" style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.5px' }}>
            Pipeline
          </h1>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 3 }}>
            Gerencie oportunidades e acompanhe o funil de vendas
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {isAdmin && (
            <button onClick={() => setShowConfig(true)} title="Configurar campos" style={{
              background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: 11,
              padding: '11px 14px', cursor: 'pointer', color: '#64748b',
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
          )}
          <button className="crm-beam-btn" onClick={() => setModalOpp('new')} style={{
            background: 'linear-gradient(135deg, #710505 0%, #8b0606 100%)',
            color: '#fff', border: 'none', borderRadius: 11, padding: '11px 22px',
            fontSize: 14, fontWeight: 600, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(113,5,5,0.35), 0 1px 4px rgba(0,0,0,0.1)',
            letterSpacing: '0.01em',
          }}>
            + Nova Oportunidade
          </button>
        </div>
      </div>

      {/* ── Stats Bar ── */}
      <div style={{ display: 'flex', gap: 14, marginBottom: 28, flexWrap: 'wrap' }}>
        {[
          { label: 'Pipeline Total', value: pipelineTotal, color: '#710505', icon: <svg style={{width:18,height:18,flexShrink:0}} fill="none" stroke="#710505" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, bg: 'linear-gradient(135deg,#fff5f5,#fff)' },
          { label: 'Total Ganho',    value: wonTotal,      color: '#059669', icon: <svg style={{width:18,height:18,flexShrink:0}} fill="none" stroke="#059669" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>, bg: 'linear-gradient(135deg,#f0fdf4,#fff)' },
          { label: 'Oportunidades',  value: totalOpps,     color: '#2563eb', icon: <svg style={{width:18,height:18,flexShrink:0}} fill="none" stroke="#2563eb" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>, bg: 'linear-gradient(135deg,#eff6ff,#fff)' },
        ].map(s => (
          <div key={s.label} className="crm-stat" style={{
            flex: '1 1 150px', background: s.bg, borderRadius: 14,
            padding: '16px 20px', border: '1px solid rgba(0,0,0,0.05)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)', cursor: 'default',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              {s.icon}
              <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.label}</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontVariantNumeric: 'tabular-nums' }}>
              <AnimatedNumber value={s.value} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Kanban Board ── */}
      {loading ? (
        <KanbanSkeleton />
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="board" type="COLUMN" direction="horizontal">
            {(boardProvided) => (
              <div
                ref={boardProvided.innerRef}
                {...boardProvided.droppableProps}
                style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}
              >
                {stages.map((s: CrmStage, colIdx: number) => {
                  const cards = oppsByStage(s.key);
                  const colValue = cards.reduce((t, o) => t + o.value, 0);
                  return (
                    <Draggable key={s.key} draggableId={`col-${s.key}`} index={colIdx}>
                      {(colProv, colSnap) => (
                        <div
                          ref={colProv.innerRef}
                          {...colProv.draggableProps}
                          style={{
                            ...colProv.draggableProps.style,
                            flex: '0 0 212px', minWidth: 212,
                            opacity: colSnap.isDragging ? 0.88 : 1,
                          }}
                        >
                          {/* Column header — drag handle */}
                          <div
                            {...colProv.dragHandleProps}
                            style={{
                              padding: '11px 13px', borderRadius: 12, marginBottom: 8,
                              background: `linear-gradient(135deg, ${s.color}10, ${s.color}06)`,
                              border: `1px solid ${s.color}22`,
                              borderTop: `3px solid ${s.color}`,
                              cursor: colSnap.isDragging ? 'grabbing' : 'grab',
                              userSelect: 'none',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                {/* Drag indicator dots */}
                                <svg style={{ width: 12, height: 12, color: `${s.color}80`, flexShrink: 0 }} fill="currentColor" viewBox="0 0 24 24">
                                  <circle cx="9" cy="6" r="1.5"/><circle cx="15" cy="6" r="1.5"/>
                                  <circle cx="9" cy="12" r="1.5"/><circle cx="15" cy="12" r="1.5"/>
                                  <circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="18" r="1.5"/>
                                </svg>
                                <span style={{ fontSize: 11.5, fontWeight: 700, color: s.color, letterSpacing: '0.02em' }}>{s.label}</span>
                              </div>
                              <span style={{ fontSize: 11, background: s.color, color: '#fff', borderRadius: 20, padding: '1px 8px', fontWeight: 700, boxShadow: `0 2px 6px ${s.color}55` }}>
                                {cards.length}
                              </span>
                            </div>
                            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0, fontVariantNumeric: 'tabular-nums' }}>
                              {fmt(colValue)}
                            </p>
                          </div>

                          <Droppable droppableId={s.key} type="CARD">
                            {(provided, snapshot) => (
                              <div ref={provided.innerRef} {...provided.droppableProps}
                                style={{
                                  minHeight: 72, borderRadius: 10, padding: '2px',
                                  transition: 'background 0.15s, border 0.15s',
                                  ...(snapshot.isDraggingOver ? {
                                    background: `${s.color}08`,
                                    border: `1.5px dashed ${s.color}40`,
                                  } : { background: 'transparent', border: '1.5px solid transparent' }),
                                }}>
                                {cards.map((opp, idx) => (
                                  <Draggable key={opp.id} draggableId={opp.id} index={idx}>
                                    {(prov, snap) => (
                                      <div
                                        ref={prov.innerRef}
                                        {...prov.draggableProps}
                                        {...prov.dragHandleProps}
                                        onContextMenu={(e) => openCtxMenu(e, opp)}
                                        style={{ ...prov.draggableProps.style, opacity: snap.isDragging ? 0.82 : 1, transform: snap.isDragging ? `${prov.draggableProps.style?.transform} rotate(1.5deg)` : prov.draggableProps.style?.transform }}
                                      >
                                        <OppCard
                                          opp={opp}
                                          stageColor={s.color}
                                          onClick={() => setModalOpp(opp)}
                                        />
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                                {provided.placeholder}
                              </div>
                            )}
                          </Droppable>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {boardProvided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {/* ── Modal ── */}
      {modalOpp !== null && (
        <OppModal
          opp={modalOpp === 'new' ? null : modalOpp}
          onClose={() => setModalOpp(null)}
          onSave={handleSave}
          onDelete={isAdmin && modalOpp !== 'new' ? handleDelete : undefined}
          onAddActivity={handleAddActivity}
          onCompleteActivity={handleCompleteActivity}
          clients={isAdmin ? clients : []}
          stages={stages}
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

      {/* ── Context Menu ── */}
      {ctxMenu && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'fixed', zIndex: 9999,
            top: ctxMenu.y, left: ctxMenu.x,
            background: '#fff', borderRadius: 12,
            boxShadow: '0 12px 32px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #e5e7eb',
            minWidth: 200, overflow: 'hidden',
            animation: 'crm-ctx-in 0.15s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          <style>{`@keyframes crm-ctx-in { from { opacity:0; transform:scale(0.92) translateY(-4px) } to { opacity:1; transform:scale(1) translateY(0) } }`}</style>

          {/* Título do card */}
          <div style={{ padding: '10px 14px 8px', borderBottom: '1px solid #f1f5f9', background: '#fafafa' }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', margin: 0, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Oportunidade</p>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', margin: '3px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{ctxMenu.opp.title}</p>
          </div>

          {/* Ações */}
          <div style={{ padding: '6px 0' }}>
            <button
              onClick={() => { const opp = ctxMenu.opp; setCtxMenu(null); setModalOpp(opp); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ width: 30, height: 30, borderRadius: 8, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ width: 15, height: 15 }} fill="none" stroke="#3b82f6" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
              </span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a2e', margin: 0 }}>Edição</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Abrir e editar oportunidade</p>
              </div>
            </button>

            <div style={{ height: 1, background: '#f1f5f9', margin: '2px 0' }} />

            <button
              onClick={() => { const opp = ctxMenu.opp; setCtxMenu(null); handleCtxDelete(opp); }}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.12s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fef2f2')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}
            >
              <span style={{ width: 30, height: 30, borderRadius: 8, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg style={{ width: 15, height: 15 }} fill="none" stroke="#ef4444" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </span>
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', margin: 0 }}>Exclusão</p>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Remover permanentemente</p>
              </div>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
