-- ============================================================
-- FIX: Infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor
-- ============================================================
-- Problem: Admin-check policies on 'profiles' query profiles itself,
-- re-triggering RLS → infinite loop (error 42P17).
-- Solution: Use a SECURITY DEFINER function that bypasses RLS.

-- Step 1: Create a helper function that checks admin role WITHOUT triggering RLS
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Step 2: Drop and recreate the recursive policies on profiles
DROP POLICY IF EXISTS "Admins read all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins update all profiles" ON profiles;

CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Admins update all profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

-- Step 3: Fix admin policies on other tables that also query profiles
-- Subscriptions
DROP POLICY IF EXISTS "Admins read all subscriptions" ON subscriptions;
CREATE POLICY "Admins read all subscriptions" ON subscriptions
  FOR SELECT USING (public.is_admin());

-- Golf Scores
DROP POLICY IF EXISTS "Admins manage all scores" ON golf_scores;
CREATE POLICY "Admins manage all scores" ON golf_scores
  FOR ALL USING (public.is_admin());

-- Draws
DROP POLICY IF EXISTS "Published draws are public" ON draws;
CREATE POLICY "Published draws are public" ON draws
  FOR SELECT USING (status = 'published' OR public.is_admin());

DROP POLICY IF EXISTS "Admins manage draws" ON draws;
CREATE POLICY "Admins manage draws" ON draws
  FOR ALL USING (public.is_admin());

-- Draw Entries
DROP POLICY IF EXISTS "Admins read all entries" ON draw_entries;
CREATE POLICY "Admins read all entries" ON draw_entries
  FOR ALL USING (public.is_admin());

-- Winners
DROP POLICY IF EXISTS "Admins manage winners" ON winners;
CREATE POLICY "Admins manage winners" ON winners
  FOR ALL USING (public.is_admin());

-- Charities
DROP POLICY IF EXISTS "Admins manage charities" ON charities;
CREATE POLICY "Admins manage charities" ON charities
  FOR ALL USING (public.is_admin());

-- Charity Contributions
DROP POLICY IF EXISTS "Admins read all contributions" ON charity_contributions;
CREATE POLICY "Admins read all contributions" ON charity_contributions
  FOR ALL USING (public.is_admin());

-- Storage (admin-gated policies)
DROP POLICY IF EXISTS "Admins upload charity images" ON storage.objects;
CREATE POLICY "Admins upload charity images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'charity-images' AND public.is_admin()
  );

DROP POLICY IF EXISTS "Admins read all proofs" ON storage.objects;
CREATE POLICY "Admins read all proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'winner-proofs' AND public.is_admin()
  );
