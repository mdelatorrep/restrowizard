import { z } from 'zod';

export const ReservationSchema = z.object({
  customer_name: z.string().trim().min(2, 'Nombre demasiado corto').max(120, 'Nombre demasiado largo'),
  customer_email: z.string().trim().email('Email inválido').max(255).optional().or(z.literal('')),
  customer_phone: z.string().trim().min(5, 'Teléfono requerido').max(40, 'Teléfono inválido'),
  party_size: z.coerce.number().int().min(1, 'Mínimo 1 persona').max(200, 'Tamaño excesivo'),
  reservation_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  reservation_time: z.string().regex(/^\d{2}:\d{2}/, 'Hora inválida'),
  special_requests: z.string().max(1000, 'Notas demasiado largas').optional().or(z.literal('')),
  source: z.enum(['phone', 'walk_in', 'website'], { errorMap: () => ({ message: 'Fuente inválida' }) }),
  table_id: z.string().uuid().nullable().optional(),
  duration_minutes: z.coerce.number().int().min(15).max(480).default(90),
});

export type ReservationValues = z.infer<typeof ReservationSchema>;

