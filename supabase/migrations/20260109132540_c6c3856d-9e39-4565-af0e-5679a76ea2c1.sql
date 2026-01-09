-- Fix UPDATE policy for service_orders to allow soft delete
DROP POLICY IF EXISTS "Users can update their own service_orders" ON public.service_orders;

CREATE POLICY "Users can update their own service_orders" 
ON public.service_orders 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Fix UPDATE policy for service_orders_informatica to allow soft delete
DROP POLICY IF EXISTS "Users can update their own service_orders_informatica" ON public.service_orders_informatica;

CREATE POLICY "Users can update their own service_orders_informatica" 
ON public.service_orders_informatica 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);