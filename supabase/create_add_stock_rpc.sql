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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.add_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_stock(UUID, INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.add_stock(UUID, INTEGER) TO anon;
