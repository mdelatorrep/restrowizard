-- 1) Audit log: restrict INSERT to service role (was WITH CHECK true)
DROP POLICY IF EXISTS "Service role inserts audit" ON public.audit_log;
CREATE POLICY "Service role inserts audit"
ON public.audit_log
FOR INSERT
TO service_role
WITH CHECK (true);

-- 2) brand-assets bucket: keep public direct URLs but drop the broad
--    SELECT policy that allowed clients to list every file.
DROP POLICY IF EXISTS "Public can view brand assets" ON storage.objects;