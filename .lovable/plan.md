

# Review: Get Started Onboarding Flow -- UX Improvements

## Current State
The flow already follows the correct "data-first" pattern: Steps 1-3 collect profile, event, and availability data, then Step 4 asks for account credentials. This is solid. However, several UX gaps prevent it from being best-in-class.

## Issues Found

### 1. No summary/review before committing
Users fill out 3 steps of data but never see a confirmation of what they entered before creating their account. Best-in-class onboarding shows a compact summary so users feel confident before signing up.

### 2. Missing step labels in progress indicator
The progress dots show position but not purpose. Users can't tell what's coming next or what they've completed. Adding labels like "Profile", "Event", "Hours", "Account" gives orientation.

### 3. Google OAuth uses wrong API
`SocialLoginButton.tsx` calls `supabase.auth.signInWithOAuth()` directly. Since this project uses Lovable Cloud, it must use `lovable.auth.signInWithOAuth()` for managed Google auth to work reliably.

### 4. Step 4 layout is dense
The account step crams Google OAuth, a divider, email/password fields, password strength meter, terms checkbox, submit button, back button, and sign-in link into one view. Restructuring with a review summary at top and cleaner spacing improves scannability.

## Planned Changes

### 1. Add a compact review summary to Step 4
Above the registration form, show a read-only summary card displaying:
- Name and booking URL (from Step 1)
- Event name and duration (from Step 2)  
- Available days and hours (from Step 3)

Each section gets a small "Edit" link that jumps back to the relevant step. This gives users confidence and an easy way to fix mistakes.

### 2. Add step labels to the progress indicator
Replace the plain dots with labeled steps: "Profile", "Event", "Hours", "Account". Keep the current dot animation but add small text labels below each dot.

### 3. Fix Google OAuth to use Lovable Cloud managed auth
Update `SocialLoginButton.tsx` to import from `@/integrations/lovable` and call `lovable.auth.signInWithOAuth("google", ...)` instead of the direct Supabase call.

### 4. Minor UX polish
- Add a subtle border/background to the review summary to visually separate it from the form
- Ensure the "Create Account" button label changes to show what happens next ("Create Account and Go to Dashboard")

## Files Changed

| File | Action |
|------|--------|
| `src/components/get-started/StepAccount.tsx` | Add review summary section above the registration form |
| `src/pages/GetStarted.tsx` | Pass onboarding data to StepAccount for the summary; add step labels |
| `src/components/auth/SocialLoginButton.tsx` | Switch to `lovable.auth.signInWithOAuth()` |

## What Does NOT Change
- Steps 1-3 remain identical
- Database persistence logic unchanged
- Confetti and success screen unchanged
- Keyboard navigation unchanged

