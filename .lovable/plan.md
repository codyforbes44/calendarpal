
# Global Page Containerization and Scroll-to-Top

## Problem
1. **No scroll-to-top on navigation** -- When users navigate between pages, the scroll position carries over, leaving them mid-page instead of at the top.
2. **Inconsistent page padding** -- `Terms.tsx`, `Privacy.tsx`, and `ProfileSettings.tsx` use hardcoded `px-6` instead of the responsive `px-4 sm:px-6 lg:px-8` pattern used elsewhere.

## Implementation

### 1. Create a ScrollToTop Component
A small component placed inside `BrowserRouter` in `App.tsx` that listens to route changes and scrolls the window to the top on every navigation.

**New file:** `src/components/ScrollToTop.tsx`

### 2. Add ScrollToTop to App.tsx
Import and render `<ScrollToTop />` as the first child inside `<BrowserRouter>`, before `<Routes>`.

### 3. Fix Inconsistent Page Padding
Update the following pages to use the standard responsive padding pattern (`px-4 sm:px-6 lg:px-8`):

| File | Current | Fix |
|------|---------|-----|
| `src/pages/Terms.tsx` | `px-6 py-24` | `px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12` |
| `src/pages/Privacy.tsx` | `px-6 py-24` | `px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-12` |
| `src/pages/ProfileSettings.tsx` | `px-4 sm:px-6` (missing `lg:px-8`) | `px-4 sm:px-6 lg:px-8` |
| Terms/Privacy footer containers | `px-6` | `px-4 sm:px-6 lg:px-8` |

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/ScrollToTop.tsx` | **New** -- scroll-to-top on route change |
| `src/App.tsx` | Import and render `<ScrollToTop />` |
| `src/pages/Terms.tsx` | Fix container padding to responsive pattern |
| `src/pages/Privacy.tsx` | Fix container padding to responsive pattern |
| `src/pages/ProfileSettings.tsx` | Add missing `lg:px-8` to container |
