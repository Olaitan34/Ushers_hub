-- RUN THIS IN SUPABASE SQL EDITOR TO FIX THE SIGNUP ISSUE
-- This removes any existing triggers that might be causing problems

-- Drop the trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function if it exists
DROP FUNCTION IF EXISTS handle_new_user();

-- Verify the tables exist
DO $$ 
DECLARE 
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name IN ('profiles', 'usher_profiles', 'events', 'bookings', 'reviews');
  
  IF table_count = 5 THEN
    RAISE NOTICE 'SUCCESS: All 5 tables exist!';
  ELSE
    RAISE NOTICE 'WARNING: Only % tables found. Expected 5 tables.', table_count;
  END IF;
END $$;

-- List all tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
