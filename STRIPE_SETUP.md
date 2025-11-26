# Stripe Payment Integration Setup

## ✅ What's Already Done

The Stripe integration has been implemented with the following:

1. **Edge Functions Created:**
   - `create-checkout` - Initiates subscription checkout sessions
   - `check-subscription` - Verifies and syncs subscription status
   - `customer-portal` - Manages subscription billing portal

2. **Frontend Integration:**
   - Subscription hook (`useSubscription`) for managing checkout flow
   - Updated UI components (UpgradeModal, TrialBanner, Settings, PremiumFeatures)
   - Automatic subscription status checking every minute
   - Stripe Customer Portal integration for billing management

3. **Database Integration:**
   - Automatic sync of subscription status to `profiles` table
   - Updates `subscription_status` and `is_premium` fields based on Stripe data

## 🚀 Required Setup Steps

### Step 1: Create Stripe Product and Price

1. Go to your [Stripe Dashboard Products page](https://dashboard.stripe.com/products)
2. Click **Create product**
3. Fill in the details:
   - **Name:** Premium Subscription
   - **Description:** Unlock unlimited house rules, multiple tournaments, voice AI, and more premium features
   - **Pricing Model:** Recurring
   - **Price:** $9.99 USD
   - **Billing Period:** Monthly
4. Click **Save product**
5. **Copy the Price ID** (it looks like `price_abc123xyz`)

### Step 2: Update Edge Function with Price ID

Open `supabase/functions/create-checkout/index.ts` and replace:

```typescript
// TODO: Replace with your actual price ID from Stripe dashboard
const priceId = "price_REPLACE_WITH_YOUR_PRICE_ID";
```

With your actual price ID:

```typescript
const priceId = "price_abc123xyz"; // Your actual price ID
```

### Step 3: Configure Stripe Customer Portal

The billing portal allows customers to manage their subscriptions, update payment methods, and view invoices.

1. Go to [Stripe Customer Portal Settings](https://dashboard.stripe.com/settings/billing/portal)
2. Click **Activate customer portal**
3. Configure the following settings:
   - **Allow customers to:** ✅ Cancel subscriptions, Update payment methods, View billing history
   - **Business information:** Add your business name and support email
   - **Link color:** #F5A623 (matches your app's primary color)
4. Click **Save**

### Step 4: Test the Integration

**Test Mode (Recommended First):**

1. Make sure you're in **Test Mode** in Stripe Dashboard (toggle in top-left)
2. Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - ZIP: Any 5 digits
3. Test the flow:
   - Click "Upgrade Now" in the app
   - Complete checkout with test card
   - Wait 10-60 seconds for status to sync
   - Verify premium status updates in Settings
   - Test "Manage Billing" button
   - Test subscription cancellation in portal

**Live Mode:**

1. Switch to **Live Mode** in Stripe Dashboard
2. Update your Price ID in the edge function if different from test
3. Test with a real card (small amount)
4. Verify the complete flow works

### Step 5: Optional - Set Up Stripe Webhooks (Advanced)

While the current implementation uses polling (checking subscription status every minute), you can optionally set up webhooks for instant updates:

1. Go to [Stripe Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://[YOUR_PROJECT_ID].supabase.co/functions/v1/stripe-webhook`
4. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`

Note: Webhook implementation requires creating a new edge function. The current polling approach works well for most use cases.

## 🔍 Troubleshooting

### Subscription Status Not Updating

1. Check browser console for errors
2. Check Supabase Edge Function logs:
   - Go to Cloud tab → Functions
   - Click on `check-subscription`
   - View recent logs
3. Verify Stripe test card was successful in Stripe Dashboard
4. Click the refresh button in Settings to manually trigger a check

### Checkout Not Opening

1. Verify the Price ID is correct in `create-checkout/index.ts`
2. Check browser console for errors
3. Check Edge Function logs for `create-checkout`
4. Verify Stripe Secret Key is properly configured

### Customer Portal Not Working

1. Verify Customer Portal is activated in Stripe Dashboard
2. Check Edge Function logs for `customer-portal`
3. Ensure the user has a Stripe customer ID (check after first checkout)

## 📝 Next Steps

1. Complete the setup steps above
2. Test thoroughly in Test Mode
3. Set up billing alerts in Stripe Dashboard
4. Configure email receipts and invoices in Stripe
5. Add your business information to Stripe account
6. Enable live mode when ready

## 🔗 Useful Links

- [Stripe Dashboard](https://dashboard.stripe.com/)
- [Stripe Customer Portal Docs](https://docs.stripe.com/customer-management/activate-no-code-customer-portal)
- [Stripe Testing Guide](https://docs.stripe.com/testing)
- [Supabase Functions Logs](https://supabase.com/dashboard/project/_/functions)
