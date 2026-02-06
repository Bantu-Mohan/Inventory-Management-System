-- Run this script in the Supabase SQL Editor to fix permission errors

-- 1. Disable Row Level Security (RLS) for public access
alter table public.inventory disable row level security;
alter table public.sales disable row level security;

-- 2. Explicitly grant permissions to the anonymous role (used by the API key)
grant all on table public.inventory to anon;
grant all on table public.sales to anon;
-- 3. Grant execute permission on the sales function
grant execute on function public.sell_item to anon;
