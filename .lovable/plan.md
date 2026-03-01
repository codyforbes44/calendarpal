
# UX Refactor: Mobile-First Polish and Consistency Pass

## Issues Found

### 1. Missing BottomNavigation on Key Pages
The **Subscription**, **EventForm**, and **Booking** pages are missing the mobile bottom navigation bar, stranding mobile users with no way to navigate without going back to the browser URL bar.

**Affected pages:**
- `src/pages/Subscription.tsx` -- no `BottomNavigation`, no `pb-bottom-nav`, uses hardcoded `px-6` instead of responsive padding
- `src/pages/EventForm.tsx` -- no `BottomNavigation`, no `pb-bottom-nav`
- `src/pages/Booking.tsx` -- no `BottomNavigation`, no `pb-bottom-nav`, uses hardcoded `px-6`

### 2. Inconsistent Page Padding
Several pages use hardcoded `px-6` instead of the design system's responsive `px-4 sm:px-6 lg:px-8` pattern. This causes content to be too far from edges on small phones (320px).

**Affected pages:**
- `src/pages/Subscription.tsx` -- `px-6` instead of responsive
- `src/pages/Booking.tsx` -- `px-6` instead of responsive
- `src/pages/Subscription.tsx` -- `pt-24 pb-12` instead of `pt-20 sm:pt-24 pb-bottom-nav`

### 3. Subscription Page Missing font-display and Mobile Polish
- Page heading uses plain `text-3xl font-bold` instead of `font-display text-2xl sm:text-3xl font-bold` like every other protected page
- Missing responsive text sizing on subheading
- No `BottomNavigation` component
- Features comparison table not optimized for mobile (horizontal scroll without visual hint)

### 4. DashboardStats Mislabeled Card
The "Active Events" stat card displays `stats?.cancelled` data (cancelled count), not active event count. This is a data display bug.

### 5. EventForm "Back to Dashboard" Navigation
After creating/editing an event, the form navigates to `/dashboard` instead of `/events` (the dedicated events management page). Same for the "Back" button.

### 6. AI Chatbot FAB Overlaps with Share FAB on Mobile
Both the AI chatbot button and the Share FAB are positioned at `bottom-20 right-4` on mobile, causing overlap. The chatbot panel also positions at `bottom-20` which conflicts with `BottomNavigation`.

### 7. Booking Page Uses Mock Data
`src/components/BookingFlow.tsx` uses `generateTimeSlots()` with random mock data instead of real availability. The `/booking` route appears to be an orphan page not connected to real data (the actual booking flow is at `/book/:username`).

### 8. Subscription Page Missing Responsive Table
Invoice history table has tiny cells on mobile with no horizontal scroll indicator.

---

## Implementation Plan

### Task 1: Add BottomNavigation and Fix Padding on Missing Pages

**Subscription.tsx:**
- Import and add `BottomNavigation`
- Change `px-6` to `px-4 sm:px-6 lg:px-8`
- Change `pt-24 pb-12` to `pt-20 sm:pt-24 pb-bottom-nav`
- Change heading to `font-display text-2xl sm:text-3xl font-bold`
- Add responsive subheading text `text-sm sm:text-base`

**EventForm.tsx:**
- Import and add `BottomNavigation`
- Add `pb-bottom-nav` to container

**Booking.tsx:**
- Import and add `BottomNavigation`
- Change `px-6` to `px-4 sm:px-6 lg:px-8`
- Change `pt-24 pb-12` to `pt-20 sm:pt-24 pb-bottom-nav`

### Task 2: Fix DashboardStats Mislabeled Card

In `src/components/dashboard/DashboardStats.tsx`, the 4th stat card shows `stats?.cancelled` but labels it "Active Events". Change to either:
- Rename to "Cancelled" with correct semantic color, or
- Use actual active event type count from a separate query

The simpler fix: rename the label to "Cancelled" and change the icon/color to match destructive/warning semantics.

### Task 3: Fix EventForm Navigation Target

Change `navigate("/dashboard")` calls in `src/pages/EventForm.tsx` to `navigate("/events")` so users return to the events list after creating/editing/deleting an event, which is the logical parent page.

### Task 4: Fix AI Chatbot FAB Position Overlap

In `src/components/dashboard/AIChatbot.tsx`:
- Move closed FAB to `bottom-36 right-4 sm:bottom-6 sm:right-6` to avoid colliding with the Share FAB (at `bottom-20`)
- Move open panel to `bottom-36 right-4 sm:bottom-6 sm:right-6` to stack above the bottom nav

In `src/pages/Dashboard.tsx`:
- Move the Share FAB to `bottom-20` (keep current, it's above bottom nav)
- Ensure z-index layering is correct (chatbot at z-50, share at z-40)

### Task 5: Remove Orphan Booking Route

The `/booking` route renders `BookingFlow.tsx` which uses mock data. The real booking flow lives at `/book/:username`. Options:
- Redirect `/booking` to `/dashboard` for logged-in users
- Or remove the route entirely from `App.tsx`

The cleaner approach: redirect `/booking` to `/bookings` (the real bookings list page) since it's confusing to have a mock booking page.

### Task 6: Subscription Page Mobile Table Polish

Add a horizontal scroll hint gradient on the invoice table for mobile, and ensure card padding is responsive (`p-4 sm:p-6`).

---

## Files Changed

| File | Change |
|------|--------|
| `src/pages/Subscription.tsx` | Add BottomNavigation, fix padding, fix heading, responsive polish |
| `src/pages/EventForm.tsx` | Add BottomNavigation, fix nav target to `/events` |
| `src/pages/Booking.tsx` | Add BottomNavigation, fix padding |
| `src/components/dashboard/DashboardStats.tsx` | Fix mislabeled stat card |
| `src/components/dashboard/AIChatbot.tsx` | Fix FAB position to avoid overlap |
| `src/pages/Dashboard.tsx` | Adjust Share FAB z-index if needed |
| `src/App.tsx` | Redirect `/booking` to `/bookings` |
