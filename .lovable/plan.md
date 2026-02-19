
## Bulk Backfill: Send Confirmation Emails to 36 Confirmed Bookings

### Context

There are **36 confirmed** bookings with `email_status = 'not_sent'` (created before email tracking was added). One additional booking with `not_sent` is `cancelled` — that one will be intentionally skipped. The goal is to send `booking_confirmed` emails to all 36 guests and hosts.

---

### Approach

A new `bulk-send-emails` backend function will be created. It will:

1. Query all bookings where `email_status = 'not_sent'` AND `status = 'confirmed'`
2. Join with `event_types` and `profiles` to get the full data needed for each email
3. Call `send-booking-email` for each booking (sequentially, with a small delay between calls to respect Resend rate limits)
4. Return a summary of how many succeeded and failed

An admin UI trigger will be added to the Admin Bookings page — a "Send Pending Emails" button with a confirmation dialog so it cannot be triggered accidentally.

---

### Technical Implementation

**New edge function: `supabase/functions/bulk-send-emails/index.ts`**

- Secured with admin-only authorization (checks the caller's JWT against `user_roles`)
- Fetches all `confirmed` + `email_status = not_sent` bookings with related `event_types` and `profiles` data in a single query using service role
- Loops through each booking, invoking the existing `send-booking-email` function
- Uses a 200ms delay between sends to stay under Resend's rate limits
- Returns `{ sent: number, failed: number, skipped: number, errors: string[] }`

**Admin UI: `src/pages/admin/AdminBookings.tsx`**

- Add a "Send Pending Emails" button in the page header, only shown when there are `not_sent` confirmed bookings
- Opens an `AlertDialog` confirmation: "This will send confirmation emails to 36 guests and hosts. Continue?"
- Shows a loading spinner and progress toast while running
- On completion, shows a success/failure summary toast and invalidates the query cache to refresh the count

---

### Rate Limiting & Safety

- Emails are sent **one at a time** (sequential, not parallel) to avoid Resend API rate limits
- The function uses the existing `send-booking-email` retry logic (3 retries with exponential backoff)
- If any individual email fails, the function continues with the rest and records the error — it does not abort the batch
- The cancelled booking is automatically excluded by the `status = 'confirmed'` filter

---

### Files Changed

| File | Change |
|---|---|
| `supabase/functions/bulk-send-emails/index.ts` | New edge function |
| `src/pages/admin/AdminBookings.tsx` | Add bulk send button + confirmation dialog |
