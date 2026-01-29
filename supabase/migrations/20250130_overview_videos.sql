-- Overview tab video URLs (Google Drive links) - one per section
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS overview_video_gifting_url TEXT,
  ADD COLUMN IF NOT EXISTS overview_video_vendor_url TEXT;

COMMENT ON COLUMN public.platform_settings.overview_video_gifting_url IS 'Google Drive (or other) video link for "How to Send Gifts" section on Overview tab';
COMMENT ON COLUMN public.platform_settings.overview_video_vendor_url IS 'Google Drive (or other) video link for "How to Register as Vendor" section on Overview tab';
