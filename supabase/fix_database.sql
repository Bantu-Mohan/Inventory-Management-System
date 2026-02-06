-- 1. Add transaction_id column if it doesn't exist
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS transaction_id UUID;

-- 2. Allow Manual Sales (make inventory_id optional)
ALTER TABLE public.sales ALTER COLUMN inventory_id DROP NOT NULL;

-- 3. Notify PostgREST to refresh schema cache (CRITICAL)
NOTIFY pgrst, 'reload config';
