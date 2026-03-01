

# Comprehensive Feature Implementation Plan for CalendarPal

This plan covers all recommended integrations and features across 6 phases, ordered by impact and dependency. Each phase builds on the previous one.

---

## Phase 1: Slack Notifications (Quick Win)

**Goal:** Real-time booking alerts in Slack using the available connector infrastructure.

### What gets built
- A new backend function `slack-notify` that sends formatted messages to a Slack channel when bookings are created, cancelled, or rescheduled
- A settings UI section under Profile Settings where users can enable/disable Slack notifications and pick a channel
- A new `slack_channel_id` column on the `profiles` table to store the user's preferred channel
- Integration into the existing `notify_on_booking` flow

### Steps
1. Connect the Slack connector to the project (connector gateway)
2. Add database migration: `slack_channel_id` and `slack_notifications_enabled` columns to `profiles`
3. Create `supabase/functions/slack-notify/index.ts` using the connector gateway pattern
4. Update `send-booking-email/index.ts` to also invoke `slack-notify` after sending emails
5. Add Slack settings section to `ProfileSettings.tsx` with channel selector
6. Add a toggle in `NotificationPreferences.tsx` for Slack alerts

---

## Phase 2: Booking Page Themes (Free) + Custom Branding (Pro)

**Goal:** Let users personalize their public booking page appearance.

### What gets built
- 4 preset theme options (Default, Warm, Ocean, Forest) available to all users
- Pro users get full custom branding: custom colors, logo upload, custom welcome message
- Theme selection UI on the Profile Settings page
- Public booking page renders dynamically based on host's theme

### Steps
1. Add database migration: `booking_theme` (text, default 'default'), `custom_brand_color` (text), `custom_brand_logo` (text), `custom_welcome_message` (text) columns to `profiles`
2. Create `src/lib/booking-themes.ts` with theme definitions (color palettes, font choices)
3. Add theme picker component to `ProfileSettings.tsx` (Free: preset grid, Pro: full color picker + logo upload)
4. Update `PublicBooking.tsx` to fetch and apply the host's theme dynamically using CSS variables
5. Gate custom branding controls behind `useSubscription().isPro`

---

## Phase 3: Embeddable Booking Widget

**Goal:** Let users embed their booking page on external websites via iframe or script snippet.

### What gets built
- A dedicated `/embed/:username` route with minimal chrome (no nav, no footer)
- A "Get Embed Code" section in Profile Settings with copyable iframe/script snippets
- PostMessage-based communication for parent page notifications (booking confirmed, etc.)

### Steps
1. Create `src/pages/EmbedBooking.tsx` -- a stripped-down version of `PublicBooking.tsx` without navigation, optimized for iframe
2. Add route `/embed/:username` in `App.tsx`
3. Add embed code generator UI in `ProfileSettings.tsx` with iframe snippet and optional JS widget snippet
4. Add `postMessage` calls in the embed page on booking success so parent sites can react
5. Set appropriate CORS/X-Frame-Options headers to allow embedding

---

## Phase 4: Payment Collection per Session (Pro)

**Goal:** Let Pro users charge for bookings using the existing Stripe integration.

### What gets built
- Per-event-type pricing: hosts can set a price on any event type
- Guests are redirected to Stripe Checkout before the booking is confirmed
- Payment status tracked on the booking record
- Hosts see payment status in their bookings dashboard

### Steps
1. Add database migration: `price_amount` (integer, nullable), `price_currency` (text, default 'usd') columns to `event_types`; `payment_status` (text, default null), `stripe_payment_id` (text, nullable) columns to `bookings`
2. Add pricing fields to `EventFormFields.tsx` (gated behind Pro)
3. Create `supabase/functions/create-booking-payment/index.ts` -- creates a Stripe Checkout session in `payment` mode with booking metadata
4. Update `PublicBooking.tsx` booking flow: if event has a price, redirect to Stripe Checkout first, then confirm booking on success callback
5. Create `/booking-payment-success` page that verifies payment and finalizes the booking
6. Add payment status badge to `BookingDetailModal.tsx` and the bookings list

---

## Phase 5: Client Directory + Advanced Analytics (Pro)

**Goal:** Give Pro users deeper insight into their booking patterns and client relationships.

### What gets built
- **Client Directory**: A searchable list of all past guests with booking history, total meetings, last meeting date
- **Conversion Funnel**: Track page views -> time slot clicks -> booking completions
- **Analytics Dashboard**: Enhanced charts showing booking trends, popular times, repeat client rate

### Steps
1. Add database migration: create `booking_page_views` table (id, host_user_id, event_type_id, viewer_session_id, created_at) for funnel tracking
2. Create `src/pages/Clients.tsx` with a searchable/filterable table of unique guests aggregated from `bookings`
3. Add route `/clients` in `App.tsx` (Pro-gated via `ProtectedRoute`)
4. Add a navigation link for "Clients" in the sidebar/bottom nav (Pro badge)
5. Create `src/components/dashboard/ConversionFunnel.tsx` showing view -> click -> book rates
6. Create `src/components/dashboard/PopularTimesChart.tsx` showing heatmap of most-booked hours
7. Update `PublicBooking.tsx` to log page views to `booking_page_views` (anonymous, no PII)
8. Add a backend function `supabase/functions/track-page-view/index.ts` for anonymous view logging
9. Gate Clients page and advanced analytics widgets behind `useSubscription().isPro`, showing upgrade prompts for Free users

---

## Phase 6: Google Calendar 2-Way Sync

**Goal:** Prevent double-bookings by syncing with Google Calendar. This is the most complex feature and requires OAuth setup.

### What gets built
- Google OAuth connection flow for hosts to link their Google Calendar
- When a booking is created/cancelled/rescheduled, the corresponding Google Calendar event is created/deleted/updated
- Host's existing Google Calendar events are checked for conflicts during time slot generation
- A "Connected Calendars" section in Profile Settings

### Steps
1. Guide user through Google Cloud Console setup (OAuth consent screen, Calendar API credentials)
2. Store Google OAuth tokens securely: add `google_access_token`, `google_refresh_token`, `google_token_expires_at`, `google_calendar_connected` columns to `profiles`
3. Create `supabase/functions/google-calendar-auth/index.ts` for OAuth callback handling and token exchange
4. Create `supabase/functions/google-calendar-sync/index.ts` for creating/updating/deleting calendar events
5. Create `supabase/functions/google-calendar-busy/index.ts` for fetching busy times from Google Calendar
6. Update `useTimeSlots.ts` to also check Google Calendar busy times when generating available slots
7. Update `send-booking-email/index.ts` to trigger `google-calendar-sync` after successful email send
8. Add "Connect Google Calendar" UI in `ProfileSettings.tsx` with connect/disconnect flow
9. Add a connected calendar indicator on the Dashboard

---

## Summary Timeline

| Phase | Feature | Complexity | New DB Tables/Columns | New Edge Functions | New Pages/Components |
|-------|---------|-----------|----------------------|-------------------|---------------------|
| 1 | Slack Notifications | Low | 2 columns | 1 | 1 component |
| 2 | Themes + Branding | Medium | 4 columns | 0 | 2 components |
| 3 | Embed Widget | Medium | 0 | 0 | 1 page, 1 component |
| 4 | Payment Collection | High | 4 columns | 1 | 2 pages, 1 component |
| 5 | Clients + Analytics | High | 1 table | 1 | 2 pages, 3 components |
| 6 | Google Calendar Sync | Very High | 4 columns | 3 | 2 components |

## Notes
- Each phase is self-contained and can be shipped independently
- Phases 1-3 are relatively quick wins (1-2 sessions each)
- Phases 4-6 are larger efforts requiring careful testing
- All Pro-gated features use the existing `useSubscription().isPro` check
- No new external dependencies are needed except Google Calendar API (Phase 6)

