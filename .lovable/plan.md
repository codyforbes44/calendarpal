

# Upgrade Admin to Maximum Platform Capabilities

## Current State
- User `c@3bi.io` (Cody Forbes) has `subscription_plan: 'free'` in the profiles table
- The `useSubscription` hook checks Stripe directly for active subscriptions, so simply updating the profile field won't grant Pro features in the app
- The user already has the `admin` role in `user_roles`

## Approach
Since this is the platform owner/super admin, we need to ensure they get Pro capabilities without requiring an actual Stripe subscription. Two changes are needed:

### 1. Update the profile record
Set `subscription_plan` to `'pro'` in the database so admin dashboards and user management views reflect the correct plan.

### 2. Update the `check-subscription` edge function
Add a check: if the authenticated user has the `admin` role, automatically return `subscribed: true` with Pro status, bypassing the Stripe lookup. This ensures the admin always has full platform access regardless of Stripe subscription state.

## Technical Details

### Database update
```sql
UPDATE profiles SET subscription_plan = 'pro' WHERE email = 'c@3bi.io';
```

### Edge function change (`supabase/functions/check-subscription/index.ts`)
After authenticating the user, check if they have the admin role using the `has_role` database function. If true, return a Pro subscription response immediately without querying Stripe.

```typescript
// After user authentication, before Stripe lookup:
const { data: isAdmin } = await supabaseClient.rpc('has_role', {
  _user_id: user.id,
  _role: 'admin'
});

if (isAdmin) {
  logStep("Admin user detected, granting Pro access", { userId: user.id });
  return new Response(JSON.stringify({
    subscribed: true,
    plan: "pro",
    product_id: null,
    subscription_end: null,
    current_period_start: null,
    cancel_at_period_end: false,
    price_amount: null,
    interval: null
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 200,
  });
}
```

This ensures:
- All admin users automatically get Pro features
- No Stripe subscription is required for admins
- The admin portal stats still show the correct plan
- The approach is secure (server-side role check via RLS-protected `has_role` function)
