-- Usher Hire Platform - PostgreSQL Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_type_enum AS ENUM ('usher', 'planner');
CREATE TYPE event_status_enum AS ENUM ('draft', 'published', 'completed', 'cancelled');
CREATE TYPE booking_status_enum AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'cancelled');

-- 1. Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  user_type user_type_enum NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Usher Profiles Table (Extended info for ushers)
CREATE TABLE usher_profiles (
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
CREATE TABLE events (
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
CREATE TABLE bookings (
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
CREATE TABLE reviews (
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

-- Create indexes for better query performance
CREATE INDEX idx_profiles_user_type ON profiles(user_type);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_usher_profiles_user_id ON usher_profiles(user_id);
CREATE INDEX idx_usher_profiles_rating ON usher_profiles(rating DESC);
CREATE INDEX idx_events_planner_id ON events(planner_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_event_date ON events(event_date);
CREATE INDEX idx_bookings_event_id ON bookings(event_id);
CREATE INDEX idx_bookings_usher_id ON bookings(usher_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX idx_reviews_reviewee_id ON reviews(reviewee_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Users can create reviews for their bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    reviewer_id = auth.uid() 
    AND (
      -- Planners can review ushers
      (booking_id IN (
        SELECT b.id FROM bookings b
        JOIN events e ON b.event_id = e.id
        WHERE e.planner_id = auth.uid() AND b.usher_id = reviewee_id
      ))
      OR
      -- Ushers can review events/planners
      (booking_id IN (
        SELECT b.id FROM bookings b
        JOIN events e ON b.event_id = e.id
        WHERE b.usher_id = auth.uid() AND e.planner_id = reviewee_id
      ))
    )
  );

-- Create functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usher_profiles_updated_at
  BEFORE UPDATE ON usher_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update usher rating after new review
CREATE OR REPLACE FUNCTION update_usher_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE usher_profiles
  SET rating = (
    SELECT AVG(rating)::DECIMAL(3,2)
    FROM reviews
    WHERE reviewee_id = NEW.reviewee_id
  )
  WHERE user_id = NEW.reviewee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update rating after review
CREATE TRIGGER update_rating_after_review
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_usher_rating();

-- Function to increment total_events for usher
CREATE OR REPLACE FUNCTION increment_usher_events()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE usher_profiles
    SET total_events = total_events + 1
    WHERE user_id = NEW.usher_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to increment events when booking completed
CREATE TRIGGER increment_events_on_completion
  AFTER UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION increment_usher_events();

-- Create a function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'user_type', 'usher')::user_type_enum
  );
  
  -- If user is an usher, create usher_profile
  IF COALESCE(NEW.raw_user_meta_data->>'user_type', 'usher') = 'usher' THEN
    INSERT INTO usher_profiles (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Insert some sample data (optional, for testing)
-- You can remove this section if you don't want sample data

-- Sample profiles will be created through the signup trigger
-- So we'll just add some sample events after you create user accounts
