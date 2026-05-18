import { z } from 'zod';

export const SeedAdminSchema = z.object({
  email: z.string().trim().email('Email inválido').max(255),
});

export type SeedAdminValues = z.infer<typeof SeedAdminSchema>;
