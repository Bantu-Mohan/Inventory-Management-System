-- MASTER FIX SCRIPT
-- Run this in Supabase SQL Editor to fix ALL permissions and missing functions.

-- 1. Grant Permissions to Logged In Users
GRANT ALL ON TABLE public.inventory TO authenticated;
GRANT ALL ON TABLE public.sales TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.inventory_id_seq TO authenticated;

-- 2. Enable RLS and Create Policies
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow All for Authenticated" ON public.inventory;
DROP POLICY IF EXISTS "Allow All for Authenticated" ON public.sales;

CREATE POLICY "Allow All for Authenticated" ON public.inventory
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Allow All for Authenticated" ON public.sales
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 3. Create the 'add_stock' Function (RPC)
CREATE OR REPLACE FUNCTION public.add_stock(p_item_id UUID, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inventory
  SET total_items = total_items + p_quantity,
      updated_at = NOW()
  WHERE id = p_item_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_stock(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_stock(UUID, INTEGER) TO anon;

-- 4. Fix sales_id_seq if needed (optional)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
