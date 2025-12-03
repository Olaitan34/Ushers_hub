-- QUICK SETUP SCRIPT - Run this first in Supabase SQL Editor
-- This creates the essential tables without complex triggers

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types (check if they exist first)
DO $$ BEGIN
    CREATE TYPE user_type_enum AS ENUM ('usher', 'planner');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE event_status_enum AS ENUM ('draft', 'published', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Profiles Table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_type user_type_enum NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Usher Profiles Table
CREATE TABLE IF NOT EXISTS usher_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  hourly_rate DECIMAL(10, 2),
  experience_years INTEGER DEFAULT 0,
  skills TEXT[] DEFAULT '{}',
  availability JSONB DEFAULT '{}',
  rating DECIMAL(3, 2) DEFAULT 0.00,
  total_events INTEGER DEFAULT 0,
  bio TEXT,
  certifications TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_rating CHECK (rating >= 0 AND rating <= 5)
);

-- 3. Events Table
CREATE TABLE IF NOT EXISTS events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  planner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  venue_address TEXT NOT NULL,
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  ushers_needed INTEGER NOT NULL DEFAULT 1,
  pay_rate DECIMAL(10, 2) NOT NULL,
  status event_status_enum DEFAULT 'draft',
  requirements TEXT,
  dress_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_ushers_needed CHECK (ushers_needed > 0),
  CONSTRAINT valid_pay_rate CHECK (pay_rate >= 0)
);

-- 4. Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  usher_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status booking_status_enum DEFAULT 'pending',
  notes TEXT,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, usher_id)
);

-- 5. Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  reviewee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_rating CHECK (rating >= 1 AND rating <= 5),
  CONSTRAINT different_users CHECK (reviewer_id != reviewee_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Usher profiles are viewable by everyone" ON usher_profiles;
DROP POLICY IF EXISTS "Ushers can insert own profile" ON usher_profiles;
DROP POLICY IF EXISTS "Ushers can update own profile" ON usher_profiles;

DROP POLICY IF EXISTS "Published events are viewable by everyone" ON events;
DROP POLICY IF EXISTS "Planners can insert events" ON events;
DROP POLICY IF EXISTS "Planners can update own events" ON events;
DROP POLICY IF EXISTS "Planners can delete own events" ON events;

DROP POLICY IF EXISTS "Users can view relevant bookings" ON bookings;
DROP POLICY IF EXISTS "Ushers can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update relevant bookings" ON bookings;

DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;

-- RLS Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for usher_profiles
CREATE POLICY "Usher profiles are viewable by everyone"
  ON usher_profiles FOR SELECT
  USING (true);

CREATE POLICY "Ushers can insert own profile"
  ON usher_profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Ushers can update own profile"
  ON usher_profiles FOR UPDATE
  USING (user_id = auth.uid());

-- RLS Policies for events
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (status = 'published' OR planner_id = auth.uid());

CREATE POLICY "Planners can insert events"
  ON events FOR INSERT
  WITH CHECK (planner_id = auth.uid());

CREATE POLICY "Planners can update own events"
  ON events FOR UPDATE
  USING (planner_id = auth.uid());

CREATE POLICY "Planners can delete own events"
  ON events FOR DELETE
  USING (planner_id = auth.uid());

-- RLS Policies for bookings
CREATE POLICY "Users can view relevant bookings"
  ON bookings FOR SELECT
  USING (
    usher_id = auth.uid() 
    OR event_id IN (SELECT id FROM events WHERE planner_id = auth.uid())
  );

CREATE POLICY "Ushers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (usher_id = auth.uid());

CREATE POLICY "Users can update relevant bookings"
  ON bookings FOR UPDATE
  USING (
    usher_id = auth.uid() 
    OR event_id IN (SELECT id FROM events WHERE planner_id = auth.uid())
  );

-- RLS Policies for reviews
CREATE POLICY "Reviews are viewable by everyone"
  ON reviews FOR SELECT
  USING (true);

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Database setup complete! All tables and policies created successfully.';
END $$;
