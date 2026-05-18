import { z } from 'zod';

export const BenefitAssignmentSchema = z.object({
  staff_member_id: z.string().uuid('Empleado inválido'),
  benefit_id: z.string().uuid('Beneficio inválido'),
  notes: z.string().trim().max(500).optional().or(z.literal('')),
});

export const TrainingAssignmentSchema = z.object({
  staff_member_id: z.string().uuid('Empleado inválido'),
  training_program_id: z.string().uuid('Programa inválido'),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida').optional().or(z.literal('')),
});

export const AvailabilitySlotSchema = z
  .object({
    day_of_week: z.number().int().min(0).max(6),
    start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora inválida'),
    end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Hora inválida'),
    is_available: z.boolean(),
    notes: z.string().nullable().optional(),
  })
  .refine((s) => s.start_time < s.end_time, {
    message: 'Hora fin debe ser posterior a hora inicio',
    path: ['end_time'],
  });

export const AvailabilitySlotsSchema = z.array(AvailabilitySlotSchema);

export type BenefitAssignmentInput = z.infer<typeof BenefitAssignmentSchema>;
export type TrainingAssignmentInput = z.infer<typeof TrainingAssignmentSchema>;
export type AvailabilitySlotInput = z.infer<typeof AvailabilitySlotSchema>;
