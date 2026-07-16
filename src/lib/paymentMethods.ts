/**
 * B-21 / B-09 — Categoría canónica del método de pago.
 *
 * Vivía como una función `canonical()` declarada DENTRO del handler de venta de
 * `POS.tsx`, así que el camino offline no podía usarla y guardaba el método sin
 * normalizar (o directamente sin método). Resultado: Reportes mostraba "Otros"
 * y el cuadre de caja no sabía qué ventas fueron en efectivo.
 *
 * Mismo criterio que `getOrderSaleAmount` (B-39): la regla vive en un solo
 * lugar y todos los flujos la importan.
 */
export type CanonicalPaymentMethod =
  | 'efectivo' | 'nequi' | 'daviplata' | 'transferencia'
  | 'tarjeta_credito' | 'tarjeta_debito' | 'qr' | 'otro';

export const canonicalPaymentMethod = (name: string | null | undefined): CanonicalPaymentMethod => {
  const n = (name || '').toLowerCase();
  if (n.includes('efectivo') || n.includes('cash')) return 'efectivo';
  if (n.includes('nequi')) return 'nequi';
  if (n.includes('davi')) return 'daviplata';
  if (n.includes('transfer')) return 'transferencia';
  if (n.includes('crédito') || n.includes('credito') || n.includes('credit')) return 'tarjeta_credito';
  if (n.includes('débito') || n.includes('debito') || n.includes('debit') || n.includes('tarjeta')) return 'tarjeta_debito';
  if (n.includes('qr')) return 'qr';
  return 'otro';
};

/**
 * Método principal de un pago dividido: el de mayor monto.
 * (El desglose completo queda en las filas de `pos_transactions`.)
 */
export const principalPaymentMethod = (
  payments: Array<{ methodName?: string | null; method_name?: string | null; amount: number }>
): CanonicalPaymentMethod => {
  const principal = [...(payments || [])].sort((a, b) => b.amount - a.amount)[0];
  if (!principal) return 'otro';
  return canonicalPaymentMethod(principal.methodName ?? principal.method_name);
};
