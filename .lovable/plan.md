

## Replace Logo with Theme-Aware Light/Dark Variants

The two uploaded images are full wordmark logos -- one with dark text (for light backgrounds) and one with white text (for dark backgrounds). The current app uses a single `bookme-logo.png` icon everywhere.

### Approach

1. **Copy the two logo images into the project**
   - `public/logo-light.png` -- dark text version (IMG_4897), used on light backgrounds
   - `public/logo-dark.png` -- white text version (IMG_4901), used on dark backgrounds

2. **Create a reusable `ThemeLogo` component** (`src/components/ThemeLogo.tsx`)
   - Accepts `className`, `width`, `height` props
   - Uses `useTheme()` from next-themes to pick the correct image
   - Renders `logo-light.png` in light mode, `logo-dark.png` in dark mode
   - Handles the `mounted` state to avoid hydration flash

3. **Update all logo references** across 4 files:
   - **`src/components/Navigation.tsx`** (3 instances) -- desktop logo, mobile sheet logo
   - **`src/components/Footer.tsx`** (1 instance) -- bottom bar logo
   - **`src/pages/Auth.tsx`** (2 instances) -- left panel logo, mobile logo
   - Replace `<img src="/bookme-logo.png" ...>` with `<ThemeLogo ... />`

4. **Keep favicon and PWA icons unchanged** -- `index.html` favicon and `manifest.json` icons stay as the existing square icon since those don't support theme switching.

### Technical Details

```text
ThemeLogo component:
  - Props: className, width, height, alt (optional)
  - Uses useTheme() + mounted state
  - Returns <img src={theme === "dark" ? "/logo-dark.png" : "/logo-light.png"} />
```

Files modified:
- `src/components/ThemeLogo.tsx` (new)
- `src/components/Navigation.tsx` (replace 3 img tags)
- `src/components/Footer.tsx` (replace 1 img tag)
- `src/pages/Auth.tsx` (replace 2 img tags)

Files added to public:
- `public/logo-light.png`
- `public/logo-dark.png`

