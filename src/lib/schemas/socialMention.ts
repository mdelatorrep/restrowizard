import { z } from 'zod';

export const SOCIAL_PLATFORMS = ['google', 'tripadvisor', 'yelp', 'instagram', 'facebook', 'twitter'] as const;

export const AddMentionSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  content: z.string().trim().min(1, 'El contenido es requerido').max(2000),
  author_name: z.string().trim().max(120).optional().or(z.literal('')),
  rating: z.coerce.number().int().min(1).max(5),
});

export const ConnectAccountSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  account_name: z.string().trim().min(1, 'El nombre de cuenta es requerido').max(120),
  account_url: z.string().trim().url('URL inválida').optional().or(z.literal('')),
});

export type AddMentionInput = z.infer<typeof AddMentionSchema>;
export type ConnectAccountInput = z.infer<typeof ConnectAccountSchema>;
