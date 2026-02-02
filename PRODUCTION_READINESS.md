# Production Readiness & Security Checklist

This document covers security and production readiness for **payments, Stripe Connect, and payouts**. Use it before going live.

---

## What is already in place

### Authorization

| Area | Status |
|------|--------|
| **Admin APIs** (payouts, process-payouts, commission, plugin-queries, etc.) | Require `role === 'admin'` via Bearer token; return 401 otherwise. |
| **Vendor Connect APIs** (onboard, complete, disconnect, dashboard-link) | Require `role === 'vendor'` and **store ownership** (vendor_id matches auth user). |
| **RLS** | `vendor_orders`, `vendor_payouts`, `stores`, `platform_settings` have RLS policies; admin/vendor access is scoped. |

### Payout safety

| Item | Status |
|------|--------|
| **Idempotency** | `process-payouts` uses Stripe `idempotencyKey: payout_vendor_order_${vo.id}` so the same vendor order cannot be transferred twice even if admin retries or the request is duplicated. |
| **Eligibility** | Only `status = 'delivered'` and `payout_status IN ('pending', 'failed')` are processed; paid rows are excluded. |
| **Capability check** | Before transfer, the app checks that the connected account has `transfers === 'active'`; otherwise marks failed and returns a clear message. |
| **Errors** | Stripe errors are caught; failed payouts are marked `payout_status = 'failed'` and reported in the response; admin can retry. |

### Stripe Connect

| Item | Status |
|------|--------|
| **Store ownership** | Onboard, complete, disconnect, dashboard-link all verify that the store belongs to the authenticated vendor. |
| **Secrets** | Stripe secret key is read from `process.env.STRIPE_SECRET_KEY` (never in client code). |
| **Return URLs** | Onboard uses `origin` from request header or `NEXT_PUBLIC_SITE_URL`; set production URL in env. |

### Checkout

| Item | Status |
|------|--------|
| **Payment** | Checkout uses Stripe Checkout (hosted); card data never touches your server. |
| **Metadata** | Order ID and basic order type/sender info stored in session metadata for verification. |

---

## Before going to production: required

### 1. Environment variables

Set these in your production environment (e.g. Vercel / hosting env):

| Variable | Purpose |
|----------|---------|
| `STRIPE_SECRET_KEY` | **Live** key (`sk_live_...`) for production. Never use test key in prod. |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | **Live** publishable key (`pk_live_...`) for Stripe.js/Checkout. |
| `NEXT_PUBLIC_SITE_URL` | Full production URL (e.g. `https://yourdomain.com`) so Stripe Connect return/refresh URLs and checkout redirects are correct. |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key. |

Optional but recommended:

- `SUPABASE_SERVICE_ROLE_KEY` – if you add server-side order validation in create-checkout-session (see below).

### 2. Stripe live mode

- In Stripe Dashboard, switch to **Live** mode.
- Use **live** API keys; complete Stripe Connect onboarding (e.g. identity, bank) for your platform account if required.
- Ensure vendors complete **live** Connect onboarding (real bank details for real payouts).

### 3. Platform Stripe balance

- Checkout sends **all** payment to the **platform** Stripe account.
- Payouts use `stripe.transfers.create` from the platform balance to each vendor’s connected account.
- Ensure the platform balance is sufficient when admin runs “Pay selected” (e.g. don’t auto-payout the full platform balance to your own bank before paying vendors).

---

## Recommended hardening

### 1. Validate order in create-checkout-session (recommended)

**Risk:** A client could call create-checkout-session with an arbitrary `orderId`. If not validated, someone could pay and then have your success flow mark a different order as paid.

**Mitigation:** In `app/api/create-checkout-session/route.ts`, before creating the Stripe session:

- Ensure `orderId` is a valid UUID.
- (If you add `SUPABASE_SERVICE_ROLE_KEY`) Load the order from the database and verify:
  - Order exists.
  - `status` is still `pending` (or similar) and `payment_status === 'pending'`.
  - Optionally: total matches the items you’re charging (to prevent amount tampering).

If you don’t use the service role key, the server cannot read arbitrary orders due to RLS; in that case, at least validate that `orderId` is a UUID and document the limitation.

### 2. Stripe secret key at startup

In `lib/stripe/config.ts`, the Stripe client is created with `process.env.STRIPE_SECRET_KEY || ''`. If the key is missing, Stripe API calls will fail at runtime.

**Optional:** Add a runtime check in a critical path (e.g. when creating checkout or processing payouts) and return a clear error if `!process.env.STRIPE_SECRET_KEY` in production.

### 3. Rate limiting and abuse

- Consider rate limiting on:
  - `POST /api/create-checkout-session`
  - `POST /api/admin/process-payouts`
- Protect admin and vendor routes (already require auth; ensure tokens are validated and not guessable).

### 4. Logging and monitoring

- Log payout processing results (counts, errors) for auditing.
- Monitor Stripe Dashboard for failed transfers and Connect account issues.
- Optionally log Stripe webhook events if you add webhooks later (e.g. for payment confirmation).

### 5. HTTPS and cookies

- Ensure the production site is served over **HTTPS** only.
- If you use cookies for session/tokens, set `Secure` and `SameSite` appropriately.

---

## Security summary

| Topic | Status / action |
|-------|-----------------|
| Admin-only payout APIs | Enforced (Bearer + role check). |
| Vendor-only Connect APIs + store ownership | Enforced. |
| Double payout (same vendor order) | Prevented by Stripe idempotency key on transfers. |
| Stripe keys | Server-side only; use live keys in production. |
| Order validation at checkout | Recommended (order exists, pending); optional service role. |
| RLS | Enabled on payout and Connect-related data; scope admin/vendor correctly. |
| Production env | Set `STRIPE_*`, `NEXT_PUBLIC_SITE_URL`, Supabase keys; use live Stripe mode. |

---

## Is it “100% secure”?

No system is “100% secure.” This setup is **production-ready** in the sense that:

- Critical paths (payouts, Connect, admin/vendor access) are **authorized and guarded**.
- **Double payouts** for the same vendor order are prevented by **Stripe idempotency**.
- **Secrets** are not exposed to the client; **Stripe Checkout** keeps card data off your server.

To be **production-ready in practice**:

1. Use **live** Stripe keys and **production** env vars.
2. Ensure **NEXT_PUBLIC_SITE_URL** is set for Connect and checkout redirects.
3. Add **order validation** in create-checkout-session (recommended).
4. Harden **rate limiting**, **logging**, and **HTTPS** as above.

After that, the payment and payout flow is in a good state for production use; continue to monitor Stripe and your logs and apply security updates as needed.
