import type { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../../../config/prisma';
import AppError from '../../../shared/errors/AppError';

const createSchema = z.object({
  clientName: z.string().min(1),
  companyName: z.string().optional(),
  value: z.preprocess((v) => Number(v), z.number().positive()),
  description: z.string().optional(),
  budgetId: z.string().uuid().optional(),
  status: z.enum(['EM_ANDAMENTO', 'FECHADA', 'PERDIDA']).default('FECHADA'),
});

const updateSchema = z.object({
  clientName: z.string().min(1).optional(),
  companyName: z.string().nullable().optional(),
  value: z.preprocess((v) => (v !== undefined ? Number(v) : undefined), z.number().positive().optional()),
  description: z.string().nullable().optional(),
  status: z.enum(['EM_ANDAMENTO', 'FECHADA', 'PERDIDA']).optional(),
});

export const listSales = async (req: Request, res: Response) => {
  const { userId, role, tenantId } = req.auth!;
  const { status, search } = req.query;

  const where: any = {};

  if (role === 'ADMIN') {
    if (tenantId) where.tenantId = tenantId;
  } else {
    where.closedById = userId;
    if (tenantId) where.tenantId = tenantId;
  }

  if (status) where.status = String(status);

  if (search) {
    where.OR = [
      { clientName: { contains: String(search), mode: 'insensitive' } },
      { companyName: { contains: String(search), mode: 'insensitive' } },
    ];
  }

  const sales = await prisma.sale.findMany({
    where,
    orderBy: { closedAt: 'desc' },
    include: {
      closedBy: { select: { id: true, name: true, role: true } },
      budget: { select: { id: true, clientName: true, totalValue: true } },
    },
  });

  return res.json(sales);
};

export const getSale = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { saleId } = req.params;

  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      closedBy: { select: { id: true, name: true, role: true } },
      budget: true,
    },
  });

  if (!sale) throw new AppError('Venda não encontrada', 404);
  if (role !== 'ADMIN' && sale.closedById !== userId) {
    throw new AppError('Acesso negado', 403);
  }

  return res.json(sale);
};

export const createSale = async (req: Request, res: Response) => {
  const { userId, tenantId } = req.auth!;
  if (!tenantId) throw new AppError('Tenant não definido', 400);

  const body = createSchema.parse(req.body);

  // Se tem budgetId, vincula e marca orçamento como FECHADO
  const sale = await prisma.$transaction(async (tx) => {
    if (body.budgetId) {
      const budget = await tx.budget.findUnique({ where: { id: body.budgetId } });
      if (!budget) throw new AppError('Orçamento não encontrado', 404);

      await tx.budget.update({
        where: { id: body.budgetId },
        data: { status: 'FECHADO' },
      });
    }

    return tx.sale.create({
      data: {
        clientName: body.clientName,
        companyName: body.companyName,
        value: body.value,
        description: body.description,
        status: body.status,
        budgetId: body.budgetId,
        tenantId,
        closedById: userId,
      },
      include: {
        closedBy: { select: { id: true, name: true, role: true } },
      },
    });
  });

  return res.status(201).json(sale);
};

export const updateSale = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { saleId } = req.params;

  const existing = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!existing) throw new AppError('Venda não encontrada', 404);
  if (role !== 'ADMIN' && existing.closedById !== userId) {
    throw new AppError('Acesso negado', 403);
  }

  const body = updateSchema.parse(req.body);

  const sale = await prisma.sale.update({
    where: { id: saleId },
    data: body,
    include: { closedBy: { select: { id: true, name: true, role: true } } },
  });

  return res.json(sale);
};

export const deleteSale = async (req: Request, res: Response) => {
  const { userId, role } = req.auth!;
  const { saleId } = req.params;

  const existing = await prisma.sale.findUnique({ where: { id: saleId } });
  if (!existing) throw new AppError('Venda não encontrada', 404);
  if (role !== 'ADMIN' && existing.closedById !== userId) {
    throw new AppError('Acesso negado', 403);
  }

  await prisma.sale.delete({ where: { id: saleId } });
  return res.json({ message: 'Venda excluída' });
};

// Dashboard stats para vendedor
export const getVendedorStats = async (req: Request, res: Response) => {
  const { userId, tenantId } = req.auth!;
  if (!tenantId) throw new AppError('Tenant não definido', 400);

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalSales, monthlySales, openBudgets, totalBudgets] = await Promise.all([
    prisma.sale.count({ where: { closedById: userId, tenantId } }),
    prisma.sale.findMany({
      where: { closedById: userId, tenantId, closedAt: { gte: startOfMonth } },
    }),
    prisma.budget.count({ where: { createdById: userId, tenantId, status: 'PENDENTE' } }),
    prisma.budget.count({ where: { createdById: userId, tenantId } }),
  ]);

  const monthlyRevenue = monthlySales.reduce((sum, s) => sum + Number(s.value), 0);
  const monthlyCount = monthlySales.length;
  const avgTicket = monthlyCount > 0 ? monthlyRevenue / monthlyCount : 0;

  return res.json({
    totalSales,
    monthlyCount,
    monthlyRevenue,
    avgTicket,
    openBudgets,
    totalBudgets,
  });
};
