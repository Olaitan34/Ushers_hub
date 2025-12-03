# Usher Hire - Setup Guide

## ✅ Completed Steps

### 1. Project Creation
- ✅ Created Next.js 14 app with TypeScript and Tailwind CSS
- ✅ Installed Supabase dependencies (@supabase/supabase-js)

### 2. Project Structure Created

```
usher-hire/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── signin/page.tsx          ✅ Sign-in page
│   │   │   └── signup/page.tsx          ✅ Sign-up page with user type selection
│   │   ├── dashboard/
│   │   │   ├── usher/page.tsx           ✅ Usher dashboard with stats cards
│   │   │   └── planner/page.tsx         ✅ Planner dashboard with event management
│   │   ├── api/
│   │   │   ├── auth/route.ts            ✅ Authentication API endpoint
│   │   │   ├── events/route.ts          ✅ Events API (GET, POST)
│   │   │   └── ushers/route.ts          ✅ Ushers API (GET)
│   │   └── page.tsx                     ✅ Landing page with hero & features
│   ├── components/
│   │   ├── Header.tsx                   ✅ Navigation with sign-in/sign-up links
│   │   ├── Footer.tsx                   ✅ Footer with links and info
│   │   └── Card.tsx                     ✅ Reusable card component
│   └── lib/
│       └── supabase.ts                  ✅ Supabase client configuration
├── .env.local                           ✅ Environment variables template
└── PROJECT_README.md                    ✅ Complete project documentation
```

## 🔧 Next Steps - Supabase Configuration

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Click "New Project"
3. Fill in project details:
   - Name: `usher-hire` (or your preferred name)
   - Database Password: (create a strong password)
   - Region: (choose closest to your users)
4. Wait for project to finish setting up (2-3 minutes)

### Step 2: Get API Credentials
1. In your Supabase dashboard, go to **Settings** → **API**
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Project API keys** → **anon public** key

### Step 3: Update .env.local
Open `.env.local` file and replace with your actual values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### Step 4: Create Database Tables

In Supabase dashboard, go to **SQL Editor** and run these queries:

```sql
-- Create users profile table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  user_type TEXT CHECK (user_type IN ('usher', 'planner')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  planner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT NOT NULL,
  ushers_needed INTEGER NOT NULL DEFAULT 1,
  pay_rate DECIMAL(10, 2),
  status TEXT CHECK (status IN ('draft', 'published', 'completed', 'cancelled')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  usher_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')) DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, usher_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Profiles: Users can read all profiles, but only update their own
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Events: Anyone can view published events, only planners can create/edit their events
CREATE POLICY "Published events are viewable by everyone"
  ON events FOR SELECT
  USING (status = 'published' OR planner_id = auth.uid());

CREATE POLICY "Planners can create events"
  ON events FOR INSERT
  WITH CHECK (planner_id = auth.uid());

CREATE POLICY "Planners can update own events"
  ON events FOR UPDATE
  USING (planner_id = auth.uid());

-- Bookings: Users can view their own bookings
CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  USING (usher_id = auth.uid() OR event_id IN (
    SELECT id FROM events WHERE planner_id = auth.uid()
  ));

CREATE POLICY "Ushers can create bookings"
  ON bookings FOR INSERT
  WITH CHECK (usher_id = auth.uid());

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  USING (usher_id = auth.uid() OR event_id IN (
    SELECT id FROM events WHERE planner_id = auth.uid()
  ));
```

### Step 5: Enable Authentication

1. In Supabase dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (should be enabled by default)
3. Optional: Configure other providers (Google, GitHub, etc.)

### Step 6: Test the Application

```bash
npm run dev
```

Visit http://localhost:3000 and test:
- ✅ Landing page loads
- ✅ Sign-up form works
- ✅ Sign-in form works
- ✅ Dashboard routes are accessible

## 🎨 Features Overview

### For Event Planners
- Create and manage events
- Browse available ushers
- Book ushers for events
- Track bookings and payments
- Rate and review ushers

### For Ushers
- Create professional profile
- Browse available events
- Apply for event positions
- Track bookings and earnings
- Build reputation with reviews

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com)
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Deploy!

## 🔐 Security Notes

- Never commit `.env.local` to version control
- Use Row Level Security (RLS) for all tables
- Validate all user inputs on both client and server
- Implement rate limiting for API routes
- Use HTTPS in production

## 📝 TODO

- [ ] Implement authentication logic in auth pages
- [ ] Connect API routes to Supabase
- [ ] Add form validation with libraries like Zod or React Hook Form
- [ ] Implement real-time updates with Supabase subscriptions
- [ ] Add payment integration (Stripe/PayPal)
- [ ] Create usher profile page
- [ ] Implement search and filter functionality
- [ ] Add notification system
- [ ] Create admin dashboard
- [ ] Add unit and integration tests

## 🐛 Troubleshooting

### Build Errors
- Run `npm install` to ensure all dependencies are installed
- Check that TypeScript errors are resolved
- Verify all imports are correct

### Supabase Connection Issues
- Verify `.env.local` has correct values
- Check Supabase project is active
- Ensure RLS policies are set correctly

### Styling Issues
- Run `npm run dev` to ensure Tailwind is compiling
- Check `tailwind.config.ts` configuration
- Verify class names are valid Tailwind classes
