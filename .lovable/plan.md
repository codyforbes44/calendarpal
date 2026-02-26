

# Onboarding-First Registration Flow

## Overview
Restructure the user experience so new visitors complete the full onboarding wizard (profile setup, event type creation, availability configuration) **before** being asked to register. Their collected data is stored temporarily and persisted to the database only after successful account creation.

## Current Flow
```text
Landing Page -> Auth (register) -> Onboarding (3 steps) -> Dashboard
```

## New Flow
```text
Landing Page -> /get-started (4 steps) -> Dashboard
  Step 1: Profile (name, username)
  Step 2: Event Type (title, duration)
  Step 3: Availability (days, times)
  Step 4: Create Account (email, password, Google OAuth)
```

## Implementation Plan

### 1. Create Onboarding Data Context
**New file: `src/contexts/OnboardingContext.tsx`**

A React context to hold onboarding data in memory across the wizard steps:
- `fullName`, `username`, `eventTitle`, `eventDescription`, `eventDuration`, `availability`, `startTime`, `endTime`
- Setter functions for each field
- A `clearOnboardingData()` method called after successful persistence

### 2. Create New Get Started Page
**New file: `src/pages/GetStarted.tsx`**

A 4-step wizard page at `/get-started`:
- **Steps 1-3**: Reuse the existing onboarding UI (profile, event type, availability) but store data in the OnboardingContext instead of hitting the database
- **Step 4**: Inline registration form (email + password + Google OAuth + terms checkbox) that:
  1. Calls `supabase.auth.signUp()` with collected metadata
  2. On success, persists profile, event type, and availability to the database
  3. Redirects to `/dashboard`
- Username availability check still queries the database in real-time (public RLS policy allows this)
- Progress indicator shows 4 steps instead of 3

### 3. Update Routing
**Edit: `src/App.tsx`**
- Add `/get-started` as a public route (no `ProtectedRoute` wrapper)
- Keep `/onboarding` route for backward compatibility (existing users who haven't completed setup)

### 4. Update Landing Page CTA
**Edit: `src/pages/Index.tsx` (and related CTA components)**
- Change primary "Get Started" / "Sign Up" buttons to link to `/get-started` instead of `/auth`

### 5. Update Auth Context Redirect
**Edit: `src/contexts/AuthContext.tsx`**
- When a user signs in from `/get-started`, skip the automatic redirect to `/onboarding` since data persistence is handled inline on that page
- Add `/get-started` to the path check so the context doesn't interfere

### 6. Update Auth Page
**Edit: `src/pages/Auth.tsx`**
- Add a prominent link/banner: "New here? Set up your account in minutes" pointing to `/get-started`
- Keep the existing login/signup form for returning users

## Technical Details

- **Data persistence order** (Step 4, after successful signup):
  1. `profiles.update()` with `full_name` and `username`
  2. `event_types.insert()` with title, description, duration
  3. `availability.insert()` with enabled days and time range
  4. Show success toast and navigate to `/dashboard`

- **Google OAuth handling**: After OAuth callback returns to `/get-started`, detect the authenticated user, persist the buffered onboarding data, then redirect to dashboard

- **Error handling**: If registration fails, stay on Step 4 with error message; collected data in Steps 1-3 remains intact in context

- **Username validation**: The existing public RLS policy on `profiles` (`username IS NOT NULL`) allows querying username availability without authentication

