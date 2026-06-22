import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import TripContent from "./TripContent";

type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 60;

export default async function TripDetailPage({ params }: Props) {
  const { id } = await params;
  const tripId = parseInt(id, 10);

  if (isNaN(tripId)) {
    return notFound();
  }

  const supabase = createServerClient();

  // Parallel laden: Trip-Details, Posts für Timeline und vollständige Posts für Journal
  const [tripRes, postsRes, fullPostsRes] = await Promise.all([
    supabase.from("trips_with_countries").select("*").eq("trip_id", tripId).single() as any,
    supabase
      .from("posts_with_thumbnail")
      .select(`
        post_id,
        post_date,
        title,
        summary,
        city,
        travel_mode,
        media_count,
        thumbnail_path,
        country:countries(name, iso_code)
      `)
      .eq("trip_id", tripId)
      .order("post_date", { ascending: true }) as any,
    supabase
      .from("posts")
      .select(`
        post_id,
        post_date,
        title,
        summary,
        city,
        travel_mode,
        weather,
        mood,
        content_blocks,
        country:countries(name, iso_code)
      `)
      .eq("trip_id", tripId)
      .order("post_date", { ascending: true }) as any,
  ]);

  if (tripRes.error || !tripRes.data) {
    console.error("Error loading trip:", tripRes.error);
    return notFound();
  }

  const trip = tripRes.data;
  const posts = postsRes.data ?? [];
  const fullPosts = fullPostsRes.data ?? [];

  // Hole alle Medien für diese Posts parallel
  const postIds = fullPosts.map((p: any) => p.post_id);
  const { data: media } = postIds.length > 0
    ? await supabase
      .from("media")
      .select("*")
      .in("post_id", postIds)
      .order("block_index")
      .order("display_order") as any
    : { data: [] };

  const start = trip.start_date ? new Date(trip.start_date) : null;
  const end = trip.end_date ? new Date(trip.end_date) : null;

  return (
    <div className="min-h-screen bg-paper pb-24 pt-32 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <a href="/#trips" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-dust hover:text-amber transition-colors font-body mb-8 group">
          <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          All Trips
        </a>

        {/* Header */}
        <header className="mb-4 border-b border-ink/10 pb-12">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="overline">Adventure</span>
            <span className="text-dust/40">·</span>
            <span className="text-xs uppercase font-body tracking-wider text-dust tabular-nums">
              {start?.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
              {end && ` – ${end.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}`}
            </span>
          </div>

          <h1 className="font-display font-black text-4xl md:text-6xl text-ink mb-6">
            {trip.trip_name}
          </h1>

          {trip.description && (
            <p className="font-body text-dust text-sm md:text-base leading-relaxed max-w-2xl mb-8">
              {trip.description}
            </p>
          )}

          {/* Stats Bar */}
          <div className="flex flex-wrap gap-8 text-xs text-dust font-body">
            <div className="flex flex-col">
              <span className="overline text-2xs mb-1">Entries</span>
              <span className="text-ink text-lg">{posts.length}</span>
            </div>
            {trip.total_distance_km && (
              <div className="flex flex-col">
                <span className="overline text-2xs mb-1">Distance</span>
                <span className="text-ink text-lg">{trip.total_distance_km.toLocaleString()} km</span>
              </div>
            )}
            {trip.countries && trip.countries.length > 0 && (
              <div className="flex flex-col">
                <span className="overline text-2xs mb-1">
                  {trip.countries.length === 1 ? "Country" : "Countries"}
                </span>
                <span className="text-ink text-lg">{trip.countries.join(", ")}</span>
              </div>
            )}
            {trip.companions && trip.companions.length > 0 && (
              <div className="flex flex-col">
                <span className="overline text-2xs mb-1">Companions</span>
                <span className="text-ink text-lg">{trip.companions.join(", ")}</span>
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Client Content Switcher */}
        <TripContent posts={posts} fullPosts={fullPosts} media={media || []} />
      </div>
    </div>
  );
}

