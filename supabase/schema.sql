create extension if not exists pgcrypto;

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  item_name text not null unique,
  number_of_packets integer not null check (number_of_packets >= 0),
  items_per_packet integer not null check (items_per_packet > 0),
  cost_per_packet numeric(12,2) not null check (cost_per_packet >= 0),
  total_items integer not null check (total_items >= 0),
  cost_per_item numeric(12,4) generated always as (cost_per_packet / items_per_packet) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists inventory_item_name_idx on public.inventory (item_name);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  inventory_id uuid references public.inventory (id) on delete set null,
  item_name text not null,
  quantity_sold integer not null check (quantity_sold > 0),
  cost_per_item numeric(12,4) not null check (cost_per_item >= 0),
  total_price numeric(12,2) not null check (total_price >= 0),
  sold_at timestamptz not null default now()
);

create index if not exists sales_sold_at_idx on public.sales (sold_at desc);

create or replace function public.sell_item(p_inventory_id uuid, p_quantity integer)
returns table (
  sale_id uuid,
  item_name text,
  cost_per_item numeric,
  total_price numeric,
  remaining_stock integer
)
language plpgsql
as $$
declare
  v_item_name text;
  v_cost_per_item numeric;
  v_total_items integer;
  v_total_price numeric;
begin
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'Quantity must be greater than 0';
  end if;

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

  update public.inventory
    set total_items = total_items - p_quantity,
        updated_at = now()
  where id = p_inventory_id;

  v_total_price := round((p_quantity * v_cost_per_item)::numeric, 2);

  insert into public.sales (inventory_id, item_name, quantity_sold, cost_per_item, total_price)
  values (p_inventory_id, v_item_name, p_quantity, v_cost_per_item, v_total_price)
  returning id into sale_id;

  item_name := v_item_name;
  cost_per_item := v_cost_per_item;
  total_price := v_total_price;

  select total_items into remaining_stock
  from public.inventory
  where id = p_inventory_id;

  return next;
end;
$$;

alter table public.inventory disable row level security;
alter table public.sales disable row level security;
