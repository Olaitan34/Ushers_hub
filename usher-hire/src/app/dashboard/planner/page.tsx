'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, type Profile, type Event, type Booking } from '@/lib/supabase';

interface DashboardStats {
  totalEvents: number;
  activeBookings: number;
  totalUshersHired: number;
  upcomingEvents: number;
}

interface EventWithBookings extends Event {
  bookings?: Booking[];
}

export default function PlannerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats>({
    totalEvents: 0,
    activeBookings: 0,
    totalUshersHired: 0,
    upcomingEvents: 0,
  });
  const [events, setEvents] = useState<EventWithBookings[]>([]);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past' | 'draft'>('all');

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/auth/signin');
        return;
      }

      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      if (profileData.user_type !== 'planner') {
        router.push('/dashboard/usher');
        return;
      }

      setProfile(profileData);

      // Fetch planner's events with bookings
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select(`
          *,
          bookings (*)
        `)
        .eq('planner_id', user.id)
        .order('event_date', { ascending: false });

      if (eventsError) throw eventsError;
      setEvents(eventsData || []);

      // Calculate stats
      const today = new Date().toISOString().split('T')[0];
      const upcoming = eventsData?.filter(
        (e) => e.event_date >= today && e.status !== 'cancelled'
      ) || [];
      
      const allBookings = eventsData?.flatMap((e) => e.bookings || []) || [];
      const activeBookings = allBookings.filter(
        (b) => b.status === 'pending' || b.status === 'accepted'
      );
      
      const acceptedBookings = allBookings.filter((b) => b.status === 'accepted');

      setStats({
        totalEvents: eventsData?.length || 0,
        activeBookings: activeBookings.length,
        totalUshersHired: acceptedBookings.length,
        upcomingEvents: upcoming.length,
      });

    } catch (error: any) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const getFilteredEvents = () => {
    const today = new Date().toISOString().split('T')[0];
    
    switch (filter) {
      case 'upcoming':
        return events.filter((e) => e.event_date >= today && e.status !== 'cancelled');
      case 'past':
        return events.filter((e) => e.event_date < today || e.status === 'completed');
      case 'draft':
        return events.filter((e) => e.status === 'draft');
      default:
        return events;
    }
  };

  const filteredEvents = getFilteredEvents();

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
          <h1 className="text-2xl font-bold text-gray-900">Event Planner Dashboard</h1>
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
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              Welcome back, {profile?.full_name}!
            </h2>
            <p className="mt-1 text-gray-600">Manage your events and hire ushers</p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/dashboard/planner/ushers"
              className="px-6 py-3 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium shadow-lg"
            >
              👥 Browse Ushers
            </Link>
            <Link
              href="/dashboard/planner/events/create"
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium shadow-lg"
            >
              + Create Event
            </Link>
          </div>
        </div>

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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Events
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.totalEvents}
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
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Upcoming Events
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.upcomingEvents}
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
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Bookings
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.activeBookings}
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
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Ushers Hired
                    </dt>
                    <dd className="text-2xl font-bold text-gray-900">
                      {stats.totalUshersHired}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Your Events</h3>
              <div className="flex space-x-2">
                {(['all', 'upcoming', 'past', 'draft'] as const).map((filterOption) => (
                  <button
                    key={filterOption}
                    onClick={() => setFilter(filterOption)}
                    className={`px-4 py-2 rounded-md text-sm font-medium ${
                      filter === filterOption
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="px-6 py-5">
            {filteredEvents.length > 0 ? (
              <div className="space-y-4">
                {filteredEvents.map((event) => {
                  const bookings = event.bookings || [];
                  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
                  const acceptedCount = bookings.filter((b) => b.status === 'accepted').length;

                  return (
                    <div
                      key={event.id}
                      className="border border-gray-200 rounded-lg p-5 hover:border-indigo-500 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-lg font-semibold text-gray-900">{event.title}</h4>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                event.status === 'published'
                                  ? 'bg-green-100 text-green-800'
                                  : event.status === 'draft'
                                  ? 'bg-gray-100 text-gray-800'
                                  : event.status === 'completed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {event.status}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-600">{event.venue_address}</p>
                          <div className="mt-3 flex items-center space-x-6 text-sm text-gray-500">
                            <span>📅 {new Date(event.event_date).toLocaleDateString()}</span>
                            <span>🕒 {event.start_time} - {event.end_time}</span>
                            <span>👥 {acceptedCount}/{event.ushers_needed} ushers confirmed</span>
                            {pendingCount > 0 && (
                              <span className="text-yellow-600 font-medium">
                                {pendingCount} pending applications
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="ml-4 flex flex-col items-end space-y-2">
                          <span className="text-xl font-bold text-indigo-600">
                            ${event.pay_rate}/usher
                          </span>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => router.push(`/dashboard/planner/events/${event.id}/applications`)}
                              className={`px-3 py-1 rounded-md text-sm font-medium ${
                                pendingCount > 0
                                  ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {pendingCount > 0 
                                ? `Review ${pendingCount} Application${pendingCount !== 1 ? 's' : ''}`
                                : 'Manage Applications'
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
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
                <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new event.
                </p>
                <div className="mt-6">
                  <Link
                    href="/dashboard/planner/events/create"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    + Create Event
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
