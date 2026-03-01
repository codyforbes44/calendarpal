

# Fix Critical Security: Move Google OAuth Tokens to Separate Table

## Problem

The `profiles` table has a public RLS SELECT policy: `"Public can view profiles by username"` with `USING (username IS NOT NULL)`. This means **anyone** can read all columns including `google_access_token` and `google_refresh_token` from any profile with a username set. These tokens grant full access to a user's Google Calendar.

## Solution

Create a new `google_calendar_tokens` table with strict RLS, migrate the token columns there, and remove them from `profiles`.

## Implementation Steps

### 1. Database Migration

Create a new `google_calendar_tokens` table and migrate data:

```sql
-- Create secure token storage table
CREATE TABLE public.google_calendar_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  connected boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.google_calendar_tokens ENABLE ROW LEVEL SECURITY;

-- Only the token owner can read their own tokens
CREATE POLICY "Users can view their own tokens"
  ON public.google_calendar_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only the token owner can insert
CREATE POLICY "Users can insert their own tokens"
  ON public.google_calendar_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Only the token owner can update
CREATE POLICY "Users can update their own tokens"
  ON public.google_calendar_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Only the token owner can delete
CREATE POLICY "Users can delete their own tokens"
  ON public.google_calendar_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Migrate existing data
INSERT INTO public.google_calendar_tokens (user_id, access_token, refresh_token, token_expires_at, connected)
SELECT user_id, google_access_token, google_refresh_token, google_token_expires_at, google_calendar_connected
FROM public.profiles
WHERE google_calendar_connected = true;

-- Remove token columns from profiles (keep google_calendar_connected as a non-sensitive flag)
ALTER TABLE public.profiles
  DROP COLUMN google_access_token,
  DROP COLUMN google_refresh_token,
  DROP COLUMN google_token_expires_at;
```

Note: `google_calendar_connected` stays on `profiles` as a non-sensitive boolean flag for UI display purposes.

### 2. Update Edge Functions (3 files)

**`google-calendar-auth/index.ts`** -- Change all token read/write operations from `profiles` to `google_calendar_tokens`. The `callback` action upserts into `google_calendar_tokens` and also updates `profiles.google_calendar_connected`. The `disconnect` action deletes from `google_calendar_tokens` and sets `profiles.google_calendar_connected = false`. The `refresh` action reads/writes `google_calendar_tokens`.

**`google-calendar-sync/index.ts`** -- Update `getValidToken()` to query `google_calendar_tokens` instead of `profiles`.

**`google-calendar-busy/index.ts`** -- Update its `getValidToken()` to query `google_calendar_tokens` instead of `profiles`.

### 3. Update Frontend (minimal changes)

**`useProfile.ts`** -- No change needed. The `Profile` interface already only exposes `google_calendar_connected` (not the tokens). The tokens were never used client-side.

**`GoogleCalendarSettings.tsx`** -- No change needed. It only reads `profile?.google_calendar_connected`.

**`Dashboard.tsx`** -- No change needed. It only reads `profile?.google_calendar_connected`.

### Summary

| Component | Change |
|---|---|
| New table `google_calendar_tokens` | Strict RLS: owner-only access |
| `profiles` table | Remove 3 token columns, keep `google_calendar_connected` flag |
| 3 edge functions | Query `google_calendar_tokens` instead of `profiles` for tokens |
| Frontend code | No changes needed |

