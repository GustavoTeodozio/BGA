import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/auth.store';
import { AdminManagement } from '../../components/admin/AdminManagement';
import api from '../../api/client';

// ── Icons ──────────────────────────────────────────────────────────────────
const UserIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);
const GearIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);
const AIIcon = ({ className = 'w-5 h-5' }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2a2 2 0 012 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 017 7h1a1 1 0 010 2h-1v1a2 2 0 01-2 2H5a2 2 0 01-2-2v-1H2a1 1 0 010-2h1a7 7 0 017-7h1V5.73A2 2 0 0110 4a2 2 0 012-2z" />
  </svg>
);
const EyeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 116 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);
const EyeOffIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.29 3.29m0 0L18.71 18.71M6.29 6.29L3 3" />
  </svg>
);
const TrashIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);
const ChevronIcon = ({ open }: { open: boolean }) => (
  <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────────
interface ClientAISettings {
  aiProvider: 'anthropic' | 'openai';
  anthropicApiKey: string;
  anthropicModel: string;
  anthropicConfigured: boolean;
  openaiApiKey: string;
  openaiModel: string;
  openaiConfigured: boolean;
  configured: boolean;
}

interface AIForm {
  aiProvider: 'anthropic' | 'openai';
  anthropicApiKey: string;
  anthropicModel: string;
  openaiApiKey: string;
  openaiModel: string;
}

interface Client {
  id: string;
  name: string;
  isActive: boolean;
  clients: {
    businessName: string;
    mainEmail: string;
    logoUrl?: string;
    logoUrls?: string[];
    clientStatus: string;
  } | null;
}

const ANTHROPIC_MODELS = [
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 (rápido)' },
  { value: 'claude-sonnet-4-6',         label: 'Claude Sonnet 4.6 (balanceado)' },
  { value: 'claude-opus-4-7',           label: 'Claude Opus 4.7 (mais capaz)' },
];
const OPENAI_MODELS = [
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (rápido)' },
  { value: 'gpt-4o',      label: 'GPT-4o (balanceado)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo (mais capaz)' },
];

// ── Shared provider key section ────────────────────────────────────────────
function ProviderKeySection({
  provider, apiKey, model, configured, showKey, onToggleShow,
  onKeyChange, onModelChange, onDelete, deleteLoading,
}: {
  provider: 'anthropic' | 'openai';
  apiKey: string; model: string; configured: boolean;
  showKey: boolean; onToggleShow: () => void;
  onKeyChange: (v: string) => void; onModelChange: (v: string) => void;
  onDelete: () => void; deleteLoading: boolean;
}) {
  const isAnthropic = provider === 'anthropic';
  const models = isAnthropic ? ANTHROPIC_MODELS : OPENAI_MODELS;
  const placeholder = isAnthropic ? 'sk-ant-api03-...' : 'sk-proj-...';
  const accent = isAnthropic ? 'orange' : 'green';
  const label = isAnthropic ? 'Anthropic' : 'OpenAI';

  return (
    <div className={`rounded-xl border p-3 space-y-2.5 ${configured ? 'border-green-200 bg-green-50/30' : 'border-gray-200 bg-white'}`}>
      {/* Provider header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isAnthropic ? (
            <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.3 3.4L12 14.8 6.7 3.4H3l9 18.2 9-18.2h-3.7z" />
            </svg>
          ) : (
            <svg className={`w-4 h-4 text-${accent}-600`} viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
            </svg>
          )}
          <span className="text-xs font-bold text-gray-700 font-outer-sans">{label}</span>
        </div>
        {configured ? (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 border border-green-200 rounded-full text-[10px] font-semibold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />configurada
          </span>
        ) : (
          <span className="text-[10px] text-gray-400 font-outer-sans">sem chave</span>
        )}
      </div>

      {/* API Key row */}
      <div className="flex gap-1.5">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey}
            onChange={e => onKeyChange(e.target.value)}
            placeholder={configured ? '••••••••••••' : placeholder}
            className="w-full px-3 py-2 pr-9 rounded-lg border border-gray-200 bg-white text-sm font-mono focus:ring-2 focus:ring-wine-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={onToggleShow}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showKey ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {configured && (
          <button
            onClick={onDelete}
            disabled={deleteLoading}
            className="px-2.5 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors flex-shrink-0"
            title={`Remover chave ${label}`}
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {/* Model */}
      <select
        value={model}
        onChange={e => onModelChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-white text-xs focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans"
      >
        {models.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
      </select>
    </div>
  );
}

// ── Client AI Row ──────────────────────────────────────────────────────────
function ClientAIRow({ client }: { client: Client }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [form, setForm] = useState<AIForm>({
    aiProvider: 'anthropic',
    anthropicApiKey: '',
    anthropicModel: 'claude-haiku-4-5-20251001',
    openaiApiKey: '',
    openaiModel: 'gpt-4o-mini',
  });

  const profile = client.clients;
  const logo = profile?.logoUrls?.[0] || profile?.logoUrl;
  const name = profile?.businessName || client.name;
  const email = profile?.mainEmail || '';

  const { data, isLoading } = useQuery<ClientAISettings>({
    queryKey: ['admin', 'settings', 'client', client.id],
    queryFn: async () => {
      const r = await api.get(`/admin/settings/clients/${client.id}`);
      return r.data;
    },
    enabled: open,
  });

  useEffect(() => {
    if (data) setForm({
      aiProvider: data.aiProvider,
      anthropicApiKey: data.anthropicApiKey,
      anthropicModel: data.anthropicModel,
      openaiApiKey: data.openaiApiKey,
      openaiModel: data.openaiModel,
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch(`/admin/settings/clients/${client.id}`, {
        aiProvider: form.aiProvider,
        anthropicApiKey: form.anthropicApiKey,
        anthropicModel: form.anthropicModel,
        openaiApiKey: form.openaiApiKey,
        openaiModel: form.openaiModel,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings', 'client', client.id] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const makeDeleteMutation = (provider: 'anthropic' | 'openai') => ({
    mutationFn: async () => {
      await api.delete(`/admin/settings/clients/${client.id}/api-key?provider=${provider}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings', 'client', client.id] });
      setForm(f => ({
        ...f,
        ...(provider === 'anthropic' ? { anthropicApiKey: '' } : { openaiApiKey: '' }),
      }));
    },
  });

  const deleteAnthropic = useMutation(makeDeleteMutation('anthropic'));
  const deleteOpenAI    = useMutation(makeDeleteMutation('openai'));

  const isConfigured         = data?.configured          ?? false;
  const anthropicConfigured  = data?.anthropicConfigured ?? false;
  const openaiConfigured     = data?.openaiConfigured    ?? false;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden bg-white">
      {/* Header row */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center border border-gray-200">
          {logo ? (
            <img src={logo} alt={name} className="w-full h-full object-contain" />
          ) : (
            <span className="text-sm font-bold text-gray-400">{name.charAt(0).toUpperCase()}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 font-outer-sans text-sm truncate">{name}</p>
          <p className="text-xs text-gray-400 font-outer-sans truncate">{email}</p>
        </div>

        {isConfigured ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-semibold text-green-700 font-outer-sans flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            IA configurada
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700 font-outer-sans flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            Sem chave
          </span>
        )}

        <ChevronIcon open={open} />
      </button>

      {/* Expanded form */}
      {open && (
        <div className="border-t border-gray-100 px-4 py-4 bg-gray-50 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-wine-600" />
            </div>
          ) : (
            <>
              {/* Active provider selector */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 font-outer-sans">
                  Provedor ativo (usado pelo Ceniq)
                </p>
                <div className="flex gap-2">
                  {(['anthropic', 'openai'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setForm(f => ({ ...f, aiProvider: p }))}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-semibold font-outer-sans transition-all ${
                        form.aiProvider === p
                          ? 'border-wine-500 bg-wine-50 text-wine-700'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {p === 'anthropic' ? (
                        <svg className="w-4 h-4 text-orange-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.3 3.4L12 14.8 6.7 3.4H3l9 18.2 9-18.2h-3.7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                        </svg>
                      )}
                      {p === 'anthropic' ? 'Anthropic' : 'OpenAI'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Per-provider key sections */}
              <ProviderKeySection
                provider="anthropic"
                apiKey={form.anthropicApiKey}
                model={form.anthropicModel}
                configured={anthropicConfigured}
                showKey={showAnthropic}
                onToggleShow={() => setShowAnthropic(v => !v)}
                onKeyChange={v => setForm(f => ({ ...f, anthropicApiKey: v }))}
                onModelChange={v => setForm(f => ({ ...f, anthropicModel: v }))}
                onDelete={() => deleteAnthropic.mutate()}
                deleteLoading={deleteAnthropic.isPending}
              />

              <ProviderKeySection
                provider="openai"
                apiKey={form.openaiApiKey}
                model={form.openaiModel}
                configured={openaiConfigured}
                showKey={showOpenAI}
                onToggleShow={() => setShowOpenAI(v => !v)}
                onKeyChange={v => setForm(f => ({ ...f, openaiApiKey: v }))}
                onModelChange={v => setForm(f => ({ ...f, openaiModel: v }))}
                onDelete={() => deleteOpenAI.mutate()}
                deleteLoading={deleteOpenAI.isPending}
              />

              {/* Save */}
              <div className="flex justify-end pt-1">
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold font-outer-sans transition-all ${
                    saved
                      ? 'bg-green-500 text-white'
                      : 'bg-wine-600 hover:bg-wine-500 text-white disabled:opacity-50'
                  }`}
                >
                  {saved ? '✓ Salvo!' : saveMutation.isPending ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Global AI Settings (admin + projetista Ceniq) ─────────────────────────
function GlobalAISection() {
  const qc = useQueryClient();
  const [showAnthropic, setShowAnthropic] = useState(false);
  const [showOpenAI, setShowOpenAI] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState<AIForm>({
    aiProvider: 'anthropic',
    anthropicApiKey: '', anthropicModel: 'claude-haiku-4-5-20251001',
    openaiApiKey: '',    openaiModel: 'gpt-4o-mini',
  });

  const { data, isLoading } = useQuery<ClientAISettings>({
    queryKey: ['admin', 'settings', 'global'],
    queryFn: async () => { const r = await api.get('/admin/settings/global'); return r.data; },
  });

  useEffect(() => {
    if (data) setForm({
      aiProvider: data.aiProvider,
      anthropicApiKey: data.anthropicApiKey,
      anthropicModel: data.anthropicModel,
      openaiApiKey: data.openaiApiKey,
      openaiModel: data.openaiModel,
    });
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.patch('/admin/settings/global', {
        aiProvider: form.aiProvider,
        anthropicApiKey: form.anthropicApiKey,
        anthropicModel: form.anthropicModel,
        openaiApiKey: form.openaiApiKey,
        openaiModel: form.openaiModel,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'settings', 'global'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const isConfigured         = data?.configured          ?? false;
  const anthropicConfigured  = data?.anthropicConfigured ?? false;
  const openaiConfigured     = data?.openaiConfigured    ?? false;

  return (
    <div className="rounded-xl border-2 border-purple-200 bg-purple-50/40 overflow-hidden mb-6">
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-purple-100">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-800 font-outer-sans text-sm">Ceniq IA — Admin &amp; Projetista</p>
          <p className="text-xs text-gray-500 font-outer-sans">Chaves globais usadas pelo Ceniq no painel admin e projetista</p>
        </div>
        {isConfigured ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-semibold text-green-700 font-outer-sans flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Configurada
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full text-xs font-semibold text-amber-700 font-outer-sans flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Sem chave
          </span>
        )}
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600" />
          </div>
        ) : (
          <>
            {/* Active provider */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 font-outer-sans mb-1.5">Provedor ativo</label>
              <div className="flex gap-2">
                {(['anthropic', 'openai'] as const).map(p => (
                  <button key={p} onClick={() => setForm(f => ({ ...f, aiProvider: p }))}
                    className={`flex-1 py-2 rounded-lg text-sm font-semibold font-outer-sans transition-all border ${
                      form.aiProvider === p ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200 hover:border-purple-300'
                    }`}>
                    {p === 'anthropic' ? 'Anthropic' : 'OpenAI'}
                  </button>
                ))}
              </div>
            </div>

            {/* Per-provider key sections */}
            <ProviderKeySection
              provider="anthropic"
              apiKey={form.anthropicApiKey}
              model={form.anthropicModel}
              configured={anthropicConfigured}
              showKey={showAnthropic}
              onToggleShow={() => setShowAnthropic(v => !v)}
              onKeyChange={v => setForm(f => ({ ...f, anthropicApiKey: v }))}
              onModelChange={v => setForm(f => ({ ...f, anthropicModel: v }))}
              onDelete={() => {}}
              deleteLoading={false}
            />

            <ProviderKeySection
              provider="openai"
              apiKey={form.openaiApiKey}
              model={form.openaiModel}
              configured={openaiConfigured}
              showKey={showOpenAI}
              onToggleShow={() => setShowOpenAI(v => !v)}
              onKeyChange={v => setForm(f => ({ ...f, openaiApiKey: v }))}
              onModelChange={v => setForm(f => ({ ...f, openaiModel: v }))}
              onDelete={() => {}}
              deleteLoading={false}
            />

            <div className="flex justify-end">
              <button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}
                className={`px-4 py-2 rounded-lg text-sm font-semibold font-outer-sans transition-all ${
                  saved ? 'bg-green-500 text-white' : 'bg-purple-600 hover:bg-purple-500 text-white'
                } disabled:opacity-50`}>
                {saved ? '✓ Salvo' : saveMutation.isPending ? '...' : 'Salvar'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── AI Settings Tab ────────────────────────────────────────────────────────
function AISettingsTab() {
  const [search, setSearch] = useState('');

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['admin', 'clients'],
    queryFn: async () => {
      const r = await api.get('/admin/clients');
      return r.data;
    },
  });

  const filtered = clients.filter(c => {
    const name = c.clients?.businessName || c.name || '';
    const email = c.clients?.mainEmail || '';
    const q = search.toLowerCase();
    return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wine-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <GlobalAISection />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 font-outer-sans">
          Configure a chave de API de IA individualmente para cada cliente. O cliente só consegue usar o Ceniq se tiver uma chave configurada.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-wine-500 focus:border-transparent font-outer-sans"
        />
      </div>

      {/* Client list */}
      {filtered.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-400 font-outer-sans text-sm">
            {search ? 'Nenhum cliente encontrado.' : 'Nenhum cliente cadastrado.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(client => (
            <ClientAIRow key={client.id} client={client} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Settings Page ─────────────────────────────────────────────────────
export function Settings() {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'ai' | 'admins'>('profile');
  const [profileData, setProfileData] = useState({ name: user?.name || '', email: user?.email || '', phone: '' });

  const tabs = [
    { id: 'profile' as const, label: 'Perfil',        icon: UserIcon },
    { id: 'general' as const, label: 'Geral',          icon: GearIcon },
    { id: 'ai'      as const, label: 'Integrações IA', icon: AIIcon },
    { id: 'admins'  as const, label: 'Equipe',         icon: UserIcon },
  ];

  return (
    <div className="px-4 py-6 sm:px-0 animate-fade-in">
      <div className="mb-8">
        <h1 className="text-2xl md:text-4xl font-bold bg-gradient-to-r from-wine-600 to-gold-500 bg-clip-text text-transparent mb-1 md:mb-2 font-outer-sans leading-tight">
          Configurações
        </h1>
        <p className="text-gray-600 font-outer-sans">Gerencie suas preferências e configurações da conta</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <div className="card-gradient">
            <nav className="space-y-2">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 font-outer-sans text-sm ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-gold-500 to-gold-600 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-wine-50'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-semibold">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <div className="card-gradient animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wine-500 to-wine-600 flex items-center justify-center shadow-lg">
                  <UserIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 font-outer-sans">Configurações do Perfil</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-outer-sans">Nome Completo</label>
                  <input type="text" value={profileData.name} onChange={e => setProfileData({ ...profileData, name: e.target.value })} className="input font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-outer-sans">Email</label>
                  <input type="email" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} className="input font-outer-sans" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-outer-sans">Telefone</label>
                  <input type="tel" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} className="input font-outer-sans" />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button className="btn btn-secondary font-outer-sans">Cancelar</button>
                  <button className="btn btn-primary font-outer-sans">Salvar Alterações</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'general' && (
            <div className="card-gradient animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <GearIcon className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 font-outer-sans">Configurações Gerais</h2>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-outer-sans">Idioma</label>
                  <select className="input font-outer-sans"><option>Português (Brasil)</option><option>English</option></select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 font-outer-sans">Fuso Horário</label>
                  <select className="input font-outer-sans"><option>America/Sao_Paulo (GMT-3)</option><option>America/New_York (GMT-5)</option></select>
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button className="btn btn-secondary font-outer-sans">Cancelar</button>
                  <button className="btn btn-primary font-outer-sans">Salvar</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="card-gradient animate-slide-up">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-wine-500 to-wine-700 flex items-center justify-center shadow-lg">
                  <AIIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800 font-outer-sans">Integrações IA</h2>
                  <p className="text-sm text-gray-500 font-outer-sans">Chaves de API do Ceniq por cliente</p>
                </div>
              </div>
              <AISettingsTab />
            </div>
          )}

          {activeTab === 'admins' && (
            <div className="card-gradient animate-slide-up">
              <AdminManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
