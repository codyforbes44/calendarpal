

# Rename "BookMe.Bet" to "Bᴏᴏᴋᴍᴇ.ʙᴇᴛ" Across the App

## Overview
Replace every visible occurrence of "BookMe.Bet" with the small-caps styled "Bᴏᴏᴋᴍᴇ.ʙᴇᴛ" throughout the codebase. This affects approximately 20 files spanning UI components, pages, SEO configuration, email templates, and metadata.

## Scope

**Files to update (grouped by area):**

### Brand Configuration
- `src/lib/seo-config.ts` -- `name`, `author`, `siteName`, page titles, descriptions, schema.org data
- `index.html` -- `<title>`, meta tags (og, twitter, description)
- `public/manifest.json` -- `name`, `short_name`

### Navigation and Footer
- `src/components/Navigation.tsx` -- logo alt text, brand text
- `src/components/Footer.tsx` -- alt text, copyright line

### SEO Component
- `src/components/SEO.tsx` -- default title fallback, `fullTitle` suffix

### Landing Page Components
- `src/components/Hero.tsx`
- `src/components/CTA.tsx`
- `src/components/Testimonials.tsx`
- `src/components/BookingPreview.tsx`
- `src/components/Features.tsx`

### Pages
- `src/pages/Index.tsx`, `src/pages/Pricing.tsx`, `src/pages/Support.tsx`
- `src/pages/Terms.tsx`, `src/pages/Privacy.tsx`
- `src/pages/Onboarding.tsx`, `src/pages/GetStarted.tsx`
- `src/pages/PublicBooking.tsx`, `src/pages/Auth.tsx`

### Edge Functions (email templates)
- `supabase/functions/send-booking-email/index.ts`
- `supabase/functions/send-reminders/index.ts`
- `supabase/functions/bulk-send-emails/index.ts`

## Rules
- **Replace**: All user-facing text instances of `BookMe.Bet` with `Bᴏᴏᴋᴍᴇ.ʙᴇᴛ`
- **Keep unchanged**: URLs (`bookme.bet`), email addresses, domain references, `href` attributes, file paths, and the `PRODID` inside ICS calendar strings (these are technical identifiers, not display names)
- **Keep unchanged**: The `twitterHandle` value `@bookme_bet` and social media URLs

## Technical Details
- The replacement string uses Unicode small capital letters: `Bᴏᴏᴋᴍᴇ.ʙᴇᴛ` (U+1D0F, U+1D0F, U+1D0B, U+1D0D, U+1D07 for "ookme" and U+0299, U+1D07, U+1D1B for "bet")
- No new dependencies or structural changes required
- Edge functions with the brand name in email HTML will be redeployed automatically

