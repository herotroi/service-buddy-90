-- Add user_id column to all relevant tables
ALTER TABLE public.situations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.withdrawal_situations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.situacao_informatica ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.retirada_informatica ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.local_equipamento ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.employees ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.service_orders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.service_orders_informatica ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop existing RLS policies and create new ones with user_id isolation

-- SITUATIONS TABLE
DROP POLICY IF EXISTS "Authenticated users can view situations" ON public.situations;
DROP POLICY IF EXISTS "Authenticated users can insert situations" ON public.situations;
DROP POLICY IF EXISTS "Authenticated users can update situations" ON public.situations;
DROP POLICY IF EXISTS "Authenticated users can delete situations" ON public.situations;

CREATE POLICY "Users can view their own situations" ON public.situations
FOR SELECT USING (auth.uid() = user_id AND deleted = false);

CREATE POLICY "Users can insert their own situations" ON public.situations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own situations" ON public.situations
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own situations" ON public.situations
FOR DELETE USING (auth.uid() = user_id);

-- WITHDRAWAL_SITUATIONS TABLE
DROP POLICY IF EXISTS "Authenticated users can view withdrawal situations" ON public.withdrawal_situations;
DROP POLICY IF EXISTS "Authenticated users can insert withdrawal situations" ON public.withdrawal_situations;
DROP POLICY IF EXISTS "Authenticated users can update withdrawal situations" ON public.withdrawal_situations;
DROP POLICY IF EXISTS "Authenticated users can delete withdrawal situations" ON public.withdrawal_situations;

CREATE POLICY "Users can view their own withdrawal_situations" ON public.withdrawal_situations
FOR SELECT USING (auth.uid() = user_id AND deleted = false);

CREATE POLICY "Users can insert their own withdrawal_situations" ON public.withdrawal_situations
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own withdrawal_situations" ON public.withdrawal_situations
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own withdrawal_situations" ON public.withdrawal_situations
FOR DELETE USING (auth.uid() = user_id);

-- SITUACAO_INFORMATICA TABLE
DROP POLICY IF EXISTS "Authenticated users can view situacao_informatica" ON public.situacao_informatica;
DROP POLICY IF EXISTS "Authenticated users can insert situacao_informatica" ON public.situacao_informatica;
DROP POLICY IF EXISTS "Authenticated users can update situacao_informatica" ON public.situacao_informatica;
DROP POLICY IF EXISTS "Authenticated users can delete situacao_informatica" ON public.situacao_informatica;

CREATE POLICY "Users can view their own situacao_informatica" ON public.situacao_informatica
FOR SELECT USING (auth.uid() = user_id AND deleted = false);

CREATE POLICY "Users can insert their own situacao_informatica" ON public.situacao_informatica
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own situacao_informatica" ON public.situacao_informatica
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own situacao_informatica" ON public.situacao_informatica
FOR DELETE USING (auth.uid() = user_id);

-- RETIRADA_INFORMATICA TABLE
DROP POLICY IF EXISTS "Authenticated users can view retirada_informatica" ON public.retirada_informatica;
DROP POLICY IF EXISTS "Authenticated users can insert retirada_informatica" ON public.retirada_informatica;
DROP POLICY IF EXISTS "Authenticated users can update retirada_informatica" ON public.retirada_informatica;
DROP POLICY IF EXISTS "Authenticated users can delete retirada_informatica" ON public.retirada_informatica;

CREATE POLICY "Users can view their own retirada_informatica" ON public.retirada_informatica
FOR SELECT USING (auth.uid() = user_id AND deleted = false);

CREATE POLICY "Users can insert their own retirada_informatica" ON public.retirada_informatica
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own retirada_informatica" ON public.retirada_informatica
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own retirada_informatica" ON public.retirada_informatica
FOR DELETE USING (auth.uid() = user_id);

-- LOCAL_EQUIPAMENTO TABLE
DROP POLICY IF EXISTS "Authenticated users can view local_equipamento" ON public.local_equipamento;
DROP POLICY IF EXISTS "Authenticated users can insert local_equipamento" ON public.local_equipamento;
DROP POLICY IF EXISTS "Authenticated users can update local_equipamento" ON public.local_equipamento;
DROP POLICY IF EXISTS "Authenticated users can delete local_equipamento" ON public.local_equipamento;

CREATE POLICY "Users can view their own local_equipamento" ON public.local_equipamento
FOR SELECT USING (auth.uid() = user_id AND deleted = false);

CREATE POLICY "Users can insert their own local_equipamento" ON public.local_equipamento
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own local_equipamento" ON public.local_equipamento
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own local_equipamento" ON public.local_equipamento
FOR DELETE USING (auth.uid() = user_id);

-- EMPLOYEES TABLE
DROP POLICY IF EXISTS "Authenticated users can view employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can insert employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can update employees" ON public.employees;
DROP POLICY IF EXISTS "Authenticated users can delete employees" ON public.employees;

CREATE POLICY "Users can view their own employees" ON public.employees
FOR SELECT USING (auth.uid() = user_id AND deleted = false);

CREATE POLICY "Users can insert their own employees" ON public.employees
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees" ON public.employees
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees" ON public.employees
FOR DELETE USING (auth.uid() = user_id);

-- SERVICE_ORDERS TABLE
DROP POLICY IF EXISTS "Authenticated users can view service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can insert service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can update service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Authenticated users can delete service orders" ON public.service_orders;
DROP POLICY IF EXISTS "Public can view service order with tracking token" ON public.service_orders;

CREATE POLICY "Users can view their own service_orders" ON public.service_orders
FOR SELECT USING (auth.uid() = user_id AND deleted = false);

CREATE POLICY "Users can insert their own service_orders" ON public.service_orders
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service_orders" ON public.service_orders
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service_orders" ON public.service_orders
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view service order with tracking token" ON public.service_orders
FOR SELECT USING (tracking_token IS NOT NULL AND deleted = false);

-- SERVICE_ORDERS_INFORMATICA TABLE
DROP POLICY IF EXISTS "Authenticated users can view service_orders_informatica" ON public.service_orders_informatica;
DROP POLICY IF EXISTS "Authenticated users can insert service_orders_informatica" ON public.service_orders_informatica;
DROP POLICY IF EXISTS "Authenticated users can update service_orders_informatica" ON public.service_orders_informatica;
DROP POLICY IF EXISTS "Authenticated users can delete service_orders_informatica" ON public.service_orders_informatica;

CREATE POLICY "Users can view their own service_orders_informatica" ON public.service_orders_informatica
FOR SELECT USING (auth.uid() = user_id AND deleted = false);

CREATE POLICY "Users can insert their own service_orders_informatica" ON public.service_orders_informatica
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service_orders_informatica" ON public.service_orders_informatica
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service_orders_informatica" ON public.service_orders_informatica
FOR DELETE USING (auth.uid() = user_id);

-- SYSTEM_SETTINGS TABLE
DROP POLICY IF EXISTS "Authenticated users can view system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can insert system settings" ON public.system_settings;
DROP POLICY IF EXISTS "Authenticated users can update system settings" ON public.system_settings;

CREATE POLICY "Users can view their own system_settings" ON public.system_settings
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own system_settings" ON public.system_settings
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own system_settings" ON public.system_settings
FOR UPDATE USING (auth.uid() = user_id);

-- Create function to populate default data for new users
CREATE OR REPLACE FUNCTION public.create_default_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Default situations for Celulares
  INSERT INTO public.situations (user_id, name, color) VALUES
    (NEW.id, 'Em Fila', '#9CA3AF'),
    (NEW.id, 'AGUARDANDO ENCOMENDA PEÇAS', '#EAB308'),
    (NEW.id, 'AGENDADO', '#3B82F6'),
    (NEW.id, 'EM BANCADA', '#F97316'),
    (NEW.id, 'FINALIZADO', '#22C55E'),
    (NEW.id, 'AG. PEÇA', '#EAB308'),
    (NEW.id, 'AG. RESPOSTA DE CLIENTE', '#A855F7'),
    (NEW.id, 'HORA MARCADA HOJE', '#06B6D4'),
    (NEW.id, 'AG. CLIENTE TRAZER O APARELHO', '#6B7280'),
    (NEW.id, 'ENVIADO P/ OUTRO LABORATÓRIO', '#EF4444');

  -- Default withdrawal situations for Celulares
  INSERT INTO public.withdrawal_situations (user_id, name, color) VALUES
    (NEW.id, 'Retirado pelo Cliente', '#22C55E'),
    (NEW.id, 'Aguardando Retirada', '#EAB308'),
    (NEW.id, 'Enviado por Motoboy', '#3B82F6');

  -- Default situations for Informática
  INSERT INTO public.situacao_informatica (user_id, name, color) VALUES
    (NEW.id, 'Em Fila', '#9CA3AF'),
    (NEW.id, 'Em Análise', '#3B82F6'),
    (NEW.id, 'Aguardando Peças', '#EAB308'),
    (NEW.id, 'Em Reparo', '#F97316'),
    (NEW.id, 'Finalizado', '#22C55E'),
    (NEW.id, 'Aguardando Cliente', '#A855F7');

  -- Default withdrawal situations for Informática
  INSERT INTO public.retirada_informatica (user_id, name, color) VALUES
    (NEW.id, 'Retirado pelo Cliente', '#22C55E'),
    (NEW.id, 'Aguardando Retirada', '#EAB308'),
    (NEW.id, 'Enviado', '#3B82F6');

  -- Default equipment locations
  INSERT INTO public.local_equipamento (user_id, name, color) VALUES
    (NEW.id, 'Bancada', '#3B82F6'),
    (NEW.id, 'Prateleira', '#22C55E'),
    (NEW.id, 'Gaveta', '#F97316');

  RETURN NEW;
END;
$$;

-- Create trigger to run after user profile is created
DROP TRIGGER IF EXISTS on_user_profile_created ON public.profiles;
CREATE TRIGGER on_user_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_user_data();