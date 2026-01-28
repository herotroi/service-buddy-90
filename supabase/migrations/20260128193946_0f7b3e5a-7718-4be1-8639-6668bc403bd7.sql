-- First drop the existing function
DROP FUNCTION IF EXISTS public.get_tracking_order_informatica(uuid);

-- Recreate the function with value field included
CREATE OR REPLACE FUNCTION public.get_tracking_order_informatica(p_id uuid)
RETURNS TABLE (
  os_number integer,
  entry_date timestamp with time zone,
  exit_date timestamp with time zone,
  equipment text,
  defect text,
  accessories text,
  value numeric,
  more_details text,
  situation_name text,
  situation_color text,
  withdrawal_name text,
  withdrawal_color text,
  withdrawn_by text,
  media_files jsonb
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
    so.equipment,
    so.defect,
    so.accessories,
    so.value,
    so.more_details,
    s.name as situation_name,
    s.color as situation_color,
    ws.name as withdrawal_name,
    ws.color as withdrawal_color,
    so.withdrawn_by,
    so.media_files
  FROM public.service_orders_informatica so
  LEFT JOIN public.situacao_informatica s ON so.situation_id = s.id
  LEFT JOIN public.retirada_informatica ws ON so.withdrawal_situation_id = ws.id
  WHERE so.id = p_id
    AND so.deleted = false;
END;
$$;