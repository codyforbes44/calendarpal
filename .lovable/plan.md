
# Stripe Integration Production Readiness Review

## Current State Assessment

### What's Working Well

1. **Core Stripe Functions Exist**
   - `create-checkout` - Creates subscription checkout sessions
   - `check-subscription` - Verifies subscription status
   - `customer-portal` - Opens Stripe billing portal
   - `list-invoices` - Lists customer invoices
   - `delete-account` - Cancels subscriptions on account deletion

2. **Price IDs Verified**
   - Monthly: `price_1ScPcF2MfT7OzvjxyRfD7Gms` ($8/month) - Exists in Stripe
   - Yearly: `price_1ScPcK2MfT7OzvjxvViGFdv8` ($7/month) - Exists in Stripe
   - Both linked to correct CalendarPal Pro products

3. **STRIPE_SECRET_KEY** is properly configured as a secret

4. **Frontend Integration**
   - `useSubscription` hook with React Query caching
   - Pricing page with checkout flow
   - Subscription management page with invoices
   - Pro badge display in navigation

---

## Critical Issues Found

### Issue 1: Inconsistent Stripe API Versions
| Function | Current Version | Latest Stable |
|----------|----------------|---------------|
| create-checkout | `2023-10-16` | `2025-08-27.basil` |
| check-subscription | `2023-10-16` | `2025-08-27.basil` |
| customer-portal | `2023-10-16` | `2025-08-27.basil` |
| list-invoices | `2025-08-27.basil` | Current |
| delete-account | `2025-08-27.basil` | Current |

This inconsistency can cause unexpected behavior and should be standardized.

### Issue 2: Incomplete CORS Headers
Current CORS headers are missing required Supabase client headers:
```javascript
// Current (incomplete)
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"

// Required (complete)
"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version"
```

### Issue 3: Outdated Stripe SDK Versions
Some edge functions use `stripe@14.21.0` while others use `stripe@18.5.0`. Should standardize to latest.

### Issue 4: Missing Error Handling in Frontend
The `useSubscriptionActions` hook doesn't refresh subscription status after successful checkout. Users must manually refresh to see their Pro status.

### Issue 5: Checkout Opens in New Tab
Current behavior opens checkout in `window.location.href` (same tab in Pricing.tsx) but the hook uses `window.open(data.url, "_blank")` (new tab). This is inconsistent.

### Issue 6: No Trial Period Configured
The Stripe prices have `trial_period_days: null`. While the UI says "Start Free Trial", there's no actual trial period configured in Stripe.

### Issue 7: Yearly Price Interval Incorrect
The yearly price (`price_1ScPcK2MfT7OzvjxvViGFdv8`) has `interval: "month"` instead of `interval: "year"`. This means customers are charged $7/month (not $7/month billed yearly = $84/year).

### Issue 8: Missing Subscription Status Refresh Post-Checkout
When user returns from checkout, the subscription status should be automatically refreshed.

### Issue 9: UpgradePrompt Uses Wrong Field
The `UpgradePrompt` component uses `profile.subscription_plan` from the database instead of the `useSubscription` hook that checks Stripe directly. These can get out of sync.

---

## Refactoring Plan

### Phase 1: Fix Stripe Prices (Requires Manual Stripe Action)

The yearly price needs to be updated in Stripe to bill annually. Either:
- Update existing price to `interval: "year"` with amount 8400 ($84)
- Or create a new yearly price with correct configuration

### Phase 2: Standardize Edge Functions

Update all Stripe edge functions to use:
- Latest Stripe SDK: `stripe@18.5.0`
- Latest API version: `2025-08-27.basil`
- Complete CORS headers with all Supabase client headers

**Files to update:**
- `supabase/functions/create-checkout/index.ts`
- `supabase/functions/check-subscription/index.ts`
- `supabase/functions/customer-portal/index.ts`

### Phase 3: Improve Frontend Integration

1. **Update `useSubscription` hook** to auto-refresh on page focus and after checkout
2. **Update `Pricing.tsx`** to refresh subscription after checkout success
3. **Update `UpgradePrompt`** to use `useSubscription` hook instead of database field

### Phase 4: Add Checkout Success Handling

Improve the Dashboard checkout success flow:
- Automatically trigger subscription refresh
- Show a more prominent success message
- Invalidate subscription cache

---

## Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/create-checkout/index.ts` | Update Stripe SDK, API version, CORS headers |
| `supabase/functions/check-subscription/index.ts` | Update Stripe SDK, API version, CORS headers |
| `supabase/functions/customer-portal/index.ts` | Update Stripe SDK, API version, CORS headers |
| `src/hooks/useSubscription.ts` | Add auto-refresh, improve cache invalidation |
| `src/components/dashboard/UpgradePrompt.tsx` | Use `useSubscription` instead of database query |
| `src/pages/Dashboard.tsx` | Trigger subscription refresh on checkout success |

---

## Technical Implementation Details

### Edge Function Updates

All three outdated edge functions will be updated with:

```typescript
// Updated imports
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

// Complete CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Latest API version
const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
```

### useSubscription Hook Improvements

```typescript
// Add window focus refetch
refetchOnWindowFocus: true,

// Add refetch after checkout
const refreshSubscription = async () => {
  await queryClient.invalidateQueries({ queryKey: subscriptionKeys.status });
  return queryClient.refetchQueries({ queryKey: subscriptionKeys.status });
};
```

### UpgradePrompt Fix

Replace database query with `useSubscription` hook:

```typescript
const { isPro, isLoading } = useSubscription();

// Remove subscription_plan database query
// Use isPro directly for conditional rendering
```

---

## Verification Checklist

After implementation, verify:
- [ ] Checkout creates subscription successfully
- [ ] Subscription status updates immediately after checkout
- [ ] Pro badge appears in navigation after subscription
- [ ] Customer portal opens and allows subscription management
- [ ] Invoice list displays correctly
- [ ] Account deletion cancels Stripe subscription
- [ ] UpgradePrompt hides for Pro users
- [ ] All edge functions respond correctly without CORS errors
