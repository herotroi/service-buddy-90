-- Add unique constraint on os_number for service_orders table
ALTER TABLE public.service_orders ADD CONSTRAINT service_orders_os_number_unique UNIQUE (os_number);

-- Add unique constraint on os_number for service_orders_informatica table
ALTER TABLE public.service_orders_informatica ADD CONSTRAINT service_orders_informatica_os_number_unique UNIQUE (os_number);