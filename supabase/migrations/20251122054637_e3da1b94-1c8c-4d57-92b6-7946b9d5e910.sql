-- Tornar o campo contact nullable
ALTER TABLE service_orders ALTER COLUMN contact DROP NOT NULL;

-- Adicionar campo para outros contatos
ALTER TABLE service_orders ADD COLUMN other_contacts text;