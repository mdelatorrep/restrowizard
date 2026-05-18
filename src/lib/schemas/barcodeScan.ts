import { z } from 'zod';

export const BarcodeScanSchema = z.object({
  barcode: z.string().trim().min(1, 'Código requerido').max(120, 'Código demasiado largo'),
  adjustment: z.coerce.number().int('Debe ser entero').min(1, 'Cantidad debe ser >= 1').max(100000, 'Cantidad excesiva'),
  mode: z.enum(['add', 'remove'], { errorMap: () => ({ message: 'Modo inválido' }) }),
});

export type BarcodeScanValues = z.infer<typeof BarcodeScanSchema>;
