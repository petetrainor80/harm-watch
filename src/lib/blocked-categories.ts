import { createServiceClient } from "./supabase/service";

export type BlockedCategoryResult =
  | { blocked: false }
  | {
      blocked: true;
      slug: string;
      redirect_url: string;
      redirect_copy: string;
    };

// Checks whether any of the submitted category slugs are blocked.
// Data-driven from the tags table (is_blocked = true). Returns the first
// blocked tag found, or { blocked: false } if all are acceptable.
export async function checkForBlockedCategories(
  slugs: string[]
): Promise<BlockedCategoryResult> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("tags")
    .select("slug, redirect_url, redirect_copy")
    .eq("is_blocked", true)
    .in("slug", slugs)
    .limit(1)
    .maybeSingle();

  if (!data) return { blocked: false };

  return {
    blocked: true,
    slug: data.slug as string,
    redirect_url: data.redirect_url as string,
    redirect_copy: data.redirect_copy as string,
  };
}

// Increments the anonymous blocked routing counter.
// No URL, no IP, no payload — counter only. See PRD section 5.
export async function recordBlockedRoutingEvent(tagSlug: string): Promise<void> {
  const supabase = createServiceClient();
  await supabase.from("blocked_routing_events").insert({ tag_slug: tagSlug });
}
