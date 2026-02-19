
# Updated OG Images for BookMe.cool

## Current State

The app currently uses three static OG image files that still carry the old CalendarPal identity:
- `/public/og-home.png` — used on the homepage
- `/public/og-pricing.png` — used on the Pricing page
- `/public/og-support.png` — used on the Support page

These are referenced in `src/lib/seo-config.ts` via `siteConfig.ogImages` and consumed by the `<SEO>` component on each page.

---

## Approach

AI image generation will be used (via an edge function) to create three new 1200×630px OG images — the standard Open Graph dimensions optimised for Twitter/X, LinkedIn, Facebook, and Slack unfurls — then save them to cloud file storage so they are served from a stable public URL.

### Why an edge function?
- Image generation produces base64 payloads too large to handle in the browser
- The edge function generates the image, uploads it to cloud storage, and returns the public URL
- Generated images are stored permanently and don't need to be regenerated on every page load

---

## Visual Design (per image)

All three images share a consistent brand language:

| Element | Value |
|---|---|
| Background | Dark gradient: `#0F172A` → `#1E1B4B` (slate to indigo-dark) |
| Accent colour | Indigo `#6366F1` / `#4F46E5` |
| Logo mark | Calendar icon + "BookMe.cool" wordmark, top-left |
| Typography | Clean sans-serif, white headings |
| Dimensions | 1200 × 630 px |

**Home OG** — Hero layout: bold "Scheduling Made Simple" headline, subtext "Book meetings in seconds. No back-and-forth.", two floating UI cards showing a mock booking confirmation, indigo glow effect bottom-right.

**Pricing OG** — Three pricing tiers (Free / Pro / Enterprise) shown as cards, "Pro" card highlighted in indigo, headline "Simple, honest pricing."

**Support OG** — FAQ/chat illustration, headline "We're here to help.", subtext "24/7 support for BookMe.cool users."

---

## Implementation Steps

### 1. Create `generate-og-images` edge function
A new Deno edge function that:
1. Accepts a `page` parameter (`home`, `pricing`, `support`)
2. Calls the AI image generation model with a detailed prompt for that page's OG design
3. Uploads the resulting base64 PNG to cloud storage bucket `og-images`
4. Returns the public URL

### 2. Create storage bucket
Add a `og-images` public storage bucket via database migration.

### 3. Create `OGImageGenerator` admin utility page
A simple admin-only React component at `/admin/og-images` that:
- Shows three buttons: "Generate Home OG", "Generate Pricing OG", "Generate Support OG"
- Calls the edge function for each
- Displays the generated image for preview
- On success, shows the public URL to copy

### 4. Update `seo-config.ts` after generation
Once generated, update `siteConfig.ogImages` to point to the cloud storage public URLs instead of the local `/og-*.png` files.

### 5. Wire up per-page OG images
Confirm each page already passes the correct `ogImage` prop to `<SEO>`:
- `Index.tsx` → `siteConfig.ogImages.home` ✓
- `Pricing.tsx` → needs `ogImage={siteConfig.ogImages.pricing}` confirmed
- `Support.tsx` → needs `ogImage={siteConfig.ogImages.support}` confirmed
- `index.html` → update the static fallback tags to use the new URLs

---

## Technical Notes

- The AI model used will be `google/gemini-3-pro-image-preview` for highest quality output suitable for OG images
- The edge function uses `LOVABLE_API_KEY` (pre-configured, no user input needed)
- Storage bucket is set to **public read** so OG images are accessible to social media crawlers without authentication
- OG image dimensions: 1200×630 is the universal standard (Twitter min 600×314, Facebook recommended 1200×630)
- The admin utility is behind `AdminRouteGuard` so only admins can trigger regeneration
- After generation, the static `/public/og-*.png` fallback files remain as backups
