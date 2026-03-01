

# Add Google Calendar and Outlook Deep-Link Buttons to Emails

## Overview
Add one-click "Add to Google Calendar" and "Add to Outlook" buttons to all **confirmation** and **reschedule** emails (both guest and host) in both `send-booking-email` and `send-reminders` edge functions. Cancellation emails are excluded since there's nothing to add.

## How Calendar Deep Links Work

Both Google Calendar and Outlook.com accept URL parameters to pre-fill a new calendar event:

- **Google Calendar**: `https://calendar.google.com/calendar/render?action=TEMPLATE&text=...&dates=START/END&details=...`
- **Outlook Web**: `https://outlook.live.com/calendar/0/action/compose?subject=...&startdt=ISO&enddt=ISO&body=...`

The start/end times must be in UTC ISO format (already computed by the existing `toUtcIcsString`/`convertTimeBetweenZones` logic).

## What Changes

### File 1: `supabase/functions/send-booking-email/index.ts`

**1. Add a `calendarLinks()` helper function** (after `icsNote`):
- Takes: event title, scheduled date, start time, end time, host timezone, meeting link, description
- Computes UTC start/end timestamps
- Returns an HTML block with two side-by-side styled buttons:
  - Google Calendar icon + "Google Calendar" link
  - Outlook icon + "Outlook" link
- Styled as a row of two pill buttons below the ICS note

**2. Add a `toUtcIso()` utility** (reuses the existing timezone-to-UTC conversion logic already in `generateICS`):
- Converts a local date + time + timezone into a UTC ISO string (`YYYYMMDDTHHmmssZ` for Google, `YYYY-MM-DDTHH:mm:ssZ` for Outlook)

**3. Insert `calendarLinks()` into confirmation emails** (both guest and host):
- Placed after the ICS note, before the closing of `bodyHtml`
- Replaces the static ICS note text with the ICS note + calendar buttons

**4. Insert `calendarLinks()` into reschedule emails** (both guest and host):
- Same placement as confirmation emails

### File 2: `supabase/functions/send-reminders/index.ts`

**1. Add the same `calendarLinks()` and `toUtcIso()` helpers** (duplicated because edge functions are isolated).

**2. Insert calendar link buttons into the reminder template** (`buildReminderHtml`):
- Added after the ICS note line

## Button Design

```text
+--------------------------------------------------+
|  [G] Add to Google Calendar  |  [O] Add to Outlook |
+--------------------------------------------------+
```

- Two buttons side-by-side in a centered table row
- Google button: white background, `#4285f4` border/text, Google "G" favicon
- Outlook button: white background, `#0078d4` border/text, Outlook icon
- Both 13px font, rounded corners, consistent with the existing `secondaryButton` style
- Wrapped in a subtle container below the ICS attachment note

## Visual Placement in Emails

For **confirmation** (guest and host):
1. Details card (date, time, duration, guest/host)
2. "Join Meeting" button (if meeting link exists)
3. "Reschedule or Cancel" button (guest only)
4. ICS attachment note
5. **NEW: "Add to Google Calendar" + "Add to Outlook" buttons**

For **reschedule** (guest and host):
1. Old time card (strikethrough)
2. New details card
3. "Reschedule or Cancel" button (guest only)
4. ICS attachment note
5. **NEW: Calendar buttons**

For **reminders**:
1. Details card
2. "Join Meeting" button
3. "Reschedule or Cancel" button (guest only)
4. ICS attachment note
5. **NEW: Calendar buttons**

## Technical Details

### Google Calendar URL format
```
https://calendar.google.com/calendar/render?action=TEMPLATE
  &text={URL-encoded title}
  &dates={YYYYMMDDTHHmmssZ}/{YYYYMMDDTHHmmssZ}
  &details={URL-encoded description}
```

### Outlook URL format
```
https://outlook.live.com/calendar/0/action/compose
  ?subject={URL-encoded title}
  &startdt={YYYY-MM-DDTHH:mm:ssZ}
  &enddt={YYYY-MM-DDTHH:mm:ssZ}
  &body={URL-encoded description}
```

### UTC Conversion
The existing `toUtcIcsString` in `generateICS` already handles DST-aware timezone-to-UTC conversion. The new `toUtcIso` will reuse the same Intl-based iterative offset approach, returning the timestamp in both formats needed (compact for Google, ISO for Outlook).

## Files Modified
- `supabase/functions/send-booking-email/index.ts` -- add helpers + insert buttons in 4 email templates (guest/host confirmation, guest/host reschedule)
- `supabase/functions/send-reminders/index.ts` -- add helpers + insert buttons in reminder template

No database changes, no new files, no dependency changes.

