'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    user_type: 'usher' as 'usher' | 'planner',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      console.log('Starting signup process...');
      
      // Sign up the user with email confirmation disabled
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            user_type: formData.user_type,
          },
          emailRedirectTo: undefined, // Disable email redirect
        },
      });

      console.log('Signup response:', { authData, signUpError });

      if (signUpError) {
        console.error('Signup error:', signUpError);
        throw signUpError;
      }

      if (!authData.user) {
        throw new Error('No user data returned from signup');
      }

      console.log('User created:', authData.user.id);

      // Wait a moment for Supabase to process
      await new Promise(resolve => setTimeout(resolve, 500));

      // Manually create the profile
      console.log('Creating profile...');
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .insert([
          {
            id: authData.user.id,
            email: formData.email,
            full_name: formData.full_name,
            phone: formData.phone || null,
            user_type: formData.user_type,
          },
        ])
        .select()
        .single();

      if (profileError) {
        console.error('Profile creation error:', profileError);
        // If profile already exists (duplicate key), that's okay
        if (!profileError.message.includes('duplicate') && !profileError.message.includes('already exists')) {
          throw new Error(`Failed to create profile: ${profileError.message}`);
        }
      } else {
        console.log('Profile created:', profileData);
      }

      // If user is an usher, create usher_profile
      if (formData.user_type === 'usher') {
        console.log('Creating usher profile...');
        const { data: usherData, error: usherProfileError } = await supabase
          .from('usher_profiles')
          .insert([
            {
              user_id: authData.user.id,
              experience_years: 0,
              skills: [],
              availability: {},
              availability_status: 'available',
              rating: 0,
              total_events: 0,
            },
          ])
          .select()
          .single();

        if (usherProfileError) {
          console.error('Usher profile creation error:', usherProfileError);
          if (!usherProfileError.message.includes('duplicate') && !usherProfileError.message.includes('already exists')) {
            throw new Error(`Failed to create usher profile: ${usherProfileError.message}`);
          }
        } else {
          console.log('Usher profile created:', usherData);
        }
      }

      // Show success message
      alert('Account created successfully! You are now logged in.');

      // Redirect based on user type
      const redirectPath =
        formData.user_type === 'usher'
          ? '/dashboard/usher'
          : '/dashboard/planner';
      
      console.log('Redirecting to:', redirectPath);
      router.push(redirectPath);
    } catch (err: any) {
      console.error('Signup error:', err);
      let errorMessage = 'An error occurred during sign up';
      
      if (err.message) {
        errorMessage = err.message;
      }
      
      // Provide more helpful error messages
      if (errorMessage.includes('Database error')) {
        errorMessage = 'Database setup error. Please make sure you have run the SQL setup script in Supabase.';
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'This email is already registered. Please try signing in instead.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-2xl">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Usher Hire today
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`relative flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.user_type === 'usher'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="user_type"
                    value="usher"
                    checked={formData.user_type === 'usher'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900">Usher</span>
                  {formData.user_type === 'usher' && (
                    <svg
                      className="absolute right-2 h-5 w-5 text-indigo-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </label>

                <label
                  className={`relative flex items-center justify-center px-4 py-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.user_type === 'planner'
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="user_type"
                    value="planner"
                    checked={formData.user_type === 'planner'}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-gray-900">Event Planner</span>
                  {formData.user_type === 'planner' && (
                    <svg
                      className="absolute right-2 h-5 w-5 text-indigo-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </label>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Creating account...' : 'Sign up'}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-indigo-600 hover:text-indigo-500">
                Sign in
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
