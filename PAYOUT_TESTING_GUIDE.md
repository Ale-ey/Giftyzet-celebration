# Payout Functionality – Testing Guide (Stripe)

This guide explains how to test the full payout flow: **customer pays → platform receives → admin processes payout → vendor receives amount after commission deduction**.

---

## Flow Overview

1. **Customer** pays at checkout → payment goes to the **platform** Stripe account.
2. **Vendor** marks the order as **delivered** → payout becomes **pending** for admin.
3. **Admin** runs **Pay selected** in the Payouts tab → Stripe **transfer** is created from platform to the vendor’s **Stripe Connect** account (after deducting commission).
4. **Vendor** sees the payout under **Vendor Dashboard → Payouts** as **Received**.

---

## Prerequisites

### 1. Stripe test mode

- Use **test** API keys: `pk_test_...` and `sk_test_...` in `.env.local`.
- All steps below use Stripe **test mode** (no real money).

### 2. Platform Stripe account

- **Developers → API keys**: copy **Secret key** (`sk_test_...`).
- Set in `.env.local`: `STRIPE_SECRET_KEY=sk_test_...`.
- Checkout creates a **Checkout Session**; payment is captured to **this** (platform) account.

### 3. Vendor Stripe Connect (Express) account

- Each vendor store must have a **connected** Stripe account to receive payouts.
- **Vendor** flow: **Vendor Dashboard → Store Setup → Connect Stripe account**.
- After onboarding, `stores.stripe_account_id` is set (e.g. `acct_xxx`).
- **Important:** The vendor must **complete the full onboarding flow**, including **adding a bank account**, so Stripe enables the **transfers** capability. Without that, payouts fail with "destination account needs transfers capability". In **test mode**, use Stripe’s test bank details (e.g. routing **110000000**, or follow Stripe’s test prompts).

### 4. Commission setting (admin)

- **Admin Dashboard → Commission / Platform service** (or equivalent).
- Set **commission %** (e.g. 10%).  
- Payout: `vendor_amount = order_total (vendor’s share) - commission`.

---

## Step-by-Step Test

### Step 1: Place an order (customer)

1. Log in as a **customer** (or use guest checkout).
2. Add a **product or service** from a store whose vendor has **already connected Stripe** (Store Setup → Connect Stripe).
3. Go to **Checkout** and complete payment.
4. Use Stripe test card: **4242 4242 4242 4242** (any future expiry, any CVC, any ZIP).
5. After payment, you should land on **Order success** and the order should exist in **My Orders**.

**Check:** In **Stripe Dashboard → Payments** (test mode), you should see a successful payment. Balance for your **platform** account increases.

---

### Step 2: Mark order as delivered (vendor)

1. Log in as the **vendor** who owns the store for that order.
2. Go to **Vendor Dashboard → Orders**.
3. Find the order and set status: **Confirmed → Dispatched → Delivered** (or whatever your UI allows to reach **Delivered**).
4. Ensure the order is **Delivered** and, in the DB, `vendor_orders.delivered_at` is set and `payout_status = 'pending'`.

**Check:** In **Admin Dashboard → Payouts**, the order should appear as a **pending** payout (Order #, Store, Vendor, Order total, Commission, Vendor amount, Delivered).

---

### Step 3: Process payout (admin)

1. Log in as **admin**.
2. Go to **Admin Dashboard → Payouts**.
3. You should see the **pending** payout(s) (delivered orders not yet paid).
4. Select the payout(s) you want to pay (or use **Select all**).
5. Click **Pay selected**.
6. Backend calls `stripe.transfers.create()`:
   - **From:** platform Stripe balance  
   - **To:** `stores.stripe_account_id` (vendor’s Connect account)  
   - **Amount:** `vendor_amount` (order total for that vendor minus commission), in cents  
   - **Currency:** USD  

**Check:**

- **Admin UI:** Success message; the row disappears from pending (or status changes).
- **Stripe Dashboard (platform account):**
  - **Balance → Overview**: balance decreases by the transfer amount.
  - **Connect → Transfers**: you see a transfer to the connected account.
- **Database:**
  - `vendor_orders.payout_status = 'paid'`, `payout_at` set, `stripe_transfer_id` set.
  - New row in `vendor_payouts` (order_id, vendor_id, store_id, order_total, commission_amount, vendor_amount, stripe_transfer_id, paid_at).

---

### Step 4: Vendor sees received payout

1. Log in as the **vendor**.
2. Go to **Vendor Dashboard → Payouts**.
3. **Filter:** **Received** (or **All**).
4. You should see the payout with:
   - Order #, Date (paid_at), Status **Received**, Order total, Commission, **Your amount** (= vendor_amount).

**Check:**

- **Vendor UI:** One table, filter by status; **Received** row shows correct **Your amount** (after commission).
- **Stripe (vendor side):** If the vendor logs into their **Stripe Connect** Express dashboard (link in Stripe’s email or from Connect settings), they see the **transfer** (or resulting balance) in their connected account.

---

## How the vendor withdraws from their Express account (Stripe → bank)

Money from your app’s payouts lands in the vendor’s **Stripe Express balance**. To get that money into their **bank account**, they use Stripe’s Express Dashboard. There is **no manual “withdraw” button** in your app; Stripe pays out to their bank automatically once they’ve added a bank account.

### Step 1: Add (or confirm) bank account

1. Vendor goes to **Stripe Express**:
   - From your app: **Vendor → Store Setup → Open Stripe dashboard**, or  
   - Direct: **https://connect.stripe.com/express_login** (sign in with the email used when connecting Stripe).
2. In the Express Dashboard: open the **Account** tab (or **Settings**).
3. Go to **Payout details** (or **Bank account**).
4. Add a **bank account** (or debit card, if offered):
   - Enter bank details or use Stripe’s verification flow.
   - In **test mode**, use Stripe’s test bank info (e.g. routing **110000000**, test account number).
5. Complete any verification (e.g. SMS code) if Stripe asks.

Without a bank account (or valid payout details), Stripe cannot send the balance to the vendor; the balance stays in Stripe until payout details are set.

### Step 2: Stripe pays out to the bank automatically

- Once a **bank account** is on file, Stripe pays out the **available balance** on a **schedule** (e.g. daily or every 2–3 business days, depending on country and account).
- The vendor does **not** click “Withdraw” in your app; Stripe moves the money from their Express balance to their bank automatically.
- In the Express Dashboard the vendor can:
  - See **Available balance** (what will be paid out).
  - See **Upcoming payouts** (date and amount).
  - See **Payout schedule** (e.g. daily, weekly) under Account / Payout settings.

### Step 3: (Optional) Change payout schedule

- In the Express Dashboard: **Account** (or **Settings**) → **Payout schedule** (or **Payout details**).
- They can often choose **daily** or **weekly** (and sometimes payout day). This only affects *when* Stripe sends the balance to the bank, not whether they get paid.

### Summary

| Step | Action |
|------|--------|
| 1 | Vendor logs into **Stripe Express** (from your app or connect.stripe.com/express_login). |
| 2 | In Express Dashboard: **Account** → **Payout details** → **add/confirm bank account**. |
| 3 | Stripe automatically pays out the **available balance** to that bank on the payout schedule. |
| 4 | (Optional) Vendor can change **payout schedule** (e.g. daily vs weekly) in Express Dashboard. |

No withdrawal action is required in your app; once payout details are set, payouts from your platform (transfers) show up as balance in Express, and Stripe sends that balance to the vendor’s bank on the configured schedule.

---

## Verifying amounts

- **Order total (vendor share):** Sum of line items that belong to that vendor’s store (from `order_items` + products/services store_id).
- **Commission:** `order_total * (commission_percent / 100)`, rounded to 2 decimals.
- **Vendor amount:** `order_total - commission_amount`, rounded to 2 decimals.
- **Stripe transfer:** Exactly `vendor_amount` in **cents** (e.g. $10.50 → 1050 cents).

Example:

- Order total (vendor) = $100.00  
- Commission 10% = $10.00  
- Vendor amount = $90.00 → transfer amount = 9000 cents  

You can verify these in:

- Admin Payouts table (before Pay selected).
- `vendor_payouts` row after payout (order_total, commission_amount, vendor_amount).
- Stripe Dashboard → Connect → Transfers (amount and destination account).

---

## "Destination account needs transfers capability" error

If you see:

```json
"errors": ["Vendor order ...: Your destination account needs to have at least one of the following capabilities enabled: transfers, crypto_transfers, legacy_payments"]
```

**Cause:** The vendor’s Stripe Connect account does not yet have the **transfers** capability **active**. Requesting it at account creation is not enough; Stripe only enables it after the account completes onboarding.

**Fix:**

1. **Vendor** logs in → **Vendor Dashboard → Store Setup**.
2. Click **Connect Stripe account** (or complete the Stripe link again).
3. **Complete the full Stripe Connect onboarding flow** in the Stripe-hosted page:
   - Fill in business/personal details as required.
   - **Add a bank account** (required for the transfers capability to become active).
   - In **test mode**, use Stripe’s test routing number, e.g. **110000000** (US) and a test account number, or follow Stripe’s test data prompts.
4. Finish until Stripe shows completion and redirects back to your app.
5. Retry the payout from **Admin → Payouts → Pay selected**.

The app checks the connected account’s capabilities before transferring; if `transfers` is not active, it returns a clear message instead of the raw Stripe error.

---

## Common issues

| Issue | What to check |
|--------|----------------|
| No pending payouts in Admin | Order must be **delivered** and `payout_status = 'pending'**. |
| “Store has no Stripe account” | Vendor must start **Store Setup → Connect Stripe account** so `stripe_account_id` is set. |
| **“Destination account needs transfers capability”** | Vendor must **complete** Stripe Connect onboarding, including **adding a bank account** (see section above). In test mode use Stripe test bank details. |
| Transfer fails (other Stripe error) | Platform must have enough balance; check **Stripe Dashboard → Balance**. |
| Vendor amount &lt; $0.50 | Payout is marked paid but no Stripe transfer. Use an order with vendor_amount ≥ $0.50. |
| Vendor doesn’t see payout | Ensure migration `20260201_vendor_can_view_own_payouts.sql` is applied; vendor on **Payouts** with filter **Received** or **All**. |

---

## Quick checklist

- [ ] Stripe test keys in `.env.local`.
- [ ] Vendor completed **Connect Stripe** on Store Setup; `stripe_account_id` is set.
- [ ] Customer placed order and paid with test card 4242...; platform received payment.
- [ ] Vendor marked order **Delivered**; pending payout appears in Admin.
- [ ] Admin ran **Pay selected**; no errors; transfer appears in Stripe.
- [ ] Vendor sees payout under **Payouts** with status **Received** and correct **Your amount** (after commission).

If all steps pass, the payout functionality is working end-to-end: payment received by platform → admin runs payout → vendor receives amount after deduction.
