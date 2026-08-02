import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client for client components.
// Uses the anon key + RLS. Never has access to the service role key.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
