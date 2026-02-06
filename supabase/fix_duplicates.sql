-- Remove duplicates (keep latest)
DELETE FROM public.inventory a USING (
      SELECT min(ctid) as ctid, item_name
        FROM public.inventory 
        GROUP BY item_name HAVING COUNT(*) > 1
      ) b
      WHERE a.item_name = b.item_name 
      AND a.ctid <> b.ctid;

-- Make name unique
ALTER TABLE public.inventory ADD CONSTRAINT unique_item_name UNIQUE (item_name);
