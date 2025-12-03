# Complete Booking & Rating System Documentation

## 🎯 System Overview

The platform now has a complete workflow for ushers to apply for events, planners to manage applications, and a rating system to track performance.

---

## 📋 Complete Workflow

### 1. **Usher Applies to Event**
**Location:** Usher Dashboard (`/dashboard/usher`)

**What happens:**
- Usher sees available published events
- Clicks "Apply Now" button
- Booking created with status: `pending`
- Application appears in "Your Applications & Bookings" section with ⏳ "Waiting for planner approval"

### 2. **Planner Reviews Applications**
**Location:** Planner Dashboard → Click "Review Applications" button

**Route:** `/dashboard/planner/events/[eventId]/applications`

**What planner sees:**
- List of all applicants for the event
- Each application shows:
  - Usher's photo, name, rating
  - Total events completed
  - Hourly rate
  - Skills
  - Application notes
  - Application date/time

**Actions available:**
- ✅ **Accept** - Approves the usher for the event
- ❌ **Reject** - Declines the application
- 👤 **View Profile** - See full usher details
- 🎉 **Mark Completed** - After event ends (only for accepted bookings)
- ⭐ **Rate Usher** - After marking completed

### 3. **Usher Gets Notified**
**Location:** Usher Dashboard

**Status indicators:**
- 🟡 **PENDING** - Yellow badge: "⏳ Waiting for planner approval"
- 🟢 **ACCEPTED** - Green badge: "✅ Confirmed! See you at the event"
- 🔴 **REJECTED** - Red badge: "❌ Application was not accepted"
- 🔵 **COMPLETED** - Blue badge: "🎉 Event completed"

### 4. **Event Happens**
- Usher works at the event
- After event is finished...

### 5. **Planner Marks as Completed**
**Location:** `/dashboard/planner/events/[eventId]/applications`

**What happens when "Mark Completed" is clicked:**
1. Booking status changes to `completed`
2. **Usher's `total_events` counter automatically increments by 1** ✅
3. "Rate Usher" button appears

### 6. **Planner Rates the Usher**
**Location:** `/dashboard/planner/events/[eventId]/rate/[usherId]`

**Rating Features:**
- 1-5 star rating with hover effects
- Optional comment/feedback
- Quick rating buttons with pre-filled text:
  - 5★ - "Excellent! Exceeded expectations"
  - 4★ - "Very good performance"
  - 3★ - "Good, met expectations"
  - 2★ - "Below expectations"
  - 1★ - "Poor performance"

**What happens when rating submitted:**
1. Review saved to `reviews` table
2. **Usher's average rating automatically recalculated** ✅
3. **Usher profile updated with new rating** ✅
4. Redirected back to applications page

---

## 🔢 Event Count Tracking

### How it works:
1. When usher completes an event, `total_events` increments
2. Displayed on usher profile
3. Visible to planners when browsing ushers
4. Shows usher's experience level

### Where it's displayed:
- Usher dashboard stats (top of page)
- Usher profile page
- Browse ushers page (planner view)
- Application cards (planner view)

---

## ⭐ Rating System

### How ratings are calculated:
```javascript
// When new rating submitted:
1. Fetch all reviews for the usher
2. Calculate average: sum(all ratings) / count(reviews)
3. Round to 2 decimal places (e.g., 4.67)
4. Update usher_profiles.rating
```

### Where ratings are displayed:
- Usher dashboard (top stats)
- Usher profile page
- Browse ushers card
- Application review page
- Next to usher name everywhere

---

## 📊 Dashboard Statistics

### Usher Dashboard Stats:
- **Total Earnings**: Sum of pay_rate from completed events
- **Events Completed**: `usher_profiles.total_events` (auto-updated)
- **Average Rating**: `usher_profiles.rating` (auto-calculated)
- **Upcoming Bookings**: Count of pending + accepted applications

### Planner Dashboard Stats (per event):
- **Total Applications**: All applications
- **Pending Review**: Applications with `status='pending'`
- **Accepted**: `X / Y` (accepted count / ushers needed)

---

## 🗄️ Database Schema

### Tables Used:

**bookings**
```sql
- id (UUID)
- event_id (UUID) -> events.id
- usher_id (UUID) -> profiles.id
- status (pending|accepted|rejected|completed|cancelled)
- notes (TEXT)
- applied_at (TIMESTAMP)
- created_at, updated_at
```

**reviews**
```sql
- id (UUID)
- booking_id (UUID) -> bookings.id
- reviewer_id (UUID) -> profiles.id (planner)
- reviewee_id (UUID) -> profiles.id (usher)
- rating (INTEGER 1-5)
- comment (TEXT, optional)
- created_at
```

**usher_profiles**
```sql
- rating (DECIMAL) - auto-calculated average
- total_events (INTEGER) - auto-incremented
- ... other fields
```

---

## 🚀 Routes Summary

### Planner Routes:
- `/dashboard/planner` - Main dashboard
- `/dashboard/planner/events/create` - Create event
- `/dashboard/planner/events/[id]/applications` - Manage applications
- `/dashboard/planner/events/[id]/rate/[usherId]` - Rate usher
- `/dashboard/planner/ushers` - Browse all ushers
- `/dashboard/planner/ushers/[id]` - View usher profile

### Usher Routes:
- `/dashboard/usher` - Main dashboard
- `/dashboard/usher/profile` - Edit profile

---

## ✅ Complete Feature Checklist

- [x] Usher can see available events
- [x] Usher can apply to events
- [x] Planner gets notified of applications (pending count)
- [x] Planner can view all applications for an event
- [x] Planner can accept applications
- [x] Planner can reject applications
- [x] Usher sees application status (pending/accepted/rejected)
- [x] Planner can mark events as completed
- [x] Event count automatically increments when marked completed
- [x] Planner can rate ushers after completion
- [x] Average rating automatically calculated
- [x] Usher profile shows updated rating
- [x] Usher profile shows total events count
- [x] Application status notifications for ushers
- [x] Prevent duplicate applications

---

## 🎨 Status Colors & Icons

| Status | Color | Icon | Message |
|--------|-------|------|---------|
| pending | Yellow | ⏳ | Waiting for planner approval |
| accepted | Green | ✅ | Confirmed! See you at the event |
| rejected | Red | ❌ | Application was not accepted |
| completed | Blue | 🎉 | Event completed |
| cancelled | Gray | ⛔ | Cancelled |

---

## 🧪 Testing the Complete Flow

### Test Scenario:

1. **Create planner account** (if you don't have one)
   - Sign up with email: `planner@test.com`
   - Select "Event Planner"

2. **Create an event** as planner
   - Title: "Test Event"
   - Date: Tomorrow
   - Status: "published"

3. **Apply as usher**
   - Sign in with usher account
   - See event in "Available Events"
   - Click "Apply Now"
   - See in "Applications & Bookings" with PENDING status

4. **Review application** as planner
   - Dashboard shows "Review 1 Application"
   - Click button
   - See usher details
   - Click "Accept"

5. **Check usher dashboard**
   - Status changed to ACCEPTED ✅
   - Shows "Confirmed! See you at the event"

6. **Mark completed** as planner
   - Go back to applications page
   - Click "Mark Completed"
   - Usher's event count increases

7. **Rate the usher** as planner
   - "Rate Usher" button appears
   - Click it
   - Give 5 stars
   - Add comment
   - Submit

8. **Verify updates**
   - Check usher dashboard
   - See updated rating
   - See incremented event count

---

## 📝 Notes

- **Automatic Updates**: Event count and ratings are automatically calculated - no manual intervention needed
- **Real-time**: All changes reflect immediately on refresh
- **Validation**: System prevents duplicate applications
- **Authorization**: Only event planner can manage their event's applications
- **One Rating Per Event**: Can only rate each usher once per event

---

## 🐛 Common Issues

**Q: Planner doesn't see applications?**
A: Make sure ushers have actually applied. Check pending count on dashboard.

**Q: Can't rate usher?**
A: Must mark event as completed first. Rating button only appears after completion.

**Q: Event count not updating?**
A: Use "Mark Completed" button - this triggers the counter increment.

**Q: Rating not changing?**
A: Rating is an average. If usher has multiple reviews, one new review might not drastically change it.
