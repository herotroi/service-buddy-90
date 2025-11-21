-- Add color column to withdrawal_situations table
ALTER TABLE public.withdrawal_situations ADD COLUMN color text NOT NULL DEFAULT '#6B7280';

-- Update existing records with default colors
UPDATE public.withdrawal_situations SET color = '#10B981' WHERE name = 'RETIRADO';
UPDATE public.withdrawal_situations SET color = '#F59E0B' WHERE name = 'AGUARDANDO';
UPDATE public.withdrawal_situations SET color = '#EF4444' WHERE name = 'DESCARTE';
UPDATE public.withdrawal_situations SET color = '#8B5CF6' WHERE name = 'ANTES AUTOMAÇÃO';
UPDATE public.withdrawal_situations SET color = '#3B82F6' WHERE name = 'NA LOJA';