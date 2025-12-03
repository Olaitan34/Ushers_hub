-- Quick Test Event Setup
-- Run this in Supabase SQL Editor

-- NOTE: You CANNOT create profiles directly via SQL because they need
-- a corresponding auth.users entry. You must sign up through the app.

-- Step 1: Check existing profiles
SELECT id, email, user_type, full_name FROM profiles;

-- Step 2: If you see a planner in step 1, use their ID below
--         If you DON'T have a planner, you must:
--         1. Sign out from your usher account
--         2. Go to /auth/signup
--         3. Create new account with user_type = 'planner'
--         4. Then come back here

-- Step 3: Create a test event using your usher ID as a workaround
--         Replace 'YOUR_USER_ID' with: 0748d141-40c3-462c-ae6b-a400e5671823
INSERT INTO events (
  planner_id,
  title,
  description,
  venue_address,
  event_date,
  start_time,
  end_time,
  ushers_needed,
  pay_rate,
  status
) VALUES (
  '0748d141-40c3-462c-ae6b-a400e5671823', -- Your usher ID (temporary workaround)
  'Grand Opening Event',
  'Help us manage crowd for our grand opening celebration',
  '123 Main Street, Downtown',
  '2025-12-05', -- Future date
  '14:00:00',
  '18:00:00',
  5,
  25.00,
  'published' -- MUST be 'published' for ushers to see it
);

-- Step 4: Verify the event was created
SELECT id, title, status, event_date, pay_rate, planner_id FROM events;

-- Step 5: After testing, you should create a proper planner account through signup
