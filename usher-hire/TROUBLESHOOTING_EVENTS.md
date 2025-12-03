# Troubleshooting: Usher Cannot See Events

## Quick Diagnostic Steps

### Step 1: Check Browser Console
1. Open the usher dashboard
2. Press F12 to open browser console
3. Look for these logs:
   ```
   Starting dashboard load...
   User authenticated: [id]
   Profile loaded: [name]
   Usher profile loaded
   Fetching available events...
   Today date: 2025-12-03
   Total events in database: [number]
   Sample event: [event object]
   Available events count: [number]
   ```

### Step 2: Use Diagnostics Page
1. Navigate to: `http://localhost:3000/diagnostics`
2. Check the **Events** section:
   - Should show green checkmark ✓
   - Shows breakdown by status (Draft/Published/Completed/Cancelled)
3. Check **Published Events** section:
   - Shows count of events available to ushers
   - Shows the query being used
4. Click "View Data" to see actual events

### Step 3: Verify Database Setup
Run this SQL in Supabase SQL Editor:
```sql
-- Check if events table exists
SELECT COUNT(*) FROM events;

-- Check all events
SELECT id, title, status, event_date FROM events;

-- Check published future events
SELECT id, title, status, event_date 
FROM events 
WHERE status = 'published' 
AND event_date >= CURRENT_DATE;
```

## Common Problems & Solutions

### Problem 1: "Total events in database: 0"
**Cause:** No events have been created yet

**Solution:**
1. Sign in as a planner
2. Click "Create Event" button
3. Fill in all required fields:
   - Title
   - Venue Address
   - Event Date (must be TODAY or FUTURE)
   - Start/End Time
   - Ushers Needed
   - Pay Rate
4. Click "Publish Event" (important!)
5. Check the event appears in planner dashboard

### Problem 2: "Available events count: 0" but "Total events: 1+"
**Possible Causes:**

**A) Events not published**
- Events have status 'draft', 'completed', or 'cancelled'
- Only 'published' events show to ushers

**Solution:** 
- Go to planner dashboard
- Find the event
- Change status to "published"

**B) Events in the past**
- Event date is before today
- Only future events show

**Solution:**
- Edit the event in planner dashboard
- Change event_date to today or future date

**C) Usher already applied**
- Events are filtered if usher already applied

**Solution:**
- Create a new event
- Or check "Your Upcoming Bookings" section

### Problem 3: Table doesn't exist error
**Cause:** Database schema not created

**Solution:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run: `supabase-quick-setup.sql`
4. Run: `add-availability-status.sql`
5. Refresh the page

### Problem 4: RLS (Row Level Security) blocking
**Cause:** Supabase RLS policies blocking access

**Solution:**
Check in Supabase Dashboard → Authentication → Policies

Make sure you have this policy for events:
```sql
-- Allow everyone to read published events
CREATE POLICY "Anyone can view published events"
ON events FOR SELECT
TO public
USING (status = 'published');
```

## Creating a Test Event

To test, create an event as planner with these exact values:

```
Title: Test Event for Ushers
Venue: 123 Test Street, Test City
Event Date: [Tomorrow's date]
Start Time: 14:00
End Time: 18:00
Ushers Needed: 5
Pay Rate: 25.00
Status: published
```

Then:
1. Sign out
2. Sign in as usher
3. Check dashboard - event should appear

## Debug Checklist

- [ ] Database tables exist (run SQL setup scripts)
- [ ] At least one event created
- [ ] Event status is "published"
- [ ] Event date is today or in the future
- [ ] Browser console shows no errors
- [ ] Diagnostics page shows events count > 0
- [ ] Usher is signed in (not planner)
- [ ] Page is not cached (try hard refresh: Ctrl+Shift+R)

## Still Not Working?

1. Copy all console logs from browser (F12)
2. Take screenshot of diagnostics page
3. Run this SQL and share results:
```sql
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE status = 'published') as published,
  COUNT(*) FILTER (WHERE event_date >= CURRENT_DATE) as future
FROM events;
```

## What the Console Should Show (Example)

```
Starting dashboard load...
User authenticated: 123e4567-e89b-12d3-a456-426614174000
Profile loaded: John Usher
Usher profile loaded
Fetching available events...
Today date: 2025-12-03
Total events in database: 2
Sample event: {id: "abc123", title: "Test Event", status: "published", event_date: "2025-12-05"}
Raw events from DB: [{...}, {...}]
Available events count: 2
Already applied to event IDs: []
Filtered events count: 2
```

If you see "Total events in database: 0" → No events created yet!
If you see "Available events count: 0" → Events exist but don't match criteria!
