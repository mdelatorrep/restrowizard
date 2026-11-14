
-- Add marketing to job_category enum
ALTER TYPE public.job_category ADD VALUE IF NOT EXISTS 'marketing';
ALTER TYPE public.job_category ADD VALUE IF NOT EXISTS 'finance';
ALTER TYPE public.job_category ADD VALUE IF NOT EXISTS 'administration';

-- Add service provider categories
ALTER TYPE public.service_category ADD VALUE IF NOT EXISTS 'equipment';
ALTER TYPE public.service_category ADD VALUE IF NOT EXISTS 'technology';
ALTER TYPE public.service_category ADD VALUE IF NOT EXISTS 'food_supplies';
ALTER TYPE public.service_category ADD VALUE IF NOT EXISTS 'consulting';
ALTER TYPE public.service_category ADD VALUE IF NOT EXISTS 'design';
