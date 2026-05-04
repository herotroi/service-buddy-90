UPDATE storage.buckets SET public = true WHERE id = 'service-orders-media';

CREATE POLICY "Public read service-orders-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-orders-media');