'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase, type Profile, type UsherProfile } from '@/lib/supabase';

export default function UsherProfilePage() {
  const router = useRouter();
  const params = useParams();
  const usherId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [usherProfile, setUsherProfile] = useState<UsherProfile | null>(null);

  useEffect(() => {
    if (usherId) {
      loadUsherProfile();
    }
  }, [usherId]);

  const loadUsherProfile = async () => {
    try {
      // Verify current user is a planner
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
        return;
      }

      // Fetch usher's profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', usherId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch usher's details
      const { data: usherData, error: usherError } = await supabase
        .from('usher_profiles')
        .select('*')
        .eq('user_id', usherId)
        .single();

      if (usherError) throw usherError;
      setUsherProfile(usherData);

    } catch (error: any) {
      console.error('Error loading usher:', error);
      alert('Failed to load usher profile');
    } finally {
      setLoading(false);
    }
  };

  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">✅ Available</span>;
      case 'busy':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-yellow-100 text-yellow-800">⚠️ Busy</span>;
      case 'unavailable':
        return <span className="px-3 py-1 text-sm font-medium rounded-full bg-red-100 text-red-800">❌ Unavailable</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile || !usherProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <p className="text-gray-600">Usher not found</p>
          <button
            onClick={() => router.push('/dashboard/planner/ushers')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard/planner/ushers')}
            className="text-indigo-600 hover:text-indigo-700 flex items-center"
          >
            ← Back to Browse
          </button>
        </div>

        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Cover Image */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-32"></div>

          {/* Profile Info */}
          <div className="px-8 pb-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16 mb-6">
              <div className="flex flex-col md:flex-row md:items-end">
                <div className="w-32 h-32 rounded-full border-4 border-white bg-white flex items-center justify-center overflow-hidden shadow-lg">
                  {profile.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-6xl text-gray-400">👤</span>
                  )}
                </div>
                <div className="mt-4 md:mt-0 md:ml-6">
                  <h1 className="text-3xl font-bold text-gray-900">{profile.full_name}</h1>
                  <div className="mt-2 flex items-center gap-3">
                    {getAvailabilityBadge(usherProfile.availability_status)}
                    <div className="flex items-center text-yellow-500">
                      <span className="text-xl">⭐</span>
                      <span className="ml-1 text-lg font-semibold text-gray-900">
                        {usherProfile.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 md:mt-0 flex gap-3">
                {profile.phone && (
                  <a
                    href={`tel:${profile.phone}`}
                    className="inline-block px-6 py-2 bg-white border-2 border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 font-medium cursor-pointer"
                  >
                    📞 Call
                  </a>
                )}
                {profile.email && (
                  <a
                    href={`mailto:${profile.email}`}
                    className="inline-block px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium cursor-pointer"
                  >
                    ✉️ Email
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-8 p-6 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">${usherProfile.hourly_rate || 0}</div>
                <div className="text-sm text-gray-500">Per Hour</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{usherProfile.experience_years}</div>
                <div className="text-sm text-gray-500">Years Experience</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{usherProfile.total_events}</div>
                <div className="text-sm text-gray-500">Events Completed</div>
              </div>
            </div>

            {/* Bio */}
            {usherProfile.bio && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
                <p className="text-gray-700 leading-relaxed">{usherProfile.bio}</p>
              </div>
            )}

            {/* Skills */}
            {usherProfile.skills && usherProfile.skills.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {usherProfile.skills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {usherProfile.certifications && usherProfile.certifications.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Certifications</h2>
                <ul className="space-y-2">
                  {usherProfile.certifications.map((cert, index) => (
                    <li key={index} className="flex items-center text-gray-700">
                      <span className="mr-2">🏆</span>
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contact Info */}
            <div className="border-t pt-6">
              <h2 className="text-xl font-bold text-gray-900 mb-3">Contact Information</h2>
              <div className="space-y-2">
                <div className="flex items-center text-gray-700">
                  <span className="font-medium mr-2">📧 Email:</span>
                  <a href={`mailto:${profile.email}`} className="text-indigo-600 hover:text-indigo-700">
                    {profile.email}
                  </a>
                </div>
                {profile.phone && (
                  <div className="flex items-center text-gray-700">
                    <span className="font-medium mr-2">📱 Phone:</span>
                    <a href={`tel:${profile.phone}`} className="text-indigo-600 hover:text-indigo-700">
                      {profile.phone}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
