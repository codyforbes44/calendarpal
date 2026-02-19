
# Full-App UX Refactor — BookMe.cool (Mobile-First)

## Audit Findings

After reviewing every page, component, and layout pattern, here are the key UX gaps identified across the app:

---

### Critical Issues (Highest Impact)

**1. Hero Section — no mobile image / weak CTA hierarchy**
- The hero image (`hidden lg:block`) is completely absent on mobile and tablet. Mobile users see only text and buttons with no visual context. The floating stat cards that convey social proof are invisible on 90% of devices.
- CTA buttons link to `/booking` (a demo) and `/availability` rather than the most logical actions for a landing page visitor.

**2. Features Section — padding/sizing not mobile-optimised**
- `py-24` top padding and `p-8` card padding are desktop-centric. On mobile, cards feel bloated and scroll distance is excessive.
- Cards have no visual stagger or progressive loading feel.

**3. BookingPreview — completely broken on mobile**
- The two-column grid (`md:grid-cols-2`) collapses to single column but the `divide-x` border remains, creating a horizontal separator that floats awkwardly. Left panel padding `p-8` is too tight on small screens.
- The embedded demo does not link to a real booking page (`href="/booking"` instead of `/book/:username`).

**4. CTA Section — CTAs link to wrong pages**
- "Try Booking Now" links to `/booking` (an internal demo route). "Set Availability" links to `/availability` which requires login — a new visitor clicking it hits a redirect.
- No mobile stacking of benefit badges — `grid sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-12` leaves badges cramped.

**5. Pricing Page — comparison table overflows on mobile**
- The `<Table>` with 4 columns is not scrollable on mobile. Users on phones can't see the Enterprise column. No `overflow-x-auto` wrapper exists.
- `scale-105` on the Pro card causes overflow/clipping inside the 3-column grid on narrow viewports.

**6. Support Page — fixed `px-6` padding, no responsive scaling**
- All padding is `px-6` with no `sm:`/`lg:` variants. On a 375px screen this leaves only 327px of content width. Header `py-24` is excessive for mobile.
- The 3-card support options grid (`lg:grid-cols-3`) goes to 1 column on mobile but the cards have no icons that are touch-target compliant.

**7. Dashboard — "Today's Schedule" time display is 24h not 12h**
- `TodaySchedule` renders `booking.start_time` and `booking.end_time` raw (e.g., `"14:00:00"`) rather than using `formatTime()`. Should format as `2:00 PM`.
- "Upcoming Meetings" also shows raw `booking.start_time` without AM/PM conversion.

**8. Bookings Page — search bar UX**
- The search card (`border-0 focus-visible:ring-0`) provides no visual affordance that it's a text input. No placeholder is visible until click.
- The view toggle (List/Calendar) shows icon only on mobile with no label — accessibility concern.

**9. Auth Page — Calendar icon instead of brand logo**
- The auth page header shows a generic `<Calendar />` icon from lucide-react. It should show the `bookme-logo.png` brand mark for consistency.
- No "Back to home" as a link is shown above the card on mobile (it's buried at the bottom), making escape route non-obvious on small screens.

**10. Footer — only visible on Index page**
- The footer only exists in `Index.tsx`. Pages like `Support.tsx` have their own mini-footer, `Pricing.tsx` has none below content, `Auth.tsx` has none. Inconsistent.

**11. PublicBooking page — not in this audit but referenced**
- OK for now — focus on the app shell and dashboard pages per this request.

**12. Navigation — desktop-only Sign Out button**
- `Button variant="ghost" onClick={handleSignOut} className="hidden md:inline-flex"` — signed-in users on mobile can only sign out via the hamburger sheet. The hamburger sheet shows Sign Out at the bottom which is fine, but the trigger button has no visual badge or avatar to indicate the user is logged in.

---

## What Will Be Refactored

### File 1: `src/components/Hero.tsx`
- Show a mobile hero illustration/visual (simplified floating card stack) on all screen sizes instead of hiding the right panel below `lg:`.
- Adjust heading from `text-4xl sm:text-5xl lg:text-7xl` to a slightly tighter mobile-first scale.
- Fix CTA: "Start Free Trial" → `/auth`, "Watch Demo" → smooth-scroll to `#preview`.
- Add a third trust indicator: "Trusted by 1,000+ professionals".

### File 2: `src/components/Features.tsx`
- Reduce section padding: `py-24` → `py-16 sm:py-24`.
- Reduce card padding: `p-8` → `p-5 sm:p-8`.
- Ensure grid is `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` (already is, just confirm).

### File 3: `src/components/BookingPreview.tsx`
- Wrap the two-column layout in a responsive stack: `grid-cols-1 md:grid-cols-2`.
- Remove `divide-x` and replace with a top border on mobile: `divide-y md:divide-y-0 md:divide-x`.
- Reduce padding: `p-8` → `p-5 sm:p-8`.
- Add `id="preview"` to the section for the smooth-scroll CTA target.

### File 4: `src/components/CTA.tsx`
- Fix CTAs: "Get Started Free" → `/auth`, "See Pricing" → `/pricing`.
- Reduce top/bottom padding: `py-24` → `py-16 sm:py-24`.
- Tighten benefit grid: `grid-cols-1 sm:grid-cols-2` with proper gap.

### File 5: `src/pages/Pricing.tsx`
- Wrap the comparison `<Table>` in `<div className="overflow-x-auto">`.
- Fix Pro card `scale-105` on mobile: `md:scale-105` so it only scales on desktop.
- Reduce top padding: `pt-32` → `pt-24 sm:pt-32`.
- Add a footer section (or link to existing footer pattern) below the pricing table.

### File 6: `src/pages/Support.tsx`
- Replace `px-6` with `px-4 sm:px-6 lg:px-8` throughout.
- Replace `py-24` header with `pt-20 sm:pt-24 pb-12 sm:pb-20`.
- Make the 3 support cards touch-target compliant (min-h-[120px]).

### File 7: `src/components/dashboard/TodaySchedule.tsx`
- Fix time display: replace raw `booking.start_time` / `booking.end_time` with a local `formatTime()` helper that converts `"14:00:00"` → `"2:00 PM"`.

### File 8: `src/components/dashboard/UpcomingMeetings.tsx`
- Fix `booking.start_time` to use formatted 12h time.
- Make the `MoreVertical` button functional — clicking it should navigate to `/bookings` filtered by that booking.

### File 9: `src/pages/Auth.tsx`
- Replace the `<Calendar />` lucide icon with `<img src="/bookme-logo.png" />` brand mark.
- Move the "Back to home" link to the top of the card (above the form) on mobile.

### File 10: `src/pages/Index.tsx` — Footer enhancement
- Extract the footer into its own component `src/components/Footer.tsx` so it can be reused.
- Add footer to `Pricing.tsx` and `Support.tsx`.

### File 11: `src/components/Navigation.tsx`
- Add a subtle avatar/initials badge next to the theme toggle when user is logged in (desktop only), making it clear who is signed in.

---

## Files to Create

| File | Purpose |
|---|---|
| `src/components/Footer.tsx` | Shared footer component extracted from Index.tsx, added to Pricing and Support |

---

## Files Modified

| File | Key Changes |
|---|---|
| `src/components/Hero.tsx` | Mobile visual, CTA fix, trust indicators |
| `src/components/Features.tsx` | Responsive padding |
| `src/components/BookingPreview.tsx` | Mobile divide fix, padding, anchor ID |
| `src/components/CTA.tsx` | CTA links, padding |
| `src/pages/Pricing.tsx` | Table overflow-x-auto, scale-105 mobile fix, footer |
| `src/pages/Support.tsx` | Responsive padding, footer |
| `src/pages/Index.tsx` | Use shared Footer component |
| `src/components/dashboard/TodaySchedule.tsx` | 12h time format fix |
| `src/components/dashboard/UpcomingMeetings.tsx` | 12h time format fix |
| `src/pages/Auth.tsx` | Brand logo, back-to-home position |
| `src/components/Navigation.tsx` | User avatar initials badge |

---

## Technical Notes

- All changes are purely presentational (CSS/layout) and functional-fix (time formatting) — no database or backend changes required.
- The Footer component will be a simple extracted presentational component.
- Time formatting uses the existing `formatTime` helper pattern already used in `Bookings.tsx` — applying the same function to `TodaySchedule` and `UpcomingMeetings`.
- The `overflow-x-auto` table fix is a single-line wrapper with no architectural change.
- No new dependencies required.
