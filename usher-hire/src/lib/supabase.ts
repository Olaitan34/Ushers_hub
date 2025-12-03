import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Type definitions
export type UserType = 'usher' | 'planner';
export type EventStatus = 'draft' | 'published' | 'completed' | 'cancelled';
export type BookingStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';

export interface Profile {
  id: string;
  user_type: UserType;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UsherProfile {
  id: string;
  user_id: string;
  hourly_rate?: number;
  experience_years: number;
  skills: string[];
  availability: Record<string, any>;
  rating: number;
  total_events: number;
  bio?: string;
  certifications?: string[];
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  planner_id: string;
  title: string;
  description?: string;
  venue_address: string;
  event_date: string;
  start_time: string;
  end_time: string;
  ushers_needed: number;
  pay_rate: number;
  status: EventStatus;
  requirements?: string;
  dress_code?: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  event_id: string;
  usher_id: string;
  status: BookingStatus;
  notes?: string;
  applied_at: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  booking_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string;
  created_at: string;
}
