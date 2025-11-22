-- Create storage bucket for service order media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'service-orders-media',
  'service-orders-media',
  true,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
);

-- Create policies for service order media bucket
CREATE POLICY "Authenticated users can view service order media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'service-orders-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload service order media"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'service-orders-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update service order media"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'service-orders-media' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete service order media"
ON storage.objects
FOR DELETE
USING (bucket_id = 'service-orders-media' AND auth.uid() IS NOT NULL);

-- Add media_files column to service_orders table
ALTER TABLE service_orders
ADD COLUMN media_files jsonb DEFAULT '[]'::jsonb;