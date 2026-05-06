
-- Remove broad authenticated-only policies on service-orders-media
DROP POLICY IF EXISTS "Authenticated users can view service order media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update service order media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete service order media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload service order media" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to service-orders-media" ON storage.objects;

-- Restrict INSERT to owner-scoped (folder = user id) and set owner
CREATE POLICY "Users can upload their own service-orders-media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-orders-media'
  AND auth.uid() IS NOT NULL
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Realtime: enable RLS on realtime.messages and require authenticated subscriptions
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can receive realtime messages" ON realtime.messages;
CREATE POLICY "Authenticated users can receive realtime messages"
ON realtime.messages FOR SELECT
TO authenticated
USING (true);
