# 🚀 Deploy Ushers Hub to Vercel - Quick Guide

## Prerequisites
✅ All code is committed to GitHub
✅ No build errors
✅ Environment variables ready

---

## 🔥 DEPLOYMENT STEPS (5 Minutes)

### Step 1: Go to Vercel
1. Open https://vercel.com
2. Click **"Sign Up"** or **"Log In"** with GitHub
3. Authorize Vercel to access your GitHub repositories

### Step 2: Import Your Project
1. Click **"Add New..."** → **"Project"**
2. Find **"Olaitan34/Ushers_hub"** in the list
3. Click **"Import"**

### Step 3: Configure Project
**Framework Preset:** Next.js (auto-detected)
**Root Directory:** `usher-hire` ⚠️ **IMPORTANT**
**Build Command:** `npm run build` (default)
**Output Directory:** `.next` (default)

### Step 4: Add Environment Variables
Click **"Environment Variables"** and add these TWO variables:

```
NEXT_PUBLIC_SUPABASE_URL
https://jknswptynsazaqxdljhh.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImprbnN3cHR5bnNhemFxeGRsamhoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3Njk5MjksImV4cCI6MjA4MDM0NTkyOX0.6Or-EjiaWH9u9OrSR-ZeHBamQul_Pv5OjOfTcOwMF74
```

### Step 5: Deploy!
1. Click **"Deploy"**
2. Wait 2-3 minutes for build to complete
3. 🎉 Your site will be live at `https://your-project-name.vercel.app`

---

## ⚙️ IMPORTANT: Configure Supabase for Production

After deployment, you MUST update Supabase settings:

### 1. Add Vercel URL to Supabase
1. Go to https://supabase.com/dashboard
2. Select your project: `jknswptynsazaqxdljhh`
3. Go to **Authentication** → **URL Configuration**
4. Add your Vercel URL to **Site URL**: `https://your-project-name.vercel.app`
5. Add to **Redirect URLs**:
   - `https://your-project-name.vercel.app/auth/callback`
   - `https://your-project-name.vercel.app/**`

### 2. Update CORS Settings (if needed)
1. In Supabase Dashboard → **Settings** → **API**
2. Scroll to **CORS Configuration**
3. Add your Vercel domain if authentication issues occur

---

## 🔧 Post-Deployment Setup

### Create Test Data
You still need to create events for testing:

1. **Create Planner Account**
   - Go to `https://your-project-name.vercel.app/auth/signup`
   - Sign up with `user_type: planner`
   - Complete profile

2. **Create Test Event**
   - Login as planner
   - Go to Dashboard → Create Event
   - Fill out form with:
     - Title: "Grand Opening Event"
     - Date: Future date (e.g., 2025-12-10)
     - Pay Rate: $25/hour
     - Ushers Needed: 5
     - Status: **Published** (very important!)

3. **Test as Usher**
   - Sign out
   - Login as usher (fatkayus@gmail.com)
   - Should see the event on dashboard
   - Click "Apply Now"

---

## 🐛 Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure Root Directory is set to `usher-hire`
- Verify all environment variables are added

### Authentication Doesn't Work
- Check Supabase URL Configuration
- Verify Redirect URLs include your Vercel domain
- Check browser console for CORS errors

### Can't See Events
- Verify event status is `published`
- Check event date is in the future
- Confirm user is logged in as usher

### Database Issues
- Run diagnostics at `/diagnostics`
- Check Supabase logs in dashboard
- Verify RLS policies are active

---

## 📱 Testing Your Live Site

After deployment, test these workflows:

1. ✅ **Home Page** - Modern design loads with animations
2. ✅ **Sign Up** - Both usher and planner accounts
3. ✅ **Sign In** - Authentication works
4. ✅ **Usher Dashboard** - Can see published events
5. ✅ **Apply to Event** - Application system works
6. ✅ **Planner Dashboard** - Can create events
7. ✅ **Browse Ushers** - Can view all ushers
8. ✅ **Review Applications** - Accept/Reject functionality
9. ✅ **Rating System** - Rate completed events

---

## 🎯 Quick Commands

```bash
# Push latest changes
git add .
git commit -m "Prepare for production"
git push origin main

# Vercel will auto-deploy on push (after initial setup)
```

---

## 🔗 Important URLs

**Your Site:** `https://your-project-name.vercel.app` (provided after deployment)
**Vercel Dashboard:** https://vercel.com/dashboard
**Supabase Dashboard:** https://supabase.com/dashboard/project/jknswptynsazaqxdljhh
**GitHub Repo:** https://github.com/Olaitan34/Ushers_hub

---

## ✨ Features Live on Production

- 🎨 Beautiful modern UI with animations
- 🔐 Secure authentication (Supabase)
- 👥 Dual dashboards (Usher & Planner)
- 📅 Event creation and management
- 🙋 Application system with status tracking
- ⭐ 5-star rating system
- 🔍 Browse and filter ushers
- 📊 Real-time statistics
- 🎯 Availability status management
- 💼 Complete booking workflow

---

## 🚀 Next Steps After Deployment

1. Share your live URL with users
2. Create real planner accounts
3. Post actual events
4. Monitor Vercel analytics
5. Check Supabase usage
6. Set up custom domain (optional)

**Need help?** Check Vercel logs or Supabase dashboard for errors.

Good luck with your deployment! 🎉
