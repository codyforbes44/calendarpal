
## Fix: Update RESEND_FROM_EMAIL Secret

### Root Cause

The `RESEND_FROM_EMAIL` secret stored in the backend is set to `contact@3bi.io` (bare root domain). Resend is rejecting every email with a 403 error because `3bi.io` is not a verified sender domain — only the subdomain `notifications.3bi.io` is verified.

The code already has the correct fallback on line 7 of `send-booking-email/index.ts`:

```
RESEND_FROM_EMAIL || "CalendarPal <contact@notifications.3bi.io>"
```

But because the secret is set (even to a wrong value), the fallback is never used.

### Fix

Update the `RESEND_FROM_EMAIL` secret value to:

```
CalendarPal <contact@notifications.3bi.io>
```

That is the only change required. No code modifications needed.

### What This Unlocks

Once the secret is updated, all email paths will immediately start working:

| Trigger | Guest Email | Host Email |
|---|---|---|
| Guest books meeting | Confirmation | New booking alert |
| Guest cancels via link | Cancellation notice | Cancellation notice |
| Guest reschedules via link | New time confirmation | Reschedule notice |
| Host cancels from dashboard | Cancellation notice | Cancellation notice |
| Host reschedules from dashboard | New time confirmation | Reschedule notice |

### No Redeployment Needed

Secrets are injected at runtime. Updating the secret value takes effect on the next function invocation — no redeployment required.

### Action Required

Click "Approve" and I will prompt you to update the `RESEND_FROM_EMAIL` secret to the correct verified address.
