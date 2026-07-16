import { describe, it, expect, vi } from 'vitest';

vi.mock('@/integrations/supabase/client', () => ({ supabase: { from: vi.fn() } }));

import { computeLoyaltyKPIs, calculateDaysSinceLastOrder } from './loyaltyData';
import type { LoyaltyCustomer } from './loyaltyData';

const cliente = (over: Partial<LoyaltyCustomer> = {}): LoyaltyCustomer => ({
  id: 'c1',
  current_points: 0,
  lifetime_points: 0,
  total_spent: 0,
  total_orders: 0,
  is_active: true,
  churn_risk_score: 0,
  last_order_at: null,
  ...(over as any),
} as LoyaltyCustomer);

const hace = (dias: number) => {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
};

describe('computeLoyaltyKPIs — B-43: la tasa de canje', () => {
  it('calcula canjeados/otorgados (antes era 0 hardcodeado)', () => {
    // Verificado contra prod: 1000 otorgados, 250 canjeados -> 25%.
    // El código decía `redemptionRate: 0 // Will be calculated separately`
    // y ese "separately" nunca llegó: el tablero mostraba 0% siempre.
    const k = computeLoyaltyKPIs([cliente()], 1000, 250);
    expect(k.redemptionRate).toBe(25);
  });

  it('0% de canje real es información, no ausencia de datos', () => {
    // Un 0% legítimo significa "nadie usa las recompensas": el programa está
    // muerto y hay que actuar. Por eso importaba que el stub no lo simulara.
    expect(computeLoyaltyKPIs([cliente()], 1000, 0).redemptionRate).toBe(0);
  });

  it('sin puntos otorgados no divide por cero', () => {
    expect(computeLoyaltyKPIs([cliente()], 0, 0).redemptionRate).toBe(0);
  });

  it('sin clientes devuelve todo en cero, no NaN', () => {
    const k = computeLoyaltyKPIs([], 1000, 250);
    expect(k.totalCustomers).toBe(0);
    expect(k.avgLTV).toBe(0);
    expect(k.redemptionRate).toBe(0);
  });
});

describe('computeLoyaltyKPIs — riesgo y retención', () => {
  it('cuenta en riesgo desde churn_risk_score >= 0.6', () => {
    const k = computeLoyaltyKPIs([
      cliente({ churn_risk_score: 0.59 }),
      cliente({ churn_risk_score: 0.6 }),
      cliente({ churn_risk_score: 0.9 }),
    ], 0, 0);
    expect(k.atRiskCustomers).toBe(2);
  });

  it('retenido = pidió en los últimos 90 días Y tiene más de 1 pedido', () => {
    const k = computeLoyaltyKPIs([
      cliente({ last_order_at: hace(10), total_orders: 3 }),   // retenido
      cliente({ last_order_at: hace(10), total_orders: 1 }),   // solo 1 pedido: no
      cliente({ last_order_at: hace(200), total_orders: 5 }),  // viejo: no
      cliente({ last_order_at: null, total_orders: 0 }),       // nunca: no
    ], 0, 0);
    expect(k.retentionRate).toBe(25); // 1 de 4
  });

  it('promedia LTV y puntos por cliente', () => {
    const k = computeLoyaltyKPIs([
      cliente({ total_spent: 100000, current_points: 100 }),
      cliente({ total_spent: 300000, current_points: 300 }),
    ], 0, 0);
    expect(k.avgLTV).toBe(200000);
    expect(k.totalPointsCirculating).toBe(400);
    expect(k.avgPointsPerCustomer).toBe(200);
  });
});

describe('calculateDaysSinceLastOrder', () => {
  it('devuelve null si nunca pidió', () => {
    expect(calculateDaysSinceLastOrder(null)).toBeNull();
  });

  it('cuenta los días desde el último pedido', () => {
    expect(calculateDaysSinceLastOrder(hace(5))).toBe(5);
  });
});
