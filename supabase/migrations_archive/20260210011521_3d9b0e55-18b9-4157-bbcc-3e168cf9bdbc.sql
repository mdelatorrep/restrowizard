
-- Make owner_id nullable for seed/directory providers
ALTER TABLE public.service_providers ALTER COLUMN owner_id DROP NOT NULL;
