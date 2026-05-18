import { z } from 'zod';

export const TICKET_TYPES = ['peticion', 'queja', 'reclamo', 'sugerencia', 'felicitacion'] as const;
export const TICKET_PRIORITIES = ['low', 'medium', 'high', 'urgent'] as const;
export const TICKET_STATUSES = ['open', 'in_progress', 'pending_customer', 'resolved', 'closed'] as const;

export const CreateTicketSchema = z.object({
  type: z.enum(TICKET_TYPES),
  priority: z.enum(TICKET_PRIORITIES),
  subject: z.string().trim().min(1, 'El asunto es requerido').max(200),
  description: z.string().trim().min(1, 'La descripción es requerida').max(5000),
  customer_name: z.string().trim().max(120).optional().or(z.literal('')),
  customer_email: z.string().trim().email('Email inválido').max(200).optional().or(z.literal('')),
  customer_phone: z.string().trim().max(40).optional().or(z.literal('')),
});

export type CreateTicketInput = z.infer<typeof CreateTicketSchema>;
