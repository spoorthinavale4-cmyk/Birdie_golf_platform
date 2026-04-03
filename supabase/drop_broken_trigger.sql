-- ============================================================
-- CRITICAL FIX: Drop the broken trigger that blocks signup
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- The handle_new_user() trigger is crashing on every signup,
-- causing the ENTIRE user creation to be rolled back.
-- We drop it here. The API route will create profiles instead.

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Verify it's gone:
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
-- Should return 0 rows
