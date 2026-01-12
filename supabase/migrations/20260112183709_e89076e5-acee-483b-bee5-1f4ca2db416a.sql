-- Remover os índices únicos que estão causando problemas
DROP INDEX IF EXISTS public.service_orders_user_os_number_unique;
DROP INDEX IF EXISTS public.service_orders_informatica_user_os_number_unique;

-- Remover a função get_next_os_number (opcional, mas limpa o banco)
DROP FUNCTION IF EXISTS public.get_next_os_number(text, uuid);