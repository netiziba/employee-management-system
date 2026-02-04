# Supabase Setup Guide

## Quick Setup

Your app needs Supabase to work. You have two options:

### Option 1: Use Remote Supabase (Recommended if Docker is not available)

1. **Create a Supabase Project:**
   - Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Sign up or log in
   - Click "New Project"
   - Fill in your project details

2. **Get Your API Keys:**
   - In your project dashboard, go to **Settings** → **API**
   - Copy your **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - Copy your **anon/public key** (the `anon` `public` key)

3. **Update `.env.local`:**
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run Database Migrations:**
   - In Supabase Dashboard, go to **SQL Editor**
   - Copy the contents of `supabase/migrations/20260203224506_setup_employee_management_schema.sql`
   - Paste and run it in the SQL Editor

5. **Restart your dev server:**
   ```bash
   pnpm dev
   ```

### Option 2: Use Local Supabase

1. **Start Docker Desktop:**
   - Make sure Docker Desktop is installed and running

2. **Start Supabase:**
   ```bash
   pnpm supabase start
   ```
   This will start Supabase locally and run your migrations automatically.

3. **The `.env.local` file already has the correct local values:**
   ```
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **Restart your dev server:**
   ```bash
   pnpm dev
   ```

## Troubleshooting

### Connection Refused Errors
- **Local Supabase:** Make sure Docker is running and `pnpm supabase start` completed successfully
- **Remote Supabase:** Verify your URL and API key in `.env.local` are correct

### Hydration Warnings
- These are usually caused by browser extensions and can be safely ignored
- They don't affect functionality

### Still Having Issues?
- Check that your `.env.local` file exists in the project root
- Make sure you've restarted your dev server after changing `.env.local`
- Verify your Supabase project is active and not paused
