
-- =============================================
-- RestroServices Marketplace - Complete Schema
-- =============================================

-- 1. New table: service_requests (restaurant needs/demands)
CREATE TABLE public.service_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  category public.service_category DEFAULT 'other',
  budget_min INTEGER,
  budget_max INTEGER,
  city TEXT,
  country TEXT DEFAULT 'Colombia',
  urgency TEXT DEFAULT 'normal',
  deadline DATE,
  requirements TEXT[],
  attachments TEXT[],
  status TEXT DEFAULT 'open',
  proposals_count INTEGER DEFAULT 0,
  selected_proposal_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view open requests" ON public.service_requests FOR SELECT USING (status = 'open' OR auth.uid() = user_id);
CREATE POLICY "Authenticated users can create requests" ON public.service_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update their requests" ON public.service_requests FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Owners can delete their requests" ON public.service_requests FOR DELETE USING (auth.uid() = user_id);

-- 2. New table: service_proposals (provider bids)
CREATE TABLE public.service_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.service_requests(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  price NUMERIC,
  estimated_delivery_days INTEGER,
  attachments TEXT[],
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Proposal owners and request owners can view" ON public.service_proposals FOR SELECT USING (
  auth.uid() = user_id OR auth.uid() IN (SELECT sr.user_id FROM public.service_requests sr WHERE sr.id = request_id)
);
CREATE POLICY "Authenticated users can create proposals" ON public.service_proposals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Proposal owners can update" ON public.service_proposals FOR UPDATE USING (auth.uid() = user_id);

-- 3. New table: provider_reviews
CREATE TABLE public.provider_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  comment TEXT,
  response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reviews" ON public.provider_reviews FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create reviews" ON public.provider_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owners can update their reviews" ON public.provider_reviews FOR UPDATE USING (auth.uid() = user_id);

-- 4. New table: provider_portfolio
CREATE TABLE public.provider_portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  client_name TEXT,
  project_date DATE,
  category public.service_category DEFAULT 'other',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_portfolio ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view portfolio" ON public.provider_portfolio FOR SELECT USING (true);
CREATE POLICY "Provider owners can manage portfolio" ON public.provider_portfolio FOR INSERT WITH CHECK (
  auth.uid() IN (SELECT sp.owner_id FROM public.service_providers sp WHERE sp.id = provider_id)
);
CREATE POLICY "Provider owners can update portfolio" ON public.provider_portfolio FOR UPDATE USING (
  auth.uid() IN (SELECT sp.owner_id FROM public.service_providers sp WHERE sp.id = provider_id)
);
CREATE POLICY "Provider owners can delete portfolio" ON public.provider_portfolio FOR DELETE USING (
  auth.uid() IN (SELECT sp.owner_id FROM public.service_providers sp WHERE sp.id = provider_id)
);

-- 5. Enrich service_providers
ALTER TABLE public.service_providers
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS years_in_business INTEGER,
  ADD COLUMN IF NOT EXISTS team_size TEXT,
  ADD COLUMN IF NOT EXISTS response_time_hours INTEGER DEFAULT 24,
  ADD COLUMN IF NOT EXISTS completed_projects INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cover_image_url TEXT,
  ADD COLUMN IF NOT EXISTS social_links JSONB,
  ADD COLUMN IF NOT EXISTS certifications TEXT[],
  ADD COLUMN IF NOT EXISTS service_areas TEXT[];

-- 6. Enrich service_bookings
ALTER TABLE public.service_bookings
  ADD COLUMN IF NOT EXISTS request_id UUID REFERENCES public.service_requests(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES public.service_proposals(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_id UUID REFERENCES public.provider_reviews(id) ON DELETE SET NULL;

-- 7. Trigger: update proposals_count on service_requests
CREATE OR REPLACE FUNCTION public.update_request_proposals_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.service_requests SET proposals_count = proposals_count + 1 WHERE id = NEW.request_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.service_requests SET proposals_count = GREATEST(proposals_count - 1, 0) WHERE id = OLD.request_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_update_proposals_count
AFTER INSERT OR DELETE ON public.service_proposals
FOR EACH ROW EXECUTE FUNCTION public.update_request_proposals_count();

-- 8. Trigger: update provider stats on review
CREATE OR REPLACE FUNCTION public.update_provider_review_stats()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.service_providers SET
    average_rating = (SELECT ROUND(AVG(rating)::numeric, 1) FROM public.provider_reviews WHERE provider_id = NEW.provider_id),
    reviews_count = (SELECT COUNT(*) FROM public.provider_reviews WHERE provider_id = NEW.provider_id)
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_update_provider_review_stats
AFTER INSERT OR UPDATE OR DELETE ON public.provider_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_provider_review_stats();

-- 9. Updated_at trigger for service_requests
CREATE TRIGGER update_service_requests_updated_at
BEFORE UPDATE ON public.service_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
