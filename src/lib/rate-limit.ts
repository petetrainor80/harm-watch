import { createServiceClient } from "./supabase/service";

// Rate limiting via the submission_throttle Postgres table.
// 5 submissions per hour, 20 per day, per hashed IP.
// PRD-Q: Upstash Redis is the first-choice per the PRD. Using Postgres here
// to avoid an additional external service dependency in early milestones.

const HOURLY_LIMIT = 5;
const DAILY_LIMIT = 20;

export interface RateLimitResult {
  allowed: boolean;
  retryAfter?: number; // seconds until the window resets
}

export async function checkRateLimit(ipHash: string): Promise<RateLimitResult> {
  const supabase = createServiceClient();
  const now = new Date();

  // Truncate to the current hour
  const hourWindow = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      now.getUTCHours()
    )
  );

  // Truncate to the current day
  const dayWindow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
  );

  const nextHour = new Date(hourWindow.getTime() + 60 * 60 * 1000);
  const nextDay = new Date(dayWindow.getTime() + 24 * 60 * 60 * 1000);

  // Check hourly count
  const { data: hourRow } = await supabase
    .from("submission_throttle")
    .select("count")
    .eq("ip_hash", ipHash)
    .eq("window_start", hourWindow.toISOString())
    .maybeSingle();

  if (hourRow && hourRow.count >= HOURLY_LIMIT) {
    return {
      allowed: false,
      retryAfter: Math.ceil((nextHour.getTime() - now.getTime()) / 1000),
    };
  }

  // Check daily total across all hourly windows today
  const { data: dayRows } = await supabase
    .from("submission_throttle")
    .select("count")
    .eq("ip_hash", ipHash)
    .gte("window_start", dayWindow.toISOString())
    .lt("window_start", nextDay.toISOString());

  const dayTotal =
    dayRows?.reduce((sum, row) => sum + (row.count as number), 0) ?? 0;

  if (dayTotal >= DAILY_LIMIT) {
    return {
      allowed: false,
      retryAfter: Math.ceil((nextDay.getTime() - now.getTime()) / 1000),
    };
  }

  // Allowed — atomically increment the hourly counter
  await supabase.rpc("increment_submission_throttle", {
    p_ip_hash: ipHash,
    p_window_start: hourWindow.toISOString(),
  });

  return { allowed: true };
}
