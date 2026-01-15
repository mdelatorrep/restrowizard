-- Add persistent client-side traceability for onboarding/debug flows

CREATE TABLE IF NOT EXISTS public.debug_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scope text NOT NULL,
  action text NOT NULL,
  data jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_debug_events_user_created
  ON public.debug_events (user_id, created_at DESC);

ALTER TABLE public.debug_events ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='debug_events'
      AND policyname='Users can insert their own debug events'
  ) THEN
    CREATE POLICY "Users can insert their own debug events"
    ON public.debug_events
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public'
      AND tablename='debug_events'
      AND policyname='Users can view their own debug events'
  ) THEN
    CREATE POLICY "Users can view their own debug events"
    ON public.debug_events
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;