-- ============================================================
-- FIX: "Database error saving/creating new user" on signup
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================
-- The handle_new_user() trigger runs on every auth.users INSERT.
-- If it fails, signup is completely blocked.
-- This script recreates the trigger function with error handling
-- so signup never fails, even if profile creation has issues.

-- Step 1: Drop and recreate the trigger function with safe error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  )
  ON CONFLICT (id) DO NOTHING;  -- skip if profile already exists
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Log the error but do NOT fail — the API route will create the profile
  RAISE WARNING 'handle_new_user trigger failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Make sure the trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Step 3: Grant necessary permissions to the function owner
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON public.profiles TO postgres;

-- Step 4: Verify the fix by checking the function exists
SELECT proname, prosecdef FROM pg_proc WHERE proname = 'handle_new_user';
