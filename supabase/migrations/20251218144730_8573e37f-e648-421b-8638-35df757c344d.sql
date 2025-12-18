-- CORREÇÕES DE SEGURANÇA CRÍTICAS

-- 1. Remover política pública muito permissiva para service_orders
DROP POLICY IF EXISTS "Public can view service order with tracking token" ON public.service_orders;

-- 2. Criar uma view segura para tracking público (apenas campos não sensíveis)
CREATE OR REPLACE VIEW public.service_orders_tracking AS
SELECT 
  tracking_token,
  os_number,
  entry_date,
  exit_date,
  device_model,
  reported_defect,
  situation_id,
  withdrawal_situation_id,
  withdrawn_by,
  -- Checklist items (não sensíveis)
  checklist_houve_queda,
  checklist_face_id,
  checklist_carrega,
  checklist_tela_quebrada,
  checklist_vidro_trincado,
  checklist_manchas_tela,
  checklist_carcaca_torta,
  checklist_riscos_tampa,
  checklist_riscos_laterais,
  checklist_vidro_camera,
  checklist_acompanha_chip,
  checklist_acompanha_sd,
  checklist_acompanha_capa,
  checklist_esta_ligado,
  media_files
FROM public.service_orders
WHERE deleted = false AND tracking_token IS NOT NULL;

-- 3. Criar função segura para buscar dados de tracking
CREATE OR REPLACE FUNCTION public.get_tracking_order(p_token uuid)
RETURNS TABLE (
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
SET search_path = public
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

-- 4. Remover políticas públicas excessivamente permissivas para situations
DROP POLICY IF EXISTS "Public can view situations for tracking" ON public.situations;
DROP POLICY IF EXISTS "Public can view withdrawal_situations for tracking" ON public.withdrawal_situations;

-- 5. NOTA: As tabelas situations e withdrawal_situations não precisam mais de políticas públicas
-- porque a função get_tracking_order é SECURITY DEFINER e busca os dados internamente

-- 6. Garantir que RLS está ativo em todas as tabelas
ALTER TABLE public.service_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_orders_informatica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_situations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.situacao_informatica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retirada_informatica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_equipamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;