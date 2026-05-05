import type { Request, Response } from 'express';
import prisma from '../../../config/prisma';
import { AppError } from '../../../shared/errors/AppError';

// ─── Opportunities ────────────────────────────────────────────────────────────

export async function listOpportunities(req: Request, res: Response) {
  const { tenantId, role, userId } = req.auth!;

  const where: any = { tenantId };
  if (role === 'VENDEDOR') where.assignedToId = userId;

  const stage = req.query.stage as string | undefined;
  if (stage) where.stage = stage;

  const opportunities = await prisma.opportunity.findMany({
    where,
    include: { activities: { orderBy: { dueDate: 'asc' } } },
    orderBy: { updatedAt: 'desc' },
  });

  return res.json(opportunities);
}

export async function createOpportunity(req: Request, res: Response) {
  const { tenantId: rawTenantId, userId } = req.auth!;
  const tenantId = rawTenantId as string;

  const {
    title, clientName, clientEmail, clientPhone, companyName,
    value, probability, stage, source, notes, expectedClose,
    assignedToId, assignedToName,
  } = req.body;

  if (!title || !clientName) throw new AppError('title e clientName são obrigatórios', 400);

  const opp = await prisma.opportunity.create({
    data: {
      tenantId,
      title: title as string,
      clientName: clientName as string,
      clientEmail: clientEmail ?? null,
      clientPhone: clientPhone ?? null,
      companyName: companyName ?? null,
      value: value ?? 0,
      probability: probability ?? 50,
      stage: stage ?? 'LEAD_NOVO',
      source: source ?? null,
      notes: notes ?? null,
      expectedClose: expectedClose ? new Date(expectedClose) : null,
      assignedToId: assignedToId ?? userId,
      assignedToName: assignedToName ?? null,
    },
    include: { activities: true },
  });

  return res.status(201).json(opp);
}

export async function getOpportunity(req: Request, res: Response) {
  const { tenantId, role, userId } = req.auth!;
  const { id } = req.params;

  const opp = await prisma.opportunity.findFirst({
    where: { id, tenantId },
    include: { activities: { orderBy: { dueDate: 'asc' } } },
  });

  if (!opp) throw new AppError('Oportunidade não encontrada', 404);
  if (role === 'VENDEDOR' && opp.assignedToId !== userId) throw new AppError('Acesso negado', 403);

  return res.json(opp);
}

export async function updateOpportunity(req: Request, res: Response) {
  const { tenantId, role, userId } = req.auth!;
  const { id } = req.params;

  const existing = await prisma.opportunity.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError('Oportunidade não encontrada', 404);
  if (role === 'VENDEDOR' && existing.assignedToId !== userId) throw new AppError('Acesso negado', 403);

  const {
    title, clientName, clientEmail, clientPhone, companyName,
    value, probability, stage, source, notes, expectedClose,
    closedAt, lostReason, assignedToId, assignedToName, clientTenantId,
  } = req.body;

  const updated = await prisma.opportunity.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(clientName !== undefined && { clientName }),
      ...(clientEmail !== undefined && { clientEmail }),
      ...(clientPhone !== undefined && { clientPhone }),
      ...(companyName !== undefined && { companyName }),
      ...(value !== undefined && { value }),
      ...(probability !== undefined && { probability }),
      ...(stage !== undefined && { stage }),
      ...(source !== undefined && { source }),
      ...(notes !== undefined && { notes }),
      ...(expectedClose !== undefined && { expectedClose: expectedClose ? new Date(expectedClose) : null }),
      ...(closedAt !== undefined && { closedAt: closedAt ? new Date(closedAt) : null }),
      ...(lostReason !== undefined && { lostReason }),
      ...(assignedToId !== undefined && { assignedToId }),
      ...(assignedToName !== undefined && { assignedToName }),
      ...(clientTenantId !== undefined && { clientTenantId: clientTenantId || null }),
    },
    include: { activities: { orderBy: { dueDate: 'asc' } } },
  });

  return res.json(updated);
}

export async function deleteOpportunity(req: Request, res: Response) {
  const { tenantId, role } = req.auth!;
  const { id } = req.params;

  const existing = await prisma.opportunity.findFirst({ where: { id, tenantId } });
  if (!existing) throw new AppError('Oportunidade não encontrada', 404);
  if (role !== 'ADMIN') throw new AppError('Acesso negado', 403);

  await prisma.opportunity.delete({ where: { id } });
  return res.status(204).send();
}

// ─── Activities ───────────────────────────────────────────────────────────────

export async function createActivity(req: Request, res: Response) {
  const { tenantId, userId, role } = req.auth!;
  const { opportunityId } = req.params;

  const opp = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId } });
  if (!opp) throw new AppError('Oportunidade não encontrada', 404);
  if (role === 'VENDEDOR' && opp.assignedToId !== userId) throw new AppError('Acesso negado', 403);

  const { type, title, notes, dueDate } = req.body;
  if (!type || !title) throw new AppError('type e title são obrigatórios', 400);

  const activity = await prisma.activity.create({
    data: {
      opportunityId: opportunityId as string,
      type,
      title: title as string,
      notes: notes ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      createdById: userId,
      createdByName: null,
    },
  });

  return res.status(201).json(activity);
}

export async function updateActivity(req: Request, res: Response) {
  const { tenantId, role, userId } = req.auth!;
  const { opportunityId, activityId } = req.params;

  const opp = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId } });
  if (!opp) throw new AppError('Oportunidade não encontrada', 404);
  if (role === 'VENDEDOR' && opp.assignedToId !== userId) throw new AppError('Acesso negado', 403);

  const { type, title, notes, dueDate, status, doneAt } = req.body;

  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: {
      ...(type !== undefined && { type }),
      ...(title !== undefined && { title }),
      ...(notes !== undefined && { notes }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(status !== undefined && { status }),
      ...(doneAt !== undefined && { doneAt: doneAt ? new Date(doneAt) : null }),
    },
  });

  return res.json(activity);
}

export async function deleteActivity(req: Request, res: Response) {
  const { tenantId, role, userId } = req.auth!;
  const { opportunityId, activityId } = req.params;

  const opp = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId } });
  if (!opp) throw new AppError('Oportunidade não encontrada', 404);
  if (role === 'VENDEDOR' && opp.assignedToId !== userId) throw new AppError('Acesso negado', 403);

  await prisma.activity.delete({ where: { id: activityId } });
  return res.status(204).send();
}

export async function completeActivity(req: Request, res: Response) {
  const { tenantId, role, userId } = req.auth!;
  const { opportunityId, activityId } = req.params;

  const opp = await prisma.opportunity.findFirst({ where: { id: opportunityId, tenantId } });
  if (!opp) throw new AppError('Oportunidade não encontrada', 404);
  if (role === 'VENDEDOR' && opp.assignedToId !== userId) throw new AppError('Acesso negado', 403);

  const activity = await prisma.activity.update({
    where: { id: activityId },
    data: { status: 'CONCLUIDO', doneAt: new Date() },
  });

  return res.json(activity);
}

// ─── Agenda ───────────────────────────────────────────────────────────────────

export async function getAgenda(req: Request, res: Response) {
  const { tenantId, role, userId } = req.auth!;

  const oppWhere: any = { tenantId, stage: { notIn: ['GANHO', 'PERDIDO'] } };
  if (role === 'VENDEDOR') oppWhere.assignedToId = userId;

  const opps = await prisma.opportunity.findMany({ where: oppWhere, select: { id: true } });
  const oppIds = opps.map((o) => o.id);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const tomorrowEnd = new Date(todayEnd);
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

  const [overdue, today, tomorrow] = await Promise.all([
    prisma.activity.findMany({
      where: { opportunityId: { in: oppIds }, status: 'PENDENTE', dueDate: { lt: todayStart } },
      include: { opportunity: { select: { title: true, clientName: true, assignedToName: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.activity.findMany({
      where: { opportunityId: { in: oppIds }, status: 'PENDENTE', dueDate: { gte: todayStart, lte: todayEnd } },
      include: { opportunity: { select: { title: true, clientName: true, assignedToName: true } } },
      orderBy: { dueDate: 'asc' },
    }),
    prisma.activity.findMany({
      where: { opportunityId: { in: oppIds }, status: 'PENDENTE', dueDate: { gt: todayEnd, lte: tomorrowEnd } },
      include: { opportunity: { select: { title: true, clientName: true, assignedToName: true } } },
      orderBy: { dueDate: 'asc' },
    }),
  ]);

  return res.json({ overdue, today, tomorrow });
}

// ─── History ─────────────────────────────────────────────────────────────────

export async function getActivityHistory(req: Request, res: Response) {
  const { tenantId, role, userId } = req.auth!;

  const oppWhere: any = { tenantId };
  if (role === 'VENDEDOR') oppWhere.assignedToId = userId;

  const opps = await prisma.opportunity.findMany({ where: oppWhere, select: { id: true } });
  const oppIds = opps.map((o) => o.id);

  const page   = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit  = Math.min(50, parseInt(req.query.limit as string) || 20);
  const search = (req.query.search as string) ?? '';
  const type   = (req.query.type as string) ?? '';
  const status = (req.query.status as string) ?? '';
  const from   = req.query.from ? new Date(req.query.from as string) : undefined;
  const to     = req.query.to   ? new Date(req.query.to   as string) : undefined;
  if (to) to.setHours(23, 59, 59, 999);

  const where: any = {
    opportunityId: { in: oppIds },
    status: status ? status : { in: ['CONCLUIDO', 'CANCELADO'] },
  };
  if (type) where.type = type;
  if (from || to) where.dueDate = { ...(from && { gte: from }), ...(to && { lte: to }) };
  if (search) where.OR = [
    { title:                     { contains: search, mode: 'insensitive' } },
    { opportunity: { title:      { contains: search, mode: 'insensitive' } } },
    { opportunity: { clientName: { contains: search, mode: 'insensitive' } } },
  ];

  const [total, activities] = await Promise.all([
    prisma.activity.count({ where }),
    prisma.activity.findMany({
      where,
      include: { opportunity: { select: { title: true, clientName: true, assignedToName: true } } },
      orderBy: { doneAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return res.json({ activities, total, page, limit, pages: Math.ceil(total / limit) });
}

// ─── Client-linked Opportunities ──────────────────────────────────────────────

export async function listLinkedOpportunities(req: Request, res: Response) {
  const { tenantId } = req.auth!;
  const opportunities = await prisma.opportunity.findMany({
    where: { clientTenantId: tenantId },
    orderBy: { updatedAt: 'desc' },
  });
  return res.json(opportunities);
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getCRMStats(req: Request, res: Response) {
  const { tenantId, role, userId } = req.auth!;

  const where: any = { tenantId };
  if (role === 'VENDEDOR') where.assignedToId = userId;

  const opps = await prisma.opportunity.findMany({ where, select: { stage: true, value: true } });

  const stages = ['LEAD_NOVO', 'CONTATO_FEITO', 'PROPOSTA_ENVIADA', 'NEGOCIACAO', 'FECHAMENTO', 'GANHO', 'PERDIDO'] as const;
  const byStage = stages.map((stage) => {
    const items = opps.filter((o) => o.stage === stage);
    return { stage, count: items.length, total: items.reduce((s, o) => s + o.value, 0) };
  });

  const pipeline = opps.filter((o) => !['GANHO', 'PERDIDO'].includes(o.stage));
  const pipelineValue = pipeline.reduce((s, o) => s + o.value, 0);
  const wonValue = opps.filter((o) => o.stage === 'GANHO').reduce((s, o) => s + o.value, 0);

  return res.json({ byStage, pipelineValue, wonValue, total: opps.length });
}
