import { createClient } from "@supabase/supabase-js";

// Service role client for Route Handlers that write to the DB on behalf of
// the public (submissions, blocked_routing_events). Bypasses RLS.
// NEVER expose this client or its key to the browser.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
