

# Refactor GetStarted Onboarding Flow

## Overview
The `/get-started` page works end-to-end but has grown to 558 lines with several code quality issues. This refactor improves maintainability, fixes potential bugs, and removes dead code -- without changing any user-facing behavior.

## Issues Found

1. **Unused import**: `useRef` is imported but never used
2. **Missing useEffect cleanup**: The `setTimeout` for dashboard redirect and `requestAnimationFrame` for confetti are never cleaned up -- can cause state updates on unmounted components
3. **Unsafe useEffect dependencies**: The OAuth `useEffect` references `persistAndRedirect` and `registeredViaForm` but only lists `[user]` in deps -- risks stale closures
4. **Duplicated logic**: `Onboarding.tsx` (legacy route) duplicates the same availability defaults, username check, and persist-to-DB logic found in `GetStarted.tsx`
5. **Monolithic component**: All 4 steps, success screen, confetti, and DB persistence live in one 558-line file

## Planned Changes

### 1. Clean up imports and fix lint issues
- Remove unused `useRef` import from `GetStarted.tsx`

### 2. Fix effect cleanup and stale closure bugs
- Store the `setTimeout` ID for the redirect in a ref and clear it on unmount
- Cancel the confetti `requestAnimationFrame` loop on unmount
- Wrap `persistAndRedirect` in `useCallback` with proper dependencies so the OAuth `useEffect` is safe

### 3. Extract confetti logic into a reusable utility
- Create `src/lib/confetti.ts` with a `fireConfetti()` function
- Use it from `GetStarted.tsx` (and available for future celebration moments)

### 4. Extract step UI into sub-components
- Create `src/components/get-started/StepProfile.tsx` (Step 1)
- Create `src/components/get-started/StepEvent.tsx` (Step 2)
- Create `src/components/get-started/StepAvailability.tsx` (Step 3)
- Create `src/components/get-started/StepAccount.tsx` (Step 4)
- Create `src/components/get-started/SuccessScreen.tsx` (success view)
- The parent `GetStarted.tsx` shrinks to ~120 lines orchestrating steps, state, and DB calls

### 5. Extract shared persistence logic
- Create `src/lib/onboarding-persist.ts` with a `persistOnboardingData(userId, data)` function
- Reuse from both `GetStarted.tsx` and `Onboarding.tsx`, eliminating ~40 lines of duplication

### 6. Deduplicate availability defaults
- `OnboardingContext.tsx` and `Onboarding.tsx` both define `DEFAULT_AVAILABILITY` independently
- Export it from `OnboardingContext.tsx` and import it in `Onboarding.tsx`

## Files Changed
| File | Action |
|------|--------|
| `src/lib/confetti.ts` | New -- reusable confetti helper |
| `src/lib/onboarding-persist.ts` | New -- shared DB persistence |
| `src/components/get-started/StepProfile.tsx` | New -- Step 1 UI |
| `src/components/get-started/StepEvent.tsx` | New -- Step 2 UI |
| `src/components/get-started/StepAvailability.tsx` | New -- Step 3 UI |
| `src/components/get-started/StepAccount.tsx` | New -- Step 4 UI |
| `src/components/get-started/SuccessScreen.tsx` | New -- success view |
| `src/pages/GetStarted.tsx` | Refactored -- orchestrator only |
| `src/pages/Onboarding.tsx` | Updated -- use shared persist + defaults |
| `src/contexts/OnboardingContext.tsx` | Updated -- export `DEFAULT_AVAILABILITY` |

## What Does NOT Change
- All user-facing behavior, animations, and flow remain identical
- No database or auth changes
- No new dependencies

