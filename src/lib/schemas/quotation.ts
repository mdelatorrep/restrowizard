import { z } from 'zod';

/**
 * Validation schema for new/edit quotation submit.
 * Used in src/pages/consultant/NewQuotation.tsx to centralize Zod validation.
 */
export const QuotationSchema = z.object({
  client_type: z.enum(['corporate', 'individual']),
  client_contact_name: z
    .string()
    .trim()
    .min(2, 'Nombre de contacto requerido (mín. 2 caracteres)')
    .max(120, 'Máximo 120 caracteres'),
  client_company: z.string().trim().max(160, 'Máximo 160 caracteres').optional().or(z.literal('')),
  client_email: z
    .string()
    .trim()
    .email('Email inválido')
    .max(255, 'Máximo 255 caracteres')
    .optional()
    .or(z.literal('')),
  client_phone: z.string().trim().max(40, 'Máximo 40 caracteres').optional().or(z.literal('')),
  event_name: z.string().trim().min(3, 'Nombre del evento requerido').max(160, 'Máximo 160 caracteres'),
  event_type: z.string().min(1, 'Tipo de evento requerido'),
  event_date: z.string().min(1, 'Fecha del evento requerida'),
  guest_count: z.number().int().min(1, 'Mínimo 1 invitado').max(10000, 'Valor irreal'),
  event_duration_hours: z.number().min(0.5, 'Mínimo 0.5 horas').max(72, 'Máximo 72 horas'),
  event_description: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
  venue_cost: z.number().min(0, 'No puede ser negativo'),
  menu_cost_per_person: z.number().min(0, 'No puede ser negativo'),
  services_cost: z.number().min(0, 'No puede ser negativo'),
  additional_costs: z.number().min(0, 'No puede ser negativo'),
  discount_percentage: z.number().min(0).max(100, 'Entre 0 y 100'),
  profit_margin_percentage: z.number().min(0).max(500, 'Entre 0 y 500'),
  valid_until: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
  internal_notes: z.string().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
});

export type QuotationSchemaValues = z.infer<typeof QuotationSchema>;
