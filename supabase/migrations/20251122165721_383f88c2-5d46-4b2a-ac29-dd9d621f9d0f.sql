-- Habilitar realtime para a tabela service_orders
ALTER TABLE service_orders REPLICA IDENTITY FULL;

-- Adicionar a tabela ao publication do realtime
ALTER PUBLICATION supabase_realtime ADD TABLE service_orders;