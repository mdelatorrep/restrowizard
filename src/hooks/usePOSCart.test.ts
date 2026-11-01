import { describe, it, expect } from 'vitest';
import { computeCartTax } from './usePOSCart';

describe('computeCartTax', () => {
  it('impoconsumo incluido en el precio: se desglosa y el total no cambia', () => {
    expect(computeCartTax(59_000, 8, true)).toEqual({ taxAmount: 4_370, totalBeforeTip: 59_000 });
  });

  it('IVA aparte: se suma al total', () => {
    expect(computeCartTax(100_000, 19, false)).toEqual({ taxAmount: 19_000, totalBeforeTip: 119_000 });
  });

  it('exento o cuenta vacía: sin impuesto', () => {
    expect(computeCartTax(59_000, 0, true)).toEqual({ taxAmount: 0, totalBeforeTip: 59_000 });
    expect(computeCartTax(0, 8, false)).toEqual({ taxAmount: 0, totalBeforeTip: 0 });
  });
});
