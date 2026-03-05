-- Store plain API key so super admin can view/copy it in the dashboard.
-- Validation still uses api_key_hash; this column is for display only (admin-only read).
ALTER TABLE public.plugin_integrations
  ADD COLUMN IF NOT EXISTS api_key_plain TEXT;

COMMENT ON COLUMN public.plugin_integrations.api_key_plain IS 'Plain API key for admin display/copy. Only admins can read. New integrations get this set; validation uses api_key_hash.';
