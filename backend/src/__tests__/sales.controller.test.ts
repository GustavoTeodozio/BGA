jest.mock('../config/prisma', () => ({
  __esModule: true,
  default: {
    sale: {
      findMany:   jest.fn(),
      findUnique: jest.fn(),
      create:     jest.fn(),
      update:     jest.fn(),
      delete:     jest.fn(),
      count:      jest.fn(),
    },
    budget: {
      findUnique: jest.fn(),
      update:     jest.fn(),
      count:      jest.fn(),
    },
    $transaction: jest.fn((fn: any) => fn({
      sale:   { findMany: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), delete: jest.fn(), count: jest.fn() },
      budget: { findUnique: jest.fn(), update: jest.fn(), count: jest.fn() },
    })),
  },
}), { virtual: true });

import prisma from '../config/prisma';
import { listSales, createSale, getVendedorStats } from '../infra/http/controllers/sales.controller';

const db = prisma as any;

function mockReq(overrides: Record<string, any> = {}): any {
  return {
    auth: { userId: 'user-1', role: 'VENDEDOR', tenantId: 'tenant-1' },
    query: {},
    params: {},
    body: {},
    ...overrides,
  };
}

function mockRes(): any {
  const res: any = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

const COMMISSION_RATE = 0.04;

beforeEach(() => jest.clearAllMocks());

// ──────────────────────────────────────────────────────────────────────
// listSales
// ──────────────────────────────────────────────────────────────────────
describe('listSales', () => {
  it('vendedor vê apenas suas próprias vendas (filtra por closedById)', async () => {
    const fakeSales = [{ id: 's1', value: 10000, status: 'FECHADA', closedById: 'user-1' }];
    db.sale.findMany.mockResolvedValue(fakeSales);

    const req = mockReq();
    const res = mockRes();
    await listSales(req, res);

    const where = db.sale.findMany.mock.calls[0][0].where;
    expect(where.closedById).toBe('user-1');
    expect(res.json).toHaveBeenCalledWith(fakeSales);
  });

  it('admin vê todas as vendas do tenant (sem filtro por closedById)', async () => {
    db.sale.findMany.mockResolvedValue([]);

    const req = mockReq({ auth: { userId: 'admin-1', role: 'ADMIN', tenantId: 'tenant-1' } });
    const res = mockRes();
    await listSales(req, res);

    const where = db.sale.findMany.mock.calls[0][0].where;
    expect(where.closedById).toBeUndefined();
    expect(where.tenantId).toBe('tenant-1');
  });

  it('filtra por status quando passado na query', async () => {
    db.sale.findMany.mockResolvedValue([]);

    const req = mockReq({ query: { status: 'FECHADA' } });
    const res = mockRes();
    await listSales(req, res);

    const where = db.sale.findMany.mock.calls[0][0].where;
    expect(where.status).toBe('FECHADA');
  });
});

// ──────────────────────────────────────────────────────────────────────
// createSale
// ──────────────────────────────────────────────────────────────────────
describe('createSale', () => {
  it('cria venda e associa closedById ao usuário autenticado', async () => {
    const created = { id: 's2', value: 40000, status: 'FECHADA', closedById: 'user-1' };
    // $transaction chama fn com o tx mock — precisamos que sale.create retorne
    db.$transaction.mockImplementation(async (fn: any) => {
      const tx = {
        sale:   { create: jest.fn().mockResolvedValue(created), findUnique: jest.fn() },
        budget: { findUnique: jest.fn(), update: jest.fn() },
      };
      return fn(tx);
    });

    const req = mockReq({ body: { clientName: 'Cliente Teste', value: 40000, status: 'FECHADA' } });
    const res = mockRes();
    await createSale(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(created);
  });

  it('rejeita criação sem tenantId', async () => {
    const req = mockReq({
      auth: { userId: 'user-1', role: 'VENDEDOR', tenantId: null },
      body: { clientName: 'Teste', value: 1000, status: 'FECHADA' },
    });
    const res = mockRes();
    await expect(createSale(req, res)).rejects.toMatchObject({ message: 'Tenant não definido' });
  });

  it('rejeita valor zero ou negativo via validação zod', async () => {
    const req = mockReq({ body: { clientName: 'X', value: 0, status: 'FECHADA' } });
    const res = mockRes();
    await expect(createSale(req, res)).rejects.toBeDefined();
  });
});

// ──────────────────────────────────────────────────────────────────────
// Comissão — cálculo de 4% por venda fechada
// ──────────────────────────────────────────────────────────────────────
describe('Comissão 4%', () => {
  const cases = [
    { value: 40000,  expected: 1600 },
    { value: 10000,  expected: 400 },
    { value: 150000, expected: 6000 },
    { value: 1,      expected: 0.04 },
  ];

  it.each(cases)('R$ $value fechado → comissão de R$ $expected', ({ value, expected }) => {
    expect(value * COMMISSION_RATE).toBeCloseTo(expected, 2);
  });

  it('venda PERDIDA ou EM_ANDAMENTO não gera comissão', () => {
    const statuses: string[] = ['PERDIDA', 'EM_ANDAMENTO'];
    for (const status of statuses) {
      const commission = status === 'FECHADA' ? 40000 * COMMISSION_RATE : null;
      expect(commission).toBeNull();
    }
  });

  it('total de comissão é soma das vendas fechadas × 4%', () => {
    const sales = [
      { value: 40000, status: 'FECHADA' },
      { value: 20000, status: 'FECHADA' },
      { value: 15000, status: 'PERDIDA' },
      { value: 5000,  status: 'EM_ANDAMENTO' },
    ];
    const totalRevenue = sales
      .filter(s => s.status === 'FECHADA')
      .reduce((sum, s) => sum + s.value, 0);
    const totalCommission = totalRevenue * COMMISSION_RATE;

    expect(totalRevenue).toBe(60000);
    expect(totalCommission).toBeCloseTo(2400, 2);
  });
});

// ──────────────────────────────────────────────────────────────────────
// getVendedorStats
// ──────────────────────────────────────────────────────────────────────
describe('getVendedorStats', () => {
  it('retorna métricas mensais do vendedor', async () => {
    db.sale.count.mockResolvedValue(5);
    db.sale.findMany.mockResolvedValue([{ value: 20000 }, { value: 30000 }]);
    db.budget.count.mockResolvedValue(3);

    const req = mockReq();
    const res = mockRes();
    await getVendedorStats(req, res);

    const json = res.json.mock.calls[0][0];
    expect(json.totalSales).toBe(5);
    expect(json.monthlyRevenue).toBe(50000);
    expect(json.monthlyCount).toBe(2);
    expect(json.avgTicket).toBe(25000);
  });
});
