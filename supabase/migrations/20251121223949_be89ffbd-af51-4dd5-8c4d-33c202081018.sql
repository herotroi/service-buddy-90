-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN new;
END;
$$;

-- Trigger to create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create employees table
CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact text,
  type text NOT NULL CHECK (type IN ('Técnico', 'Não Técnico')),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view employees"
  ON public.employees FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert employees"
  ON public.employees FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update employees"
  ON public.employees FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete employees"
  ON public.employees FOR DELETE
  TO authenticated
  USING (true);

-- Create situations table
CREATE TABLE public.situations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.situations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view situations"
  ON public.situations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert situations"
  ON public.situations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update situations"
  ON public.situations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete situations"
  ON public.situations FOR DELETE
  TO authenticated
  USING (true);

-- Insert default situations
INSERT INTO public.situations (name, color) VALUES
  ('AGUARDANDO ENCOMENDA PEÇAS', '#FFA500'),
  ('AGENDADO', '#0000FF'),
  ('EM BANCADA', '#FF8C00'),
  ('FINALIZADO', '#008000'),
  ('AG. PEÇA', '#FFD700'),
  ('AG. RESPOSTA DE CLIENTE', '#800080'),
  ('HORA MARCADA HOJE', '#87CEEB'),
  ('AG. CLIENTE TRAZER O APARELHO', '#808080'),
  ('ENVIADO P/ OUTRO LABORATÓRIO', '#FF0000');

-- Create withdrawal_situations table
CREATE TABLE public.withdrawal_situations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.withdrawal_situations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view withdrawal situations"
  ON public.withdrawal_situations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert withdrawal situations"
  ON public.withdrawal_situations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update withdrawal situations"
  ON public.withdrawal_situations FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete withdrawal situations"
  ON public.withdrawal_situations FOR DELETE
  TO authenticated
  USING (true);

-- Insert default withdrawal situations
INSERT INTO public.withdrawal_situations (name) VALUES
  ('RETIRADO'),
  ('AGUARDANDO'),
  ('DESCARTE'),
  ('ANTES AUTOMAÇÃO'),
  ('NA LOJA');

-- Create service_orders table
CREATE TABLE public.service_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_number serial UNIQUE NOT NULL,
  entry_date timestamptz DEFAULT now() NOT NULL,
  client_name text NOT NULL,
  contact text NOT NULL,
  device_model text NOT NULL,
  device_password text,
  reported_defect text NOT NULL,
  client_message text,
  value numeric(10, 2),
  situation_id uuid REFERENCES public.situations(id),
  part_order_date timestamptz,
  service_date timestamptz,
  received_by_id uuid REFERENCES public.employees(id),
  technician_id uuid REFERENCES public.employees(id),
  withdrawn_by text,
  exit_date timestamptz,
  withdrawal_situation_id uuid REFERENCES public.withdrawal_situations(id),
  mensagem_finalizada boolean DEFAULT false NOT NULL,
  mensagem_entregue boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view service orders"
  ON public.service_orders FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert service orders"
  ON public.service_orders FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update service orders"
  ON public.service_orders FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete service orders"
  ON public.service_orders FOR DELETE
  TO authenticated
  USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_situations_updated_at
  BEFORE UPDATE ON public.situations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_situations_updated_at
  BEFORE UPDATE ON public.withdrawal_situations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();