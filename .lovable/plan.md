

# Update All Brand References to bookme.bet

A sweep across the codebase found old brand names ("CalendarPal", "BookMe.cool") and stale URLs ("calendarpal.lovable.app") still present in 10 files. Here's the full update plan.

## Changes Summary

| File | What changes |
|------|-------------|
| `src/components/onboarding/OnboardingWizard.tsx` | "Welcome to CalendarPal" -> "Welcome to Bookme.bet" |
| `src/components/GeoAccessGuard.tsx` | Storage key `calendarpal_geo_check` -> `bookme_geo_check` |
| `src/components/admin/AdminSidebar.tsx` | "BookMe.cool" label -> "Bookme.bet" |
| `src/pages/ResetPassword.tsx` | 3 SEO titles: "CalendarPal" -> "Bookme.bet" |
| `src/pages/UpdatePassword.tsx` | 3 SEO titles/descriptions: "CalendarPal" -> "Bookme.bet" |
| `src/lib/blocked-countries.ts` | "BookMe.cool" text and `support@bookme.cool` -> "Bookme.bet" / `support@bookme.bet` |
| `src/pages/Privacy.tsx` | Footer year 2025 -> 2026 |
| `src/pages/Terms.tsx` | Footer year 2025 -> 2026 |
| `supabase/functions/send-booking-email/index.ts` | ICS PRODID, UID domain, description, organizer email: `bookme.cool` -> `bookme.bet` |
| `supabase/functions/admin-appeals/index.ts` | All "CalendarPal" text, `calendarpal.lovable.app` URL -> "Bookme.bet" / `bookme.bet` |
| `supabase/functions/geo-appeal/index.ts` | "CalendarPal" text, `calendarpal.lovable.app` fallback -> "Bookme.bet" / `bookme.bet` |
| `supabase/functions/check-geo-access/index.ts` | "CalendarPal" in error message -> "Bookme.bet" |
| `supabase/functions/generate-og-images/index.ts` | All "BookMe.cool" in AI prompts -> "Bookme.bet", update URL references |
| `supabase/functions/reset-password/index.ts` | `calendarpal.lovable.app` fallback -> `bookme.bet` |

## Technical Details

- All string replacements are straightforward find-and-replace within each file
- The `GeoAccessGuard.tsx` storage key change means users' cached geo checks will re-run once (harmless)
- Edge functions with `calendarpal.lovable.app` fallback URLs will be updated to `https://bookme.bet`
- Footer copyright years on Privacy and Terms pages updated from 2025 to 2026
- No database or schema changes required

