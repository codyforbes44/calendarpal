
# Rename: CalendarPal → BookMe.cool

## Scope

"CalendarPal" appears in **26 files** across UI components, SEO config, legal pages, the email template, and static assets. Every instance will be replaced with "BookMe.cool". The domain references (`calendarpal.com`) will become `bookme.cool`, and email addresses (`support@calendarpal.com`, `sales@calendarpal.com`, `noreply@calendarpal.com`) will become their `@bookme.cool` equivalents.

---

## Files to Change

### Core Config (drives most pages automatically)
- **`src/lib/seo-config.ts`** — `name`, `url`, `author`, `twitterHandle`, `logo` reference, all page titles, organization schema, web app schema, social links. This single file propagates the brand name to every page that uses `siteConfig` and `pageSEO`.

### Static Files
- **`index.html`** — Page title, OG tags, Twitter tags, hreflang URLs, all hardcoded `calendarpal.com` references.
- **`public/robots.txt`** — Sitemap URL: `https://bookme.cool/sitemap.xml`
- **`public/sitemap.xml`** — All 6 `<loc>` URLs updated to `bookme.cool`
- **`public/manifest.json`** — `name`, `short_name`, `description`

### UI Components
- **`src/components/Navigation.tsx`** — Brand name display in navbar (desktop + mobile sheet)
- **`src/components/admin/AdminSidebar.tsx`** — "CalendarPal" subtitle under "Admin Portal"
- **`src/components/Hero.tsx`** — No direct brand name text (uses imported copy), no change needed
- **`src/components/SEO.tsx`** — Default title fallback string

### Pages
- **`src/pages/Index.tsx`** — Footer copyright line
- **`src/pages/NotFound.tsx`** — Brand name in the 404 logo area
- **`src/pages/Onboarding.tsx`** — Welcome toast message + booking URL preview text (`calendarpal.com/book/...` → `bookme.cool/book/...`) + SEO fallback strings
- **`src/pages/ResetPassword.tsx`** — SEO title strings
- **`src/pages/Auth.tsx`** — Any brand references in SEO/UI (uses `pageSEO` so covered by seo-config)
- **`src/pages/Support.tsx`** — 3 inline "CalendarPal" mentions + footer copyright + FAQ answer mentioning "CalendarPal"
- **`src/pages/Terms.tsx`** — 6 inline "CalendarPal" mentions + footer copyright
- **`src/pages/Privacy.tsx`** — Footer copyright
- **`src/pages/Pricing.tsx`** — `sales@calendarpal.com` enterprise email link

### Backend / Edge Functions
- **`src/lib/blocked-countries.ts`** — `support@calendarpal.com` contact email + description text
- **`supabase/functions/send-booking-email/index.ts`** — Calendar UID domain (`@calendarpal.com`), meeting description text, organizer fallback email (`noreply@calendarpal.com`)

---

## What Stays the Same

- Logo image files (`/calendarpal-logo.png`) — the filename doesn't show to users; changing it would require updating all references and is unnecessary for a name change
- All routing, database schema, authentication logic — purely a cosmetic/brand rename
- The `twitterHandle` and social links will be updated to `@bookme_cool` / `bookme.cool` placeholders since the actual social accounts don't exist yet

---

## Technical Notes

- `src/lib/seo-config.ts` is the single source of truth for the brand name across most pages — updating it fixes Navigation, all page SEO titles/descriptions, OG tags, organization schema, and web app schema automatically.
- The `logo` field in seo-config currently references `/calendarpal-logo.png` — this path will be left as-is since the file exists and works; the filename is not user-visible.
- Inline hardcoded mentions in Terms, Support, Privacy, and the email edge function must each be updated individually since they don't use `siteConfig`.

