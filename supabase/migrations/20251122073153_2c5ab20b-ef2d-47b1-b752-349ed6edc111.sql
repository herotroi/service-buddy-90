-- Atualizar o bucket para permitir arquivos maiores (5GB = 5368709120 bytes)
UPDATE storage.buckets 
SET file_size_limit = 5368709120
WHERE id = 'service-orders-media';

-- Adicionar mais tipos MIME suportados incluindo HEIC
UPDATE storage.buckets 
SET allowed_mime_types = ARRAY[
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'video/mp4',
  'video/mpeg',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/x-matroska'
]
WHERE id = 'service-orders-media';