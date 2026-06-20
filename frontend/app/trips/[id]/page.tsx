import { createServerClient } from "@/lib/supabase";
import { notFound } from "next/navigation";
import Image from "next/image";

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

  // Parallel laden: Trip-Details und Posts des Trips (mit Thumbnail & Country Info)
  const [tripRes, postsRes] = await Promise.all([
    supabase.from("trips").select("*").eq("trip_id", tripId).single() as any,
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
  ]);

  if (tripRes.error || !tripRes.data) {
    console.error("Error loading trip:", tripRes.error);
    return notFound();
  }

  const trip = tripRes.data;
  const posts = postsRes.data ?? [];
  const start = trip.start_date ? new Date(trip.start_date) : null;
  const end = trip.end_date ? new Date(trip.end_date) : null;

  return (
    <div className="min-h-screen bg-paper pb-24 pt-32 px-8">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <a href="/trips" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-dust hover:text-amber transition-colors font-body mb-8 group">
          <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Alle Trips
        </a>

        {/* Header */}
        <header className="mb-16 border-b border-ink/10 pb-12">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="overline">Abenteuer</span>
            <span className="text-dust/40">·</span>
            <span className="text-xs uppercase font-body tracking-wider text-dust tabular-nums">
              {start?.toLocaleDateString("de-DE", { month: "short", year: "numeric" })}
              {end && ` – ${end.toLocaleDateString("de-DE", { month: "short", year: "numeric" })}`}
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
              <span className="overline text-2xs mb-1">Posts</span>
              <span className="text-ink font-semibold text-lg">{posts.length}</span>
            </div>
            {trip.total_distance_km && (
              <div className="flex flex-col">
                <span className="overline text-2xs mb-1">Distanz</span>
                <span className="text-ink font-semibold text-lg">{trip.total_distance_km.toLocaleString()} km</span>
              </div>
            )}
            {trip.companions && trip.companions.length > 0 && (
              <div className="flex flex-col">
                <span className="overline text-2xs mb-1">Begleiter</span>
                <span className="text-ink font-semibold text-lg">{trip.companions.join(", ")}</span>
              </div>
            )}
          </div>
        </header>

        {/* Timeline Posts */}
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-cream/20 rounded-sm border border-cream border-dashed">
            <p className="font-body text-dust text-sm">Für diesen Trip wurden noch keine Posts erfasst.</p>
          </div>
        ) : (
          <div className="relative border-l border-ink/10 pl-6 ml-4 space-y-12 py-4">
            {posts.map((post: any, index: number) => {
              const pDate = new Date(post.post_date);
              const postCountry = post.country as any;
              
              return (
                <div key={post.post_id} className="relative group">
                  {/* Timeline bullet */}
                  <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border border-ink/20 bg-paper flex items-center justify-center transition-colors group-hover:border-amber group-hover:bg-amber/10 duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-dust group-hover:bg-amber transition-colors duration-300" />
                  </div>

                  {/* Post details */}
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Date/Location metadata */}
                    <div className="w-full md:w-44 shrink-0 md:pt-1">
                      <time className="block text-sm font-semibold text-ink font-body tabular-nums">
                        {pDate.toLocaleDateString("de-DE", { day: "numeric", month: "short", year: "numeric" })}
                      </time>
                      <span className="block text-2xs text-dust font-body mt-1">
                        {post.city && `${post.city}, `}
                        {postCountry?.name}
                        {postCountry?.iso_code && ` ${countryCodeToFlag(postCountry.iso_code)}`}
                      </span>
                      {post.travel_mode && (
                        <span className="inline-block mt-2 text-3xs uppercase tracking-widest bg-cream text-dust px-1.5 py-0.5 rounded-sm font-body">
                          {post.travel_mode}
                        </span>
                      )}
                    </div>

                    {/* Card container */}
                    <a
                      href={`/post/${post.post_id}`}
                      className="flex-1 w-full flex flex-col sm:flex-row bg-white border border-ink/5 rounded-sm overflow-hidden hover:border-amber/40 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      {/* Post Thumbnail (if available) */}
                      {post.thumbnail_path && (
                        <div className="relative w-full sm:w-40 h-40 sm:h-auto shrink-0 bg-cream">
                          <Image
                            src={post.thumbnail_path}
                            alt={post.title || "Post thumbnail"}
                            fill
                            sizes="(max-width: 640px) 100vw, 160px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      {/* Content block */}
                      <div className="p-6 flex flex-col justify-between">
                        <div>
                          <h3 className="font-display font-bold text-lg text-ink group-hover:text-amber transition-colors mb-2">
                            {post.title || `Tag ${index + 1}`}
                          </h3>
                          {post.summary && (
                            <p className="font-body text-xs text-dust leading-relaxed line-clamp-2">
                              {post.summary}
                            </p>
                          )}
                        </div>

                        {/* Media count */}
                        {post.media_count > 0 && (
                          <div className="flex items-center gap-1 text-dust text-3xs uppercase tracking-wider font-body mt-4">
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1"/>
                              <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1"/>
                            </svg>
                            {post.media_count} {post.media_count === 1 ? "Bild/Video" : "Bilder/Videos"}
                          </div>
                        )}
                      </div>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
