-- Remove the single address field and add separate address fields
ALTER TABLE public.profiles
DROP COLUMN address;

ALTER TABLE public.profiles
ADD COLUMN street TEXT,
ADD COLUMN number TEXT,
ADD COLUMN complement TEXT,
ADD COLUMN neighborhood TEXT,
ADD COLUMN city TEXT,
ADD COLUMN state TEXT,
ADD COLUMN zip_code TEXT;