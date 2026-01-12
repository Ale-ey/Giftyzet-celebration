# Gift Link Delivery Setup Guide 📧📱🔗

## Environment Variables Required

Add these environment variables to your `.env.local` file:

### Resend (Email Service)

```env
# Resend API Key (Get from https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# From Email Address (Must be verified in Resend)
RESEND_FROM_EMAIL=gifts@yourdomain.com
```

**Setup Steps:**
1. Sign up at https://resend.com
2. Verify your domain or use their test domain
3. Create an API key
4. Add the API key to `.env.local`

### Twilio (SMS Service)

```env
# Twilio Account SID (Get from https://console.twilio.com)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio Auth Token
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Twilio Phone Number (Must be purchased from Twilio)
TWILIO_PHONE_NUMBER=+1234567890
```

**Setup Steps:**
1. Sign up at https://www.twilio.com
2. Get your Account SID and Auth Token from the console
3. Purchase a phone number with SMS capabilities
4. Add credentials to `.env.local`

---

## Complete `.env.local` Example

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
STRIPE_SECRET_KEY=sk_test_xxxxx

# Resend (Email)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=gifts@yourdomain.com

# Twilio (SMS)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## Testing

### Test Email Delivery:
```bash
curl -X POST http://localhost:3000/api/send-gift-link \
  -H "Content-Type: application/json" \
  -d '{
    "method": "email",
    "receiverName": "John Doe",
    "receiverEmail": "john@example.com",
    "senderName": "Jane Smith",
    "giftLink": "https://yourdomain.com/gift-receiver/test-token"
  }'
```

### Test SMS Delivery:
```bash
curl -X POST http://localhost:3000/api/send-gift-link \
  -H "Content-Type: application/json" \
  -d '{
    "method": "sms",
    "receiverName": "John Doe",
    "receiverPhone": "+1234567890",
    "senderName": "Jane Smith",
    "giftLink": "https://yourdomain.com/gift-receiver/test-token"
  }'
```

---

## Cost Estimates

### Resend Pricing:
- **Free Tier**: 3,000 emails/month
- **Pro Plan**: $20/month for 50,000 emails
- **Perfect for**: Most small to medium businesses

### Twilio Pricing:
- **SMS**: ~$0.0075 per message (varies by country)
- **Phone Number**: ~$1/month
- **Perfect for**: High-value gift orders

---

## Troubleshooting

### Email Not Sending:
1. Check RESEND_API_KEY is correct
2. Verify your domain in Resend dashboard
3. Check spam folder
4. Review Resend logs at https://resend.com/logs

### SMS Not Sending:
1. Check TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN
2. Verify phone number format (+1234567890)
3. Check Twilio balance
4. Review Twilio logs in console

### Copy Link Option:
- No configuration needed
- Works immediately
- User copies link manually

---

## Security Notes

⚠️ **Never commit `.env.local` to git**
✅ Add `.env.local` to `.gitignore`
✅ Use different API keys for development and production
✅ Rotate API keys regularly
✅ Monitor usage to detect anomalies

---

## Production Deployment

### Vercel:
1. Go to Project Settings → Environment Variables
2. Add all environment variables
3. Redeploy

### Other Platforms:
Add environment variables through your platform's dashboard or CLI.

---

## Support

- **Resend Docs**: https://resend.com/docs
- **Twilio Docs**: https://www.twilio.com/docs
- **Resend Support**: support@resend.com
- **Twilio Support**: https://support.twilio.com
