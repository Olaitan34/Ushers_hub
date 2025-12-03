-- Add availability_status column to usher_profiles table
-- Run this in Supabase SQL Editor

-- Add the column if it doesn't exist
ALTER TABLE usher_profiles 
ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'busy', 'unavailable'));

-- Update existing records to have default availability_status
UPDATE usher_profiles 
SET availability_status = 'available' 
WHERE availability_status IS NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_usher_profiles_availability_status 
ON usher_profiles(availability_status);

-- Update existing signup to include availability_status
-- This will be handled in the application code
