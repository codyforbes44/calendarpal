
# Upgrade Reminder Email Templates to Modern Design

## Overview
Replace the plain `buildReminderHtml` function in `supabase/functions/send-reminders/index.ts` with the same modern design system used in `send-booking-email` -- gradient header, card-based layout, brand logo, and shared helper functions.

## What Changes

### File: `supabase/functions/send-reminders/index.ts`

**1. Add shared design constants and helper functions** (after the existing utility functions, before `buildReminderHtml`):
- `BRAND_COLOR`, `BRAND_GRADIENT`, `LOGO_URL` constants
- `emailLayout()` -- the shared HTML wrapper with gradient header, logo, white body card, and branded footer
- `detailRow()` -- icon + label + value table rows
- `detailsCard()` -- the rounded card container with colored left border
- `buildTimezoneBlock()` -- prominent primary timezone with secondary timezone line
- `actionButton()` / `secondaryButton()` -- styled CTA buttons
- `icsNote()` -- small attachment note

These are copied from the booking email function to maintain visual consistency.

**2. Rewrite `buildReminderHtml`** to use `emailLayout()` internally:
- Gradient header with amber/warm tone (distinguishes reminders from confirmations) using icon "⏰" and title "Meeting in 24 Hours"
- Card body with `detailsCard` containing: date row, timezone block (primary = recipient's local time, secondary = other party's time), duration row, and guest/host row
- "Join Meeting" action button when a meeting link exists
- "Reschedule or Cancel" secondary button for guest emails
- ICS attachment note at the bottom
- Hidden preheader text for better inbox previews

**3. Update email subjects** to include the checkmark/clock emoji consistent with the booking email style.

### No other files change. All existing logic (timezone conversion, ICS generation, window scanning, host preference checks, retry logic) remains untouched.

## Design Details

| Element | Value |
|---------|-------|
| Header gradient | Amber: `#f59e0b` to `#d97706` to `#b45309` |
| Header icon | ⏰ |
| Header title | "Meeting in 24 Hours" |
| Card border color | `#f59e0b` (amber) |
| Logo | `https://calendarpal.lovable.app/bookme-logo.png` |
| Body background | `#f0f0f5` (matches booking emails) |
| Card background | `#ffffff` |

## Technical Notes
- The helper functions are duplicated (not shared across functions) because edge functions are isolated -- each function must be self-contained in a single `index.ts`.
- The function will be automatically deployed after editing.
