-- Vendors can create and manage their own plugin integrations (one per store).
-- Required so vendors can get an API key after signup without admin.
CREATE POLICY "Vendors can manage own plugin_integrations"
  ON public.plugin_integrations
  FOR ALL
  TO authenticated
  USING (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  )
  WITH CHECK (
    vendor_id IN (SELECT id FROM public.vendors WHERE user_id = auth.uid())
  );

COMMENT ON POLICY "Vendors can manage own plugin_integrations" ON public.plugin_integrations IS 'Vendors can create and view their plugin API key for their store(s).';
