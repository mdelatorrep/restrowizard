DROP POLICY IF EXISTS "Users can upload their own invoice files" ON storage.objects;

CREATE POLICY "Users can upload their own invoice files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'invoices'
  AND auth.uid()::text = (storage.foldername(name))[1]
);