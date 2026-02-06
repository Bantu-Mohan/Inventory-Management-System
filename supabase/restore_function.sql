-- RUN THIS IN SUPABASE SQL EDITOR TO RESTORE THE SELL FUNCTION
-- This is required for the "Sell Item" button to work.

create or replace function public.sell_item(p_inventory_id uuid, p_quantity integer)
returns table (
  sale_id uuid,
  item_name text,
  cost_per_item numeric,
  total_price numeric,
  remaining_stock integer
)
language plpgsql
security definer 
as $$
declare
  v_item_name text;
  v_cost_per_item numeric;
  v_total_items integer;
  v_total_price numeric;
begin
  -- 1. Validate Input
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than 0';
  end if;

  -- 2. Fetch current item details with locking
  select i.item_name, i.cost_per_item, i.total_items
    into v_item_name, v_cost_per_item, v_total_items
  from public.inventory i
  where i.id = p_inventory_id
  for update;

  if v_item_name is null then
    raise exception 'Item not found';
  end if;

  if v_total_items < p_quantity then
    raise exception 'Insufficient stock';
  end if;

  -- 3. Update Inventory Stock
  update public.inventory
    set total_items = total_items - p_quantity,
        updated_at = now()
  where id = p_inventory_id;

  -- 4. Calculate Price
  v_total_price := round((p_quantity * v_cost_per_item)::numeric, 2);

  -- 5. Record Sale
  -- Note: The schema for 'sales' has: item_name, quantity_sold, total_price
  insert into public.sales (item_name, quantity_sold, total_price, sold_at)
  values (v_item_name, p_quantity, v_total_price, now())
  returning id into sale_id;

  -- 6. Prepare Return Data
  item_name := v_item_name;
  cost_per_item := v_cost_per_item;
  total_price := v_total_price;

  select total_items into remaining_stock
  from public.inventory
  where id = p_inventory_id;

  return next;
end;
$$;

-- Grant execute permission
grant execute on function public.sell_item to anon;
grant execute on function public.sell_item to service_role;
