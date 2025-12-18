-- ========================================
-- SCRIPT DE IMPORTAÇÃO DE DADOS
-- Execute APÓS criar um novo usuário no Supabase externo
-- ========================================

-- ⚠️ IMPORTANTE: 
-- 1. Primeiro, registre-se no novo Supabase com o email: treuherzeduardoo@gmail.com
-- 2. Anote o novo user_id que será gerado (você pode ver nas tabelas auth.users)
-- 3. Substitua 'SEU_NOVO_USER_ID' abaixo pelo ID real

-- Para encontrar seu novo user_id, execute:
-- SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com';

-- ==========================================
-- DESABILITAR TRIGGERS TEMPORARIAMENTE
-- ==========================================
-- (Para evitar que o trigger create_default_user_data crie dados duplicados)

-- ==========================================
-- ATUALIZAR PROFILE
-- ==========================================
UPDATE public.profiles SET
  full_name = 'EDUARDO TREUHERZ',
  phone = '(55) 3522-2729',
  cnpj = '07.868.468/0001-41',
  street = 'AV. Júlio de Castilhos',
  number = '466',
  complement = 'Assistência e Loja de informatica',
  neighborhood = 'Centro',
  city = 'Três Passos',
  state = 'RS',
  zip_code = '98600-000'
WHERE email = 'treuherzeduardoo@gmail.com';

-- ==========================================
-- LIMPAR DADOS PADRÃO (criados pelo trigger)
-- ==========================================
DELETE FROM public.situations WHERE user_id = (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com');
DELETE FROM public.withdrawal_situations WHERE user_id = (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com');
DELETE FROM public.situacao_informatica WHERE user_id = (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com');
DELETE FROM public.retirada_informatica WHERE user_id = (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com');
DELETE FROM public.local_equipamento WHERE user_id = (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com');

-- ==========================================
-- EMPLOYEES
-- ==========================================
INSERT INTO public.employees (id, created_at, updated_at, deleted, user_id, name, contact, type) VALUES
('4c839ef9-e3a2-41bc-8618-7dbc3bbfbcb6', '2025-11-21T22:50:07.42657+00:00', '2025-12-17T08:04:54.888703+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'EDUARDO TREUHERZ', '', 'Técnico'),
('199940b2-5d68-4f95-964e-c9bbf917cd7d', '2025-12-17T08:14:23.379075+00:00', '2025-12-17T08:14:23.379075+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'teste', '', 'Não Técnico');

-- ==========================================
-- SITUATIONS (Celulares)
-- ==========================================
INSERT INTO public.situations (id, created_at, updated_at, deleted, user_id, name, color) VALUES
('522641b8-61a4-4ce8-a29f-935ce24022a4', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:03:18.040655+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Em Fila', '#9CA3AF'),
('9fff86f3-5d86-4b78-aebb-a917f6fe0c2f', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:03:22.574398+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Aguardando Peças', '#EAB308'),
('0b68faed-7fa3-4e74-aeb7-48bce6bad17e', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:03:27.118851+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Agendado', '#3B82F6'),
('9dbd2488-fc98-4fdc-ab55-11e4e4ad3ed7', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:03:32.160709+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Em Bancada', '#F97316'),
('6f7c1b5d-44e6-41da-be69-6b93a2bda0bf', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:03:36.831498+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Finalizado', '#22C55E'),
('2063ef81-fbe9-4837-af7e-6a3e21dd7d94', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:03:41.398318+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Ag. Resposta Cliente', '#A855F7'),
('be4cb20a-9bef-470f-8af1-02b58f6a1c65', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:03:45.882802+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Hora Marcada Hoje', '#06B6D4'),
('3efd4e24-bf07-4a41-ace6-1ab30d95ef33', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:03:49.838805+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Ag. Trazer o Aparelho', '#6B7280'),
('c50f58ae-5b92-4585-8f7d-82acceee1beb', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:03:54.471135+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Outro Laboratório', '#EF4444');

-- ==========================================
-- WITHDRAWAL_SITUATIONS (Celulares)
-- ==========================================
INSERT INTO public.withdrawal_situations (id, created_at, updated_at, deleted, user_id, name, color) VALUES
('e6bde2e6-0f7a-460a-ad9b-fbee3b34c9b7', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:04:00.167606+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Retirado', '#22C55E'),
('0be6e2f3-0b95-46b7-8a6b-dadd40b0b3ef', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:04:04.631295+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Aguardando Retirada', '#EAB308'),
('eeb32c1e-b63b-48fc-bd5c-eda1ff9020fc', '2025-11-21T22:42:55.170831+00:00', '2025-12-17T08:04:09.447494+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Motoboy', '#3B82F6');

-- ==========================================
-- SITUACAO_INFORMATICA
-- ==========================================
INSERT INTO public.situacao_informatica (id, created_at, updated_at, deleted, user_id, name, color) VALUES
('3b9e07c2-d1cf-4ae9-a20b-1ff09ced4e6a', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:07:42.279181+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Em Fila', '#9CA3AF'),
('f89f2f6d-6e77-405e-8700-7d63e8d6bf22', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:07:46.918619+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Em Análise', '#3B82F6'),
('b2a5d0dd-3d36-4bb8-ab50-ea34bc8ac65f', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:07:51.486296+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Aguardando Peças', '#EAB308'),
('47af5d17-dc98-41f2-bfcf-a3ff34c1e90a', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:07:56.23512+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Em Reparo', '#F97316'),
('09a83cb1-e5c7-435a-8a5a-14ad0c7e1b95', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:08:00.95052+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Finalizado', '#22C55E'),
('23ef59e3-ae10-41f4-88f9-4cc3a3fddd3e', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:08:05.91077+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Aguardando Cliente', '#A855F7');

-- ==========================================
-- RETIRADA_INFORMATICA
-- ==========================================
INSERT INTO public.retirada_informatica (id, created_at, updated_at, deleted, user_id, name, color) VALUES
('ef325931-0f25-41a4-b066-baada6ddb9b4', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:09:05.632703+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Aguardando Retirada', '#EAB308'),
('2d022f4a-2f29-4012-affd-c875afc3cf93', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:09:10.408913+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Retirado', '#22C55E'),
('b7570ad0-57c1-46a5-9639-230217738120', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:09:15.082044+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Não Retirado', '#EF4444');

-- ==========================================
-- LOCAL_EQUIPAMENTO
-- ==========================================
INSERT INTO public.local_equipamento (id, created_at, updated_at, deleted, user_id, name, color) VALUES
('7a816f58-50b0-44d0-bde8-7543c499370d', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:08:27.696392+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Balcão', '#3B82F6'),
('5b572a0a-ca04-48f3-ba82-348caa79c21d', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:08:32.315966+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Bancada', '#F97316'),
('1e614980-c1a9-4aa9-8e19-c11cb5f2592c', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:08:37.626791+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Estoque', '#8B5CF6'),
('06048fef-7e7d-4fb8-bb35-ee151c5a5a79', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:08:41.952958+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Prateleira 1', '#22C55E'),
('d6517f4a-c7a6-43b0-a095-253d6547537f', '2025-11-27T22:04:39.481937+00:00', '2025-12-17T08:08:46.362382+00:00', false, (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'), 'Prateleira 2', '#EAB308');

-- ==========================================
-- SERVICE_ORDERS (Celulares)
-- ==========================================
-- Nota: Você precisará atualizar os IDs de situation_id, received_by_id, etc.
-- para corresponder aos novos IDs no banco externo

INSERT INTO public.service_orders (
  id, os_number, entry_date, exit_date, value, situation_id, received_by_id, technician_id,
  withdrawal_situation_id, mensagem_finalizada, mensagem_entregue, created_at, updated_at,
  media_files, deleted, user_id, client_name, contact, device_model, device_password, 
  device_pattern, reported_defect, client_address, client_cpf, client_message, other_contacts,
  tracking_token, checklist_houve_queda, checklist_face_id, checklist_carrega, 
  checklist_tela_quebrada, checklist_vidro_trincado, checklist_manchas_tela, 
  checklist_carcaca_torta, checklist_riscos_tampa, checklist_riscos_laterais,
  checklist_vidro_camera, checklist_acompanha_chip, checklist_acompanha_sd,
  checklist_acompanha_capa, checklist_esta_ligado, withdrawn_by
) VALUES 
(
  '95046869-c9d0-46df-adfb-69c17bd67275', 
  11998, 
  '2025-12-17T00:00:00+00:00', 
  NULL, 
  NULL, 
  '522641b8-61a4-4ce8-a29f-935ce24022a4', -- Em Fila
  '4c839ef9-e3a2-41bc-8618-7dbc3bbfbcb6', -- EDUARDO TREUHERZ
  NULL,
  NULL,
  false, 
  false, 
  '2025-12-17T07:19:31.34011+00:00', 
  '2025-12-17T09:01:24.485259+00:00',
  '[]'::jsonb, 
  false, 
  (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'),
  'teste', 
  NULL, 
  'rete', 
  'qwert123', 
  '0,3,4,1,2,5',
  'tela', 
  NULL, 
  NULL, 
  NULL, 
  NULL,
  'a1dca460-ab96-439b-ad4a-96e423f2536b',
  NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL
),
(
  '15e49193-b366-48d9-9dae-76a2fb31b2ea', 
  1, 
  '2025-11-22T00:00:00+00:00', 
  '2025-12-27T00:00:00+00:00', 
  NULL, 
  '6f7c1b5d-44e6-41da-be69-6b93a2bda0bf', -- Finalizado
  '4c839ef9-e3a2-41bc-8618-7dbc3bbfbcb6', -- EDUARDO TREUHERZ
  '4c839ef9-e3a2-41bc-8618-7dbc3bbfbcb6',
  'e6bde2e6-0f7a-460a-ad9b-fbee3b34c9b7', -- Retirado
  false, 
  false, 
  '2025-11-22T06:08:53.200083+00:00', 
  '2025-12-17T14:28:54.14051+00:00',
  '[]'::jsonb, -- Nota: arquivos de mídia precisarão ser migrados manualmente
  false, 
  (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'),
  'eduardo treuherz', 
  '(55) 99911-6414', 
  'edge 30 ultra', 
  '123456', 
  '0,3,4',
  'não liga', 
  'rua rui barbosa centro 188', 
  '036.244.820-50', 
  'testesss', 
  NULL,
  '3c8b1e55-bb35-4b4f-9818-e54e21d1e97a',
  false, NULL, true, false, false, false, false, true, true, false, true, false, true, true, 'Eduardo'
);

-- ==========================================
-- SERVICE_ORDERS_INFORMATICA
-- ==========================================
INSERT INTO public.service_orders_informatica (
  id, os_number, entry_date, exit_date, value, situation_id, received_by_id, 
  equipment_location_id, withdrawal_situation_id, client_notified, created_at, updated_at,
  media_files, deleted, user_id, client_name, contact, other_contacts, equipment, 
  accessories, defect, more_details, observations, withdrawn_by, senha
) VALUES 
(
  'f2eb1330-7f21-4f65-9a52-ffe3fd31d00a', 
  11999, 
  '2025-12-17T00:00:00+00:00', 
  NULL, 
  NULL, 
  '3b9e07c2-d1cf-4ae9-a20b-1ff09ced4e6a', -- Em Fila
  '4c839ef9-e3a2-41bc-8618-7dbc3bbfbcb6', -- EDUARDO TREUHERZ
  '7a816f58-50b0-44d0-bde8-7543c499370d', -- Balcão
  NULL,
  false, 
  '2025-12-17T08:15:00.419899+00:00', 
  '2025-12-17T08:15:00.419899+00:00',
  '[]'::jsonb, 
  false, 
  (SELECT id FROM auth.users WHERE email = 'treuherzeduardoo@gmail.com'),
  'teste', 
  '(55) 99911-6414', 
  NULL, 
  'notebook lenovo', 
  'carregador',
  'não liga', 
  NULL, 
  NULL, 
  NULL, 
  '12345'
);

-- ==========================================
-- ATUALIZAR SEQUÊNCIA
-- ==========================================
SELECT setval('service_orders_os_number_seq', 12000, true);

-- ==========================================
-- FIM DA IMPORTAÇÃO DE DADOS
-- ==========================================
