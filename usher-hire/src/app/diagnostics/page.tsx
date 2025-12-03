'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DiagnosticsPage() {
  const [results, setResults] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const diagnostics: any = {};

    try {
      // Check auth
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      diagnostics.auth = {
        success: !authError,
        userId: user?.id,
        email: user?.email,
        error: authError?.message,
      };

      // Check profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count');
      diagnostics.profiles = {
        success: !profilesError,
        count: profiles?.length,
        error: profilesError?.message,
      };

      // Check usher_profiles table
      const { data: usherProfiles, error: usherError } = await supabase
        .from('usher_profiles')
        .select('count');
      diagnostics.usherProfiles = {
        success: !usherError,
        count: usherProfiles?.length,
        error: usherError?.message,
      };

      // Check events table
      const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('*')
        .order('created_at', { ascending: false });
      diagnostics.events = {
        success: !eventsError,
        count: events?.length || 0,
        data: events,
        error: eventsError?.message,
        breakdown: events ? {
          draft: events.filter(e => e.status === 'draft').length,
          published: events.filter(e => e.status === 'published').length,
          completed: events.filter(e => e.status === 'completed').length,
          cancelled: events.filter(e => e.status === 'cancelled').length,
        } : null,
      };

      // Check published events
      const today = new Date().toISOString().split('T')[0];
      const { data: publishedEvents, error: publishedError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .gte('event_date', today);
      diagnostics.publishedEvents = {
        success: !publishedError,
        count: publishedEvents?.length || 0,
        data: publishedEvents,
        error: publishedError?.message,
        note: `Checking for status='published' and event_date >= '${today}'`,
      };

      // Check bookings table
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('count');
      diagnostics.bookings = {
        success: !bookingsError,
        count: bookings?.length,
        error: bookingsError?.message,
      };

    } catch (error: any) {
      diagnostics.generalError = error.message;
    }

    setResults(diagnostics);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Running diagnostics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">System Diagnostics</h1>

        <div className="space-y-4">
          {Object.entries(results).map(([key, value]: [string, any]) => (
            <div key={key} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </h2>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  value.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {value.success ? '✓ Success' : '✗ Failed'}
                </span>
              </div>

              <div className="space-y-2">
                {value.userId && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">User ID:</span>
                    <span className="ml-2 text-gray-600">{value.userId}</span>
                  </div>
                )}
                {value.email && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Email:</span>
                    <span className="ml-2 text-gray-600">{value.email}</span>
                  </div>
                )}
                {value.count !== undefined && (
                  <div className="text-sm">
                    <span className="font-medium text-gray-700">Count:</span>
                    <span className="ml-2 text-gray-600">{value.count}</span>
                  </div>
                )}
                {value.breakdown && (
                  <div className="text-sm mt-2 p-3 bg-gray-50 rounded">
                    <div className="font-medium text-gray-700 mb-2">Breakdown:</div>
                    <div className="space-y-1 pl-2">
                      <div>Draft: <span className="font-semibold">{value.breakdown.draft}</span></div>
                      <div>Published: <span className="font-semibold text-green-600">{value.breakdown.published}</span></div>
                      <div>Completed: <span className="font-semibold">{value.breakdown.completed}</span></div>
                      <div>Cancelled: <span className="font-semibold">{value.breakdown.cancelled}</span></div>
                    </div>
                  </div>
                )}
                {value.note && (
                  <div className="text-sm text-blue-600 bg-blue-50 p-2 rounded mt-2">
                    ℹ️ {value.note}
                  </div>
                )}
                {value.error && (
                  <div className="text-sm">
                    <span className="font-medium text-red-700">Error:</span>
                    <span className="ml-2 text-red-600">{value.error}</span>
                  </div>
                )}
                {value.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium text-indigo-600 hover:text-indigo-700">
                      View Data
                    </summary>
                    <pre className="mt-2 p-4 bg-gray-50 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(value.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={runDiagnostics}
            className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
          >
            Refresh Diagnostics
          </button>
        </div>
      </div>
    </div>
  );
}
