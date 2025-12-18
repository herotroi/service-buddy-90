-- Add unique constraint on key and user_id for system_settings upsert
CREATE UNIQUE INDEX IF NOT EXISTS system_settings_key_user_id_idx ON public.system_settings (key, user_id);