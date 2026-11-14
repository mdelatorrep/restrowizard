-- Add campaign_id to customer_feedback if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'customer_feedback' 
                   AND column_name = 'campaign_id') THEN
        ALTER TABLE public.customer_feedback 
        ADD COLUMN campaign_id UUID REFERENCES public.feedback_campaigns(id);
    END IF;
END $$;

-- Create function to increment campaign responses
CREATE OR REPLACE FUNCTION public.increment_campaign_responses(campaign_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    UPDATE public.feedback_campaigns
    SET responses_count = COALESCE(responses_count, 0) + 1
    WHERE id = campaign_id;
END;
$$;