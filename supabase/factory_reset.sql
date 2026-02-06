-- RUN THIS IN SUPABASE SQL EDITOR TO RESET EVERYTHING
-- This effectively factory resets your public schema and tables

-- 1. Reset Schema Permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

-- 2. Drop existing tables to clear bad state
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.inventory CASCADE;

-- 3. Re-create Inventory
CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT NOT NULL,
    number_of_packets INTEGER DEFAULT 0,
    items_per_packet INTEGER DEFAULT 1,
    -- removed cost_per_packet
    total_items INTEGER DEFAULT 0,
    cost_per_item NUMERIC DEFAULT 0, -- Direct input now
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Re-create Sales
CREATE TABLE public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name TEXT,
    quantity_sold INTEGER,
    total_price NUMERIC,
    sold_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. OPEN EVERYTHING UP (The "Git-R-Done" Approach)
-- Enable RLS just to attach a "Let Everyone In" policy
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Inventory" ON public.inventory FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Access Sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

-- 6. Grant basic rights again just in case
GRANT ALL ON TABLE public.inventory TO anon;
GRANT ALL ON TABLE public.inventory TO service_role;
GRANT ALL ON TABLE public.sales TO anon;
GRANT ALL ON TABLE public.sales TO service_role;
