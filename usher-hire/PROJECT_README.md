# Usher Hire Platform

A Next.js 14 application for connecting event planners with professional ushers.

## 🚀 Features

- **User Authentication**: Separate sign-in/sign-up flows for ushers and event planners
- **Dual Dashboards**: 
  - Usher Dashboard: Manage profile, view available events, track bookings
  - Planner Dashboard: Create events, find ushers, manage bookings
- **API Routes**: RESTful API endpoints for events, ushers, and authentication
- **Supabase Integration**: Backend powered by Supabase for authentication and database

## 📋 Prerequisites

- Node.js 18.17 or later
- npm or yarn
- Supabase account

## 🛠️ Setup Instructions

### 1. Clone and Install Dependencies

```bash
cd usher-hire
npm install
```

### 2. Configure Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Copy your project URL and anon key from the project settings
3. Update the `.env.local` file with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url-here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

### 3. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
usher-hire/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   ├── signin/         # Sign-in page
│   │   │   └── signup/         # Sign-up page
│   │   ├── dashboard/
│   │   │   ├── usher/          # Usher dashboard
│   │   │   └── planner/        # Planner dashboard
│   │   └── api/
│   │       ├── auth/           # Authentication API
│   │       ├── events/         # Events API
│   │       └── ushers/         # Ushers API
│   ├── components/
│   │   ├── Header.tsx          # Navigation header
│   │   ├── Footer.tsx          # Footer component
│   │   └── Card.tsx            # Reusable card component
│   └── lib/
│       └── supabase.ts         # Supabase client configuration
├── .env.local                  # Environment variables
└── package.json
```

## 🎯 Key Routes

- `/auth/signin` - User sign-in
- `/auth/signup` - User registration
- `/dashboard/usher` - Usher dashboard
- `/dashboard/planner` - Event planner dashboard
- `/api/auth` - Authentication API endpoint
- `/api/events` - Events management API
- `/api/ushers` - Ushers data API

## 🔧 Technologies Used

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Authentication**: Supabase Auth

## 📝 Next Steps

1. Set up Supabase database schema
2. Implement authentication logic
3. Create database tables for users, events, and bookings
4. Add form validation
5. Implement real-time features
6. Add payment integration

## 🤝 Contributing

Feel free to submit issues and enhancement requests!

## 📄 License

MIT License
