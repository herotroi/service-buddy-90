-- Remover constraints únicas globais de os_number
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_os_number_key;
ALTER TABLE public.service_orders DROP CONSTRAINT IF EXISTS service_orders_os_number_unique;

-- Criar constraint única composta por user_id + os_number
ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_user_os_number_unique UNIQUE (user_id, os_number);

-- Fazer o mesmo para service_orders_informatica
ALTER TABLE public.service_orders_informatica DROP CONSTRAINT IF EXISTS service_orders_informatica_os_number_key;
ALTER TABLE public.service_orders_informatica DROP CONSTRAINT IF EXISTS service_orders_informatica_os_number_unique;

-- Criar constraint única composta por user_id + os_number
ALTER TABLE public.service_orders_informatica ADD CONSTRAINT service_orders_informatica_user_os_number_unique UNIQUE (user_id, os_number);