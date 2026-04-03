-- ============================================================
-- COMPLETE FIX: Signup "Database error creating new user"
-- Run this ONCE in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── 1. Drop the trigger that crashes on every signup ──────────
--    The API route (route.ts) creates profiles manually,
--    so the trigger is not needed.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- ── 2. Add missing INSERT policy on profiles ─────────────────
--    The service-role client needs to INSERT profiles from the API.
--    Without this, the upsert in route.ts would be blocked by RLS.
DROP POLICY IF EXISTS "Service role manages profiles" ON profiles;
CREATE POLICY "Service role manages profiles" ON profiles
  FOR ALL USING (auth.role() = 'service_role');

-- ── 3. Verify ────────────────────────────────────────────────
-- Should return 0 rows (trigger is gone):
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Should show the new policy:
SELECT policyname FROM pg_policies WHERE tablename = 'profiles';
