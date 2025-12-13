-- Add client address field to service_orders
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS client_address text;