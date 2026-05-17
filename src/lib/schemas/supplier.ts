import { z } from 'zod';

export const SupplierSchema = z.object({
  supplier_name: z.string().trim().min(1, 'El nombre es obligatorio').max(160),
  contact_name: z.string().max(120).optional().default(''),
  email: z.string().trim().email('Email inválido').max(180).optional().or(z.literal('')).default(''),
  phone: z.string().max(40).optional().default(''),
  address: z.string().max(240).optional().default(''),
  city: z.string().max(120).optional().default(''),
  payment_terms: z.string().max(80).optional().default(''),
  minimum_order: z.coerce.number().min(0).default(0),
  delivery_days: z.string().max(80).optional().default(''),
  lead_time_days: z.coerce.number().min(1, 'Mínimo 1 día').default(1),
  notes: z.string().max(1000).optional().default(''),
  is_active: z.boolean().default(true),
  rating: z.coerce.number().min(0).max(5, 'Máx. 5').default(0),
});

export type SupplierValues = z.infer<typeof SupplierSchema>;
