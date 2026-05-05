import type { Request, Response } from 'express';
import { getClientSettings } from './settings.controller';

const SYSTEM_PROMPT = `Você é Ceniq, IA de design de stands da BGA STANDS.
Responda APENAS com um objeto JSON válido, sem texto extra, sem markdown, sem explicações.

Estrutura obrigatória:
{
  "width": <número 4-20>,
  "depth": <número 4-20>,
  "wallColor": "<#rrggbb>",
  "floorColor": "<#rrggbb>",
  "accentColor": "<#rrggbb>",
  "brandName": "<string ou null>",
  "summary": "<resumo em português>",
  "components": [
    { "id": "<único>", "type": "<tipo>", "col": <número>, "row": <número>, "w": <número>, "d": <número>, "h": <número>, "color": "<#rrggbb>", "label": null }
  ]
}

Tipos disponíveis e dimensões típicas (todos os valores em metros):
panel_led : w=3-5, d=0.15, h=2-3  — painel luminoso na parede traseira (row=0.05)
tv        : w=1.2-1.8, d=0.2, h=1.2-1.8 — monitor encostado na parede (row=0.1)
totem     : w=0.5-0.7, d=0.5-0.7, h=2-2.5 — coluna cilíndrica decorativa
balcao    : w=1.5-2.5, d=0.6-0.9, h=1-1.2 — balcão de atendimento
mesa      : w=1-1.5, d=0.7-1, h=0.72-0.80 — mesa com tampo
cadeira   : w=0.6-0.8, d=0.6-0.8, h=0.85-1 — cadeira com encosto
sofa      : w=1.8-2.5, d=0.8-1, h=0.8-0.9 — sofá
vitrine   : w=0.8-1.5, d=0.4-0.6, h=1.2-1.6 — vitrine de vidro
banner    : w=0.8-1.2, d=0.1, h=2-2.2 — banner vertical com haste
planta    : w=0.5-0.8, d=0.5-0.8, h=1-1.5 — planta decorativa
prateleira: w=1-2, d=0.3-0.5, h=1.5-2 — estante com prateleiras
carpet    : w=2-5, d=1.5-4, h=0.02 — tapete no chão

Regras:
- col ≥ 0 e col + w ≤ width
- row ≥ 0 e row + d ≤ depth
- Todas as cores devem ser #rrggbb hexadecimal válido (ex: #ff0000)
- Deixe corredor de 1.2m para circulação
- Totens normalmente nos cantos (col≈0 ou col≈width-0.6)
- Gere entre 5 e 12 componentes por stand
- IDs únicos como "c1", "c2", etc.`;

type ChatMessage = { role: string; content: string };

async function callAnthropic(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { content: { type: string; text: string }[] };
  return data.content?.find((c) => c.type === 'text')?.text ?? '';
}

async function callOpenAI(apiKey: string, model: string, messages: ChatMessage[]): Promise<string> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map((m) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.content,
        })),
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${body}`);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices?.[0]?.message?.content ?? '';
}

function extractJson(rawText: string): unknown {
  const fenced = rawText.match(/```(?:json)?\s*([\s\S]*?)```/);
  const inline = rawText.match(/(\{[\s\S]*\})/);
  const jsonStr = fenced?.[1] ?? inline?.[1] ?? rawText;
  return JSON.parse(jsonStr.trim());
}

export async function ceniqChat(req: Request, res: Response) {
  const tenantId = req.auth?.tenantId ?? '__global__';

  const clientSettings = getClientSettings(tenantId);

  const provider = clientSettings.aiProvider || 'anthropic';
  const apiKey = clientSettings.aiApiKey;
  const configuredModel = clientSettings.aiModel;

  if (!apiKey) {
    return res.status(503).json({
      message: 'Chave de API não configurada para sua conta. Contate o administrador.',
    });
  }

  const { prompt, history = [] } = req.body as {
    prompt: string;
    history?: ChatMessage[];
  };

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ message: 'O campo "prompt" é obrigatório.' });
  }

  const messages: ChatMessage[] = [
    ...history,
    { role: 'user', content: prompt },
  ];

  let rawText: string;
  try {
    if (provider === 'openai') {
      const model = configuredModel || 'gpt-4o-mini';
      rawText = await callOpenAI(apiKey, model, messages);
    } else {
      const model = configuredModel || 'claude-haiku-4-5-20251001';
      rawText = await callAnthropic(apiKey, model, messages);
    }
  } catch (err: any) {
    console.error('[Ceniq] API error:', err.message);
    return res.status(502).json({ message: err.message });
  }

  let stand: unknown;
  try {
    stand = extractJson(rawText);
  } catch {
    console.error('[Ceniq] Failed to parse stand JSON:', rawText);
    return res.status(502).json({
      message: 'A IA retornou uma resposta inválida. Tente reformular o pedido.',
      raw: rawText,
    });
  }

  return res.json({ stand, message: (stand as any).summary ?? 'Stand gerado com sucesso!' });
}
