-- Remover constraint de unicidade do os_number para permitir duplicatas
ALTER TABLE service_orders DROP CONSTRAINT IF EXISTS service_orders_user_os_number_unique;
ALTER TABLE service_orders_informatica DROP CONSTRAINT IF EXISTS service_orders_informatica_user_os_number_unique;