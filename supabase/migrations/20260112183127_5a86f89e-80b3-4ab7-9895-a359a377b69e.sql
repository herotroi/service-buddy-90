-- Adicionar constraint único para (user_id, os_number) em service_orders
-- Isso garante que não haja duplicatas mesmo com concorrência
CREATE UNIQUE INDEX IF NOT EXISTS service_orders_user_os_number_unique 
ON public.service_orders (user_id, os_number) 
WHERE deleted = false;

-- Adicionar constraint único para (user_id, os_number) em service_orders_informatica
CREATE UNIQUE INDEX IF NOT EXISTS service_orders_informatica_user_os_number_unique 
ON public.service_orders_informatica (user_id, os_number) 
WHERE deleted = false;

-- Criar função para gerar próximo número de OS atomicamente
CREATE OR REPLACE FUNCTION get_next_os_number(p_user_id UUID, p_table TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_next_number INTEGER;
  v_starting_number INTEGER := 1;
BEGIN
  -- Buscar número inicial configurado pelo usuário
  SELECT COALESCE(value::INTEGER, 1) INTO v_starting_number
  FROM system_settings
  WHERE key = 'os_starting_number' AND user_id = p_user_id
  LIMIT 1;

  IF p_table = 'service_orders' THEN
    SELECT COALESCE(MAX(os_number), v_starting_number - 1) + 1 INTO v_next_number
    FROM service_orders
    WHERE user_id = p_user_id AND deleted = false;
  ELSIF p_table = 'service_orders_informatica' THEN
    SELECT COALESCE(MAX(os_number), v_starting_number - 1) + 1 INTO v_next_number
    FROM service_orders_informatica
    WHERE user_id = p_user_id AND deleted = false;
  ELSE
    RAISE EXCEPTION 'Tabela inválida: %', p_table;
  END IF;

  -- Garantir que não seja menor que o número inicial
  RETURN GREATEST(v_next_number, v_starting_number);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;