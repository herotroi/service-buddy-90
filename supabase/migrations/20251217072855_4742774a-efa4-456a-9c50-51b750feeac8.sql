-- Add deleted column to all relevant tables

-- Service Orders (Celulares)
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Service Orders (Informatica)
ALTER TABLE public.service_orders_informatica ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Employees
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Situations (Celulares)
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Situacao Informatica
ALTER TABLE public.situacao_informatica ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Withdrawal Situations (Celulares)
ALTER TABLE public.withdrawal_situations ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Retirada Informatica
ALTER TABLE public.retirada_informatica ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Local Equipamento
ALTER TABLE public.local_equipamento ADD COLUMN IF NOT EXISTS deleted boolean NOT NULL DEFAULT false;

-- Update RLS policies to filter out deleted records

-- Service Orders (Celulares)
DROP POLICY IF EXISTS "Authenticated users can view service orders" ON public.service_orders;
CREATE POLICY "Authenticated users can view service orders" 
ON public.service_orders 
FOR SELECT 
USING (deleted = false);

DROP POLICY IF EXISTS "Public can view service order with tracking token" ON public.service_orders;
CREATE POLICY "Public can view service order with tracking token" 
ON public.service_orders 
FOR SELECT 
USING (tracking_token IS NOT NULL AND deleted = false);

-- Service Orders (Informatica)
DROP POLICY IF EXISTS "Authenticated users can view service_orders_informatica" ON public.service_orders_informatica;
CREATE POLICY "Authenticated users can view service_orders_informatica" 
ON public.service_orders_informatica 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND deleted = false);

-- Employees
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;
CREATE POLICY "Authenticated users can view employees" 
ON public.employees 
FOR SELECT 
USING (deleted = false);

-- Situations
DROP POLICY IF EXISTS "Authenticated users can view situations" ON public.situations;
CREATE POLICY "Authenticated users can view situations" 
ON public.situations 
FOR SELECT 
USING (deleted = false);

-- Situacao Informatica
DROP POLICY IF EXISTS "Authenticated users can view situacao_informatica" ON public.situacao_informatica;
CREATE POLICY "Authenticated users can view situacao_informatica" 
ON public.situacao_informatica 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND deleted = false);

-- Withdrawal Situations
DROP POLICY IF EXISTS "Authenticated users can view withdrawal situations" ON public.withdrawal_situations;
CREATE POLICY "Authenticated users can view withdrawal situations" 
ON public.withdrawal_situations 
FOR SELECT 
USING (deleted = false);

-- Retirada Informatica
DROP POLICY IF EXISTS "Authenticated users can view retirada_informatica" ON public.retirada_informatica;
CREATE POLICY "Authenticated users can view retirada_informatica" 
ON public.retirada_informatica 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND deleted = false);

-- Local Equipamento
DROP POLICY IF EXISTS "Authenticated users can view local_equipamento" ON public.local_equipamento;
CREATE POLICY "Authenticated users can view local_equipamento" 
ON public.local_equipamento 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND deleted = false);

-- Create indexes for better performance on deleted column
CREATE INDEX IF NOT EXISTS idx_service_orders_deleted ON public.service_orders(deleted);
CREATE INDEX IF NOT EXISTS idx_service_orders_informatica_deleted ON public.service_orders_informatica(deleted);
CREATE INDEX IF NOT EXISTS idx_employees_deleted ON public.employees(deleted);
CREATE INDEX IF NOT EXISTS idx_situations_deleted ON public.situations(deleted);
CREATE INDEX IF NOT EXISTS idx_situacao_informatica_deleted ON public.situacao_informatica(deleted);
CREATE INDEX IF NOT EXISTS idx_withdrawal_situations_deleted ON public.withdrawal_situations(deleted);
CREATE INDEX IF NOT EXISTS idx_retirada_informatica_deleted ON public.retirada_informatica(deleted);
CREATE INDEX IF NOT EXISTS idx_local_equipamento_deleted ON public.local_equipamento(deleted);