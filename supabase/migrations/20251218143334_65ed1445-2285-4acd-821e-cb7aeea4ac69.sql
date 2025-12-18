-- Adicionar coluna media_files na tabela service_orders_informatica
ALTER TABLE public.service_orders_informatica 
ADD COLUMN media_files jsonb DEFAULT '[]'::jsonb;