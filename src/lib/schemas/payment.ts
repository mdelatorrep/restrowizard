import { z } from 'zod';

export const PaymentDialogSchema = z.object({
  selectedMethodId: z.string().min(1, 'Selecciona un método de pago'),
  tipAmount: z.coerce.number().min(0, 'Propina inválida').max(1_000_000, 'Propina excesiva'),
  cashReceived: z.coerce.number().min(0).optional().default(0),
});

export const buildCashPaymentSchema = (finalTotal: number) =>
  PaymentDialogSchema.refine(
    (v) => v.cashReceived === undefined || v.cashReceived >= finalTotal,
    { message: 'Efectivo recibido debe cubrir el total', path: ['cashReceived'] },
  );

export type PaymentDialogValues = z.infer<typeof PaymentDialogSchema>;
