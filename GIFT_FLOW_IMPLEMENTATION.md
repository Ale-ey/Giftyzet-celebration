# Gift Flow Implementation

## Overview
This document describes the new gift ordering flow with the "Gift to Myself" checkbox feature.

## Features Implemented

### 1. Gift to Myself Checkbox ✅
- Added prominent checkbox in the order confirmation modal
- Checkbox is checked by default (order for self)
- When unchecked, order becomes a gift order
- Dynamic UI that shows/hides receiver fields based on checkbox state

### 2. Order Types

#### Self Order (Checkbox Checked)
- Order is for the person placing the order
- Uses sender's address for delivery
- No receiver information needed
- Payment processed immediately
- Order delivered to sender's address

#### Gift Order (Checkbox Unchecked)
- Order is being sent as a gift
- Requires receiver's basic information (name, email, phone)
- Receiver's address is **optional** at checkout
  - **If provided**: Order proceeds directly with that address
  - **If not provided**: Gift link is generated for receiver to confirm address
- After payment, a unique gift link is generated (if address not provided)
- Sender shares the link with the receiver
- Receiver confirms their address via the link
- Order is then processed for delivery

### 3. Enhanced Gift Receiver Page ✅

The gift receiver page now includes:

#### Sender Information Section
- Shows sender's name
- Shows sender's email (if available)
- Shows sender's phone (if available)
- Displayed in a highlighted blue card for visibility

#### Gift Details Section
- Shows all items in the gift
- Shows quantities and prices
- Shows total amount

#### Receiver Actions
- **Confirm & Accept**: Receiver fills their address and accepts the gift
- **Reject Gift**: Receiver can decline the gift (with confirmation prompt)

#### Status Pages
- **Accepted**: Green success page with confirmation message
- **Rejected**: Red rejection page with notification message

## User Flow

### For Self Orders

1. User adds items to cart
2. User clicks "Proceed to Checkout"
3. Modal opens with "Gift to Myself" checkbox **checked**
4. User fills/confirms their contact details
5. User clicks "Proceed to Payment"
6. Redirected to Stripe Checkout
7. After payment, redirected to success page
8. Order is processed for delivery to user's address

### For Gift Orders

1. User adds items to cart
2. User clicks "Proceed to Checkout"
3. Modal opens with "Gift to Myself" checkbox **checked**
4. User **unchecks** "Gift to Myself" checkbox
5. Receiver information fields appear
6. User fills in:
   - Their own contact details (sender)
   - Receiver's name, email, and phone
   - **No address required from receiver yet**
7. User clicks "Proceed to Payment"
8. Redirected to Stripe Checkout
9. After payment, redirected to success page with gift link
10. User shares the gift link with receiver
11. Receiver opens link and sees:
    - Sender's information
    - Gift details
    - Form to enter their delivery address
12. Receiver can either:
    - **Accept**: Fill address and confirm
    - **Reject**: Decline the gift
13. If accepted, order is processed for delivery
14. If rejected, sender is notified

## UI Components

### Order Confirmation Modal

#### Checkbox Section
```
┌─────────────────────────────────────────────┐
│ ☑ This order is for myself                  │
│ The order will be delivered to your address │
└─────────────────────────────────────────────┘
```

When unchecked:
```
┌─────────────────────────────────────────────┐
│ ☐ This order is for myself                  │
│ You're sending this as a gift - the receiver│
│ will confirm their address via a link       │
└─────────────────────────────────────────────┘
```

#### Receiver Information Section (Only visible when checkbox unchecked)
```
┌─────────────────────────────────────────────┐
│ 🎁 Receiver Information                     │
│ ℹ️ You can optionally provide the receiver's│
│    address now, or they can fill it later   │
│    via a gift link you'll receive after     │
│    payment.                                 │
│                                             │
│ Receiver Name: [____________] *             │
│ Receiver Email: [____________] *            │
│ Receiver Phone: [____________] *            │
│ Receiver Address: [____________] (Optional) │
│                   [____________]            │
│ If left blank, receiver will be sent a link │
│ to provide their address after payment.     │
└─────────────────────────────────────────────┘
```

### Gift Receiver Page

#### Layout
```
┌─────────────────────────────────────────────┐
│           🎁 You Received a Gift!           │
│    [Sender Name] has sent you a gift        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 👤 Sender Information                       │
│ Name: John Doe                              │
│ Email: john@example.com                     │
│ Phone: +1234567890                          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🎁 Gift Details                             │
│ Product 1 x2     $50.00                     │
│ Product 2 x1     $25.00                     │
│ ─────────────────────────────                │
│ Total:           $75.00                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 👤 Your Information                         │
│ Name: [Pre-filled]                          │
│ Email: [Pre-filled]                         │
│ Phone: [Pre-filled]                         │
│ Address: [________________]                 │
│                                             │
│ [✓ Confirm & Accept] [✗ Reject Gift]       │
└─────────────────────────────────────────────┘
```

## API Integration

### Order Creation
When creating an order, the `orderType` field is set based on the checkbox:
- `orderType: "self"` - When checkbox is checked
- `orderType: "gift"` - When checkbox is unchecked

### Gift Token
For gift orders:
- A unique gift token is generated
- Token is used to create a shareable link
- Link format: `https://yourdomain.com/gift-receiver/{token}`
- Token is stored with the order in the database

### Gift Confirmation
When receiver confirms:
- Address is saved to the order
- Order status is updated to "confirmed"
- Sender can be notified (optional)

When receiver rejects:
- Order status is updated to "rejected"
- Sender is notified
- Refund process can be initiated (optional)

## Database Schema

### Orders Table
```sql
orders {
  id: uuid
  order_type: enum ('self', 'gift')
  sender_name: string
  sender_email: string
  sender_phone: string
  sender_address: string
  receiver_name: string (nullable for self orders)
  receiver_email: string (nullable for self orders)
  receiver_phone: string (nullable for self orders)
  receiver_address: string (nullable until confirmed)
  gift_token: string (nullable, only for gift orders)
  status: enum ('pending', 'confirmed', 'rejected', 'delivered')
  ...
}
```

## Validation Rules

### Self Orders
- Sender name, email, phone, address: **Required**
- Receiver fields: **Not required**

### Gift Orders
- Sender name, email, phone, address: **Required**
- Receiver name, email, phone: **Required**
- Receiver address: **Optional**
  - If provided: Used for direct delivery
  - If not provided: Receiver confirms via gift link

## Error Handling

### Validation Errors
- Toast notifications for missing required fields
- Inline validation for email format
- Phone number format validation

### Gift Link Errors
- Invalid token: "Gift not found" page
- Expired token: "Gift link has expired" message
- Already confirmed: Show confirmation status

## Security Considerations

1. **Gift Token**: 
   - Generated using secure random string
   - Unique per order
   - Cannot be guessed or enumerated

2. **Access Control**:
   - Gift link is the only way to access gift details
   - No authentication required for receiver
   - Token-based access only

3. **Data Privacy**:
   - Sender's full address is NOT shown to receiver
   - Only name, email, and phone are visible
   - Receiver's address is only visible after confirmation

## Testing Checklist

### Self Order Flow
- [ ] Checkbox is checked by default
- [ ] Receiver fields are hidden
- [ ] Can fill sender details
- [ ] Auto-fill works when logged in
- [ ] Can proceed to payment
- [ ] Payment processes successfully
- [ ] Order is created with type "self"
- [ ] No gift link is generated

### Gift Order Flow
- [ ] Can uncheck "Gift to Myself" checkbox
- [ ] Receiver fields appear when unchecked
- [ ] Info message about gift link is visible
- [ ] Can fill both sender and receiver details
- [ ] Validation works for all required fields
- [ ] Can proceed to payment
- [ ] Payment processes successfully
- [ ] Order is created with type "gift"
- [ ] Gift link is generated
- [ ] Gift link is displayed on success page

### Gift Receiver Experience
- [ ] Can open gift link
- [ ] Sender information is displayed
- [ ] Gift details are shown correctly
- [ ] Can fill delivery address
- [ ] Can accept gift
- [ ] Can reject gift
- [ ] Confirmation page shows after accept
- [ ] Rejection page shows after reject
- [ ] Toast notifications work correctly

## Future Enhancements

### Potential Features
1. **Email Notifications**:
   - Send gift link via email automatically
   - Notify sender when gift is accepted/rejected
   - Reminder emails for pending gifts

2. **Gift Messages**:
   - Allow sender to add a personal message
   - Display message on gift receiver page

3. **Gift Wrapping Options**:
   - Special packaging for gifts
   - Gift cards and notes

4. **Multiple Recipients**:
   - Send same gift to multiple people
   - Bulk gift sending

5. **Scheduled Delivery**:
   - Choose specific delivery date
   - Birthday/anniversary scheduling

6. **Gift Tracking**:
   - Track gift status
   - Delivery updates
   - Receiver confirmation status

7. **Gift Registry**:
   - Create wish lists
   - Share registry links
   - Track fulfilled items

## Support

For issues or questions:
1. Check validation messages in the UI
2. Review browser console for errors
3. Check order status in database
4. Verify gift token is valid
5. Test with different scenarios

## Files Modified

### Modified Files:
- `components/checkout/OrderConfirmationModal.tsx` - Added checkbox and conditional fields
- `app/checkout/page.tsx` - Updated to handle dynamic order type
- `app/gift-receiver/[token]/page.tsx` - Enhanced with sender details and reject option

### Key Changes:
1. Added `isGiftToMyself` state to control checkbox
2. Dynamic `orderType` based on checkbox state
3. Conditional rendering of receiver fields
4. Enhanced gift receiver page layout
5. Added reject functionality
6. Improved UI/UX with better messaging
7. Added toast notifications throughout

## Summary

The new gift flow provides a seamless experience for both senders and receivers:

✅ **For Senders**:
- Simple checkbox to switch between self and gift orders
- Clear indication of what information is needed
- No need to know receiver's address upfront
- Easy sharing of gift link

✅ **For Receivers**:
- Can see who sent the gift
- Can view gift details before accepting
- Can provide their own delivery address
- Can reject unwanted gifts

✅ **For the Platform**:
- Flexible order types
- Better user experience
- Reduced friction in gift giving
- Privacy-conscious design
