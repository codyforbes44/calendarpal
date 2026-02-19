
# Generate & Implement New BookMe.cool OG Images

## What This Does

The plan triggers AI generation of three 1200×630px Open Graph images (Home, Pricing, Support) via the existing `generate-og-images` edge function, then updates `siteConfig.ogImages` in `src/lib/seo-config.ts` to point to the permanent cloud storage URLs — so every page automatically serves the new branded images to social crawlers.

---

## Current State

| File | Current OG Image Value |
|---|---|
| `siteConfig.ogImages.home` | `/og-home.png` (old static file) |
| `siteConfig.ogImages.pricing` | `/og-pricing.png` (old static file) |
| `siteConfig.ogImages.support` | `/og-support.png` (old static file) |

All three pages (`Index.tsx`, `Pricing.tsx`, `Support.tsx`) already read from `siteConfig.ogImages` and pass the value into the `<SEO>` component — so updating the config is all that's needed on the frontend side.

The `generate-og-images` edge function and the public `og-images` storage bucket are already in place from the previous implementation.

---

## What Will Change

### Step 1 — Generate the three OG images
The edge function `generate-og-images` will be called once for each page (`home`, `pricing`, `support`). It:
1. Sends a detailed visual prompt to `google/gemini-3-pro-image-preview`
2. Receives a 1200×630px PNG as base64
3. Uploads it to the `og-images` public storage bucket as `og-home.png`, `og-pricing.png`, `og-support.png`
4. Returns a permanent public URL

### Step 2 — Update `src/lib/seo-config.ts`
Replace the three local path values with the permanent cloud storage URLs:

```ts
ogImages: {
  home: "https://<project>.supabase.co/storage/v1/object/public/og-images/og-home.png",
  pricing: "https://<project>.supabase.co/storage/v1/object/public/og-images/og-pricing.png",
  support: "https://<project>.supabase.co/storage/v1/object/public/og-images/og-support.png",
},
```

### Step 3 — Update `index.html` static fallback
The `<meta property="og:image">` tag in `index.html` is a static fallback for crawlers that don't execute JavaScript. This will be updated to the new home OG image cloud URL.

---

## Visual Design (unchanged from plan)

All three images share BookMe.cool brand identity:
- Dark gradient background: `#0F172A` → `#1E1B4B`
- Indigo accent: `#6366F1` / `#4F46E5`  
- "BookMe.cool" wordmark top-left
- 1200 × 630 px

**Home** — "Scheduling Made Simple" headline, floating booking UI cards, indigo glow  
**Pricing** — Three tier cards (Free / Pro highlighted / Enterprise), "Simple, honest pricing."  
**Support** — Chat bubbles illustration, "We're here to help.", "24/7 support for BookMe.cool users."

---

## Files Modified

| File | Change |
|---|---|
| `src/lib/seo-config.ts` | Update `ogImages` to cloud storage URLs |
| `index.html` | Update static `og:image` fallback meta tag |

No routing, database, or component changes needed — the SEO wiring is already correct.

---

## Technical Notes

- Image generation takes 30–60 seconds per image (AI model limitation); all three will be triggered in sequence
- The edge function uses `upsert: true` so running it again always overwrites with a fresh version
- The cloud storage bucket `og-images` is already public, so no auth is needed for crawlers to fetch the URLs
- After updating `siteConfig`, all three pages automatically serve the correct image via their existing `ogImage={siteConfig.url + siteConfig.ogImages.home/pricing/support}` props
