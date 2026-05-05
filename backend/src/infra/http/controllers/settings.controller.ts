import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

const SETTINGS_FILE = path.join(process.cwd(), 'data', 'settings.json');

export interface ClientAISettings {
  aiProvider?: 'anthropic' | 'openai';
  // Per-provider keys (new)
  anthropicApiKey?: string;
  anthropicModel?: string;
  openaiApiKey?: string;
  openaiModel?: string;
  // Legacy single key — kept for migration; resolved by getClientSettings()
  aiApiKey?: string;
  aiModel?: string;
}

export interface AppSettings {
  clients?: Record<string, ClientAISettings>;
}

export function loadSettings(): AppSettings {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return {};
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8')) as AppSettings;
  } catch {
    return {};
  }
}

function saveSettings(data: AppSettings) {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

// Returns raw settings with a computed `aiApiKey` so ceniq.controller.ts
// keeps working without changes — it just reads the active provider's key.
export function getClientSettings(tenantId: string): ClientAISettings {
  const s = loadSettings();
  const c = s.clients?.[tenantId] ?? {};
  const provider = c.aiProvider || 'anthropic';
  const activeKey =
    provider === 'openai'
      ? (c.openaiApiKey || (c.aiApiKey && !c.anthropicApiKey ? c.aiApiKey : undefined))
      : (c.anthropicApiKey || c.aiApiKey);
  const activeModel =
    provider === 'openai'
      ? (c.openaiModel || c.aiModel || 'gpt-4o-mini')
      : (c.anthropicModel || c.aiModel || 'claude-haiku-4-5-20251001');
  return { ...c, aiApiKey: activeKey, aiModel: activeModel };
}

function maskKey(key: string | undefined): string {
  if (!key) return '';
  if (key.length <= 8) return '••••••••';
  return '••••••••' + key.slice(-4);
}

// ── Client AI endpoints ────────────────────────────────────────────────────

// GET /admin/settings/clients/:tenantId
export async function getClientAISettings(req: Request, res: Response) {
  const tenantId = req.params['tenantId'] as string;
  const s = loadSettings();
  const c = s.clients?.[tenantId] ?? {};

  // Handle legacy: if only old aiApiKey exists, attribute it to the stored provider
  const legacyKey = c.aiApiKey;
  const legacyIsOpenAI = c.aiProvider === 'openai';

  const anthropicKey = c.anthropicApiKey || (!legacyIsOpenAI ? legacyKey : undefined);
  const openaiKey    = c.openaiApiKey    || (legacyIsOpenAI  ? legacyKey : undefined);

  return res.json({
    aiProvider: c.aiProvider || 'anthropic',

    anthropicApiKey: maskKey(anthropicKey),
    anthropicModel: c.anthropicModel || c.aiModel || 'claude-haiku-4-5-20251001',
    anthropicConfigured: !!anthropicKey,

    openaiApiKey: maskKey(openaiKey),
    openaiModel: c.openaiModel || (legacyIsOpenAI ? c.aiModel : undefined) || 'gpt-4o-mini',
    openaiConfigured: !!openaiKey,

    configured: !!(anthropicKey || openaiKey),
  });
}

// PATCH /admin/settings/clients/:tenantId
export async function updateClientAISettings(req: Request, res: Response) {
  const tenantId = req.params['tenantId'] as string;
  const {
    aiProvider,
    anthropicApiKey, anthropicModel,
    openaiApiKey, openaiModel,
  } = req.body as {
    aiProvider?: 'anthropic' | 'openai';
    anthropicApiKey?: string; anthropicModel?: string;
    openaiApiKey?: string;    openaiModel?: string;
  };

  const settings = loadSettings();
  if (!settings.clients) settings.clients = {};
  const current = settings.clients[tenantId] ?? {};
  const updated: ClientAISettings = { ...current };

  if (aiProvider) updated.aiProvider = aiProvider;

  if (anthropicModel) updated.anthropicModel = anthropicModel;
  if (anthropicApiKey && !anthropicApiKey.startsWith('••')) {
    updated.anthropicApiKey = anthropicApiKey.trim();
  }

  if (openaiModel) updated.openaiModel = openaiModel;
  if (openaiApiKey && !openaiApiKey.startsWith('••')) {
    updated.openaiApiKey = openaiApiKey.trim();
  }

  settings.clients[tenantId] = updated;
  saveSettings(settings);

  return res.json({ message: 'Configurações de IA salvas.' });
}

// DELETE /admin/settings/clients/:tenantId/api-key?provider=anthropic|openai
export async function deleteClientAIKey(req: Request, res: Response) {
  const tenantId  = req.params['tenantId'] as string;
  const provider  = (req.query['provider'] as string | undefined) || 'both';
  const settings  = loadSettings();
  const clientsMap = settings.clients;

  if (clientsMap?.[tenantId]) {
    if (provider === 'anthropic' || provider === 'both') {
      delete clientsMap[tenantId].anthropicApiKey;
      delete clientsMap[tenantId].aiApiKey; // clear legacy too
    }
    if (provider === 'openai' || provider === 'both') {
      delete clientsMap[tenantId].openaiApiKey;
      if (clientsMap[tenantId].aiProvider === 'openai') {
        delete clientsMap[tenantId].aiApiKey;
      }
    }
  }

  saveSettings(settings);
  return res.json({ message: 'Chave removida.' });
}

// ── Global AI endpoints ────────────────────────────────────────────────────

const GLOBAL_KEY = '__global__';

// GET /admin/settings/global
export async function getGlobalAISettings(_req: Request, res: Response) {
  const s = loadSettings();
  const c = s.clients?.[GLOBAL_KEY] ?? {};

  const legacyKey = c.aiApiKey;
  const legacyIsOpenAI = c.aiProvider === 'openai';

  const anthropicKey = c.anthropicApiKey || (!legacyIsOpenAI ? legacyKey : undefined);
  const openaiKey    = c.openaiApiKey    || (legacyIsOpenAI  ? legacyKey : undefined);

  return res.json({
    aiProvider: c.aiProvider || 'anthropic',

    anthropicApiKey: maskKey(anthropicKey),
    anthropicModel: c.anthropicModel || c.aiModel || 'claude-haiku-4-5-20251001',
    anthropicConfigured: !!anthropicKey,

    openaiApiKey: maskKey(openaiKey),
    openaiModel: c.openaiModel || (legacyIsOpenAI ? c.aiModel : undefined) || 'gpt-4o-mini',
    openaiConfigured: !!openaiKey,

    configured: !!(anthropicKey || openaiKey),
  });
}

// PATCH /admin/settings/global
export async function updateGlobalAISettings(req: Request, res: Response) {
  const {
    aiProvider,
    anthropicApiKey, anthropicModel,
    openaiApiKey, openaiModel,
  } = req.body as {
    aiProvider?: 'anthropic' | 'openai';
    anthropicApiKey?: string; anthropicModel?: string;
    openaiApiKey?: string;    openaiModel?: string;
  };

  const settings = loadSettings();
  if (!settings.clients) settings.clients = {};
  const current = settings.clients[GLOBAL_KEY] ?? {};
  const updated: ClientAISettings = { ...current };

  if (aiProvider) updated.aiProvider = aiProvider;

  if (anthropicModel) updated.anthropicModel = anthropicModel;
  if (anthropicApiKey && !anthropicApiKey.startsWith('••')) {
    updated.anthropicApiKey = anthropicApiKey.trim();
  }

  if (openaiModel) updated.openaiModel = openaiModel;
  if (openaiApiKey && !openaiApiKey.startsWith('••')) {
    updated.openaiApiKey = openaiApiKey.trim();
  }

  settings.clients[GLOBAL_KEY] = updated;
  saveSettings(settings);
  return res.json({ message: 'Configurações globais de IA salvas.' });
}
