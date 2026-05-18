import { z } from 'zod';

export const TrainingProgramSchema = z.object({
  title: z.string().trim().min(1, 'Título requerido').max(120),
  description: z.string().trim().max(1000).nullable().optional(),
  category: z.string().trim().min(1).max(60),
  position: z.string().trim().max(80).nullable().optional(),
  estimated_hours: z.coerce.number().min(0.1, 'Mínimo 0.1 h').max(500, 'Máximo 500 h'),
  is_mandatory: z.boolean(),
  is_active: z.boolean(),
  passing_score: z.coerce.number().int().min(0).max(100, 'Máximo 100%'),
});

export const BenefitSchema = z.object({
  benefit_name: z.string().trim().min(1, 'Nombre requerido').max(120),
  benefit_type: z.string().trim().min(1).max(60),
  description: z.string().trim().max(500).nullable().optional(),
  value: z.coerce.number().min(0, 'Debe ser positivo'),
  value_type: z.enum(['fixed', 'percentage', 'unlimited']),
  eligibility_months: z.coerce.number().int().min(0).max(120),
});

export type TrainingProgramInput = z.infer<typeof TrainingProgramSchema>;
export type BenefitInput = z.infer<typeof BenefitSchema>;
