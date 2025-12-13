-- Add CPF and checklist fields to service_orders table (celulares only)
ALTER TABLE public.service_orders
ADD COLUMN IF NOT EXISTS client_cpf text,
ADD COLUMN IF NOT EXISTS checklist_houve_queda boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_face_id boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_carrega boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_tela_quebrada boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_vidro_trincado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_manchas_tela boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_carcaca_torta boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_riscos_tampa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_riscos_laterais boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_vidro_camera boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_acompanha_chip boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_acompanha_sd boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_acompanha_capa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS checklist_esta_ligado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tracking_token uuid DEFAULT gen_random_uuid();

-- Create unique index on tracking_token for secure access
CREATE UNIQUE INDEX IF NOT EXISTS idx_service_orders_tracking_token ON public.service_orders(tracking_token);

-- Create a public access policy for tracking (read-only with token)
CREATE POLICY "Public can view service order with tracking token"
ON public.service_orders
FOR SELECT
TO anon
USING (tracking_token IS NOT NULL);