import { describe, it, expect } from 'vitest';
import {
  getOrderSaleAmount,
  getLineUnitPrice,
  getLineQuantity,
  getLineName,
  getLineMenuItemId,
  getLineRevenue,
  toOrderLines,
} from './orderItems';

/**
 * Tests de REGRESIÓN sobre las reglas de dinero.
 *
 * Cada bloque fija un bug real que llegó a producción. Los números no son
 * inventados: salen de las verificaciones hechas contra la BD al arreglarlos.
 */

describe('getOrderSaleAmount — B-20/B-39: la propina no es venta', () => {
  it('excluye la propina del monto de venta', () => {
    // Verificado contra prod: venta 50.000 + propina 10.000.
    // "Ventas Hoy" mostraba 60.000 y Reportes 50.000 — misma venta, dos pantallas.
    expect(getOrderSaleAmount({ total: 60000, tip_amount: 10000 })).toBe(50000);
  });

  it('devuelve el total cuando no hay propina', () => {
    expect(getOrderSaleAmount({ total: 50000, tip_amount: 0 })).toBe(50000);
    expect(getOrderSaleAmount({ total: 50000, tip_amount: null })).toBe(50000);
    expect(getOrderSaleAmount({ total: 50000 })).toBe(50000);
  });

  it('nunca devuelve negativo aunque la propina supere el total', () => {
    // Dato corrupto: no debe restar plata de las ventas del día.
    expect(getOrderSaleAmount({ total: 100, tip_amount: 500 })).toBe(0);
  });

  it('tolera strings numéricos (numeric de Postgres llega como string)', () => {
    expect(getOrderSaleAmount({ total: '60000', tip_amount: '10000' })).toBe(50000);
  });

  it('no revienta con null/undefined', () => {
    expect(getOrderSaleAmount(null)).toBe(0);
    expect(getOrderSaleAmount(undefined)).toBe(0);
    expect(getOrderSaleAmount({})).toBe(0);
  });
});

describe('getLineUnitPrice — B-37: `price` vs `unit_price`', () => {
  it('lee `price` (pedidos web y manuales)', () => {
    expect(getLineUnitPrice({ price: 100 })).toBe(100);
  });

  it('lee `unit_price` (todo lo que nace en el POS)', () => {
    // Este era el bug: los lectores analíticos solo miraban `price`, así que
    // TODA venta de POS entraba con ingreso 0 y la matriz BCG la marcaba "perro".
    expect(getLineUnitPrice({ unit_price: 100 })).toBe(100);
  });

  it('prefiere `price` cuando vienen los dos', () => {
    expect(getLineUnitPrice({ price: 100, unit_price: 999 })).toBe(100);
  });

  it('devuelve 0 si no hay ninguno', () => {
    expect(getLineUnitPrice({})).toBe(0);
    expect(getLineUnitPrice({ price: null, unit_price: null })).toBe(0);
  });
});

describe('getLineRevenue — ingreso de la línea', () => {
  it('multiplica precio por cantidad', () => {
    // Verificado contra prod: la línea que antes valía 0 ahora vale 200.
    expect(getLineRevenue({ unit_price: 100, quantity: 2 })).toBe(200);
    expect(getLineRevenue({ price: 100, quantity: 2 })).toBe(200);
  });

  it('suma los modificadores por unidad', () => {
    // Papas (2.000) + extra queso (500) x 3 = 7.500
    expect(getLineRevenue({
      price: 2000,
      quantity: 3,
      modifiers: [{ name: 'Extra queso', price: 500 }],
    })).toBe(7500);
  });

  it('asume cantidad 1 cuando falta (comportamiento previo)', () => {
    expect(getLineRevenue({ price: 100 })).toBe(100);
  });
});

describe('getLineQuantity / getLineName / getLineMenuItemId', () => {
  it('cantidad: default 1, ignora valores no positivos', () => {
    expect(getLineQuantity({ quantity: 3 })).toBe(3);
    expect(getLineQuantity({})).toBe(1);
    expect(getLineQuantity({ quantity: 0 })).toBe(1);
    expect(getLineQuantity({ quantity: -5 })).toBe(1);
  });

  it('nombre: cae a "Sin nombre" con vacío o espacios', () => {
    expect(getLineName({ name: 'Waffle' })).toBe('Waffle');
    expect(getLineName({ name: '   ' })).toBe('Sin nombre');
    expect(getLineName({})).toBe('Sin nombre');
  });

  it('id: acepta `menu_item_id` o `id`', () => {
    expect(getLineMenuItemId({ menu_item_id: 'abc' })).toBe('abc');
    expect(getLineMenuItemId({ id: 'xyz' })).toBe('xyz');
    expect(getLineMenuItemId({})).toBeNull();
  });
});

describe('toOrderLines — `items` es jsonb sin forma garantizada', () => {
  it('devuelve el array tal cual', () => {
    expect(toOrderLines([{ name: 'a' }])).toHaveLength(1);
  });

  it('devuelve [] ante cualquier cosa que no sea array', () => {
    // Sin esto, un `items` corrupto tumbaba el reporte entero.
    expect(toOrderLines(null)).toEqual([]);
    expect(toOrderLines(undefined)).toEqual([]);
    expect(toOrderLines({})).toEqual([]);
    expect(toOrderLines('[]')).toEqual([]);
  });
});
