'use client';

import { useState } from 'react';
import { supabase, type Event } from '@/lib/supabase';

interface EventCardProps {
  event: Event;
  onApply?: (eventId: string) => void;
  isApplied?: boolean;
}

export default function EventCard({ event, onApply, isApplied = false }: EventCardProps) {
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(isApplied);

  const handleApply = async () => {
    if (!onApply || applied) return;

    setApplying(true);
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        alert('Please sign in to apply for events');
        return;
      }

      // Check if already applied
      const { data: existingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('event_id', event.id)
        .eq('usher_id', user.id)
        .single();

      if (existingBooking) {
        alert('You have already applied for this event');
        setApplied(true);
        return;
      }

      // Create booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .insert([
          {
            event_id: event.id,
            usher_id: user.id,
            status: 'pending',
          },
        ]);

      if (bookingError) throw bookingError;

      setApplied(true);
      alert('Application submitted successfully!');
      
      if (onApply) {
        onApply(event.id);
      }
    } catch (error: any) {
      console.error('Error applying for event:', error);
      alert('Failed to apply for event. Please try again.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-gray-900">{event.title}</h3>
          {event.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">{event.description}</p>
          )}
          
          <div className="mt-4 space-y-2">
            <div className="flex items-center text-sm text-gray-700">
              <svg
                className="h-5 w-5 text-gray-400 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {event.venue_address}
            </div>

            <div className="flex items-center text-sm text-gray-700">
              <svg
                className="h-5 w-5 text-gray-400 mr-2"
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
              {new Date(event.event_date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>

            <div className="flex items-center text-sm text-gray-700">
              <svg
                className="h-5 w-5 text-gray-400 mr-2"
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
              {event.start_time} - {event.end_time}
            </div>

            <div className="flex items-center text-sm text-gray-700">
              <svg
                className="h-5 w-5 text-gray-400 mr-2"
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
              {event.ushers_needed} ushers needed
            </div>

            {event.dress_code && (
              <div className="flex items-center text-sm text-gray-700">
                <svg
                  className="h-5 w-5 text-gray-400 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                Dress code: {event.dress_code}
              </div>
            )}
          </div>
        </div>

        <div className="ml-6 flex flex-col items-end">
          <div className="text-3xl font-bold text-indigo-600">
            ${event.pay_rate}
          </div>
          <div className="text-sm text-gray-500 mb-4">per usher</div>
          
          <button
            onClick={handleApply}
            disabled={applying || applied}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              applied
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : applying
                ? 'bg-indigo-400 text-white cursor-not-allowed'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {applied ? 'Applied' : applying ? 'Applying...' : 'Apply Now'}
          </button>
        </div>
      </div>
    </div>
  );
}
