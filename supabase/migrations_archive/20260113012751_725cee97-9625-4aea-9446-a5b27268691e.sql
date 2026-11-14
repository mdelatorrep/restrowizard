
-- Add fields to consultant_clients to allow creating clients without user account
ALTER TABLE public.consultant_clients 
  ALTER COLUMN client_user_id DROP NOT NULL;

-- Add direct restaurant info for consultant-managed clients
ALTER TABLE public.consultant_clients 
  ADD COLUMN IF NOT EXISTS restaurant_name TEXT,
  ADD COLUMN IF NOT EXISTS restaurant_city TEXT,
  ADD COLUMN IF NOT EXISTS restaurant_cuisine_type TEXT,
  ADD COLUMN IF NOT EXISTS restaurant_phone TEXT,
  ADD COLUMN IF NOT EXISTS restaurant_email TEXT,
  ADD COLUMN IF NOT EXISTS invitation_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

-- Create index for invitation token lookup
CREATE INDEX IF NOT EXISTS idx_consultant_clients_invitation_token 
  ON public.consultant_clients(invitation_token) 
  WHERE invitation_token IS NOT NULL;

-- Update RLS policies to allow consultants to manage their clients
DROP POLICY IF EXISTS "Consultants can view their own clients" ON public.consultant_clients;
DROP POLICY IF EXISTS "Consultants can insert their own clients" ON public.consultant_clients;
DROP POLICY IF EXISTS "Consultants can update their own clients" ON public.consultant_clients;
DROP POLICY IF EXISTS "Consultants can delete their own clients" ON public.consultant_clients;

CREATE POLICY "Consultants can view their own clients" 
ON public.consultant_clients 
FOR SELECT 
USING (
  consultant_id IN (
    SELECT id FROM public.consultant_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Consultants can insert their own clients" 
ON public.consultant_clients 
FOR INSERT 
WITH CHECK (
  consultant_id IN (
    SELECT id FROM public.consultant_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Consultants can update their own clients" 
ON public.consultant_clients 
FOR UPDATE 
USING (
  consultant_id IN (
    SELECT id FROM public.consultant_profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Consultants can delete their own clients" 
ON public.consultant_clients 
FOR DELETE 
USING (
  consultant_id IN (
    SELECT id FROM public.consultant_profiles WHERE user_id = auth.uid()
  )
);

-- Allow restaurant owners to view if they are a client
CREATE POLICY "Restaurant owners can view their consultant relationship" 
ON public.consultant_clients 
FOR SELECT 
USING (client_user_id = auth.uid());

-- Create a function to claim a consultant client account
CREATE OR REPLACE FUNCTION public.claim_consultant_client(p_invitation_token UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_client_record consultant_clients%ROWTYPE;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated');
  END IF;

  -- Find the client by invitation token
  SELECT * INTO v_client_record
  FROM consultant_clients
  WHERE invitation_token = p_invitation_token
    AND client_user_id IS NULL
    AND claimed_at IS NULL;

  IF v_client_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or already claimed invitation');
  END IF;

  -- Update the client record to link to the user
  UPDATE consultant_clients
  SET client_user_id = v_user_id,
      claimed_at = NOW(),
      status = 'active'
  WHERE id = v_client_record.id;

  RETURN json_build_object(
    'success', true, 
    'client_id', v_client_record.id,
    'consultant_id', v_client_record.consultant_id
  );
END;
$$;
