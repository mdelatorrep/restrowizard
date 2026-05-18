import { z } from 'zod';

export const JobApplicationSchema = z.object({
  job_id: z.string().uuid('Oferta inválida'),
  candidate_profile_id: z.string().uuid('Perfil inválido'),
  cover_letter: z.string().trim().max(2000, 'Máximo 2000 caracteres').optional().or(z.literal('')),
  resume_url: z.string().url('URL de CV inválida').optional(),
  applicant_name: z.string().trim().min(1, 'Nombre requerido').max(120),
  applicant_email: z.string().trim().email('Email inválido').max(255).optional(),
  applicant_phone: z.string().trim().max(40).optional(),
});

export type JobApplicationInput = z.infer<typeof JobApplicationSchema>;
