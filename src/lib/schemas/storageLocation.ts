import { z } from 'zod';

export const StorageLocationSchema = z.object({
  location_name: z.string().trim().min(1, 'El nombre es obligatorio').max(120),
  location_type: z.string().min(1).default('dry_storage'),
  temperature_range: z.string().max(40).optional().default(''),
  description: z.string().max(500).optional().default(''),
  is_active: z.boolean().default(true),
  sort_order: z.coerce.number().min(0).default(0),
});

export type StorageLocationValues = z.infer<typeof StorageLocationSchema>;
