

# Comprehensive Mobile-First Refactor & Best Practices Audit

## Current State Assessment

The codebase is **already in good shape** for mobile responsiveness — most pages use mobile-first breakpoints (`px-4 sm:px-6 lg:px-8`), bottom navigation exists, and touch targets are generally adequate. However, there are specific areas that need improvement.

## Areas Requiring Changes

### 1. Dialogs/Modals → Bottom Sheet on Mobile
**Files:** `SavePromptModal.tsx`, `ShareModal.tsx`, `BookingDetailModal.tsx`, `RescheduleDialog.tsx`, `EventTypesList.tsx` (QR modal)

Currently all use `<Dialog>` which renders as a centered modal on all screen sizes. On mobile, these should use `<Drawer>` (vaul) for a bottom-sheet UX pattern. Implementation: create a `ResponsiveModal` wrapper that renders `Drawer` on mobile, `Dialog` on desktop.

### 2. Tables → Card Layout on Mobile
**Files:** `Clients.tsx`, `AdminInviteCodes.tsx`, `AdminBookings.tsx`, `AdminUsers.tsx`

The Clients page uses `<Table>` which is hard to read on mobile. Convert to card-based layout on mobile with `md:hidden` / `hidden md:block` pattern.

### 3. Analytics Email Stats Grid
**File:** `BookingAnalytics.tsx`

The 6-column email stats grid (`grid-cols-2 lg:grid-cols-6`) cramts on small screens. Change to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`.

### 4. OnboardingWizard Mobile Polish
**File:** `OnboardingWizard.tsx`

Action buttons should stack below text on small screens. The step items' flex layout can clip action buttons. Add `flex-wrap` and adjust gap/padding.

### 5. GuestSaveBanner Mobile Layout
**File:** `GuestSaveBanner.tsx`

The banner uses `flex items-center` which can overflow on narrow screens. Stack vertically on mobile.

### 6. Calendar Heatmap Overflow
**File:** `CalendarHeatmap.tsx`

28-day grid may overflow on narrow mobile. Ensure horizontal scroll or reduce cell sizes.

### 7. Pie Chart Labels
**File:** `BookingAnalytics.tsx`

`label` on PieChart gets cut off on mobile. Hide labels on small screens, rely on Legend only.

### 8. Input Font Size (iOS Zoom Prevention)
**File:** `Input` component

Already uses `text-base md:text-sm` which prevents iOS zoom. This is correct.

### 9. Lazy Loading & Suspense
Already implemented in `App.tsx` with `React.lazy` for all routes. No changes needed.

### 10. Missing touch-target sizes
**Files:** Various icon buttons (e.g., `BookingActionsDropdown`, sort buttons in `Clients.tsx`)

Ensure all icon-only buttons use `min-h-[44px] min-w-[44px]`.

## Implementation Plan (Grouped by Priority)

### Phase 1: ResponsiveModal Component
Create a `ResponsiveModal` component that wraps `Dialog` (desktop) and `Drawer` (mobile) using `useIsMobile()`. Apply it to:
- `SavePromptModal.tsx`
- `ShareModal.tsx`
- `BookingDetailModal.tsx`
- `RescheduleDialog.tsx`
- `EventTypesList.tsx` QR modal

### Phase 2: Table-to-Card Mobile Layouts
- **`Clients.tsx`**: Render card list on `md:hidden`, table on `hidden md:block`
- **`AdminInviteCodes.tsx`**: Same pattern
- **`AdminBookings.tsx`**: Same pattern (already has some responsive handling but uses table)

### Phase 3: Grid & Layout Fixes
- `BookingAnalytics.tsx`: Fix 6-col grid to `grid-cols-2 sm:grid-cols-3 lg:grid-cols-6`
- `OnboardingWizard.tsx`: Add responsive wrapping for step items
- `GuestSaveBanner.tsx`: Stack layout on mobile
- `CalendarHeatmap.tsx`: Add `overflow-x-auto` wrapper
- `BookingAnalytics.tsx` PieChart: Conditionally hide labels on mobile

### Phase 4: Touch Targets & Accessibility
- Audit all icon buttons for 44px minimum
- Add `aria-label` to icon-only buttons missing them
- Ensure focus rings are visible on all interactive elements
- Sort buttons in `Clients.tsx` need larger touch targets

### Phase 5: Consistency Pass
- Ensure all loading states use skeleton patterns (most already do)
- Verify dark mode on all components (the design system handles this well already)
- Standardize card padding to `p-4 sm:p-6` (most already follow this)

## Files to Create
| File | Purpose |
|------|---------|
| `src/components/ui/responsive-modal.tsx` | Dialog on desktop, Drawer on mobile |

## Files to Modify (~15 files)
| File | Change |
|------|--------|
| `SavePromptModal.tsx` | Use ResponsiveModal |
| `ShareModal.tsx` | Use ResponsiveModal |
| `BookingDetailModal.tsx` | Use ResponsiveModal |
| `RescheduleDialog.tsx` | Use ResponsiveModal |
| `EventTypesList.tsx` | Use ResponsiveModal for QR |
| `Clients.tsx` | Card layout on mobile |
| `AdminInviteCodes.tsx` | Card layout on mobile |
| `BookingAnalytics.tsx` | Fix grid, pie chart labels |
| `OnboardingWizard.tsx` | Responsive step items |
| `GuestSaveBanner.tsx` | Stack on mobile |
| `CalendarHeatmap.tsx` | Overflow handling |
| `Bookings.tsx` | Touch target audit |
| `Notifications.tsx` | Touch target audit |
| `ProfileSettings.tsx` | Minor spacing consistency |

## What's Already Good (No Changes Needed)
- Lazy loading with React.lazy + Suspense
- Bottom navigation on mobile
- Input font sizes (iOS zoom safe)
- DashboardStats grid (already 2-col mobile, 4-col desktop)
- QuickActions grid (already 2x2 mobile, 4-col desktop)
- Consistent `pb-bottom-nav` usage
- Empty states with CTAs throughout
- Error boundary exists
- Dark mode CSS variables properly set up
- Skeleton loading on most data-fetching components

