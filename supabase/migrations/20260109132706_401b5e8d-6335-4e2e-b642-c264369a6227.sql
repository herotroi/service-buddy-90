-- The issue is that the SELECT policy filters out deleted=true records
-- When UPDATE sets deleted=true, the row can't be returned after update
-- Solution: Change SELECT policy to only filter in application, not RLS
-- OR add a policy that allows the user to see their own records regardless of deleted status for UPDATE purposes

-- First, let's modify the SELECT policy to remove the deleted filter
-- The application code already filters deleted=false, so RLS doesn't need to

DROP POLICY IF EXISTS "Users can view their own service_orders" ON public.service_orders;

CREATE POLICY "Users can view their own service_orders" 
ON public.service_orders 
FOR SELECT 
USING (auth.uid() = user_id);

-- Same for service_orders_informatica
DROP POLICY IF EXISTS "Users can view their own service_orders_informatica" ON public.service_orders_informatica;

CREATE POLICY "Users can view their own service_orders_informatica" 
ON public.service_orders_informatica 
FOR SELECT 
USING (auth.uid() = user_id);