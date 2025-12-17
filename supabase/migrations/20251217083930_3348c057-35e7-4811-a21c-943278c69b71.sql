-- Adicionar coluna separada para senha de padrão
ALTER TABLE public.service_orders 
ADD COLUMN device_pattern text;

-- Comentário para documentação
COMMENT ON COLUMN public.service_orders.device_password IS 'Senha de texto do aparelho';
COMMENT ON COLUMN public.service_orders.device_pattern IS 'Senha de padrão de 9 pontos do aparelho';