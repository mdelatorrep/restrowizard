import { z } from 'zod';

export const CustomerFeedbackSchema = z.object({
  customer_name: z.string().trim().max(120).optional().or(z.literal('')),
  customer_email: z.string().trim().email('Email inválido').max(255).optional().or(z.literal('')),
  rating: z.coerce.number().int().min(1, 'Mínimo 1').max(5, 'Máximo 5'),
  comment: z.string().trim().max(2000).optional().or(z.literal('')),
  source: z.string().trim().min(1),
});

export const FeedbackCampaignSchema = z.object({
  name: z.string().trim().min(2, 'Nombre demasiado corto').max(120),
  incentive: z.string().trim().max(200).optional().or(z.literal('')),
});

export const FeedbackResponseSchema = z.object({
  response_text: z.string().trim().min(1, 'Escribe una respuesta').max(2000),
});

export type CustomerFeedbackInput = z.infer<typeof CustomerFeedbackSchema>;
export type FeedbackCampaignInput = z.infer<typeof FeedbackCampaignSchema>;
