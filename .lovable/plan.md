
# Mobile-First Best-in-Class Refactor

This is a broad request, so the plan is structured as a phased audit-and-refactor. Each phase is independently shippable so you can approve all of it or stop after any phase.

## Goals

- Mobile-first, accessible, fast, and consistent across every page
- Tighten security (RLS, input validation, edge function hardening)
- Remove dead code, unify patterns, raise polish
- Keep behavior identical unless a defect is found

## Scope (what gets touched)

Public pages, auth, dashboard, bookings, events, availability, clients, settings, admin, public booking + embed, confirmation, edge functions, shared UI primitives.

## Phase 1 — Audit & Baseline (no code changes shipped)

1. Run security scan + linter; capture findings.
2. Read every page/component listed under `src/pages` and `src/components` to catalog:
   - Inconsistent breakpoints / non-mobile-first classes
   - Touch targets <44px
   - Modals not using `ResponsiveModal`
   - Tables without mobile card fallback
   - Forms without zod validation
   - Direct `supabase` calls that should be React Query hooks
   - Duplicate logic (e.g. `PublicBooking` vs `EmbedBooking`)
3. Produce a short defect list and confirm priorities before Phase 2 ships.

## Phase 2 — Foundation & Shared Primitives

- Standardize container: `container mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 pb-bottom-nav` via a `<PageShell>` wrapper.
- Add `<PageHeader>` (title, description, actions) used on every authenticated page.
- Ensure every interactive element meets the 44x44 touch target rule (audit `Button size="icon"` usages).
- Centralize zod schemas in `src/lib/schemas/` (booking, profile, event, auth) and wire them into existing forms.
- Add `useDebouncedValue`, `useMediaQuery` helpers if missing; consolidate `use-mobile`.
- Confetti, share, calendar utils → move to `src/lib/` if duplicated.

## Phase 3 — Mobile-First Page Refactors

For each page below: convert to mobile-first classes, add skeletons, empty states, error states, safe-area padding, and ResponsiveModal where needed.

- `Index`, `Pricing`, `About`, `Support` (public marketing)
- `Auth`, `ResetPassword`, `UpdatePassword`
- `Dashboard` (already strong; tighten card stacking on <375px)
- `Bookings` + `BookingsCalendarView` (mobile calendar fallback to agenda list)
- `Events`, `EventForm` (sticky save bar on mobile)
- `Availability` (collapsible day rows on mobile)
- `Clients` (already has card mode; verify)
- `Settings`, `ProfileSettings`, `Subscription`, `Notifications`
- `PublicBooking`, `EmbedBooking`, `BookingPaymentSuccess`, `GuestBookingManage`
- Admin pages: ensure each table has a mobile card layout + sticky filter bar.

Extract shared logic from `PublicBooking` and `EmbedBooking` into a single `useBookingFlow` hook + `<BookingFlow>` component to remove drift.

## Phase 4 — Performance

- Route-level `React.lazy` + `Suspense` for admin, settings, embed, and confirmation routes.
- Image lazy loading + `loading="lazy"` on all `<img>` tags; switch hero to responsive `srcSet`.
- Memoize heavy chart components and gate analytics queries on viewport visibility (`IntersectionObserver`).
- Audit React Query: set sensible `staleTime` defaults globally, dedupe overlapping queries.
- Trim `index.css` font import to only weights actually used.

## Phase 5 — Accessibility

- Add `aria-label` to all icon-only buttons (audit `lucide-react` usages).
- Verify focus-visible rings on custom buttons/cards.
- Skip-to-content link in `Navigation`.
- Run color-contrast check on success/warning/info tokens in dark mode.
- Forms: associate every input with a `<Label htmlFor>` and surface zod errors via `aria-describedby`.

## Phase 6 — Security & Backend Hygiene

- Re-run security scan; fix any RLS gaps.
- Validate all edge function inputs with zod (`create-booking-payment`, `verify-booking-payment`, `manage-guest-booking`, `geo-appeal`, `bulk-send-emails`, etc.).
- Ensure no edge function logs PII or secrets.
- Confirm `verify_jwt` settings per function are correct.
- Add rate-limit notes to `security-memory` for public endpoints.

## Phase 7 — Polish & QA

- Consistent toasts (single source, success/error/info variants).
- Loading skeletons everywhere a spinner currently exists.
- Empty states with CTA on every list view.
- Manual QA at 320, 375, 414, 768, 1024, 1280 widths for every route.
- Lighthouse pass target: ≥90 mobile on public pages.

## Technical notes

- Keep all design tokens; no new colors. Reuse `--primary`, `--accent`, etc.
- No framework swaps. Stay on React 18 + Vite + Tailwind v3 + shadcn.
- No DB schema changes unless Phase 1 audit surfaces a real bug.
- `src/integrations/supabase/{client,types}.ts` and `.env` remain untouched.

## Deliverable cadence

Each phase ships as its own change set so you can review incrementally. Phase 1 produces a written defect list; you approve which items proceed.

## Open question

Do you want me to execute all 7 phases sequentially without stopping, or pause after Phase 1 so you can review the defect list before any code changes ship? (Recommended: pause after Phase 1.)
