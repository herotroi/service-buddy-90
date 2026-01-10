-- Add storage policies for service-orders-media bucket
-- Allow authenticated users to upload files to their own folders
CREATE POLICY "Users can upload to service-orders-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'service-orders-media'
);

-- Allow authenticated users to update their own files
CREATE POLICY "Users can update their files in service-orders-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-orders-media' 
  AND owner_id = auth.uid()::text
);

-- Allow authenticated users to delete their own files
CREATE POLICY "Users can delete their files in service-orders-media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-orders-media' 
  AND owner_id = auth.uid()::text
);

-- Allow authenticated users to read their own files
CREATE POLICY "Users can read their files in service-orders-media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'service-orders-media' 
  AND owner_id = auth.uid()::text
);