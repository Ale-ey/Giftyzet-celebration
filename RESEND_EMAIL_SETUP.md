# Send confirmation emails through Resend only (no Supabase SMTP)

Auth emails (signup confirm, password reset, etc.) are sent **only by Resend** via the Resend API. Supabase does not send the email; it calls a **Send Email Hook** (Edge Function), and that function sends the email with Resend.

## Flow

1. User signs up in your app → Supabase Auth creates the user and needs to send a confirmation email.
2. Supabase calls your **Send Email Hook** (Edge Function) with the user email and token.
3. The Edge Function builds the confirmation URL and sends the email using **Resend’s API** (no Supabase SMTP).
4. User clicks the link → Supabase verifies the token and redirects to your app.

---

## 1. Resend setup

1. Sign up at [resend.com](https://resend.com) and log in.
2. **API key**  
   - Go to **API Keys** → Create API Key.  
   - Copy the key (starts with `re_`). You’ll set it as an Edge Function secret.
3. **Sender address**  
   - **Production:** Domains → Add your domain → add DNS records → send from e.g. `noreply@yourdomain.com`.  
   - **Testing:** You can use `onboarding@resend.dev` (no domain verification).

---

## 2. Deploy the Send Email Hook (Edge Function)

The repo includes a Supabase Edge Function that receives the auth email payload and sends it via Resend.

1. **Install Supabase CLI** (if needed):
   ```bash
   npm install -g supabase
   ```
2. **Log in and link the project**:
   ```bash
   supabase login
   supabase link --project-ref YOUR_PROJECT_REF
   ```
   (`YOUR_PROJECT_REF` is in your project URL, e.g. `xwhemtsztjcjvecpcjpy`.)

3. **Set Edge Function secrets** (Dashboard or CLI):
   - **RESEND_API_KEY** – Your Resend API key.
   - **SUPABASE_URL** – Your Supabase project URL, e.g. `https://xwhemtsztjcjvecpcjpy.supabase.co`.
   - **RESEND_FROM_EMAIL** – Sender email (e.g. `noreply@yourdomain.com` or `onboarding@resend.dev`).
   - **RESEND_FROM_NAME** – Sender name (e.g. `GiftyZel`).

   With CLI:
   ```bash
   supabase secrets set RESEND_API_KEY=re_xxxx
   supabase secrets set SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   supabase secrets set RESEND_FROM_EMAIL=onboarding@resend.dev
   supabase secrets set RESEND_FROM_NAME=GiftyZel
   ```

4. **Deploy the function**:
   ```bash
   supabase functions deploy send-auth-email
   ```

5. **Note the function URL** (shown after deploy), e.g.:
   `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-auth-email`

---

## 3. Enable the Send Email Hook in Supabase

1. Open **Supabase Dashboard** → your project → **Authentication** → **Hooks**.
2. Find **Send Email Hook** (or **Customize email**).
3. **Enable** the hook and set the URL to your Edge Function:
   ```text
   https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-auth-email
   ```
4. Save.

After this, Supabase will **not** send auth emails itself. It will only call your Edge Function; your function sends the email via Resend.

---

## 4. Check that it works

1. **Site URL** and **Redirect URLs** in Supabase (Auth → URL Configuration) must include your app and callback, e.g.:
   - Site URL: `https://giftyzet-celebration.vercel.app`
   - Redirect URLs: `https://giftyzet-celebration.vercel.app/auth/callback`, `http://localhost:3000/auth/callback`
2. Sign up with a new email.
3. Check inbox (and spam) for the confirmation email **from your Resend sender** (e.g. GiftyZel / onboarding@resend.dev).
4. Click “Confirm email”; you should land on your app and be signed in.

---

## Template (GiftyZel UI)

The Edge Function uses a built-in HTML template that matches the app:

- Primary red `#dc2626`, white card, logo from your **Site URL** (`{{ .SiteURL }}/logo.png`).
- “Confirm your email” heading and “Confirm email” button.
- Same layout for signup and recovery; subject line varies (e.g. “Confirm your GiftyZel account”, “Reset your GiftyZel password”).

The source template for reference (Supabase SMTP / manual use) is in `lib/emails/templates/confirm-signup.html`.

---

## Troubleshooting

- **Emails not received**  
  Check Resend dashboard (Logs) for bounces or errors. For custom domains, ensure DNS is verified.

- **“Could not complete sign in” after clicking the link**  
  See `EMAIL_CONFIRMATION_FIX.md`: add your callback URL to Supabase **Redirect URLs** and set **Site URL** correctly.

- **Hook not called / emails still from Supabase**  
  Ensure the Send Email Hook is enabled and the URL is exactly your deployed Edge Function URL. Check Edge Function logs in Supabase Dashboard → Edge Functions → send-auth-email → Logs.

- **429 Too Many Requests on signup**  
  That’s Supabase Auth rate limiting, not Resend. Wait and retry; optionally increase limits under Authentication → Rate Limits. See the 429 section below.

---

## 429 Too Many Requests on signup (Supabase, not Resend)

Signup returns **429** from **Supabase Auth** (rate limit), not from Resend. The request is blocked before any email is sent.

**Do this:**

1. **Wait at least 30–60 minutes** without retrying from the same IP. Supabase limits signups and “email send” attempts per hour (e.g. 2 emails/hour on free tier).
2. **Raise limits in the dashboard:**
   - Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
   - Go to **Authentication** (left sidebar) → **Rate Limits**.
   - Increase **Sign-up / sign-in** rate (e.g. requests per hour per IP) if the option is there, and save.
   - Note: “Email sent” limits (e.g. 2/hour) may still apply; with the Send Email Hook, Supabase still counts the attempt before calling your function.
3. **Do not retry repeatedly** – The app shows: *"Too many signup attempts. Please wait a few minutes and try again."* Each retry can extend the block.
4. **Test from another network** – e.g. phone hotspot or different Wi‑Fi, to confirm it’s IP-based.

---

## Alternative: Resend as Supabase SMTP

If you prefer not to use the Send Email Hook, you can still use Resend only for delivery by configuring Supabase to send via Resend SMTP:

- **Supabase** → Project Settings → Auth → **SMTP**: enable Custom SMTP, host `smtp.resend.com`, port `465`, username `resend`, password = Resend API key, sender = your Resend address.
- **Supabase** → Authentication → **Email Templates**: paste the HTML from `lib/emails/templates/confirm-signup.html` (with `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`).

In that case Supabase still “sends” the email (builds the link and triggers the send), and Resend delivers it. With the **Send Email Hook** above, only Resend sends the email (via the Edge Function).
