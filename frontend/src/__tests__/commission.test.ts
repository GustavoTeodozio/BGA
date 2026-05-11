import { describe, it, expect } from 'vitest';

const COMMISSION_RATE = 0.04;

function calcCommission(value: number, status: string): number | null {
  return status === 'FECHADA' ? value * COMMISSION_RATE : null;
}

function calcTotals(sales: { value: number; status: string }[]) {
  const closed = sales.filter(s => s.status === 'FECHADA');
  const totalRevenue = closed.reduce((sum, s) => sum + s.value, 0);
  const totalCommission = totalRevenue * COMMISSION_RATE;
  return { totalRevenue, totalCommission, count: closed.length };
}

// ──────────────────────────────────────────────────────────────────────
// Comissão individual por venda
// ──────────────────────────────────────────────────────────────────────
describe('calcCommission', () => {
  it('retorna 4% do valor para venda FECHADA', () => {
    expect(calcCommission(40000, 'FECHADA')).toBeCloseTo(1600);
    expect(calcCommission(10000, 'FECHADA')).toBeCloseTo(400);
    expect(calcCommission(150000, 'FECHADA')).toBeCloseTo(6000);
  });

  it('retorna null para venda PERDIDA', () => {
    expect(calcCommission(40000, 'PERDIDA')).toBeNull();
  });

  it('retorna null para venda EM_ANDAMENTO', () => {
    expect(calcCommission(40000, 'EM_ANDAMENTO')).toBeNull();
  });

  it('funciona com valores fracionários', () => {
    expect(calcCommission(1234.56, 'FECHADA')).toBeCloseTo(49.38, 2);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Totalizador (painel do vendedor)
// ──────────────────────────────────────────────────────────────────────
describe('calcTotals', () => {
  it('soma somente as vendas fechadas', () => {
    const sales = [
      { value: 40000, status: 'FECHADA' },
      { value: 20000, status: 'FECHADA' },
      { value: 15000, status: 'PERDIDA' },
      { value: 5000,  status: 'EM_ANDAMENTO' },
    ];
    const { totalRevenue, totalCommission, count } = calcTotals(sales);
    expect(count).toBe(2);
    expect(totalRevenue).toBe(60000);
    expect(totalCommission).toBeCloseTo(2400);
  });

  it('retorna zeros quando não há vendas fechadas', () => {
    const sales = [
      { value: 10000, status: 'PERDIDA' },
      { value: 5000,  status: 'EM_ANDAMENTO' },
    ];
    const { totalRevenue, totalCommission, count } = calcTotals(sales);
    expect(count).toBe(0);
    expect(totalRevenue).toBe(0);
    expect(totalCommission).toBe(0);
  });

  it('retorna zeros com lista vazia', () => {
    const { totalRevenue, totalCommission, count } = calcTotals([]);
    expect(count).toBe(0);
    expect(totalRevenue).toBe(0);
    expect(totalCommission).toBe(0);
  });

  it('calcula corretamente com muitas vendas', () => {
    const sales = Array.from({ length: 10 }, (_, i) => ({
      value: 10000 * (i + 1),
      status: 'FECHADA',
    }));
    // 10k + 20k + ... + 100k = 550k
    const { totalRevenue, totalCommission } = calcTotals(sales);
    expect(totalRevenue).toBe(550000);
    expect(totalCommission).toBeCloseTo(22000);
  });
});

// ──────────────────────────────────────────────────────────────────────
// Ranking de comissão por vendedor (lógica do AdminSales)
// ──────────────────────────────────────────────────────────────────────
describe('ranking de comissão por vendedor', () => {
  function buildRanking(sales: { value: number; status: string; sellerName: string; sellerId: string }[]) {
    const map: Record<string, { name: string; revenue: number; commission: number; count: number }> = {};
    for (const s of sales.filter(s => s.status === 'FECHADA')) {
      if (!map[s.sellerId]) map[s.sellerId] = { name: s.sellerName, revenue: 0, commission: 0, count: 0 };
      map[s.sellerId].revenue += s.value;
      map[s.sellerId].commission += s.value * COMMISSION_RATE;
      map[s.sellerId].count += 1;
    }
    return Object.values(map).sort((a, b) => b.commission - a.commission);
  }

  it('agrupa corretamente e ordena por comissão decrescente', () => {
    const sales = [
      { value: 50000, status: 'FECHADA', sellerName: 'Ana',   sellerId: 'u1' },
      { value: 20000, status: 'FECHADA', sellerName: 'Bruno', sellerId: 'u2' },
      { value: 30000, status: 'FECHADA', sellerName: 'Ana',   sellerId: 'u1' },
      { value: 10000, status: 'PERDIDA', sellerName: 'Bruno', sellerId: 'u2' },
    ];
    const ranking = buildRanking(sales);

    expect(ranking[0].name).toBe('Ana');
    expect(ranking[0].revenue).toBe(80000);
    expect(ranking[0].commission).toBeCloseTo(3200);
    expect(ranking[0].count).toBe(2);

    expect(ranking[1].name).toBe('Bruno');
    expect(ranking[1].revenue).toBe(20000);
    expect(ranking[1].commission).toBeCloseTo(800);
  });

  it('exclui vendas não fechadas do ranking', () => {
    const sales = [
      { value: 100000, status: 'EM_ANDAMENTO', sellerName: 'Carlos', sellerId: 'u3' },
      { value: 100000, status: 'PERDIDA',       sellerName: 'Carlos', sellerId: 'u3' },
    ];
    const ranking = buildRanking(sales);
    expect(ranking).toHaveLength(0);
  });
});
