-- Allow public read access to situations table for tracking purposes
CREATE POLICY "Public can view situations for tracking"
ON public.situations
FOR SELECT
USING (true);