-- ========================================
-- SCRIPT DE MIGRAÇÃO COMPLETO
-- De: Lovable Cloud → Para: Supabase Externo
-- Data: 2025-12-18
-- ========================================

-- ==========================================
-- PARTE 1: CRIAÇÃO DA ESTRUTURA DO BANCO
-- ==========================================

-- Criar sequência para números de OS
CREATE SEQUENCE IF NOT EXISTS service_orders_os_number_seq START WITH 12000;

-- ==========================================
-- TABELA: profiles
-- ==========================================
CREATE TABLE public.profiles (
  id uuid NOT NULL PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  email text NOT NULL,
  full_name text,
  phone text,
  cnpj text,
  logo_url text,
  street text,
  number text,
  complement text,
  neighborhood text,
  city text,
  state text,
  zip_code text
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ==========================================
-- TABELA: employees
-- ==========================================
CREATE TABLE public.employees (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  user_id uuid,
  name text NOT NULL,
  contact text,
  type text NOT NULL
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own employees" ON public.employees
  FOR SELECT USING ((auth.uid() = user_id) AND (deleted = false));

CREATE POLICY "Users can insert their own employees" ON public.employees
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own employees" ON public.employees
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own employees" ON public.employees
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TABELA: situations (Celulares)
-- ==========================================
CREATE TABLE public.situations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  user_id uuid,
  name text NOT NULL,
  color text NOT NULL
);

ALTER TABLE public.situations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own situations" ON public.situations
  FOR SELECT USING ((auth.uid() = user_id) AND (deleted = false));

CREATE POLICY "Users can insert their own situations" ON public.situations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own situations" ON public.situations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own situations" ON public.situations
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TABELA: withdrawal_situations (Celulares)
-- ==========================================
CREATE TABLE public.withdrawal_situations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  user_id uuid,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280'
);

ALTER TABLE public.withdrawal_situations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own withdrawal_situations" ON public.withdrawal_situations
  FOR SELECT USING ((auth.uid() = user_id) AND (deleted = false));

CREATE POLICY "Users can insert their own withdrawal_situations" ON public.withdrawal_situations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own withdrawal_situations" ON public.withdrawal_situations
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own withdrawal_situations" ON public.withdrawal_situations
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TABELA: situacao_informatica
-- ==========================================
CREATE TABLE public.situacao_informatica (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  user_id uuid,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280'
);

ALTER TABLE public.situacao_informatica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own situacao_informatica" ON public.situacao_informatica
  FOR SELECT USING ((auth.uid() = user_id) AND (deleted = false));

CREATE POLICY "Users can insert their own situacao_informatica" ON public.situacao_informatica
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own situacao_informatica" ON public.situacao_informatica
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own situacao_informatica" ON public.situacao_informatica
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TABELA: retirada_informatica
-- ==========================================
CREATE TABLE public.retirada_informatica (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  user_id uuid,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280'
);

ALTER TABLE public.retirada_informatica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own retirada_informatica" ON public.retirada_informatica
  FOR SELECT USING ((auth.uid() = user_id) AND (deleted = false));

CREATE POLICY "Users can insert their own retirada_informatica" ON public.retirada_informatica
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own retirada_informatica" ON public.retirada_informatica
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own retirada_informatica" ON public.retirada_informatica
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TABELA: local_equipamento
-- ==========================================
CREATE TABLE public.local_equipamento (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  user_id uuid,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6B7280'
);

ALTER TABLE public.local_equipamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own local_equipamento" ON public.local_equipamento
  FOR SELECT USING ((auth.uid() = user_id) AND (deleted = false));

CREATE POLICY "Users can insert their own local_equipamento" ON public.local_equipamento
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own local_equipamento" ON public.local_equipamento
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own local_equipamento" ON public.local_equipamento
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TABELA: system_settings
-- ==========================================
CREATE TABLE public.system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid,
  key text NOT NULL,
  value text NOT NULL
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own system_settings" ON public.system_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own system_settings" ON public.system_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own system_settings" ON public.system_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- ==========================================
-- TABELA: service_orders (Celulares)
-- ==========================================
CREATE TABLE public.service_orders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_number integer NOT NULL DEFAULT nextval('service_orders_os_number_seq'),
  entry_date timestamp with time zone NOT NULL DEFAULT now(),
  value numeric,
  situation_id uuid,
  service_date timestamp with time zone,
  received_by_id uuid,
  technician_id uuid,
  exit_date timestamp with time zone,
  withdrawal_situation_id uuid,
  mensagem_finalizada boolean NOT NULL DEFAULT false,
  mensagem_entregue boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  media_files jsonb DEFAULT '[]'::jsonb,
  checklist_houve_queda boolean DEFAULT false,
  checklist_face_id boolean DEFAULT false,
  checklist_carrega boolean DEFAULT false,
  checklist_tela_quebrada boolean DEFAULT false,
  checklist_vidro_trincado boolean DEFAULT false,
  checklist_manchas_tela boolean DEFAULT false,
  checklist_carcaca_torta boolean DEFAULT false,
  checklist_riscos_tampa boolean DEFAULT false,
  checklist_riscos_laterais boolean DEFAULT false,
  checklist_vidro_camera boolean DEFAULT false,
  checklist_acompanha_chip boolean DEFAULT false,
  checklist_acompanha_sd boolean DEFAULT false,
  checklist_acompanha_capa boolean DEFAULT false,
  checklist_esta_ligado boolean DEFAULT false,
  tracking_token uuid DEFAULT gen_random_uuid(),
  deleted boolean NOT NULL DEFAULT false,
  user_id uuid,
  client_address text,
  withdrawn_by text,
  client_cpf text,
  device_pattern text,
  other_contacts text,
  client_name text NOT NULL,
  contact text,
  device_model text NOT NULL,
  device_password text,
  reported_defect text NOT NULL,
  client_message text,
  part_order_date timestamp with time zone
);

ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service_orders" ON public.service_orders
  FOR SELECT USING ((auth.uid() = user_id) AND (deleted = false));

CREATE POLICY "Users can insert their own service_orders" ON public.service_orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service_orders" ON public.service_orders
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service_orders" ON public.service_orders
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- TABELA: service_orders_informatica
-- ==========================================
CREATE TABLE public.service_orders_informatica (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_number integer NOT NULL DEFAULT nextval('service_orders_os_number_seq'),
  entry_date timestamp with time zone NOT NULL DEFAULT now(),
  value numeric,
  situation_id uuid,
  service_date timestamp with time zone,
  received_by_id uuid,
  equipment_location_id uuid,
  withdrawal_situation_id uuid,
  client_notified boolean NOT NULL DEFAULT false,
  exit_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  deleted boolean NOT NULL DEFAULT false,
  user_id uuid,
  media_files jsonb DEFAULT '[]'::jsonb,
  equipment text NOT NULL,
  accessories text,
  defect text NOT NULL,
  more_details text,
  observations text,
  withdrawn_by text,
  senha text,
  client_name text NOT NULL,
  contact text,
  other_contacts text
);

ALTER TABLE public.service_orders_informatica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service_orders_informatica" ON public.service_orders_informatica
  FOR SELECT USING ((auth.uid() = user_id) AND (deleted = false));

CREATE POLICY "Users can insert their own service_orders_informatica" ON public.service_orders_informatica
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own service_orders_informatica" ON public.service_orders_informatica
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own service_orders_informatica" ON public.service_orders_informatica
  FOR DELETE USING (auth.uid() = user_id);

-- ==========================================
-- FUNÇÕES DO BANCO
-- ==========================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Função para criar dados padrão do usuário
CREATE OR REPLACE FUNCTION public.create_default_user_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Função para criar perfil de usuário
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- Função para tracking de OS
CREATE OR REPLACE FUNCTION public.get_tracking_order(p_token uuid)
RETURNS TABLE(
  os_number integer,
  entry_date timestamp with time zone,
  exit_date timestamp with time zone,
  device_model text,
  reported_defect text,
  situation_name text,
  situation_color text,
  withdrawal_name text,
  withdrawal_color text,
  withdrawn_by text,
  media_files jsonb,
  checklist_houve_queda boolean,
  checklist_face_id boolean,
  checklist_carrega boolean,
  checklist_tela_quebrada boolean,
  checklist_vidro_trincado boolean,
  checklist_manchas_tela boolean,
  checklist_carcaca_torta boolean,
  checklist_riscos_tampa boolean,
  checklist_riscos_laterais boolean,
  checklist_vidro_camera boolean,
  checklist_acompanha_chip boolean,
  checklist_acompanha_sd boolean,
  checklist_acompanha_capa boolean,
  checklist_esta_ligado boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    so.os_number,
    so.entry_date,
    so.exit_date,
    so.device_model,
    so.reported_defect,
    s.name as situation_name,
    s.color as situation_color,
    ws.name as withdrawal_name,
    ws.color as withdrawal_color,
    so.withdrawn_by,
    so.media_files,
    so.checklist_houve_queda,
    so.checklist_face_id,
    so.checklist_carrega,
    so.checklist_tela_quebrada,
    so.checklist_vidro_trincado,
    so.checklist_manchas_tela,
    so.checklist_carcaca_torta,
    so.checklist_riscos_tampa,
    so.checklist_riscos_laterais,
    so.checklist_vidro_camera,
    so.checklist_acompanha_chip,
    so.checklist_acompanha_sd,
    so.checklist_acompanha_capa,
    so.checklist_esta_ligado
  FROM public.service_orders so
  LEFT JOIN public.situations s ON so.situation_id = s.id
  LEFT JOIN public.withdrawal_situations ws ON so.withdrawal_situation_id = ws.id
  WHERE so.tracking_token = p_token
    AND so.deleted = false
    AND so.tracking_token IS NOT NULL;
END;
$$;

-- ==========================================
-- TRIGGERS
-- ==========================================

-- Trigger para criar perfil ao registrar usuário
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger para criar dados padrão do usuário
CREATE TRIGGER on_profile_created
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.create_default_user_data();

-- Triggers para updated_at
CREATE TRIGGER update_employees_updated_at
  BEFORE UPDATE ON public.employees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_situations_updated_at
  BEFORE UPDATE ON public.situations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_situations_updated_at
  BEFORE UPDATE ON public.withdrawal_situations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_situacao_informatica_updated_at
  BEFORE UPDATE ON public.situacao_informatica
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_retirada_informatica_updated_at
  BEFORE UPDATE ON public.retirada_informatica
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_local_equipamento_updated_at
  BEFORE UPDATE ON public.local_equipamento
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_orders_updated_at
  BEFORE UPDATE ON public.service_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_service_orders_informatica_updated_at
  BEFORE UPDATE ON public.service_orders_informatica
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==========================================
-- STORAGE BUCKETS
-- ==========================================

-- Bucket para logos (público)
INSERT INTO storage.buckets (id, name, public) VALUES ('logos', 'logos', true);

-- Bucket para mídia de ordens de serviço (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('service-orders-media', 'service-orders-media', false);

-- Políticas de storage para logos
CREATE POLICY "Logos are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Users can upload their own logo" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own logo" ON storage.objects
  FOR UPDATE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own logo" ON storage.objects
  FOR DELETE USING (bucket_id = 'logos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Políticas de storage para service-orders-media
CREATE POLICY "Users can view their own service order media" ON storage.objects
  FOR SELECT USING (bucket_id = 'service-orders-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload service order media" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'service-orders-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own service order media" ON storage.objects
  FOR UPDATE USING (bucket_id = 'service-orders-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own service order media" ON storage.objects
  FOR DELETE USING (bucket_id = 'service-orders-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ==========================================
-- FIM DA ESTRUTURA
-- ==========================================
