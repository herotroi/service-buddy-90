-- Add DELETE policy for system_settings table
CREATE POLICY "Users can delete their own system_settings" 
ON public.system_settings 
FOR DELETE 
USING (auth.uid() = user_id);