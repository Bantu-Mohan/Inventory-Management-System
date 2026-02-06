-- Add transaction_id column to sales table
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS transaction_id UUID;

-- Notify change
NOTIFY pgrst, 'reload config';
