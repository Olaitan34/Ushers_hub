import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client for server-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// GET - Fetch user's bookings
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch bookings for the user
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        events (*),
        profiles!usher_id (*)
      `)
      .eq('usher_id', user.id)
      .order('created_at', { ascending: false });

    if (bookingsError) throw bookingsError;

    return NextResponse.json(
      { bookings },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { event_id, notes } = body;

    if (!event_id) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      );
    }

    // Check if user is an usher
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_type')
      .eq('id', user.id)
      .single();

    if (profileError || profile.user_type !== 'usher') {
      return NextResponse.json(
        { error: 'Only ushers can apply for events' },
        { status: 403 }
      );
    }

    // Check if already applied
    const { data: existingBooking } = await supabase
      .from('bookings')
      .select('id')
      .eq('event_id', event_id)
      .eq('usher_id', user.id)
      .single();

    if (existingBooking) {
      return NextResponse.json(
        { error: 'You have already applied for this event' },
        { status: 400 }
      );
    }

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          event_id,
          usher_id: user.id,
          status: 'pending',
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (bookingError) throw bookingError;

    return NextResponse.json(
      { message: 'Application submitted successfully', booking },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH - Update booking status
export async function PATCH(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { booking_id, status } = body;

    if (!booking_id || !status) {
      return NextResponse.json(
        { error: 'Booking ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Fetch booking with event details
    const { data: booking, error: fetchError } = await supabase
      .from('bookings')
      .select('*, events (*)')
      .eq('id', booking_id)
      .single();

    if (fetchError) throw fetchError;

    // Check authorization (only event planner or usher can update)
    const event = booking.events as any;
    if (event.planner_id !== user.id && booking.usher_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to update this booking' },
        { status: 403 }
      );
    }

    // Update booking
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', booking_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(
      { message: 'Booking updated successfully', booking: updatedBooking },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
