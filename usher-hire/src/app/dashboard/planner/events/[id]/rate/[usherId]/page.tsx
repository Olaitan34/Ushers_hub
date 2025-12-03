'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, type Profile, type UsherProfile } from '@/lib/supabase';

export default function RateUsherPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.id as string;
  const usherId = params.usherId as string;
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [usherProfile, setUsherProfile] = useState<Profile | null>(null);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [bookingId, setBookingId] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      // Fetch booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('event_id', eventId)
        .eq('usher_id', usherId)
        .single();

      if (bookingError) throw bookingError;
      setBookingId(bookingData.id);

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('reviews')
        .select('id')
        .eq('booking_id', bookingData.id)
        .single();

      if (existingReview) {
        alert('You have already rated this usher');
        router.push(`/dashboard/planner/events/${eventId}/applications`);
        return;
      }

      // Fetch usher profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', usherId)
        .single();

      if (profileError) throw profileError;
      setUsherProfile(profileData);

    } catch (error: any) {
      console.error('Error loading data:', error);
      alert('Failed to load usher information');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      alert('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Create review
      const { error: reviewError } = await supabase
        .from('reviews')
        .insert({
          booking_id: bookingId,
          reviewer_id: user.id,
          reviewee_id: usherId,
          rating,
          comment: comment || null,
        });

      if (reviewError) throw reviewError;

      // Fetch all reviews for this usher to calculate new average
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewee_id', usherId);

      if (reviewsError) throw reviewsError;

      const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      // Update usher profile with new rating
      const { error: updateError } = await supabase
        .from('usher_profiles')
        .update({ 
          rating: Number(avgRating.toFixed(2)),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', usherId);

      if (updateError) throw updateError;

      alert('Rating submitted successfully!');
      router.push(`/dashboard/planner/events/${eventId}/applications`);

    } catch (error: any) {
      console.error('Error submitting rating:', error);
      alert('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <button
            onClick={() => router.push(`/dashboard/planner/events/${eventId}/applications`)}
            className="text-indigo-600 hover:text-indigo-700 mb-6"
          >
            ← Back
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">Rate Usher</h1>
          <p className="text-gray-600 mb-8">
            Please rate {usherProfile?.full_name}'s performance
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div>
              <label className="block text-lg font-medium text-gray-900 mb-4">
                How would you rate this usher?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <svg
                      className={`w-12 h-12 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                      />
                    </svg>
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="mt-2 text-sm text-gray-600">
                  {rating} star{rating !== 1 && 's'} selected
                </p>
              )}
            </div>

            {/* Comment */}
            <div>
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                id="comment"
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience working with this usher..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              />
            </div>

            {/* Quick Rating Options */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Quick feedback:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { stars: 5, text: 'Excellent! Exceeded expectations' },
                  { stars: 4, text: 'Very good performance' },
                  { stars: 3, text: 'Good, met expectations' },
                  { stars: 2, text: 'Below expectations' },
                  { stars: 1, text: 'Poor performance' },
                ].map((option) => (
                  <button
                    key={option.stars}
                    type="button"
                    onClick={() => {
                      setRating(option.stars);
                      setComment(option.text);
                    }}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 text-gray-700"
                  >
                    {option.stars} ⭐ - {option.text}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => router.push(`/dashboard/planner/events/${eventId}/applications`)}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || rating === 0}
                className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Submitting...' : 'Submit Rating'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
