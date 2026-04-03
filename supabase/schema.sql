-- ============================================================
-- GOLF CHARITY PLATFORM — Complete Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- ▸ EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ▸ ENUMS
CREATE TYPE subscription_plan AS ENUM ('monthly', 'yearly');
CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'lapsed', 'trialing');
CREATE TYPE draw_status AS ENUM ('draft', 'simulated', 'published');
CREATE TYPE draw_type AS ENUM ('random', 'algorithmic');
CREATE TYPE winner_tier AS ENUM ('five', 'four', 'three');
CREATE TYPE winner_status AS ENUM ('pending', 'verified', 'rejected', 'paid');
CREATE TYPE user_role AS ENUM ('subscriber', 'admin');

-- ============================================================
-- TABLES
-- ============================================================

-- PROFILES (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role DEFAULT 'subscriber',
  charity_id UUID,
  charity_percentage INT DEFAULT 10 CHECK (charity_percentage >= 10 AND charity_percentage <= 100),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHARITIES
CREATE TABLE charities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  short_description TEXT,
  image_url TEXT,
  website_url TEXT,
  featured BOOLEAN DEFAULT FALSE,
  active BOOLEAN DEFAULT TRUE,
  total_contributions NUMERIC DEFAULT 0,
  upcoming_events JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from profiles to charities
ALTER TABLE profiles ADD CONSTRAINT profiles_charity_fk 
  FOREIGN KEY (charity_id) REFERENCES charities(id) ON DELETE SET NULL;

-- SUBSCRIPTIONS
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan subscription_plan NOT NULL,
  status subscription_status DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GOLF SCORES
CREATE TABLE golf_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score >= 1 AND score <= 45),
  played_at DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRAWS
CREATE TABLE draws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL UNIQUE, -- always 1st of month
  status draw_status DEFAULT 'draft',
  draw_type draw_type DEFAULT 'random',
  winning_numbers INT[] CHECK (array_length(winning_numbers, 1) = 5),
  pool_total NUMERIC DEFAULT 0,
  jackpot_carried_forward NUMERIC DEFAULT 0,
  five_match_pool NUMERIC DEFAULT 0,
  four_match_pool NUMERIC DEFAULT 0,
  three_match_pool NUMERIC DEFAULT 0,
  total_entries INT DEFAULT 0,
  simulation_numbers INT[],
  notes TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- DRAW ENTRIES (snapshot of user scores at draw time)
CREATE TABLE draw_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  numbers INT[] NOT NULL,
  matched_count INT DEFAULT 0,
  tier winner_tier,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(draw_id, user_id)
);

-- WINNERS
CREATE TABLE winners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  draw_id UUID NOT NULL REFERENCES draws(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tier winner_tier NOT NULL,
  prize_amount NUMERIC NOT NULL,
  proof_url TEXT,
  admin_notes TEXT,
  status winner_status DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHARITY CONTRIBUTIONS
CREATE TABLE charity_contributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  charity_id UUID NOT NULL REFERENCES charities(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  month DATE NOT NULL,
  subscription_id UUID REFERENCES subscriptions(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Rolling 5-score limit (DB-enforced)
CREATE OR REPLACE FUNCTION enforce_score_limit()
RETURNS TRIGGER AS $$
DECLARE
  excess_count INT;
BEGIN
  -- Count how many scores this user has AFTER the insert
  SELECT COUNT(*) - 5 INTO excess_count
  FROM golf_scores
  WHERE user_id = NEW.user_id;

  -- Delete oldest scores beyond limit
  IF excess_count > 0 THEN
    DELETE FROM golf_scores
    WHERE id IN (
      SELECT id FROM golf_scores
      WHERE user_id = NEW.user_id
      ORDER BY played_at ASC, created_at ASC
      LIMIT excess_count
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_score_insert
  AFTER INSERT ON golf_scores
  FOR EACH ROW EXECUTE FUNCTION enforce_score_limit();

-- Update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER draws_updated_at BEFORE UPDATE ON draws
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER charities_updated_at BEFORE UPDATE ON charities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER winners_updated_at BEFORE UPDATE ON winners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Helper: bypass-RLS admin check to avoid infinite recursion (42P17)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE golf_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE draws ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE charities ENABLE ROW LEVEL SECURITY;
ALTER TABLE charity_contributions ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins read all profiles" ON profiles
  FOR SELECT USING (public.is_admin());
CREATE POLICY "Admins update all profiles" ON profiles
  FOR UPDATE USING (public.is_admin());

-- Subscriptions
CREATE POLICY "Users read own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role manages subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Admins read all subscriptions" ON subscriptions
  FOR SELECT USING (public.is_admin());

-- Golf Scores
CREATE POLICY "Users manage own scores" ON golf_scores
  FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins manage all scores" ON golf_scores
  FOR ALL USING (public.is_admin());

-- Draws
CREATE POLICY "Published draws are public" ON draws
  FOR SELECT USING (status = 'published' OR public.is_admin());
CREATE POLICY "Admins manage draws" ON draws
  FOR ALL USING (public.is_admin());

-- Draw Entries
CREATE POLICY "Users read own entries" ON draw_entries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all entries" ON draw_entries
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role manages entries" ON draw_entries
  FOR ALL USING (auth.role() = 'service_role');

-- Winners
CREATE POLICY "Users read own winnings" ON winners
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users upload proof" ON winners
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage winners" ON winners
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role manages winners" ON winners
  FOR ALL USING (auth.role() = 'service_role');

-- Charities (public read)
CREATE POLICY "Public can read active charities" ON charities
  FOR SELECT USING (active = TRUE);
CREATE POLICY "Admins manage charities" ON charities
  FOR ALL USING (public.is_admin());

-- Charity Contributions
CREATE POLICY "Users read own contributions" ON charity_contributions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins read all contributions" ON charity_contributions
  FOR ALL USING (public.is_admin());
CREATE POLICY "Service role manages contributions" ON charity_contributions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('charity-images', 'charity-images', TRUE);

INSERT INTO storage.buckets (id, name, public)
VALUES ('winner-proofs', 'winner-proofs', FALSE);

CREATE POLICY "Anyone can view charity images" ON storage.objects
  FOR SELECT USING (bucket_id = 'charity-images');

CREATE POLICY "Admins upload charity images" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'charity-images' AND public.is_admin()
  );

CREATE POLICY "Winners upload own proofs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'winner-proofs' AND auth.uid() IS NOT NULL
  );

CREATE POLICY "Admins read all proofs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'winner-proofs' AND public.is_admin()
  );

-- ============================================================
-- SEED — Default Charities
-- ============================================================

INSERT INTO charities (name, description, short_description, image_url, website_url, featured, active) VALUES
(
  'Cancer Research UK',
  'Cancer Research UK is the world largest independent cancer research charity dedicated to saving lives through research, influence and information. We''ve been pioneering cancer research for over 100 years, and our work has been at the heart of the progress that has already seen survival rates double in the last 40 years.',
  'Fighting cancer with world-class research since 1902.',
  'https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800',
  'https://www.cancerresearchuk.org',
  TRUE,
  TRUE
),
(
  'British Heart Foundation',
  'The British Heart Foundation funds cutting-edge research into all heart and circulatory diseases and the things that cause them. We support people living with heart and circulatory diseases and drive forward vital policy change to help keep people healthy.',
  'Beating heart and circulatory disease through research.',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800',
  'https://www.bhf.org.uk',
  TRUE,
  TRUE
),
(
  'Macmillan Cancer Support',
  'Macmillan Cancer Support provides specialist health care, information and financial support to people affected by cancer. We work together to do whatever it takes to support people living with cancer, pushing for better cancer care.',
  'Whatever it takes — supporting people affected by cancer.',
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800',
  'https://www.macmillan.org.uk',
  FALSE,
  TRUE
),
(
  'RNLI',
  'The Royal National Lifeboat Institution is the charity that saves lives at sea. Our volunteers provide a 24-hour search and rescue service around the coasts of the United Kingdom, the Republic of Ireland, and the Channel Islands.',
  'Saving lives at sea since 1824.',
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
  'https://rnli.org',
  FALSE,
  TRUE
),
(
  'Great Ormond Street Hospital',
  'Great Ormond Street Hospital Children''s Charity raises money to fund pioneering medical research and to keep improving the hospital environment for its young patients and their families. Every day, the hospital treats 619 inpatient and day care admissions.',
  'Giving seriously ill children a better chance.',
  'https://images.unsplash.com/photo-1551076805-e1869033e561?w=800',
  'https://www.gosh.org',
  FALSE,
  TRUE
);
