import { z } from 'zod';

export const LoyaltyTierSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(60, 'Máx. 60 caracteres'),
  min_points: z.coerce.number().int('Debe ser entero').min(0, 'Debe ser >= 0'),
  points_multiplier: z.coerce.number().min(0.1, 'Mínimo 0.1').max(10, 'Máximo 10'),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, 'Color hex inválido')
    .default('#6B7280'),
});
export type LoyaltyTierValues = z.infer<typeof LoyaltyTierSchema>;

export const LoyaltyCustomerSchema = z.object({
  customer_name: z.string().trim().min(1, 'Nombre requerido').max(120),
  customer_email: z
    .string()
    .trim()
    .max(255)
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  customer_phone: z.string().trim().max(40, 'Teléfono demasiado largo').optional().or(z.literal('')),
});
export type LoyaltyCustomerValues = z.infer<typeof LoyaltyCustomerSchema>;

export const LoyaltyRewardSchema = z.object({
  name: z.string().trim().min(1, 'Nombre requerido').max(120),
  description: z.string().max(500, 'Máx. 500 caracteres').optional().default(''),
  points_required: z.coerce.number().int().min(1, 'Debe ser >= 1'),
  reward_type: z.enum([
    'discount_percent',
    'discount_fixed',
    'free_item',
    'free_delivery',
    'experience',
    'upgrade',
  ]),
  reward_value: z.coerce.number().min(0, 'Debe ser >= 0').default(0),
});
export type LoyaltyRewardValues = z.infer<typeof LoyaltyRewardSchema>;

export const AwardPointsSchema = z.object({
  points: z.coerce.number().int().min(1, 'Debe ser >= 1').max(1_000_000, 'Excesivo'),
  reason: z.string().trim().min(1, 'Razón requerida').max(120),
});
export type AwardPointsValues = z.infer<typeof AwardPointsSchema>;
