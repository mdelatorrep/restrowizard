-- ================================================
-- TALENT MODULE ENHANCEMENT: Staff Availability, Time Off, Templates, Certifications
-- Based on 7shifts, Deputy, HotSchedules best practices
-- ================================================

-- Staff Availability (recurring weekly availability)
CREATE TABLE public.staff_availability (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_member_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  effective_from DATE,
  effective_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Time Off Requests
CREATE TABLE public.time_off_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_member_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL DEFAULT 'vacation' CHECK (request_type IN ('vacation', 'sick', 'personal', 'unpaid', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME, -- For partial day requests
  end_time TIME,
  is_full_day BOOLEAN NOT NULL DEFAULT true,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled')),
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shift Templates (reusable shift patterns)
CREATE TABLE public.shift_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  template_name TEXT NOT NULL,
  position TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER NOT NULL DEFAULT 0,
  color TEXT, -- For visual distinction in calendar
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Shift Swap Requests
CREATE TABLE public.shift_swap_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  original_shift_id UUID NOT NULL REFERENCES public.staff_shifts(id) ON DELETE CASCADE,
  requesting_staff_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  target_staff_id UUID REFERENCES public.staff_members(id) ON DELETE SET NULL, -- NULL means open swap
  target_shift_id UUID REFERENCES public.staff_shifts(id) ON DELETE SET NULL, -- For direct swaps
  swap_type TEXT NOT NULL DEFAULT 'give_away' CHECK (swap_type IN ('give_away', 'swap', 'cover')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied', 'cancelled', 'accepted_pending_approval')),
  reason TEXT,
  reviewed_by TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff Certifications/Trainings
CREATE TABLE public.staff_certifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_member_id UUID NOT NULL REFERENCES public.staff_members(id) ON DELETE CASCADE,
  certification_name TEXT NOT NULL,
  certification_type TEXT DEFAULT 'training' CHECK (certification_type IN ('food_safety', 'alcohol', 'first_aid', 'training', 'other')),
  issued_date DATE,
  expiration_date DATE,
  issuing_authority TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'valid' CHECK (status IN ('valid', 'expired', 'pending', 'revoked')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add missing columns to staff_members
ALTER TABLE public.staff_members 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS max_hours_per_week INTEGER DEFAULT 40,
ADD COLUMN IF NOT EXISTS preferred_shifts TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS skills TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS employee_id TEXT;

-- Add missing columns to staff_shifts
ALTER TABLE public.staff_shifts
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.shift_templates(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITH TIME ZONE;

-- Enable RLS on new tables
ALTER TABLE public.staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_swap_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_availability
CREATE POLICY "Users can manage their own staff availability" ON public.staff_availability
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for time_off_requests
CREATE POLICY "Users can manage their own time off requests" ON public.time_off_requests
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for shift_templates
CREATE POLICY "Users can manage their own shift templates" ON public.shift_templates
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for shift_swap_requests
CREATE POLICY "Users can manage their own shift swap requests" ON public.shift_swap_requests
FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for staff_certifications
CREATE POLICY "Users can manage their own staff certifications" ON public.staff_certifications
FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_staff_availability_staff ON public.staff_availability(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_day ON public.staff_availability(day_of_week);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_staff ON public.time_off_requests(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_dates ON public.time_off_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_time_off_requests_status ON public.time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_shift_swap_requests_shift ON public.shift_swap_requests(original_shift_id);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_staff ON public.staff_certifications(staff_member_id);
CREATE INDEX IF NOT EXISTS idx_staff_certifications_expiry ON public.staff_certifications(expiration_date);