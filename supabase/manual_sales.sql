-- Allow manual sales by making inventory_id optional
ALTER TABLE sales ALTER COLUMN inventory_id DROP NOT NULL;

-- Also ensure item_name is present (it should be, but just in case)
-- (No action needed usually as it exists)
