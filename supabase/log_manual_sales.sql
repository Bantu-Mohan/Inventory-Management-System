-- Create Trigger to Log Manual Sales in Activity Log
-- Since Manual Sales don't affect inventory table, the inventory trigger doesn't catch them.
-- We attach this to the SALES table.

CREATE OR REPLACE FUNCTION log_sales_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log Manual Sales (where inventory_id is NULL)
    -- Inventory Sales update the inventory table, so they are logged by log_inventory_change() trigger (STO_REMOVED)
    IF NEW.inventory_id IS NULL THEN
        INSERT INTO public.audit_logs (item_name, action_type, change_amount, details)
        VALUES (
            NEW.item_name,
            'MANUAL_SALE', 
            -NEW.quantity, 
            'Manual Sale: ' || NEW.quantity || ' x ' || NEW.item_name || ' (₹' || NEW.total_price || ')'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS on_sales_insert ON public.sales;

-- Create Trigger
CREATE TRIGGER on_sales_insert
AFTER INSERT ON public.sales
FOR EACH ROW EXECUTE FUNCTION log_sales_insert();

NOTIFY pgrst, 'reload config';
