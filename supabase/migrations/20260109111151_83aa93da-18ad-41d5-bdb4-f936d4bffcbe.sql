-- Remove the incorrect unique constraint on just 'key' column
-- This allows each user to have their own settings
ALTER TABLE public.system_settings DROP CONSTRAINT IF EXISTS system_settings_key_key;