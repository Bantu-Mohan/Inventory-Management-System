-- Enable Storage if not already enabled (usually enabled by default in Supabase projects)
-- Create a public bucket for receipts
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Set up RLS for the receipts bucket
-- Allow anyone to read (public)
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'receipts' );

-- Allow authenticated users to upload (Staff)
create policy "Staff Upload"
  on storage.objects for insert
  with check ( bucket_id = 'receipts' and auth.role() = 'authenticated' );
