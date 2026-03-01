
# Hero Sections UX Refactor Plan

## Problems Identified

1. **About, Pricing, Support hero sections are too short** -- the background images have no room to display because the hero wrappers lack vertical padding. The `HeroBackground` fills absolute-positioned space, but the parent containers are only as tall as the text content.

2. **Text readability over backgrounds** -- text content on About, Pricing, and Support pages lacks `relative z-10`, meaning the gradient overlay can interfere with text layering.

3. **HeroBackground gradient is not responsive** -- mobile screens need a stronger overlay for text readability on smaller text, but desktop can afford a lighter overlay to show more of the image.

4. **Home hero mobile height** -- `min-h-screen` pushes automation cards far below the fold with no scroll cue; should be `min-h-[85vh]` on mobile.

5. **Home hero floating card clips** -- the `absolute -bottom-4 -left-4` card overflows its container on some screens.

6. **Missing LCP optimization** -- `fetchpriority="high"` missing from hero image.

---

## Changes by File

### 1. `src/components/HeroBackground.tsx`
- Add `fetchpriority="high"` and `sizes="100vw"` to the `<img>` tag for performance.
- Make the gradient overlay responsive: stronger on mobile (`from-background/60 via-background/40 to-background/70`) and lighter on desktop (`sm:from-background/30 sm:via-background/15 sm:to-background/50`).

### 2. `src/components/Hero.tsx` (Home page)
- Change `min-h-screen` to `min-h-[85vh] sm:min-h-screen` so mobile doesn't push everything too far down.
- Fix floating card positioning from `-bottom-4 -left-4` to `-bottom-6 -left-2` to avoid clipping.
- Improve trust indicator gap for better wrapping: `gap-x-4 gap-y-2`.

### 3. `src/pages/About.tsx`
- Add vertical padding and overflow handling to the hero section wrapper: `py-12 sm:py-16 lg:py-20 overflow-hidden rounded-2xl`.
- Add `relative z-10` to the text content (h1 and p) so they layer above the gradient overlay.

### 4. `src/pages/Pricing.tsx`
- Add vertical padding to the hero header wrapper: `py-10 sm:py-14 lg:py-16 overflow-hidden rounded-2xl`.
- Add `relative z-10` to heading and description text.

### 5. `src/pages/Support.tsx`
- Add vertical padding to the hero wrapper: `py-10 sm:py-14 lg:py-16 overflow-hidden rounded-2xl`.
- Add `relative z-10` to heading and description text.

### 6. `src/pages/Auth.tsx`
- Add `relative z-10` to the marketing content wrapper to ensure proper layering over the hero background.

---

## Summary

These changes ensure:
- Hero background images have sufficient height to be visible and impactful across all devices
- Text always remains readable with responsive gradient overlays (stronger on mobile, lighter on desktop)
- Proper z-index layering so text sits above overlays
- Better mobile viewport usage without pushing content too far below the fold
- Improved LCP performance with `fetchpriority`
- No clipping issues with floating elements
