# Environment Variables Setup

Create a `.env.local` file in the root of your project with the following content:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xwhemtsztjcjvecpcjpy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_yt7zbL_XRf2kZftXN8W-0g_eZNIcUCA
```

## Important Notes

1. **Never commit `.env.local` to version control** - It's already in `.gitignore`
2. **Restart your dev server** after creating/updating `.env.local`:
   ```bash
   npm run dev
   ```

## Getting Your Supabase Keys

If you need to get the correct keys from Supabase:

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project: `xwhemtsztjcjvecpcjpy`
3. Go to **Settings** → **API**
4. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Note: The anon key typically starts with `eyJ` (JWT format). If your key starts with `sb_publishable_`, it might be a different type of key. Try using it first, and if you encounter authentication issues, get the anon key from the dashboard.

## Verification

After setting up, verify the connection by checking the browser console when the app loads. You should not see any Supabase connection errors.

