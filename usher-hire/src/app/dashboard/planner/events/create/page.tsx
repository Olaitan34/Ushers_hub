'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    venue_address: '',
    event_date: '',
    start_time: '',
    end_time: '',
    ushers_needed: 1,
    pay_rate: 0,
    requirements: '',
    dress_code: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/auth/signin');
        return;
      }

      // Create the event
      const { data, error: insertError } = await supabase
        .from('events')
        .insert([
          {
            planner_id: user.id,
            title: formData.title,
            description: formData.description,
            venue_address: formData.venue_address,
            event_date: formData.event_date,
            start_time: formData.start_time,
            end_time: formData.end_time,
            ushers_needed: parseInt(formData.ushers_needed.toString()),
            pay_rate: parseFloat(formData.pay_rate.toString()),
            requirements: formData.requirements || null,
            dress_code: formData.dress_code || null,
            status: 'draft', // Can publish later
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      // Redirect to planner dashboard
      router.push('/dashboard/planner');
    } catch (err: any) {
      setError(err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create New Event</h1>
            <p className="mt-2 text-gray-600">Fill in the details for your event</p>
          </div>

          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step >= s
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`h-1 w-24 sm:w-32 ${
                        step > s ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-600">Basic Info</span>
              <span className="text-xs text-gray-600">Date & Time</span>
              <span className="text-xs text-gray-600">Requirements</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Step 1: Basic Information */}
            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                    Event Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    id="title"
                    required
                    value={formData.title}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Corporate Conference 2024"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Provide details about your event..."
                  />
                </div>

                <div>
                  <label htmlFor="venue_address" className="block text-sm font-medium text-gray-700">
                    Venue Address *
                  </label>
                  <input
                    type="text"
                    name="venue_address"
                    id="venue_address"
                    required
                    value={formData.venue_address}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="123 Main St, City, State"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Date and Time */}
            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="event_date" className="block text-sm font-medium text-gray-700">
                    Event Date *
                  </label>
                  <input
                    type="date"
                    name="event_date"
                    id="event_date"
                    required
                    value={formData.event_date}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="start_time" className="block text-sm font-medium text-gray-700">
                      Start Time *
                    </label>
                    <input
                      type="time"
                      name="start_time"
                      id="start_time"
                      required
                      value={formData.start_time}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="end_time" className="block text-sm font-medium text-gray-700">
                      End Time *
                    </label>
                    <input
                      type="time"
                      name="end_time"
                      id="end_time"
                      required
                      value={formData.end_time}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="ushers_needed" className="block text-sm font-medium text-gray-700">
                      Ushers Needed *
                    </label>
                    <input
                      type="number"
                      name="ushers_needed"
                      id="ushers_needed"
                      required
                      min="1"
                      value={formData.ushers_needed}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="pay_rate" className="block text-sm font-medium text-gray-700">
                      Pay Rate ($ per usher) *
                    </label>
                    <input
                      type="number"
                      name="pay_rate"
                      id="pay_rate"
                      required
                      min="0"
                      step="0.01"
                      value={formData.pay_rate}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Requirements */}
            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
                    Requirements
                  </label>
                  <textarea
                    name="requirements"
                    id="requirements"
                    rows={4}
                    value={formData.requirements}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Must be punctual, friendly demeanor..."
                  />
                </div>

                <div>
                  <label htmlFor="dress_code" className="block text-sm font-medium text-gray-700">
                    Dress Code
                  </label>
                  <input
                    type="text"
                    name="dress_code"
                    id="dress_code"
                    value={formData.dress_code}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="e.g., Business formal, All black"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Event Summary</h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-blue-700">Title:</dt>
                      <dd className="font-medium text-blue-900">{formData.title || 'N/A'}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-blue-700">Date:</dt>
                      <dd className="font-medium text-blue-900">
                        {formData.event_date ? new Date(formData.event_date).toLocaleDateString() : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-blue-700">Time:</dt>
                      <dd className="font-medium text-blue-900">
                        {formData.start_time && formData.end_time
                          ? `${formData.start_time} - ${formData.end_time}`
                          : 'N/A'}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-blue-700">Ushers:</dt>
                      <dd className="font-medium text-blue-900">{formData.ushers_needed}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-blue-700">Pay Rate:</dt>
                      <dd className="font-medium text-blue-900">${formData.pay_rate}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 flex justify-between">
              <button
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Event'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
