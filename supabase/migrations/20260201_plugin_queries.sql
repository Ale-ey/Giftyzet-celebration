-- Plugin queries: submissions from "Add Gifting to Your Store" section (name, email, phone, query)
CREATE TABLE IF NOT EXISTS public.plugin_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.plugin_queries ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit (anon, authenticated)
CREATE POLICY "Allow insert plugin_queries"
  ON public.plugin_queries
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated (admin) can read
CREATE POLICY "Allow authenticated read plugin_queries"
  ON public.plugin_queries
  FOR SELECT
  TO authenticated
  USING (true);

GRANT INSERT ON public.plugin_queries TO anon;
GRANT INSERT ON public.plugin_queries TO authenticated;
GRANT SELECT ON public.plugin_queries TO authenticated;

COMMENT ON TABLE public.plugin_queries IS 'Plugin interest form from Add Gifting to Your Store (name, email, phone, query).';
