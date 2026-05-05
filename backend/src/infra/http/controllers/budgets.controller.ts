import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../config/prisma';
import AppError from '../../../shared/errors/AppError';

const createSchema = z.object({
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().optional(),
  companyName: z.string().optional(),
  description: z.string().optional(),
  items: z.string().optional(),
  totalValue: z.preprocess((v) => (v !== '' && v !== undefined ? Number(v) : undefined), z.number().positive().optional()),
  notes: z.string().optional(),
});

const updateSchema = z.object({
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().nullable().optional(),
  clientPhone: z.string().nullable().optional(),
  companyName: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  items: z.string().nullable().optional(),
  totalValue: z.preprocess((v) => (v !== '' && v !== undefined ? Number(v) : undefined), z.number().positive().optional()),
  status: z.enum(['PENDENTE', 'APROVADO', 'RECUSADO', 'FECHADO']).optional(),
  notes: z.string().nullable().optional(),
});

export const listBudgets = async (req: Request, res: Response) => {
  const { userId, role, tenantId } = req.auth!;
  const { status, search, mine } = req.query;

  const where: any = {};

  if (role === 'ADMIN' && mine !== 'true') {
    if (tenantId) where.tenantId = tenantId;
  } else {
    where.createdById = userId;
    if (tenantId) where.tenantId = tenantId;
  }

  if (status) where.status = String(status);

  if (search) {
    where.OR = [
      { clientName: { contains: String(search), mode: 'insensitive' } },
      { companyName: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const budgets = await prisma.budget.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  return res.json(budgets);
};

export const getBudget = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { budgetId } = req.params;

  const budget = await prisma.budget.findUnique({
    where: { id: budgetId },
    include: {
      createdBy: { select: { id: true, name: true, role: true } },
      sale: true,
    },
  });

  if (!budget) throw new AppError('Orçamento não encontrado', 404);
  if (role !== 'ADMIN' && budget.createdById !== userId) {
    throw new AppError('Acesso negado', 403);
  }

  return res.json(budget);
};

export const createBudget = async (req: Request, res: Response) => {
  const { userId, tenantId } = req.auth!;
  if (!tenantId) throw new AppError('Tenant não definido', 400);

  const body = createSchema.parse(req.body);

  const budget = await prisma.budget.create({
    data: {
      ...body,
      tenantId,
      createdById: userId,
    },
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  return res.status(201).json(budget);
};

export const updateBudget = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { budgetId } = req.params;

  const existing = await prisma.budget.findUnique({ where: { id: budgetId } });
  if (!existing) throw new AppError('Orçamento não encontrado', 404);
  if (role !== 'ADMIN' && existing.createdById !== userId) {
    throw new AppError('Acesso negado', 403);
  }

  const body = updateSchema.parse(req.body);

  const budget = await prisma.budget.update({
    where: { id: budgetId },
    data: body,
    include: { createdBy: { select: { id: true, name: true, role: true } } },
  });

  return res.json(budget);
};

export const deleteBudget = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { budgetId } = req.params;

  const existing = await prisma.budget.findUnique({ where: { id: budgetId } });
  if (!existing) throw new AppError('Orçamento não encontrado', 404);
  if (role !== 'ADMIN' && existing.createdById !== userId) {
    throw new AppError('Acesso negado', 403);
  }

  await prisma.budget.delete({ where: { id: budgetId } });
  return res.json({ message: 'Orçamento excluído' });
};
