import { z } from 'zod';

export const StaffShiftSchema = z
  .object({
    staff_member_id: z.string().uuid({ message: 'Empleado requerido' }),
    shift_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
    start_time: z.string().regex(/^\d{2}:\d{2}/, 'Hora inicio inválida'),
    end_time: z.string().regex(/^\d{2}:\d{2}/, 'Hora fin inválida'),
    break_minutes: z.number().int().min(0).max(480).default(0),
    notes: z.string().trim().max(500).optional(),
  })
  .refine((d) => d.end_time > d.start_time, {
    message: 'La hora fin debe ser posterior a la hora inicio',
    path: ['end_time'],
  });

export type StaffShiftInput = z.infer<typeof StaffShiftSchema>;
