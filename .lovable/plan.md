
# Fix Hero Section Consistency Across Pages

## Issue
The About and Pricing hero sections are constrained to `max-w-3xl mx-auto`, creating a nicely contained card-like hero. The Support page hero, however, spans the full container width, making it visually inconsistent with the other pages.

## Changes

### 1. `src/pages/Support.tsx` -- Match hero width to About/Pricing
- Add `max-w-3xl mx-auto` to the hero wrapper div (line 60) so it matches the About and Pricing pages
- This creates a consistent, contained hero card across all three public pages

### 2. No changes needed for About.tsx or Pricing.tsx
- Both pages already have the correct `max-w-3xl mx-auto` constraint with proper padding, rounded corners, and z-index layering
- The hero backgrounds, text readability, and responsive behavior are working correctly as shown in the screenshots

## Technical Detail

```text
Before (Support):
<div className="relative text-center mb-10 sm:mb-16 py-10 sm:py-14 lg:py-16 overflow-hidden rounded-2xl">

After (Support):
<div className="relative text-center max-w-3xl mx-auto mb-10 sm:mb-16 py-10 sm:py-14 lg:py-16 overflow-hidden rounded-2xl">
```

This is a single-line change that brings visual consistency across all three pages.
