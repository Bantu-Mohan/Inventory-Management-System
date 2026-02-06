-- Update sell_item RPC to support tracking Inventory ID and Transaction ID
-- First DROP existing functions to avoid signature conflicts ("cannot change return type" error)

DROP FUNCTION IF EXISTS public.sell_item(uuid, integer);
DROP FUNCTION IF EXISTS public.sell_item(uuid, integer, uuid);

CREATE OR REPLACE FUNCTION sell_item(
  p_inventory_id uuid,
  p_quantity integer,
  p_transaction_id uuid DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_item_name text;
  v_cost numeric;
  v_total numeric;
BEGIN
  -- Get item details
  SELECT item_name, cost_per_item INTO v_item_name, v_cost
  FROM inventory
  WHERE id = p_inventory_id;

  -- Update Inventory Count
  UPDATE inventory
  SET total_items = total_items - p_quantity
  WHERE id = p_inventory_id;

  -- Insert into Sales with valid Inventory ID and Transaction ID
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
    v_cost, 
    v_total, 
    p_inventory_id, 
    p_transaction_id
  );
END;
$$;

NOTIFY pgrst, 'reload config';
