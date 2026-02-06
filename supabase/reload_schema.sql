-- Force PostgREST schema cache reload
NOTIFY pgrst, 'reload config';

-- Sometimes it helps to just run a dummy comment or simple change
COMMENT ON SCHEMA public IS 'Standard public schema';
