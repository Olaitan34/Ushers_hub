# 🔧 FIXING "Database error saving new user"

## The Problem
This error occurs when trying to sign up because the database tables haven't been created yet in your Supabase project.

## ✅ SOLUTION (Follow these steps in order)

### Step 1: Run the Quick Setup SQL (2 minutes)

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/spgnndvulkawunrgjean

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar (or use the search)
   - Click "New Query"

3. **Copy and Run the Setup Script**
   - Open the file: `supabase-quick-setup.sql` in your project
   - Copy ALL the contents
   - Paste into the SQL Editor
   - Click "Run" (or press Ctrl+Enter)
   - Wait for "Success" message

4. **Verify Tables Were Created**
   - Click "Table Editor" in the left sidebar
   - You should see these tables:
     ✅ profiles
     ✅ usher_profiles
     ✅ events
     ✅ bookings
     ✅ reviews

### Step 2: Test Signup Again

1. **Make sure your dev server is running**
   ```bash
   npm run dev
   ```

2. **Try signing up again**
   - Go to http://localhost:3000/auth/signup
   - Fill in the form
   - Select user type (Usher or Planner)
   - Click "Sign up"

3. **You should see**
   - "Account created successfully!" alert
   - Email verification message (check your email)
   - Redirect to your dashboard

### Step 3: Verify It Worked

1. **Check Supabase Authentication**
   - Go to Supabase Dashboard → Authentication → Users
   - You should see your new user

2. **Check Profiles Table**
   - Go to Supabase Dashboard → Table Editor → profiles
   - You should see your profile record

3. **Check Usher Profile (if you signed up as usher)**
   - Go to Table Editor → usher_profiles
   - You should see your usher profile

---

## 🐛 Still Having Issues?

### Error: "relation does not exist"
**Solution**: You didn't run the SQL script. Go back to Step 1.

### Error: "duplicate key value"
**Solution**: User already exists. Either:
- Use a different email address
- Delete the user from Supabase Authentication → Users
- Then try again

### Error: "Invalid user_type"
**Solution**: The enum wasn't created. Make sure you ran the COMPLETE `supabase-quick-setup.sql` script.

### Error: "Email not confirmed"
**Solution**: 
- Check your email for verification link
- Or go to Supabase → Authentication → Users → Click your user → Mark as "Confirmed"

### Tables exist but signup still fails
**Solution**: Check RLS policies
```sql
-- Run this in SQL Editor to temporarily disable RLS for testing
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE usher_profiles DISABLE ROW LEVEL SECURITY;

-- Try signup again
-- If it works, re-enable RLS:
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usher_profiles ENABLE ROW LEVEL SECURITY;
```

---

## 🎯 What Changed?

### Updated Signup Function
The signup function now manually creates the profile records instead of relying on database triggers. This is more reliable because:

1. ✅ It handles errors gracefully
2. ✅ Creates both `profiles` and `usher_profiles` tables as needed
3. ✅ Shows clear error messages
4. ✅ Verifies the profile was created before redirecting

### Files Modified
- ✅ `src/app/auth/signup/page.tsx` - Now manually creates profiles
- ✅ `src/app/layout.tsx` - Fixed hydration warning
- ✅ Created `supabase-quick-setup.sql` - Simplified database setup

---

## 📝 Quick Test Checklist

- [ ] Ran `supabase-quick-setup.sql` in Supabase SQL Editor
- [ ] Verified tables exist in Table Editor
- [ ] Dev server is running (`npm run dev`)
- [ ] Tried signup with new email address
- [ ] Received success message
- [ ] User appears in Supabase Authentication
- [ ] Profile appears in profiles table
- [ ] Dashboard loads correctly

---

## 🚀 After It Works

Once signup is working, you can test the full flow:

1. **Create a Planner Account**
   - Sign up as "Event Planner"
   - Go to dashboard
   - Create an event
   - Change event status to "published" in Supabase

2. **Create an Usher Account**
   - Sign up as "Usher" (use different email)
   - Browse available events
   - Apply for the event you created

3. **Check Applications**
   - Sign in as planner
   - See pending application
   - Accept/reject application

---

## 💡 Pro Tips

1. **Use Test Emails**: For testing, use emails like:
   - planner1@test.com
   - usher1@test.com
   - john@example.com

2. **Skip Email Verification**: In Supabase Dashboard:
   - Go to Authentication → Providers
   - Disable "Confirm email" for testing
   - Re-enable for production

3. **View Logs**: In Supabase Dashboard:
   - Go to Logs → Postgres Logs
   - See any database errors in real-time

4. **Test with Incognito**: Use incognito/private windows to test multiple accounts without signing out

---

**Need more help?** Check the browser console (F12) for detailed error messages!
