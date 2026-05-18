import { z } from 'zod';

/**
 * Per-step Zod schemas for the NewQuotation multi-step form.
 * Used in src/pages/consultant/NewQuotation.tsx to validate each step
 * before allowing navigation to the next.
 */

// Step 1: Client + Event basics
export const QuotationStep1Schema = z.object({
  client_type: z.enum(['corporate', 'individual']),
  client_contact_name: z
    .string()
    .trim()
    .min(2, 'Nombre del contacto requerido (mín. 2 caracteres)')
    .max(120, 'Máximo 120 caracteres'),
  client_company: z.string().trim().max(160).optional().or(z.literal('')),
  client_email: z.string().trim().email('Email inválido').max(255).optional().or(z.literal('')),
  client_phone: z.string().trim().max(40).optional().or(z.literal('')),
  event_name: z.string().trim().min(3, 'Nombre del evento requerido').max(160),
  event_type: z.string().min(1, 'Tipo de evento requerido'),
  event_date: z.string().min(1, 'Fecha del evento requerida'),
  guest_count: z.coerce.number().int().min(1, 'Mínimo 1 invitado').max(10000),
  event_duration_hours: z.coerce.number().min(0.5, 'Mínimo 0.5 horas').max(72),
  event_description: z.string().max(2000).optional().or(z.literal('')),
});

// Step 2: Venue (optional zone selection)
export const QuotationStep2Schema = z.object({
  venue_cost: z.coerce.number().min(0, 'No puede ser negativo'),
});

// Step 3: Menu — at least allow empty, but per-item validation if present
export const QuotationMenuItemSchema = z.object({
  category: z.string().min(1, 'Categoría requerida'),
  item_name: z.string().trim().min(1, 'Nombre del ítem requerido').max(160),
  item_description: z.string().max(500).optional().or(z.literal('')),
  price_per_person: z.coerce.number().min(0, 'No puede ser negativo'),
  quantity: z.coerce.number().int().min(1, 'Mínimo 1'),
  is_included: z.boolean().default(true),
});

export const QuotationStep3Schema = z.object({
  menu_items: z.array(QuotationMenuItemSchema).default([]),
});

// Step 4: Services
export const QuotationServiceSchema = z.object({
  service_type: z.string().min(1),
  service_name: z.string().trim().min(1, 'Nombre del servicio requerido').max(160),
  service_description: z.string().max(500).optional().or(z.literal('')),
  price: z.coerce.number().min(0, 'No puede ser negativo'),
  provider_name: z.string().max(160).optional().or(z.literal('')),
});

export const QuotationStep4Schema = z.object({
  services_cost: z.coerce.number().min(0, 'No puede ser negativo'),
  services: z.array(QuotationServiceSchema).default([]),
});

// Step 5: Pricing / totals
export const QuotationStep5Schema = z.object({
  additional_costs: z.coerce.number().min(0),
  discount_percentage: z.coerce.number().min(0).max(100, 'Entre 0 y 100'),
  profit_margin_percentage: z.coerce.number().min(0).max(500, 'Entre 0 y 500'),
  valid_until: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
  internal_notes: z.string().max(2000).optional().or(z.literal('')),
});

export const stepSchemas = {
  1: QuotationStep1Schema,
  2: QuotationStep2Schema,
  3: QuotationStep3Schema,
  4: QuotationStep4Schema,
  5: QuotationStep5Schema,
} as const;

export type StepNumber = keyof typeof stepSchemas;
