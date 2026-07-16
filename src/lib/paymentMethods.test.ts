import { describe, it, expect } from 'vitest';
import { canonicalPaymentMethod, principalPaymentMethod } from './paymentMethods';

/**
 * B-21/B-09 — La categoría canónica del método de pago.
 *
 * Esta regla vivía DENTRO del handler de venta de POS.tsx, así que el camino
 * offline no podía usarla: guardaba el método sin normalizar (o sin método) y
 * el cierre de caja no sabía qué ventas habían sido en efectivo.
 */

describe('canonicalPaymentMethod', () => {
  it('reconoce efectivo en español e inglés', () => {
    // El cuadre de caja depende de esto: solo el efectivo cuenta para B-01/B-02.
    expect(canonicalPaymentMethod('Efectivo')).toBe('efectivo');
    expect(canonicalPaymentMethod('EFECTIVO')).toBe('efectivo');
    expect(canonicalPaymentMethod('Cash')).toBe('efectivo');
    expect(canonicalPaymentMethod('Pago en efectivo')).toBe('efectivo');
  });

  it('distingue crédito de débito', () => {
    expect(canonicalPaymentMethod('Tarjeta de crédito')).toBe('tarjeta_credito');
    expect(canonicalPaymentMethod('Credito')).toBe('tarjeta_credito');
    expect(canonicalPaymentMethod('Tarjeta débito')).toBe('tarjeta_debito');
    expect(canonicalPaymentMethod('Debit card')).toBe('tarjeta_debito');
  });

  it('"tarjeta" a secas cae a débito', () => {
    expect(canonicalPaymentMethod('Tarjeta')).toBe('tarjeta_debito');
  });

  it('reconoce los medios locales', () => {
    expect(canonicalPaymentMethod('Nequi')).toBe('nequi');
    expect(canonicalPaymentMethod('Daviplata')).toBe('daviplata');
    expect(canonicalPaymentMethod('Transferencia bancaria')).toBe('transferencia');
    expect(canonicalPaymentMethod('Código QR')).toBe('qr');
  });

  it('lo desconocido cae a "otro", no revienta', () => {
    // Reportes mostraba "Otros 100%" justo por no normalizar (B-21).
    expect(canonicalPaymentMethod('Trueque')).toBe('otro');
    expect(canonicalPaymentMethod('')).toBe('otro');
    expect(canonicalPaymentMethod(null)).toBe('otro');
    expect(canonicalPaymentMethod(undefined)).toBe('otro');
  });
});

describe('principalPaymentMethod — pago dividido', () => {
  it('elige el método de MAYOR monto como principal', () => {
    // Cliente paga 80.000 en tarjeta y 20.000 en efectivo: la orden es "tarjeta".
    expect(principalPaymentMethod([
      { methodName: 'Efectivo', amount: 20000 },
      { methodName: 'Tarjeta de crédito', amount: 80000 },
    ])).toBe('tarjeta_credito');
  });

  it('acepta tanto methodName (offline) como method_name (online)', () => {
    // Los dos caminos escriben el mismo contrato: por eso acepta ambas formas.
    expect(principalPaymentMethod([{ method_name: 'Efectivo', amount: 100 }])).toBe('efectivo');
    expect(principalPaymentMethod([{ methodName: 'Efectivo', amount: 100 }])).toBe('efectivo');
  });

  it('sin pagos devuelve "otro"', () => {
    expect(principalPaymentMethod([])).toBe('otro');
  });

  it('no muta el array recibido', () => {
    const payments = [
      { methodName: 'Efectivo', amount: 10 },
      { methodName: 'Nequi', amount: 90 },
    ];
    principalPaymentMethod(payments);
    expect(payments[0].methodName).toBe('Efectivo');
  });
});
