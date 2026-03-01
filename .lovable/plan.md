

## AI-Generated Hero Background Images for All Public Pages

### Overview
Create a new edge function that uses the Gemini image generation model to produce unique, high-quality hero background images for each public page. The images will be stored in a storage bucket and loaded as subtle background images behind each page's hero section.

### Pages Receiving Hero Backgrounds (5 total)
1. **Home** (Hero component) -- scheduling automation theme
2. **About** -- team/mission abstract theme
3. **Pricing** -- plans/value abstract theme
4. **Support** -- help/community theme
5. **Auth** -- left panel background (desktop)

### Implementation Steps

**1. Create a storage bucket for hero images**
- SQL migration to create a `hero-images` public storage bucket (or reuse `og-images`)
- Allow public read access via RLS policy

**2. Create `generate-hero-images` edge function**
- Accepts `{ page: string }` with valid values: `home`, `about`, `pricing`, `support`, `auth`
- Uses `google/gemini-3-pro-image-preview` model for high-quality generation
- Each page gets a carefully crafted prompt for a 1920x1080 abstract background that complements the brand (deep indigo + coral palette, subtle gradients)
- Uploads result to `hero-images` storage bucket
- Returns the public URL

**3. Create a reusable `HeroBackground` component**
- New component: `src/components/HeroBackground.tsx`
- Accepts `page` prop, constructs the storage URL for the matching image
- Renders an absolutely positioned `<img>` with `object-cover`, low opacity (15-25%), and a gradient overlay to ensure text readability
- Gracefully falls back to the current CSS gradient background if image fails to load

**4. Integrate `HeroBackground` into each page's hero section**
- **`src/components/Hero.tsx`** (Home): Add `<HeroBackground page="home" />` inside the existing hero section, behind the animated blobs
- **`src/pages/About.tsx`**: Wrap hero section with relative positioning, add background
- **`src/pages/Pricing.tsx`**: Add to the header area
- **`src/pages/Support.tsx`**: Add to the header area
- **`src/pages/Auth.tsx`**: Add to the left marketing panel

**5. Admin trigger or manual invocation**
- Add a simple way to generate/regenerate images (could be invoked via the existing admin panel or manually via edge function call)

### Technical Details

```text
Edge function: supabase/functions/generate-hero-images/index.ts
  - Model: google/gemini-3-pro-image-preview
  - Resolution requested: 1920x1080 per prompt
  - Storage: hero-images bucket, files named hero-{page}.png
  - Auth: LOVABLE_API_KEY (auto-provisioned)

HeroBackground component:
  Props: { page: string; opacity?: number; className?: string }
  - Constructs URL: {SUPABASE_URL}/storage/v1/object/public/hero-images/hero-{page}.png
  - Renders: absolute positioned img with object-cover + gradient overlay
  - Handles: onError fallback (hides image, keeps CSS gradient)

Prompt strategy per page:
  - home: Abstract flowing calendar/time shapes, deep indigo-to-purple gradient, subtle coral highlights
  - about: Soft interconnected nodes/people silhouettes, indigo tones, warm light
  - pricing: Abstract geometric tiers/steps, indigo gradient, coral accent glow
  - support: Soft chat bubble/help shapes, warm indigo, friendly light rays
  - auth: Professional abstract pattern, deep indigo, subtle depth/parallax feel
```

### Files Created
- `supabase/functions/generate-hero-images/index.ts` (new edge function)
- `src/components/HeroBackground.tsx` (new reusable component)

### Files Modified
- `src/components/Hero.tsx` -- add HeroBackground behind existing content
- `src/pages/About.tsx` -- add HeroBackground to hero section
- `src/pages/Pricing.tsx` -- add HeroBackground to header
- `src/pages/Support.tsx` -- add HeroBackground to header
- `src/pages/Auth.tsx` -- add HeroBackground to left panel

### Database Migration
- Create `hero-images` storage bucket with public read access
