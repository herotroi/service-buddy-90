-- Add NOT NULL constraints to user_id columns for defense in depth
-- All tables have 0 records with NULL user_id, so this is safe

ALTER TABLE service_orders ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE service_orders_informatica ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE employees ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE situations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE withdrawal_situations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE situacao_informatica ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE retirada_informatica ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE local_equipamento ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE system_settings ALTER COLUMN user_id SET NOT NULL;