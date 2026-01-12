# Stripe Integration Setup Guide

This guide will help you set up Stripe payment integration for GiftyZel.

## Prerequisites

1. A Stripe account (sign up at https://stripe.com)
2. Node.js and npm installed
3. Environment variables configured

## Setup Steps

### 1. Install Dependencies

The required Stripe packages are already installed:
- `@stripe/stripe-js` - Client-side Stripe library
- `stripe` - Server-side Stripe library

### 2. Get Stripe API Keys

1. Log in to your Stripe Dashboard: https://dashboard.stripe.com
2. Navigate to **Developers** → **API Keys**
3. Copy your **Publishable key** (starts with `pk_test_` for test mode)
4. Copy your **Secret key** (starts with `sk_test_` for test mode)

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory and add:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
```

**Important:** Never commit your `.env.local` file to version control!

### 4. Test the Integration

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Add items to your cart
3. Click "Proceed to Checkout"
4. Fill in the contact details (auto-filled if logged in)
5. Click "Proceed to Payment"
6. You'll be redirected to Stripe Checkout

### 5. Test Cards

Use these test card numbers in Stripe's test mode:

- **Success:** `4242 4242 4242 4242`
- **Decline:** `4000 0000 0000 0002`
- **Requires authentication:** `4000 0025 0000 3155`

Use any future expiry date, any 3-digit CVC, and any ZIP code.

## Features Implemented

### ✅ Completed Features

1. **Toast Notifications**: Replaced alert prompts with elegant toast notifications when adding items to cart
2. **Removed Gift All Items**: Removed the "Gift All Items" button from cart and cart drawer
3. **Checkout Modal**: Modal opens when proceeding to checkout
4. **Auto-fill User Details**: If logged in, user contact details are automatically filled
5. **Stripe Integration**: Clean Stripe Checkout integration
6. **Payment Verification**: Payment status is verified after successful payment

### Checkout Flow

1. User adds items to cart (toast notification appears)
2. User clicks "Proceed to Checkout"
3. Modal opens with contact details form
   - Auto-filled if user is logged in
   - Empty fields if user is not logged in
4. User fills/confirms contact details
5. User clicks "Proceed to Payment"
6. Order is created in database
7. User is redirected to Stripe Checkout
8. After payment, user is redirected to success page
9. Payment is verified and order status is updated

## API Endpoints

### `/api/create-checkout-session` (POST)

Creates a Stripe Checkout session.

**Request Body:**
```json
{
  "items": [...],
  "orderData": {...},
  "orderId": "order_id"
}
```

**Response:**
```json
{
  "sessionId": "cs_test_...",
  "url": "https://checkout.stripe.com/..."
}
```

### `/api/verify-payment` (POST)

Verifies payment status after checkout.

**Request Body:**
```json
{
  "sessionId": "cs_test_..."
}
```

**Response:**
```json
{
  "success": true,
  "paymentStatus": "paid",
  "orderId": "order_id"
}
```

## Files Modified/Created

### New Files:
- `lib/stripe/client.ts` - Stripe client configuration
- `lib/stripe/config.ts` - Server-side Stripe configuration
- `app/api/create-checkout-session/route.ts` - Creates Stripe checkout session
- `app/api/verify-payment/route.ts` - Verifies payment status
- `.env.example` - Environment variables template
- `STRIPE_SETUP.md` - This setup guide

### Modified Files:
- `components/product/ProductDetailPage.tsx` - Added toast notification
- `components/service/ServiceDetailPage.tsx` - Added toast notification
- `components/cart/CartPage.tsx` - Removed Gift All Items button
- `components/cart/CartDrawer.tsx` - Removed Gift All Items button
- `components/checkout/OrderConfirmationModal.tsx` - Added auto-fill and Stripe integration
- `app/checkout/page.tsx` - Integrated Stripe checkout flow
- `app/order-success/page.tsx` - Added payment verification
- `package.json` - Added Stripe dependencies

## Going to Production

When ready to go live:

1. Switch to live API keys in Stripe Dashboard
2. Update environment variables with live keys:
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...`
   - `STRIPE_SECRET_KEY=sk_live_...`
3. Test thoroughly with real payment methods
4. Set up Stripe webhooks for production (optional but recommended)

## Troubleshooting

### "Stripe failed to load"
- Check that `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is set correctly
- Ensure the key starts with `pk_test_` or `pk_live_`

### "Failed to create checkout session"
- Check that `STRIPE_SECRET_KEY` is set correctly
- Ensure the key starts with `sk_test_` or `sk_live_`
- Check the browser console and server logs for detailed errors

### Payment not verifying
- Ensure Stripe Checkout session completed successfully
- Check that the session ID is being passed correctly
- Verify API endpoint is accessible

## Support

For Stripe-specific issues, refer to:
- Stripe Documentation: https://stripe.com/docs
- Stripe Support: https://support.stripe.com

For GiftyZel-specific issues, check the application logs or contact support.
