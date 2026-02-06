-- Sanitize Inventory Data (Fix NULLs)
UPDATE public.inventory SET total_items = 0 WHERE total_items IS NULL;
UPDATE public.inventory SET number_of_packets = 0 WHERE number_of_packets IS NULL;
UPDATE public.inventory SET items_per_packet = 1 WHERE items_per_packet IS NULL OR items_per_packet = 0;


-- Make add_stock robust
CREATE OR REPLACE FUNCTION public.add_stock(p_item_id UUID, p_quantity INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.inventory
  SET total_items = COALESCE(total_items, 0) + p_quantity,
      updated_at = NOW()
  WHERE id = p_item_id;
END;
$$;

-- Make sell_item robust
DROP FUNCTION IF EXISTS public.sell_item(UUID, INTEGER);

CREATE OR REPLACE FUNCTION public.sell_item(p_inventory_id UUID, p_quantity INTEGER)
RETURNS TABLE (
  total_price NUMERIC,
  remaining_stock INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cost_per_item NUMERIC;
  v_current_stock INTEGER;
  v_item_name TEXT;
  v_total_price NUMERIC;
BEGIN
  -- Get item details
  SELECT COALESCE(cost_per_item, 0), COALESCE(total_items, 0), item_name
  INTO v_cost_per_item, v_current_stock, v_item_name
  FROM public.inventory
  WHERE id = p_inventory_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  IF v_current_stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  -- Calculate price
  v_total_price := p_quantity * v_cost_per_item;

  -- Update inventory
  UPDATE public.inventory
  SET total_items = COALESCE(total_items, 0) - p_quantity,
      updated_at = NOW()
  WHERE id = p_inventory_id
  RETURNING total_items INTO v_current_stock;

  -- Insert sale record
  INSERT INTO public.sales (item_name, quantity, total_price, sold_at)
  VALUES (v_item_name, p_quantity, v_total_price, NOW());

  RETURN QUERY SELECT v_total_price, v_current_stock;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sell_item(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sell_item(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.sell_item(UUID, INTEGER) TO anon;
