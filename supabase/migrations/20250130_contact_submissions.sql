-- Contact form submissions table (anonymous submissions from footer contact form)
CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anon) to INSERT contact submissions
CREATE POLICY "Allow anonymous insert for contact submissions"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users (e.g. admin) can read; adjust as needed for your admin
-- For now we allow no SELECT by anon so only service role or custom admin can read
CREATE POLICY "Allow authenticated read for contact submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Optional: grant usage so anon can insert
GRANT INSERT ON public.contact_submissions TO anon;
GRANT INSERT ON public.contact_submissions TO authenticated;
GRANT SELECT ON public.contact_submissions TO authenticated;

COMMENT ON TABLE public.contact_submissions IS 'Contact form submissions from the site footer (name, email, query).';
