-- Tax and plugin tax settings (admin-configured, used at checkout)
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS tax_percent NUMERIC(5, 2) NOT NULL DEFAULT 8.00 CHECK (tax_percent >= 0 AND tax_percent <= 100),
  ADD COLUMN IF NOT EXISTS plugin_tax NUMERIC(10, 2) DEFAULT 0;

COMMENT ON COLUMN public.platform_settings.tax_percent IS 'Sales tax percentage applied at checkout (admin-configured)';
COMMENT ON COLUMN public.platform_settings.plugin_tax IS 'Reserved for future plugin feature';

-- Set defaults on existing row
UPDATE public.platform_settings
SET tax_percent = 8.00, plugin_tax = COALESCE(plugin_tax, 0)
WHERE id = 'default';
