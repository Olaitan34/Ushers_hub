'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, type Event, type Booking, type Profile, type UsherProfile } from '@/lib/supabase';

interface ApplicationWithUsher extends Booking {
  profile: Profile;
  usherProfile: UsherProfile;
}

export default function EventApplicationsPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [applications, setApplications] = useState<ApplicationWithUsher[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);

  useEffect(() => {
    if (eventId) {
      loadData();
    }
  }, [eventId]);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      // Fetch event
      const { data: eventData, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (eventError) throw eventError;
      
      // Verify user is the planner
      if (eventData.planner_id !== user.id) {
        alert('Unauthorized');
        router.push('/dashboard/planner');
        return;
      }

      setEvent(eventData);

      // Fetch applications for this event
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (bookingsError) throw bookingsError;

      // Fetch usher details for each application
      const usherIds = bookingsData?.map(b => b.usher_id) || [];
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .in('id', usherIds);

      const { data: usherProfilesData } = await supabase
        .from('usher_profiles')
        .select('*')
        .in('user_id', usherIds);

      // Combine data
      const combined = bookingsData?.map(booking => ({
        ...booking,
        profile: profilesData?.find(p => p.id === booking.usher_id)!,
        usherProfile: usherProfilesData?.find(up => up.user_id === booking.usher_id)!,
      })) || [];

      setApplications(combined);
    } catch (error: any) {
      console.error('Error loading applications:', error);
      alert('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId: string, newStatus: 'accepted' | 'rejected') => {
    try {
      setProcessing(bookingId);

      const { error } = await supabase
        .from('bookings')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (error) throw error;

      alert(`Application ${newStatus}!`);
      loadData(); // Reload data
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Failed to update application');
    } finally {
      setProcessing(null);
    }
  };

  const handleMarkCompleted = async (bookingId: string, usherId: string) => {
    try {
      setProcessing(bookingId);

      // Update booking status to completed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', bookingId);

      if (bookingError) throw bookingError;

      // Increment usher's total_events count
      const { data: usherProfile, error: fetchError } = await supabase
        .from('usher_profiles')
        .select('total_events')
        .eq('user_id', usherId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from('usher_profiles')
        .update({ 
          total_events: (usherProfile.total_events || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', usherId);

      if (updateError) throw updateError;

      alert('Event marked as completed! Usher event count updated.');
      loadData();
    } catch (error: any) {
      console.error('Error marking completed:', error);
      alert('Failed to mark as completed');
    } finally {
      setProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-600">Event not found</p>
      </div>
    );
  }

  const pendingCount = applications.filter(a => a.status === 'pending').length;
  const acceptedCount = applications.filter(a => a.status === 'accepted').length;

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/planner')}
            className="text-indigo-600 hover:text-indigo-700 mb-4"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-gray-600 mt-2">
            📅 {new Date(event.event_date).toLocaleDateString()} • 
            📍 {event.venue_address}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-gray-900">{applications.length}</div>
            <div className="text-sm text-gray-600">Total Applications</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg shadow border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">{pendingCount}</div>
            <div className="text-sm text-yellow-700">Pending Review</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg shadow border border-green-200">
            <div className="text-2xl font-bold text-green-800">{acceptedCount} / {event.ushers_needed}</div>
            <div className="text-sm text-green-700">Accepted / Needed</div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Applications</h2>
          </div>

          {applications.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {applications.map((application) => (
                <div key={application.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    {/* Usher Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-3">
                        <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {application.profile?.avatar_url ? (
                            <img src={application.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">👤</span>
                          )}
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {application.profile?.full_name}
                          </h3>
                          <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span>⭐ {application.usherProfile?.rating.toFixed(1)}</span>
                            <span>📅 {application.usherProfile?.total_events} events</span>
                            <span>💰 ${application.usherProfile?.hourly_rate}/hr</span>
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      {application.usherProfile?.skills && application.usherProfile.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {application.usherProfile.skills.map((skill, idx) => (
                            <span key={idx} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {application.notes && (
                        <p className="text-sm text-gray-600 mb-3">
                          <span className="font-medium">Note:</span> {application.notes}
                        </p>
                      )}

                      <div className="text-xs text-gray-500">
                        Applied: {new Date(application.applied_at || application.created_at).toLocaleString()}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="ml-6 flex flex-col gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium text-center ${getStatusBadge(application.status)}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                      </span>

                      {application.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(application.id, 'accepted')}
                            disabled={processing === application.id}
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm disabled:opacity-50"
                          >
                            {processing === application.id ? 'Processing...' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleStatusChange(application.id, 'rejected')}
                            disabled={processing === application.id}
                            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {application.status === 'accepted' && (
                        <button
                          onClick={() => handleMarkCompleted(application.id, application.usher_id)}
                          disabled={processing === application.id}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm disabled:opacity-50"
                        >
                          {processing === application.id ? 'Processing...' : 'Mark Completed'}
                        </button>
                      )}

                      <button
                        onClick={() => router.push(`/dashboard/planner/ushers/${application.usher_id}`)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
                      >
                        View Profile
                      </button>

                      {application.status === 'completed' && (
                        <button
                          onClick={() => router.push(`/dashboard/planner/events/${eventId}/rate/${application.usher_id}`)}
                          className="px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 text-sm"
                        >
                          Rate Usher
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              No applications yet
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
