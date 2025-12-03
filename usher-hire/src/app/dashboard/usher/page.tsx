'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Profile, type UsherProfile, type Booking, type Event } from '@/lib/supabase';

interface DashboardStats {
  totalEarnings: number;
  eventsCompleted: number;
  averageRating: number;
  upcomingBookings: number;
}

interface EventWithBooking extends Event {
  bookings?: Booking[];
}

export default function UsherDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [usherProfile, setUsherProfile] = useState<UsherProfile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalEarnings: 0,
    eventsCompleted: 0,
    averageRating: 0,
    upcomingBookings: 0,
  });
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [availableEvents, setAvailableEvents] = useState<Event[]>([]);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [applyingTo, setApplyingTo] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const handleApplyToEvent = async (eventId: string) => {
    try {
      setApplyingTo(eventId);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already applied
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('event_id', eventId)
        .eq('usher_id', user.id)
        .single();

      if (existingBooking) {
        alert('You have already applied to this event');
        return;
      }

      // Create booking
      const { error } = await supabase
        .from('bookings')
        .insert({
          event_id: eventId,
          usher_id: user.id,
          status: 'pending',
          applied_at: new Date().toISOString(),
        });

      if (error) throw error;

      alert('Application submitted successfully!');
      checkUser(); // Refresh data
    } catch (error: any) {
      console.error('Error applying:', error);
      alert('Failed to apply. Please try again.');
    } finally {
      setApplyingTo(null);
    }
  };

  const checkUser = async () => {
    try {
      console.log('Starting dashboard load...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/auth/signin');
        return;
      }

      console.log('User authenticated:', user.id);

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData.user_type !== 'usher') {
        router.push('/dashboard/planner');
        return;
      }

      console.log('Profile loaded:', profileData.full_name);
      setProfile(profileData);

      // Fetch usher profile
      const { data: usherData, error: usherError } = await supabase
        .from('usher_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usherError) throw usherError;
      console.log('Usher profile loaded');
      setUsherProfile(usherData);

      // Calculate profile completion
      const completion = calculateProfileCompletion(profileData, usherData);
      setProfileCompletion(completion);

      // Fetch bookings with event details
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          events (*)
        `)
        .eq('usher_id', user.id)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Calculate stats
      const completed = bookingsData?.filter((b) => b.status === 'completed') || [];
      const upcoming = bookingsData?.filter(
        (b) => b.status === 'accepted' || b.status === 'pending'
      ) || [];

      setUpcomingBookings(upcoming);

      const totalEarnings = completed.reduce((sum, booking) => {
        const event = booking.events as any;
        return sum + (event?.pay_rate || 0);
      }, 0);

      setStats({
        totalEarnings,
        eventsCompleted: usherData.total_events,
        averageRating: usherData.rating,
        upcomingBookings: upcoming.length,
      });

      // Fetch available events
      console.log('Fetching available events...');
      const today = new Date().toISOString().split('T')[0];
      console.log('Today date:', today);
      
      // First, let's check if there are ANY events at all
      const { data: allEvents, error: allEventsError } = await supabase
        .from('events')
        .select('*');
      
      console.log('Total events in database:', allEvents?.length || 0);
      if (allEvents && allEvents.length > 0) {
        console.log('Sample event:', allEvents[0]);
      }
      
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .gte('event_date', today)
        .order('event_date', { ascending: true })
        .limit(10);

      if (eventsError) {
        console.error('Error fetching events:', eventsError);
        setAvailableEvents([]);
      } else {
        console.log('Raw events from DB:', eventsData);
        console.log('Available events count:', eventsData?.length || 0);
        // Filter out events the usher has already applied to
        const appliedEventIds = bookingsData?.map(b => b.event_id) || [];
        console.log('Already applied to event IDs:', appliedEventIds);
        const filteredEvents = eventsData?.filter(e => !appliedEventIds.includes(e.id)) || [];
        console.log('Filtered events count:', filteredEvents.length);
        setAvailableEvents(filteredEvents);
      }

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompletion = (profile: Profile, usherProfile: UsherProfile): number => {
    let completed = 0;
    const total = 8;

    if (profile.full_name) completed++;
    if (profile.phone) completed++;
    if (profile.avatar_url) completed++;
    if (usherProfile.bio) completed++;
    if (usherProfile.hourly_rate) completed++;
    if (usherProfile.experience_years > 0) completed++;
    if (usherProfile.skills && usherProfile.skills.length > 0) completed++;
    if (usherProfile.availability && Object.keys(usherProfile.availability).length > 0) completed++;

    return Math.round((completed / total) * 100);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Usher Dashboard</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {profile?.full_name}!
          </h2>
          <p className="mt-1 text-gray-600">Here's what's happening with your usher profile</p>
        </div>

        {/* Profile Completion */}
        {profileCompletion < 100 && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Complete your profile ({profileCompletion}%)
                </h3>
                <p className="mt-1 text-sm text-yellow-700">
                  A complete profile helps you get more event opportunities
                </p>
              </div>
              <button 
                onClick={() => router.push('/dashboard/usher/profile')}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 text-sm font-medium"
              >
                Complete Profile
              </button>
            </div>
            <div className="mt-3 w-full bg-yellow-200 rounded-full h-2">
              <div
                className="bg-yellow-600 h-2 rounded-full transition-all"
                style={{ width: `${profileCompletion}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Earnings
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      ${stats.totalEarnings.toFixed(2)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Events Completed
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.eventsCompleted}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Average Rating
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.averageRating.toFixed(1)} / 5.0
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Upcoming Bookings
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.upcomingBookings}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Events */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg font-medium text-gray-900">Available Events</h3>
            <span className="text-sm text-gray-500">
              {loading ? 'Loading...' : `${availableEvents.length} events`}
            </span>
          </div>
          <div className="px-6 py-5">
            {availableEvents.length > 0 ? (
              <div className="space-y-4">
                {availableEvents.map((event) => (
                  <div
                    key={event.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-indigo-500 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                        <p className="mt-1 text-sm text-gray-600">{event.venue_address}</p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                          <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                          <span>🕒 {event.start_time} - {event.end_time}</span>
                          <span>👥 {event.ushers_needed} ushers needed</span>
                        </div>
                      </div>
                      <div className="ml-4 flex flex-col items-end">
                        <span className="text-2xl font-bold text-indigo-600">
                          ${event.pay_rate}
                        </span>
                        <button 
                          onClick={() => handleApplyToEvent(event.id)}
                          disabled={applyingTo === event.id}
                          className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {applyingTo === event.id ? 'Applying...' : 'Apply Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-2">No available events at the moment</p>
                <p className="text-sm text-gray-400">
                  Events will appear here once planners create and publish them
                </p>
                {loading && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Your Applications & Bookings</h3>
          </div>
          <div className="px-6 py-5">
            {upcomingBookings.length > 0 ? (
              <div className="space-y-4">
                {upcomingBookings.map((booking) => {
                  const event = booking.events as any;
                  const getStatusInfo = (status: string) => {
                    switch(status) {
                      case 'pending':
                        return { 
                          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                          icon: '⏳',
                          message: 'Waiting for planner approval'
                        };
                      case 'accepted':
                        return { 
                          color: 'bg-green-100 text-green-800 border-green-200',
                          icon: '✅',
                          message: 'Confirmed! See you at the event'
                        };
                      case 'rejected':
                        return { 
                          color: 'bg-red-100 text-red-800 border-red-200',
                          icon: '❌',
                          message: 'Application was not accepted'
                        };
                      case 'completed':
                        return { 
                          color: 'bg-blue-100 text-blue-800 border-blue-200',
                          icon: '🎉',
                          message: 'Event completed'
                        };
                      default:
                        return { color: 'bg-gray-100 text-gray-800', icon: '•', message: status };
                    }
                  };
                  
                  const statusInfo = getStatusInfo(booking.status);
                  
                  return (
                    <div key={booking.id} className={`border-2 rounded-lg p-4 ${statusInfo.color}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="text-lg font-semibold text-gray-900">{event?.title}</h4>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                              {statusInfo.icon} {booking.status.toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{statusInfo.message}</p>
                          <p className="mt-1 text-sm text-gray-600">{event?.venue_address}</p>
                          <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                            <span>📅 {new Date(event?.event_date).toLocaleDateString()}</span>
                            <span>🕒 {event?.start_time} - {event?.end_time}</span>
                            <span>💰 ${event?.pay_rate}</span>
                          </div>
                          <p className="mt-2 text-xs text-gray-500">
                            Applied: {new Date(booking.applied_at || booking.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                No applications yet. Apply to events above!
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
