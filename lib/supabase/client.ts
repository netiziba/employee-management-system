import { createBrowserClient } from '@supabase/ssr'
import { type Database } from '@/database.types';

export function createClient() {
  // During build time, environment variables might not be available
  // Use fallback values to prevent build errors
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
  
  return createBrowserClient<Database>(url, key);
}
