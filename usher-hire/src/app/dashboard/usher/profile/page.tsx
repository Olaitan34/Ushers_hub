'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, type Profile, type UsherProfile } from '@/lib/supabase';

export default function UsherProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    avatar_url: '',
    hourly_rate: '',
    experience_years: '',
    bio: '',
    skills: '',
    certifications: '',
    availability_status: 'available' as 'available' | 'busy' | 'unavailable',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
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
      setProfile(profileData);

      // Fetch usher profile
      const { data: usherData, error: usherError } = await supabase
        .from('usher_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (usherError) throw usherError;

      // Populate form
      setFormData({
        full_name: profileData.full_name || '',
        phone: profileData.phone || '',
        avatar_url: profileData.avatar_url || '',
        hourly_rate: usherData.hourly_rate?.toString() || '',
        experience_years: usherData.experience_years?.toString() || '0',
        bio: usherData.bio || '',
        skills: usherData.skills?.join(', ') || '',
        certifications: usherData.certifications?.join(', ') || '',
        availability_status: usherData.availability_status || 'available',
      });

    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Update profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone || null,
          avatar_url: formData.avatar_url || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      // Update usher_profiles table
      const { error: usherError } = await supabase
        .from('usher_profiles')
        .update({
          hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
          experience_years: parseInt(formData.experience_years) || 0,
          bio: formData.bio || null,
          skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
          certifications: formData.certifications ? formData.certifications.split(',').map(s => s.trim()) : [],
          availability_status: formData.availability_status,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (usherError) throw usherError;

      setSuccess(true);
      setTimeout(() => {
        router.push('/dashboard/usher');
      }, 1500);

    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.message || 'Failed to save profile');
    } finally {
      setSaving(false);
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

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Complete Your Profile</h1>
            <p className="mt-2 text-gray-600">
              Fill in your details to increase your chances of getting hired
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
              Profile saved successfully! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Information */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    name="full_name"
                    id="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    id="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="avatar_url" className="block text-sm font-medium text-gray-700">
                    Profile Picture URL
                  </label>
                  <input
                    type="url"
                    name="avatar_url"
                    id="avatar_url"
                    value={formData.avatar_url}
                    onChange={handleChange}
                    placeholder="https://example.com/photo.jpg"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Add a link to your professional photo
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Information */}
            <div className="pt-6 border-t border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Professional Information</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
                      Hourly Rate ($)
                    </label>
                    <input
                      type="number"
                      name="hourly_rate"
                      id="hourly_rate"
                      min="0"
                      step="0.01"
                      value={formData.hourly_rate}
                      onChange={handleChange}
                      placeholder="25.00"
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="experience_years" className="block text-sm font-medium text-gray-700">
                      Years of Experience
                    </label>
                    <input
                      type="number"
                      name="experience_years"
                      id="experience_years"
                      min="0"
                      value={formData.experience_years}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="availability_status" className="block text-sm font-medium text-gray-700">
                    Availability Status
                  </label>
                  <select
                    name="availability_status"
                    id="availability_status"
                    value={formData.availability_status}
                    onChange={(e) => setFormData(prev => ({ ...prev, availability_status: e.target.value as any }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  >
                    <option value="available">✅ Available - Ready to work</option>
                    <option value="busy">⚠️ Busy - Limited availability</option>
                    <option value="unavailable">❌ Unavailable - Not taking bookings</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Event planners will see your availability status
                  </p>
                </div>

                <div>
                  <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    id="bio"
                    rows={4}
                    value={formData.bio}
                    onChange={handleChange}
                    placeholder="Tell event planners about yourself, your experience, and why you'd be a great usher..."
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="skills" className="block text-sm font-medium text-gray-700">
                    Skills
                  </label>
                  <input
                    type="text"
                    name="skills"
                    id="skills"
                    value={formData.skills}
                    onChange={handleChange}
                    placeholder="Customer service, crowd management, event coordination (comma-separated)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple skills with commas
                  </p>
                </div>

                <div>
                  <label htmlFor="certifications" className="block text-sm font-medium text-gray-700">
                    Certifications
                  </label>
                  <input
                    type="text"
                    name="certifications"
                    id="certifications"
                    value={formData.certifications}
                    onChange={handleChange}
                    placeholder="First Aid, CPR, Security License (comma-separated)"
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-gray-900"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Separate multiple certifications with commas
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-6 border-t border-gray-200 flex justify-between">
              <button
                type="button"
                onClick={() => router.push('/dashboard/usher')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
