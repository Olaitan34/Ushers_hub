# 🚀 Quick Start Guide - Usher Hire Platform

## ✅ You're Almost Ready!

Your Supabase credentials are already configured. Just follow these final steps:

---

## 📝 STEP 1: Set Up Database (2 minutes)

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/spgnndvulkawunrgjean

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar

3. **Run the Schema**
   - Open the file: `supabase-schema.sql`
   - Copy ALL the contents
   - Paste into Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Tables Created**
   - Go to "Table Editor" in sidebar
   - You should see: profiles, usher_profiles, events, bookings, reviews

---

## 🏃 STEP 2: Start the App (30 seconds)

```bash
cd c:\Users\emfat\Ushers_hub\usher-hire
npm run dev
```

Open your browser to: **http://localhost:3000**

---

## 🎯 STEP 3: Test It Out!

### Create Your First Planner Account:
1. Go to http://localhost:3000/auth/signup
2. Fill in the form:
   - Full Name: "John Planner"
   - Email: "planner@test.com"
   - Phone: "+1234567890"
   - Password: "password123"
   - Select: **Event Planner**
3. Click "Sign up"
4. You'll be redirected to `/dashboard/planner`

### Create Your First Event:
1. Click "Create Event" button
2. **Step 1 - Basic Info:**
   - Title: "Wedding Reception"
   - Description: "Elegant wedding at downtown venue"
   - Venue: "123 Main St, New York, NY"
   - Click "Next"
3. **Step 2 - Date & Time:**
   - Event Date: (pick a future date)
   - Start Time: 18:00
   - End Time: 23:00
   - Ushers Needed: 4
   - Pay Rate: 150
   - Click "Next"
4. **Step 3 - Requirements:**
   - Requirements: "Must be punctual and professional"
   - Dress Code: "Black suit, white shirt"
   - Click "Create Event"

### Publish Your Event:
To make it visible to ushers, you need to change status to 'published':
1. Go to Supabase Dashboard → Table Editor → events table
2. Find your event
3. Change `status` from 'draft' to 'published'
4. Save

### Create an Usher Account:
1. Sign out (or open incognito window)
2. Go to http://localhost:3000/auth/signup
3. Fill in the form:
   - Full Name: "Sarah Usher"
   - Email: "usher@test.com"
   - Password: "password123"
   - Select: **Usher**
4. Click "Sign up"
5. You'll be redirected to `/dashboard/usher`

### Apply for the Event:
1. Scroll down to "Available Events"
2. You should see your "Wedding Reception" event
3. Click "Apply Now"
4. Application submitted!

### Review Applications (Back to Planner):
1. Sign out and sign in as planner (planner@test.com)
2. Go to `/dashboard/planner`
3. You'll see "1 pending applications" on your event
4. Click "Review Applications" to see the usher who applied

---

## 🎨 What You Have Now:

### ✅ Features Working:
- User authentication (sign up/sign in)
- Role-based dashboards (usher/planner)
- Event creation (multi-step form)
- Event browsing
- Application system
- Real-time stats
- Profile completion tracking

### 📊 Dashboards:
- **Usher Dashboard** (`/dashboard/usher`):
  - Total earnings
  - Events completed
  - Average rating
  - Upcoming bookings
  - Available events to apply

- **Planner Dashboard** (`/dashboard/planner`):
  - Total events
  - Upcoming events
  - Active bookings
  - Ushers hired
  - Event filtering
  - Application management

---

## 🔧 Common Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Check for errors
npm run lint
```

---

## 📱 Testing Checklist

- [ ] Sign up as usher works
- [ ] Sign up as planner works
- [ ] Usher dashboard loads with stats
- [ ] Planner dashboard loads with stats
- [ ] Event creation works (all 3 steps)
- [ ] Events appear in planner dashboard
- [ ] Published events appear for ushers
- [ ] Usher can apply for events
- [ ] Applications appear in planner dashboard
- [ ] Stats update correctly

---

## 🐛 If Something Doesn't Work:

### Database not set up:
```
Error: relation "profiles" does not exist
```
→ Run the `supabase-schema.sql` in Supabase SQL Editor

### Environment variables missing:
```
Error: Missing Supabase environment variables
```
→ Check `.env.local` exists in usher-hire folder with correct values

### Sign up fails:
```
Error: User already registered
```
→ Use a different email or check Supabase Auth → Users

### Events not showing for ushers:
→ Make sure event status is 'published' (not 'draft')
→ Make sure event_date is in the future

---

## 🎉 You're Ready!

Everything is set up and ready to go. Just:
1. ✅ Run the database schema
2. ✅ Start the dev server
3. ✅ Create test accounts
4. ✅ Try all the features!

**Time to complete**: ~5 minutes
**What you get**: A fully functional usher hiring platform! 🚀

---

## 📚 Next Steps:

- Read `IMPLEMENTATION_COMPLETE.md` for full feature list
- Check `SETUP_GUIDE.md` for detailed setup
- Review `PROJECT_README.md` for documentation

Happy building! 🎯
