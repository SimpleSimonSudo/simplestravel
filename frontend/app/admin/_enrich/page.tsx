import { createServerClient } from "@/lib/supabase";
import EnrichClient from "./EnrichClient";

export const revalidate = 0; // Ensure admin tags are fresh

export default async function EnrichPage() {
  const supabase = createServerClient();

  // Fetch posts with minimal fields to populate the sidebar list chronologically (old to new)
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      post_id,
      post_date,
      actual_date,
      title,
      is_enriched,
      media_count,
      summary,
      country_id,
      trip_id,
      latitude,
      longitude,
      companions,
      travel_mode,
      weather,
      mood,
      highlights,
      tags
    `)
    .order("actual_date", { ascending: true });

  if (error) {
    console.error("Error loading posts for enrichment:", error);
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-paper text-ink">
        <div className="text-center font-body">
          <h1 className="text-2xl font-bold font-display mb-2">Error Loading Posts</h1>
          <p className="text-xs text-dust">{error.message}</p>
        </div>
      </div>
    );
  }

  return <EnrichClient initialPosts={posts || []} />;
}
