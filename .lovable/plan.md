

## Remove Google OAuth and Clean Up Onboarding

### Changes

**1. Remove Google Sign-In button from Auth page** (`src/pages/Auth.tsx`)
- Remove the `SocialLoginButton` import and component (lines 16, 244-258)
- Remove the "or continue with email" divider since email is now the only option

**2. Remove Google Sign-In button from Get Started flow** (`src/components/get-started/StepAccount.tsx`)
- Remove `SocialLoginButton` import and component (lines 7, 73)
- Remove the "or continue with email" divider (lines 75-82)
- This simplifies the final onboarding step to just email/password registration

**3. Remove OAuth callback logic from GetStarted** (`src/pages/GetStarted.tsx`)
- Remove the `useEffect` that auto-persists when an OAuth user lands on step 4 (lines 86-89), since OAuth sign-up is no longer possible from this flow

**4. Clean up AuthContext OAuth redirect** (`src/contexts/AuthContext.tsx`)
- Remove the special `/get-started` path check in the `onAuthStateChange` handler (lines 52-53), since OAuth won't redirect there anymore

**5. Optionally delete the SocialLoginButton component** (`src/components/auth/SocialLoginButton.tsx`)
- Since it's no longer used anywhere, it can be removed to keep the codebase clean

### Files Modified
- `src/pages/Auth.tsx` -- remove Google button + divider
- `src/components/get-started/StepAccount.tsx` -- remove Google button + divider
- `src/pages/GetStarted.tsx` -- remove OAuth auto-persist effect
- `src/contexts/AuthContext.tsx` -- remove `/get-started` special case
- `src/components/auth/SocialLoginButton.tsx` -- delete file (unused)

