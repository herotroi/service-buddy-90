-- Add unique constraint for key+user_id combination
ALTER TABLE public.system_settings ADD CONSTRAINT system_settings_key_user_id_unique UNIQUE (key, user_id);