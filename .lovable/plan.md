

## Strategy: "Try Before You Sign Up"

The current flow forces users to create an account before seeing any value. The proposed change flips this: let visitors **experience the full platform as a guest** — create a profile, set up event types, configure availability — and only ask them to register when they want to **save their work**.

This is the "product-led growth" approach used by tools like Canva and Figma. It dramatically reduces signup friction because users are already invested by the time they hit the registration wall.

### How It Works

1. **Landing page CTA → `/get-started`** (already exists, no auth required)
2. **Steps 1-3 remain identical** — profile, event type, availability — all stored in localStorage via `OnboardingContext`
3. **Step 4 changes from "Account" to "Save Your Setup"** — reframed messaging: "Create an account to save everything you just built" instead of "Create Account"
4. **Add a "Preview Dashboard" step** — after step 3, show users a realistic preview of what their dashboard/booking page will look like with the data they entered, then prompt registration
5. **Allow guest exploration of dashboard pages** — protected routes show a "save banner" instead of redirecting to `/auth`

### Implementation Plan

#### 1. Reframe the GetStarted flow (Step 4)
- Change `StepAccount` heading from "Create your account" to **"Save your setup"**
- Update messaging to emphasize they'll lose their work without registering
- Add a live preview of their booking page URL and configured schedule before the registration fields
- Keep invite code + terms + email/password as-is

#### 2. Create a "Guest Mode" for dashboard pages
- Modify `ProtectedRoute` to support a `guestAllowed` prop
- When `guestAllowed=true` and no user is logged in, render children but show a persistent **"Sign up to save" banner** at the top
- Apply `guestAllowed` to: `/dashboard`, `/events`, `/availability`, `/settings`
- Guest mode reads data from `OnboardingContext` / localStorage instead of database
- All write operations (save, create, update) trigger a registration prompt modal

#### 3. Add a registration prompt modal
- New `SavePromptModal` component that appears when a guest tries to save anything
- Shows a summary of what they've configured so far
- Contains the registration form (email, password, invite code, terms)
- On success: persists all localStorage data to database, redirects to dashboard

#### 4. Update CTAs and navigation
- Landing page "Get Started" → still goes to `/get-started`
- Add "Try it free" button that goes directly to `/dashboard` in guest mode
- Navigation shows "Sign up to save" instead of user avatar when in guest mode
- Bottom navigation works in guest mode

#### 5. Update Auth flow
- `/auth` sign-up form checks for existing onboarding data in localStorage
- If found, auto-persist after successful registration (same as current GetStarted step 4)
- This handles users who explore as guest, leave, come back, and sign up from `/auth`

### Files to create/modify

| File | Change |
|------|--------|
| `src/components/ProtectedRoute.tsx` | Add `guestAllowed` prop, show save banner for guests |
| `src/components/GuestSaveBanner.tsx` | **New** — persistent banner for guest users |
| `src/components/SavePromptModal.tsx` | **New** — registration modal triggered on save attempts |
| `src/components/get-started/StepAccount.tsx` | Reframe copy to "Save your setup" |
| `src/pages/Dashboard.tsx` | Support guest mode with localStorage data |
| `src/pages/Events.tsx` | Support guest mode |
| `src/pages/Availability.tsx` | Support guest mode |
| `src/App.tsx` | Add `guestAllowed` to select protected routes |
| `src/components/Navigation.tsx` | Show guest CTA when not authenticated |
| `src/contexts/OnboardingContext.tsx` | Add helper to check if guest has unsaved data |
| `src/hooks/useGuestMode.ts` | **New** — hook to detect guest state and trigger save prompts |

### Key technical decisions
- **localStorage as guest storage** — already in use via `OnboardingContext`, just needs to be read by dashboard components
- **No database writes without auth** — all guest interactions are client-side only
- **Invite code still required at registration** — maintains exclusivity while removing exploration friction
- **Graceful degradation** — features requiring server data (bookings, analytics) show empty states with sample/demo data in guest mode

