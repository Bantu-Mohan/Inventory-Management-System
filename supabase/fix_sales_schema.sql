-- Fix Sales Table Schema
-- Add missing columns if they don't exist

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS total_price NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS item_name TEXT;

-- Grant permissions again just in case
GRANT ALL ON TABLE public.sales TO authenticated;
GRANT ALL ON TABLE public.sales TO service_role;
