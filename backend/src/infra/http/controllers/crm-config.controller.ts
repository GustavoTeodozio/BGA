import type { Request, Response } from 'express';
import prisma from '../../../config/prisma';

// Defaults used when no config exists yet
export const DEFAULT_STAGES = [
  { key: 'LEAD_NOVO',        label: 'Lead Novo',        color: '#64748b', icon: 'user' },
  { key: 'CONTATO_FEITO',    label: 'Contato Feito',    color: '#3b82f6', icon: 'phone' },
  { key: 'PROPOSTA_ENVIADA', label: 'Proposta Enviada', color: '#8b5cf6', icon: 'document' },
  { key: 'NEGOCIACAO',       label: 'Negociação',       color: '#f59e0b', icon: 'chat' },
  { key: 'FECHAMENTO',       label: 'Fechamento',       color: '#f97316', icon: 'clock' },
  { key: 'GANHO',            label: 'Ganho',            color: '#10b981', icon: 'check' },
  { key: 'PERDIDO',          label: 'Perdido',          color: '#ef4444', icon: 'x' },
];

export const DEFAULT_ACT_TYPES = [
  { key: 'LIGACAO',   label: 'Ligação',    color: '#3b82f6', icon: 'phone' },
  { key: 'REUNIAO',   label: 'Reunião',    color: '#8b5cf6', icon: 'users' },
  { key: 'VISITA',    label: 'Visita',     color: '#10b981', icon: 'building' },
  { key: 'EMAIL',     label: 'E-mail',     color: '#f59e0b', icon: 'mail' },
  { key: 'WHATSAPP',  label: 'WhatsApp',   color: '#22c55e', icon: 'chat' },
  { key: 'FOLLOW_UP', label: 'Follow-up',  color: '#f97316', icon: 'refresh' },
  { key: 'OUTRO',     label: 'Outro',      color: '#64748b', icon: 'document' },
];

export async function getCrmConfig(req: Request, res: Response) {
  const { tenantId } = req.auth!;
  const config = await prisma.crmConfig.findUnique({ where: { tenantId: tenantId! } });
  return res.json({
    stages:   config ? (config.stages   as any[]) : DEFAULT_STAGES,
    actTypes: config ? (config.actTypes as any[]) : DEFAULT_ACT_TYPES,
  });
}

export async function updateCrmConfig(req: Request, res: Response) {
  const { tenantId } = req.auth!;
  const { stages, actTypes } = req.body as { stages?: any[]; actTypes?: any[] };

  const config = await prisma.crmConfig.upsert({
    where:  { tenantId: tenantId! },
    create: {
      tenantId: tenantId!,
      stages:   stages   ?? DEFAULT_STAGES,
      actTypes: actTypes ?? DEFAULT_ACT_TYPES,
    },
    update: {
      ...(stages   !== undefined && { stages }),
      ...(actTypes !== undefined && { actTypes }),
    },
  });

  return res.json({
    stages:   config.stages   as any[],
    actTypes: config.actTypes as any[],
  });
}
