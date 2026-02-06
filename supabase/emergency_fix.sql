-- 🚨 EMERGENCY PERMISSION FIX STATEMENTS
-- Run these one by one or all key in Supabase SQL Editor

BEGIN;

-- 1. Ensure public schema usage
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO postgres;

-- 2. Toggle RLS OFF (and back on and off to be sure it toggles)
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory DISABLE ROW LEVEL SECURITY;

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales DISABLE ROW LEVEL SECURITY;

-- 3. Grant ALL privileges on tables
GRANT ALL ON TABLE public.inventory TO anon;
GRANT ALL ON TABLE public.inventory TO service_role;

GRANT ALL ON TABLE public.sales TO anon;
GRANT ALL ON TABLE public.sales TO service_role;

-- 4. Grant execution on functions
GRANT EXECUTE ON FUNCTION public.sell_item TO anon;
GRANT EXECUTE ON FUNCTION public.sell_item TO service_role;

COMMIT;

-- Verify query (Result should be empty if RLS is effectively ignored for anon, or show data if present)
-- select * from public.inventory;
