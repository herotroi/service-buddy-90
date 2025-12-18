-- Allow public read access to withdrawal_situations table for tracking purposes
CREATE POLICY "Public can view withdrawal_situations for tracking"
ON public.withdrawal_situations
FOR SELECT
USING (true);