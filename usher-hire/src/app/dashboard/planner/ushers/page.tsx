'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Profile, type UsherProfile } from '@/lib/supabase';

interface UsherWithProfile {
  profile: Profile;
  usherProfile: UsherProfile;
}

export default function BrowseUshersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [ushers, setUshers] = useState<UsherWithProfile[]>([]);
  const [filteredUshers, setFilteredUshers] = useState<UsherWithProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | 'available' | 'busy' | 'unavailable'>('all');
  const [minRating, setMinRating] = useState(0);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    filterUshers();
  }, [searchTerm, availabilityFilter, minRating, ushers]);

  const checkAuth = async () => {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/auth/signin');
        return;
      }

      // Verify user is a planner
      const { data: profileData } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('id', user.id)
        .single();

      if (profileData?.user_type !== 'planner') {
        router.push('/dashboard/usher');
        return;
      }

      await loadUshers();
    } catch (error) {
      console.error('Auth error:', error);
      router.push('/auth/signin');
    }
  };

  const loadUshers = async () => {
    try {
      // Fetch all usher profiles
      const { data: usherProfilesData, error: usherError } = await supabase
        .from('usher_profiles')
        .select('*')
        .order('rating', { ascending: false });

      if (usherError) throw usherError;

      // Fetch corresponding profiles
      const userIds = usherProfilesData?.map(up => up.user_id) || [];
      const { data: profilesData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds);

      if (profileError) throw profileError;

      // Combine data
      const combined = usherProfilesData?.map(usherProfile => ({
        profile: profilesData?.find(p => p.id === usherProfile.user_id)!,
        usherProfile,
      })) || [];

      setUshers(combined);
      setFilteredUshers(combined);
    } catch (error: any) {
      console.error('Error loading ushers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUshers = () => {
    let filtered = [...ushers];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(u => 
        u.profile.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.usherProfile.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.usherProfile.skills?.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Availability filter
    if (availabilityFilter !== 'all') {
      filtered = filtered.filter(u => u.usherProfile.availability_status === availabilityFilter);
    }

    // Rating filter
    if (minRating > 0) {
      filtered = filtered.filter(u => u.usherProfile.rating >= minRating);
    }

    setFilteredUshers(filtered);
  };

  const getAvailabilityBadge = (status: string) => {
    switch (status) {
      case 'available':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">✅ Available</span>;
      case 'busy':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">⚠️ Busy</span>;
      case 'unavailable':
        return <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">❌ Unavailable</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading ushers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Browse Ushers</h1>
              <p className="mt-2 text-gray-600">Find and book qualified ushers for your events</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/planner')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                Search
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, skills, or bio..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              />
            </div>

            <div>
              <label htmlFor="availability" className="block text-sm font-medium text-gray-700 mb-2">
                Availability
              </label>
              <select
                id="availability"
                value={availabilityFilter}
                onChange={(e) => setAvailabilityFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                <option value="all">All Ushers</option>
                <option value="available">Available</option>
                <option value="busy">Busy</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div>
              <label htmlFor="rating" className="block text-sm font-medium text-gray-700 mb-2">
                Minimum Rating
              </label>
              <select
                id="rating"
                value={minRating}
                onChange={(e) => setMinRating(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
              >
                <option value="0">Any Rating</option>
                <option value="3">3+ Stars</option>
                <option value="4">4+ Stars</option>
                <option value="4.5">4.5+ Stars</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-600">
            Showing <span className="font-semibold">{filteredUshers.length}</span> of <span className="font-semibold">{ushers.length}</span> ushers
          </p>
        </div>

        {/* Ushers Grid */}
        {filteredUshers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUshers.map(({ profile, usherProfile }) => (
              <div key={profile.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Profile Header */}
                <div className="bg-gradient-to-r from-indigo-500 to-purple-600 h-24"></div>
                
                <div className="px-6 pb-6">
                  {/* Avatar */}
                  <div className="flex justify-center -mt-12 mb-4">
                    <div className="w-24 h-24 rounded-full border-4 border-white bg-white flex items-center justify-center overflow-hidden">
                      {profile.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-4xl text-gray-400">👤</span>
                      )}
                    </div>
                  </div>

                  {/* Name and Status */}
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{profile.full_name}</h3>
                    <div className="mt-2 flex justify-center">
                      {getAvailabilityBadge(usherProfile.availability_status)}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">{usherProfile.rating.toFixed(1)}</div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-indigo-600">{usherProfile.total_events}</div>
                      <div className="text-xs text-gray-500">Events</div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">💰</span>
                      <span>${usherProfile.hourly_rate || 0}/hour</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium mr-2">📅</span>
                      <span>{usherProfile.experience_years} years experience</span>
                    </div>
                  </div>

                  {/* Skills */}
                  {usherProfile.skills && usherProfile.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {usherProfile.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded"
                          >
                            {skill}
                          </span>
                        ))}
                        {usherProfile.skills.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                            +{usherProfile.skills.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bio */}
                  {usherProfile.bio && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {usherProfile.bio}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => router.push(`/dashboard/planner/ushers/${profile.id}`)}
                      className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => {
                        if (profile.phone) {
                          window.location.href = `tel:${profile.phone}`;
                        } else {
                          alert('Phone number not available');
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm"
                      title="Call"
                    >
                      📞
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-500 text-lg">No ushers found matching your criteria</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setAvailabilityFilter('all');
                setMinRating(0);
              }}
              className="mt-4 px-4 py-2 text-indigo-600 hover:text-indigo-700"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
