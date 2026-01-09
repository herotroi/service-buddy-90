-- Add new descriptive fields to service_orders table
ALTER TABLE public.service_orders 
ADD COLUMN IF NOT EXISTS device_brand text,
ADD COLUMN IF NOT EXISTS device_chip text,
ADD COLUMN IF NOT EXISTS memory_card_size text,
ADD COLUMN IF NOT EXISTS technical_info text;