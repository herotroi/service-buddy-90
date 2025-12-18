-- Make the service-orders-media bucket private
UPDATE storage.buckets SET public = false WHERE id = 'service-orders-media';