-- 1. Add inventory_id column (it was missing!)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS inventory_id UUID;

-- 2. Add transaction_id column
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS transaction_id UUID;

-- 3. Add sold_at column (just in case)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS sold_at TIMESTAMPTZ DEFAULT now();

-- 4. Add cost_per_item if missing (likely cause of error)
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS cost_per_item NUMERIC;

-- 5. Make sure inventory_id allows NULL (for manual sales)
ALTER TABLE public.sales ALTER COLUMN inventory_id DROP NOT NULL;

-- 6. Reload Schema Cache
NOTIFY pgrst, 'reload config';
