import { z } from 'zod';

export const CreateClientSchema = z.object({
  restaurant_name: z.string().trim().min(1, 'El nombre del restaurante es requerido').max(200),
  restaurant_city: z.string().trim().max(120).optional().or(z.literal('')),
  restaurant_cuisine_type: z.string().trim().max(80).optional().or(z.literal('')),
  restaurant_email: z.string().trim().email('Email inválido').max(200).optional().or(z.literal('')),
  restaurant_phone: z.string().trim().max(40).optional().or(z.literal('')),
  monthly_fee: z.coerce.number().min(0, 'Tarifa inválida').optional(),
  services_included: z.string().trim().max(500).optional().or(z.literal('')),
});

export type CreateClientInput = z.infer<typeof CreateClientSchema>;
