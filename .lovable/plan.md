

# Fix Embed Widget Branding and Add Payment Support

## Changes Overview

Two fixes: update branding text and add Stripe payment support to the embedded booking flow.

---

## 1. Fix Branding (3 locations in EmbedBooking.tsx)

Replace all instances of `Powered by <strong>Bᴏᴏᴋᴍᴇ.ʙᴇᴛ</strong>` with `Powered by <strong>CalendarPal</strong>` in the embed page. There are two occurrences:
- Line 354 (event selection step)
- Line 453 (details form step)

Also update the `postMessage` event type from `bookme-booking-confirmed` to `calendarpal-booking-confirmed` (line 206), and update the matching reference in the embed code generator (`EmbedCodeGenerator.tsx`, line 43).

---

## 2. Add Payment Support to Embed Booking Flow

The `PublicBooking.tsx` page already handles paid events by calling `create-booking-payment` when `price_amount > 0`. The embed flow skips this entirely. We need to replicate the same logic.

### 2a. Update EventType interface (EmbedBooking.tsx)

Add `price_amount` and `price_currency` fields to the `EventType` interface (currently missing).

### 2b. Show price on event cards

In the event selection step, display the price next to duration/location when `price_amount > 0`. Format as currency (e.g., "$5.00").

### 2c. Add payment redirect in handleBooking

Before the direct booking insert, add the same conditional check from PublicBooking:
- If `selectedEvent.price_amount > 0`, invoke `create-booking-payment` with the same payload
- For embeds, use `window.top.location.href` (or `window.location.href`) to redirect to Stripe Checkout since the embed runs in an iframe
- If no price, proceed with the existing direct booking flow

### 2d. Show price in details form

Display the price in the booking summary card so guests know the cost before confirming.

---

## Files Modified

| File | Change |
|---|---|
| `src/pages/EmbedBooking.tsx` | Fix branding (2 spots), update EventType interface, add payment redirect logic, show price on cards |
| `src/components/settings/EmbedCodeGenerator.tsx` | Update `bookme-booking-confirmed` to `calendarpal-booking-confirmed` in JS widget code |

## Technical Notes

- The `create-booking-payment` edge function already handles CORS and works without auth (guest checkout), so no edge function changes are needed.
- The Stripe checkout `success_url` already points to `/booking-payment-success` which handles verification and booking creation server-side, so the embed payment flow will work end-to-end.
- For iframe context: `window.location.href` works inside iframes for navigation to external URLs (Stripe Checkout). No special handling needed since Stripe opens in the same frame/tab context.

