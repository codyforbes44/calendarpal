
## Email System Audit & Fix Plan

### Problem Summary

The email system has **3 silent failure bugs** that mean guest-initiated cancellations and reschedules never send notification emails. Host-initiated actions work correctly. Here is the complete fix plan.

---

### Bug 1 (Critical): Wrong Email Type Strings in `manage-guest-booking`

**File:** `supabase/functions/manage-guest-booking/index.ts`

The function calls `send-booking-email` with:
- `type: "cancellation"` — should be `"booking_cancelled"`
- `type: "reschedule"` — should be `"booking_rescheduled"`

The `send-booking-email` handler hits the `default` case and throws "Unknown email type", which is caught and swallowed silently.

**Fix:** Correct the type strings.

---

### Bug 2 (Critical): Wrong Booking Payload Shape in `manage-guest-booking`

**File:** `supabase/functions/manage-guest-booking/index.ts`

The function spreads the raw Supabase booking row (snake_case DB columns) into the email payload, but `send-booking-email` expects a structured camelCase object matching the `BookingEmailData` interface. Key mismatches:

| Sent (wrong) | Expected |
|---|---|
| `guest_name` | `guestName` |
| `guest_email` | `guestEmail` |
| `host_user_id` | `hostEmail` (the value, not ID) |
| `event_types.title` | `eventTitle` |
| `scheduled_date` | `scheduledDate` |
| `start_time` | `startTime` |
| `end_time` | `endTime` |

The host email is available from the joined `profiles` row but is never mapped into the email payload, so host never receives guest-initiated cancellation/reschedule emails.

**Fix:** Build a correctly shaped `BookingEmailData` object from the fetched booking, mapping all fields and extracting host email from the joined `profiles` record.

---

### Bug 3 (Critical): Missing `oldDateTime` in Reschedule from `manage-guest-booking`

**File:** `supabase/functions/manage-guest-booking/index.ts`

The reschedule email call does not include `oldDateTime`, which is required by `send-booking-email`. This causes the function to throw `"oldDateTime required for reschedule emails"`, which is then swallowed.

**Fix:** Capture the original `scheduled_date` and `start_time` from the booking before updating, then pass it as `oldDateTime` in the email invocation.

---

### Bug 4 (Minor): ICS Calendar Has No Timezone

**File:** `supabase/functions/send-booking-email/index.ts`

The ICS `DTSTART`/`DTEND` values are written as floating local time (e.g., `20260301T090000`) with no `TZID` component. Calendar apps interpret this as the device's local time, which will show the wrong time for guests in different timezones.

**Fix:** Add a `VTIMEZONE` component to the ICS and use `TZID` on `DTSTART`/`DTEND` using the booking's `hostTimezone` field. For simplicity and maximum compatibility, convert to UTC and use the `Z` suffix format instead (e.g., `20260301T140000Z`), which is unambiguous in every calendar client.

---

### Bug 5 (Minor): Dead Code in `PublicBooking.tsx`

**File:** `src/pages/PublicBooking.tsx` (line 323)

```typescript
const { data: hostData } = await supabase.auth.admin?.getUserById?.(profile.user_id) || {};
```

`supabase.auth.admin` is `undefined` on the browser client. This line always produces `undefined` and the result is never used. The host email is correctly fetched on the next lines from the `profiles` table. The dead code should be removed for clarity.

---

### Files to Change

1. **`supabase/functions/manage-guest-booking/index.ts`** — Fix type strings, fix payload shape, add `oldDateTime`
2. **`supabase/functions/send-booking-email/index.ts`** — Fix ICS to use UTC time (unambiguous timezone)
3. **`src/pages/PublicBooking.tsx`** — Remove dead auth.admin line

---

### Technical Detail: Correct ICS UTC Conversion

Replace the `formatDate` helper inside `generateICS` to convert local date+time to UTC using the `Temporal` API or a simple offset approach. Since we have the timezone string (e.g., `"America/New_York"`), we use `Intl` to calculate the UTC offset and emit `Z`-suffixed timestamps.

---

### Email Coverage After Fix

| Trigger | Guest Email | Host Email |
|---|---|---|
| Guest books meeting | Yes (confirmation) | Yes (new booking) |
| Guest cancels via link | Yes (confirmation) | **Yes (fixed)** |
| Guest reschedules via link | Yes (updated) | **Yes (fixed)** |
| Host cancels from dashboard | Yes | Yes |
| Host reschedules from dashboard | Yes | Yes |
