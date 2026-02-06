-- Overload sell_item to support both signatures (Robust Fix)

-- 1. Main implementation with Transaction ID
CREATE OR REPLACE FUNCTION public.sell_item(
  p_inventory_id UUID,
  p_quantity INTEGER,
  p_transaction_id UUID
)
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
  INSERT INTO public.sales (item_name, quantity, total_price, sold_at, transaction_id)
  VALUES (v_item_name, p_quantity, v_total_price, NOW(), p_transaction_id);

  RETURN QUERY SELECT v_total_price, v_current_stock;
END;
$$;

-- 2. Overload for backward compatibility (2 args)
-- This redirects to the 3-arg version with NULL transaction_id
CREATE OR REPLACE FUNCTION public.sell_item(
  p_inventory_id UUID,
  p_quantity INTEGER
)
RETURNS TABLE (
  total_price NUMERIC,
  remaining_stock INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.sell_item(p_inventory_id, p_quantity, NULL::UUID);
END;
$$;

-- Grant permissions for BOTH
GRANT EXECUTE ON FUNCTION public.sell_item(UUID, INTEGER, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sell_item(UUID, INTEGER, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.sell_item(UUID, INTEGER, UUID) TO anon;

GRANT EXECUTE ON FUNCTION public.sell_item(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sell_item(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.sell_item(UUID, INTEGER) TO anon;

-- Force Cache Reload
NOTIFY pgrst, 'reload config';
