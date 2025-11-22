-- Create system settings table
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read settings
CREATE POLICY "Authenticated users can view system settings"
ON public.system_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to update settings
CREATE POLICY "Authenticated users can update system settings"
ON public.system_settings
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to insert settings
CREATE POLICY "Authenticated users can insert system settings"
ON public.system_settings
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default starting OS number
INSERT INTO public.system_settings (key, value)
VALUES ('os_starting_number', '1');

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Update profiles table to allow users to update their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);