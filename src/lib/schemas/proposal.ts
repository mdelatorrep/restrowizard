import { z } from 'zod';

export const ProposalSchema = z.object({
  request_id: z.string().uuid('Solicitud inválida'),
  provider_id: z.string().uuid('Proveedor inválido'),
  message: z.string().trim().min(20, 'Mensaje muy corto (mín. 20 caracteres)').max(2000, 'Mensaje muy largo'),
  price: z.coerce.number().min(0, 'Precio inválido').max(1_000_000_000, 'Precio excesivo').optional(),
  estimated_delivery_days: z.coerce.number().int().min(1, 'Mínimo 1 día').max(365, 'Máximo 365 días').optional(),
});

export type ProposalValues = z.infer<typeof ProposalSchema>;
