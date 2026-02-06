-- Fix Sales RPC to use Client Price and Track History Correctly
-- Drop old versions to avoid conflicts
DROP FUNCTION IF EXISTS public.sell_item(uuid, integer);
DROP FUNCTION IF EXISTS public.sell_item(uuid, integer, uuid);
DROP FUNCTION IF EXISTS public.sell_item(uuid, integer, uuid, numeric);

CREATE OR REPLACE FUNCTION sell_item(
  p_inventory_id uuid,
  p_quantity integer,
  p_transaction_id uuid DEFAULT NULL,
  p_unit_price numeric DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_item_name text;
  v_base_cost numeric;
  v_final_cost numeric;
  v_total numeric;
BEGIN
  -- 1. Get Item Details
  SELECT item_name, cost_per_item INTO v_item_name, v_base_cost
  FROM inventory
  WHERE id = p_inventory_id;

  -- 2. Determine Cost (Client Override vs DB Default)
  IF p_unit_price IS NOT NULL THEN
      v_final_cost := p_unit_price;
  ELSE
      v_final_cost := COALESCE(v_base_cost, 0); -- Handle nulls safely
  END IF;

  -- 3. Calculate Total
  v_total := v_final_cost * p_quantity;

  -- 4. Update Inventory
  UPDATE inventory
  SET total_items = total_items - p_quantity
  WHERE id = p_inventory_id;

  -- 5. Insert Sale Record
  INSERT INTO public.sales (
    item_name, 
    quantity, 
    cost_per_item, 
    total_price, 
    inventory_id, 
    transaction_id
  )
  VALUES (
    v_item_name, 
    p_quantity, 
    v_final_cost, 
    v_total, 
    p_inventory_id, 
    p_transaction_id
  );
END;
$$;

NOTIFY pgrst, 'reload config';
