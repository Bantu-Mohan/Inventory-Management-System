
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  item_name text not null,
  action_type text not null,
  change_amount integer,
  details text
);

-- Enable RLS but allow everything for now
alter table public.audit_logs disable row level security;
grant select on public.audit_logs to anon, authenticated, service_role;

create or replace function log_inventory_change()
returns trigger as $$
declare
  v_action text;
  v_details text;
  v_change integer;
begin
  if (TG_OP = 'INSERT') then
    v_action := 'CREATE';
    v_details := 'Item created';
    v_change := NEW.total_items;
    
    insert into public.audit_logs (item_name, action_type, change_amount, details)
    values (NEW.item_name, v_action, v_change, v_details);
    
    return NEW;

  elsif (TG_OP = 'UPDATE') then
    -- Check for stock change
    if (OLD.total_items != NEW.total_items) then
        v_change := NEW.total_items - OLD.total_items;
        
        if (v_change > 0) then
            v_action := 'ADD_STOCK';
            v_details := 'Added ' || v_change || ' items';
        else
            v_action := 'STOCK_REMOVED';
            v_details := 'Removed ' || abs(v_change) || ' items (Sale or Correction)';
        end if;
        
        insert into public.audit_logs (item_name, action_type, change_amount, details)
        values (NEW.item_name, v_action, v_change, v_details);
    end if;

    -- Check for detail updates (Price, Name, etc)
    -- We removed cost_per_packet check as it may not exist in live schema
    if (OLD.cost_per_item != NEW.cost_per_item OR 
        OLD.items_per_packet != NEW.items_per_packet OR
        OLD.item_name != NEW.item_name) then
        
        v_action := 'UPDATE';
        v_details := 'Updated item configuration';
        
        insert into public.audit_logs (item_name, action_type, change_amount, details)
        values (NEW.item_name, v_action, 0, v_details);
    end if;
    
    return NEW;

  elsif (TG_OP = 'DELETE') then
    v_action := 'DELETE';
    v_details := 'Item deleted permanently';
    
    insert into public.audit_logs (item_name, action_type, change_amount, details)
    values (OLD.item_name, v_action, 0, v_details);
    
    return OLD;
  end if;
  return null;
end;
$$ language plpgsql security definer;

-- Recreate trigger
drop trigger if exists on_inventory_change on public.inventory;
create trigger on_inventory_change
after insert or update or delete on public.inventory
for each row execute function log_inventory_change();
