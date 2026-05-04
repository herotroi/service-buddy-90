UPDATE storage.buckets
SET public = true
WHERE id = 'service-orders-media';

DROP POLICY IF EXISTS "Public read service-orders-media" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can download service-orders-media" ON storage.objects;

CREATE POLICY "Anyone can download service-orders-media"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'service-orders-media');