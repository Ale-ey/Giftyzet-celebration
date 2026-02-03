# Email templates

HTML templates for auth and transactional emails, styled to match the GiftyZel app UI.

## Sending via Resend only (recommended)

Auth emails (signup confirm, etc.) are sent **only by Resend** via the **Send Email Hook**:

1. Supabase calls the Edge Function `supabase/functions/send-auth-email` when it needs to send an auth email.
2. The Edge Function builds the confirmation URL and sends the email using **Resend’s API** (no Supabase SMTP).
3. The function uses a built-in GiftyZel-styled HTML template (same look as `templates/confirm-signup.html`).

See **RESEND_EMAIL_SETUP.md** in the project root for: deploying the Edge Function, setting secrets, and enabling the Send Email Hook in Supabase.

## Templates (reference / SMTP)

| File | Use |
|------|-----|
| `templates/confirm-signup.html` | Reference template (Supabase Go variables). Used by the Edge Function logic; for Supabase SMTP you can paste this into Auth → Email Templates. |

## Alternative: Resend as Supabase SMTP

If you use Supabase’s built-in email sending with Resend SMTP, paste `templates/confirm-signup.html` into Supabase Auth → Email Templates. See **RESEND_EMAIL_SETUP.md** (Alternative section).
