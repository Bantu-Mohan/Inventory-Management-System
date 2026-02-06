-- Grant permissions to logged-in users
GRANT ALL ON TABLE public.inventory TO authenticated;
GRANT ALL ON TABLE public.sales TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE public.inventory_id_seq TO authenticated; -- If generic primary key logic used later (UUID usually doesn't need this but safe to add)

-- Ensure RLS is enabled
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they conflict (optional but safer)
DROP POLICY IF EXISTS "Allow All for Authenticated" ON public.inventory;
DROP POLICY IF EXISTS "Allow All for Authenticated" ON public.sales;

-- Create broad policies for logged-in users
CREATE POLICY "Allow All for Authenticated" ON public.inventory
FOR ALL TO authenticated
USING (true) WITH CHECK (true);

CREATE POLICY "Allow All for Authenticated" ON public.sales
FOR ALL TO authenticated
USING (true) WITH CHECK (true);
