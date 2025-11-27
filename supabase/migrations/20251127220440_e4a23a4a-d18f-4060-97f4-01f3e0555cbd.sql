-- =============================================
-- TABELAS PARA O SETOR DE INFORMÁTICA
-- =============================================

-- 1. Situações de Informática (clone da tabela situations)
CREATE TABLE public.situacao_informatica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.situacao_informatica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view situacao_informatica"
ON public.situacao_informatica FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert situacao_informatica"
ON public.situacao_informatica FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update situacao_informatica"
ON public.situacao_informatica FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete situacao_informatica"
ON public.situacao_informatica FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_situacao_informatica_updated_at
BEFORE UPDATE ON public.situacao_informatica
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir situações padrão
INSERT INTO public.situacao_informatica (name, color) VALUES
  ('Em Fila', '#9CA3AF'),
  ('Aguardando Peças', '#EAB308'),
  ('Em Bancada', '#F97316'),
  ('Finalizado', '#22C55E'),
  ('Aguardando Resposta', '#8B5CF6'),
  ('Pronto para Entrega', '#3B82F6');

-- 2. Local do Equipamento (nova tabela)
CREATE TABLE public.local_equipamento (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.local_equipamento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view local_equipamento"
ON public.local_equipamento FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert local_equipamento"
ON public.local_equipamento FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update local_equipamento"
ON public.local_equipamento FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete local_equipamento"
ON public.local_equipamento FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_local_equipamento_updated_at
BEFORE UPDATE ON public.local_equipamento
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir locais padrão
INSERT INTO public.local_equipamento (name, color) VALUES
  ('Balcão', '#3B82F6'),
  ('Bancada', '#F97316'),
  ('Estoque', '#8B5CF6'),
  ('Prateleira 1', '#22C55E'),
  ('Prateleira 2', '#EAB308');

-- 3. Retirada Informática (clone da tabela withdrawal_situations)
CREATE TABLE public.retirada_informatica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.retirada_informatica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view retirada_informatica"
ON public.retirada_informatica FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert retirada_informatica"
ON public.retirada_informatica FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update retirada_informatica"
ON public.retirada_informatica FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete retirada_informatica"
ON public.retirada_informatica FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_retirada_informatica_updated_at
BEFORE UPDATE ON public.retirada_informatica
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir situações de retirada padrão
INSERT INTO public.retirada_informatica (name, color) VALUES
  ('Aguardando Retirada', '#EAB308'),
  ('Retirado', '#22C55E'),
  ('Não Retirado', '#EF4444');

-- 4. Ordens de Serviço - Informática
CREATE TABLE public.service_orders_informatica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  os_number INTEGER NOT NULL DEFAULT nextval('service_orders_os_number_seq'::regclass),
  senha TEXT,
  entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_name TEXT NOT NULL,
  contact TEXT,
  other_contacts TEXT,
  equipment TEXT NOT NULL,
  accessories TEXT,
  defect TEXT NOT NULL,
  more_details TEXT,
  value NUMERIC,
  situation_id UUID REFERENCES public.situacao_informatica(id),
  observations TEXT,
  service_date TIMESTAMP WITH TIME ZONE,
  received_by_id UUID REFERENCES public.employees(id),
  equipment_location_id UUID REFERENCES public.local_equipamento(id),
  withdrawal_situation_id UUID REFERENCES public.retirada_informatica(id),
  client_notified BOOLEAN NOT NULL DEFAULT false,
  exit_date TIMESTAMP WITH TIME ZONE,
  withdrawn_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.service_orders_informatica ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view service_orders_informatica"
ON public.service_orders_informatica FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert service_orders_informatica"
ON public.service_orders_informatica FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update service_orders_informatica"
ON public.service_orders_informatica FOR UPDATE
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete service_orders_informatica"
ON public.service_orders_informatica FOR DELETE
USING (auth.uid() IS NOT NULL);

-- Trigger para updated_at
CREATE TRIGGER update_service_orders_informatica_updated_at
BEFORE UPDATE ON public.service_orders_informatica
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar realtime para as novas tabelas
ALTER TABLE public.situacao_informatica REPLICA IDENTITY FULL;
ALTER TABLE public.local_equipamento REPLICA IDENTITY FULL;
ALTER TABLE public.retirada_informatica REPLICA IDENTITY FULL;
ALTER TABLE public.service_orders_informatica REPLICA IDENTITY FULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.situacao_informatica;
ALTER PUBLICATION supabase_realtime ADD TABLE public.local_equipamento;
ALTER PUBLICATION supabase_realtime ADD TABLE public.retirada_informatica;
ALTER PUBLICATION supabase_realtime ADD TABLE public.service_orders_informatica;