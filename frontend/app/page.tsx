import { getStats, getTripsWithCountries } from "@/lib/queries";
import type { TripWithCountries } from "@/lib/types";
import { createServerClient } from "@/lib/supabase";
import ContentBlocksRenderer from "@/components/ContentBlocksRenderer";

// Revalidate every 60s (server-side caching)
export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServerClient();

  // Alle Daten parallel laden: Stats, Trips und die 10 neuesten Posts mit Content
  const [stats, trips, recentPostsRes] = await Promise.all([
    getStats(),
    getTripsWithCountries(),
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
        country:countries(name, iso_code),
        trip:trips(trip_id, trip_name)
      `)
      .order("post_date", { ascending: false })
      .limit(10) as any,
  ]);

  const recentPosts = recentPostsRes.data ?? [];

  // Hole alle Medien für diese Posts parallel
  const postIds = recentPosts.map((p: any) => p.post_id);
  const { data: media } = postIds.length > 0
    ? await supabase
        .from("media")
        .select("*")
        .in("post_id", postIds)
        .order("block_index")
        .order("display_order") as any
    : { data: [] };

  return (
    <>
      <HeroSection stats={stats} />
      <TripsSection trips={trips} />
      <StatsSection stats={stats} />
      <RecentPostsSection posts={recentPosts} media={media || []} recentTrip={trips && trips.length > 0 ? trips[0] : null} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────

function HeroSection({ stats }: { stats: { posts: number; countries: number; trips: number } }) {
  return (
    <section className="relative min-h-screen flex flex-col justify-end px-8 pb-8 md:pb-20 overflow-x-clip">
      {/* Background decorative number */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
        aria-hidden
      >
        <span
          className="font-display font-black text-[20vw] leading-none"
          style={{ color: "rgba(0,0,0,0.02)" }}
        >
          {stats.countries}
        </span>
      </div>

      {/* Amber vertical line */}
      <div className="absolute left-8 top-32 bottom-32 w-px bg-amber/30" />

      <div className="max-w-6xl mx-auto w-full text-center relative pt-4 pb-8 md:py-12">
        {/* Decorative background globe image */}
        <div
          className="absolute top-[30%] md:top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[160vw] h-[160vw] md:w-[110vw] md:h-[110vw] max-w-[1000px] max-h-[1000px] select-none pointer-events-none z-0 opacity-[0.38] mix-blend-multiply"
          style={{
            maskImage: "radial-gradient(circle, black 55%, transparent 68%)",
            WebkitMaskImage: "radial-gradient(circle, black 55%, transparent 68%)",
          }}
        >
          <div
            className="w-full h-full"
            style={{
              backgroundImage: "url('/page_media/earth_brown.png')",
              backgroundSize: "contain",
              backgroundPosition: "center",
              backgroundRepeat: "no-repeat",
              animation: "spin 180s linear infinite, fadeIn 1.2s ease-out forwards",
            }}
            aria-hidden="true"
          />
        </div>

        {/* Content wrapper to ensure text stays on top */}
        <div className="relative z-10">

          {/* Main headline */}
          <h1 className="font-display font-black text-ink leading-none mb-8 animate-fade-up delay-100"
            style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}>
            Traveling
            <br />
            <span className="italic text-amber">Planet</span>
            <br />
            Earth.
          </h1>
        </div>
      </div>
      {/* Authors Photo Stamp */}
      <div className="absolute -bottom-10 right-0 md:-bottom-20 w-[65vw] md:w-[28vw] max-w-[260px] md:max-w-[440px] z-20 animate-fade-up delay-300">
        <img
          src="/page_media/authers.png"
          alt="Authors of traveling planet earth"
          className="w-full h-auto object-contain block"
          style={{ filter: "drop-shadow(0px 16px 12px rgba(13, 12, 11, 0.22))" }}
          loading="lazy"
        />
      </div>
    </section>
  );
}

function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-display font-bold text-ink" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)" }}>
        {value.toLocaleString()}
      </span>
      <span className="text-xs uppercase tracking-widest text-dust font-body mt-1">{label}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// STATS SECTION
// ─────────────────────────────────────────────────────────────

function StatsSection({ stats }: { stats: { posts: number; countries: number; trips: number } }) {
  return (
    <section className="px-8 py-16 bg-cream/10 border-t border-b border-ink/5">
      <div className="max-w-6xl mx-auto flex flex-wrap gap-12 justify-center">
        <StatItem value={stats.posts} label="Posts" />
        <StatItem value={stats.countries} label="Countries" />
        <StatItem value={stats.trips} label="Trips" />
        <StatItem value={7} label="Years" />
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// TRIPS
// ─────────────────────────────────────────────────────────────

function TripsSection({ trips }: { trips: TripWithCountries[] }) {
  return (
    <section id="trips" className="px-8 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-14">
          <div>
            <span className="overline block mb-3">Discover Adventures</span>
            <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
              Voyages
            </h2>
          </div>
        </div>

        {/* Trip list */}
        <div className="divide-y divide-ink/10">
          {trips.map((trip, i) => (
            <TripRow key={trip.trip_id} trip={trip} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TripRow({ trip, index }: { trip: TripWithCountries; index: number }) {
  const countries = trip.countries ?? [];
  const dateStr = formatDateRange(trip.start_date, trip.end_date);

  return (
    <a
      href={`/trips/${trip.trip_id}`}
      className="group flex flex-col md:flex-row md:items-start justify-between py-8 gap-6 hover:pl-3 transition-all duration-300"
    >
      {/* Left: name + description + route + metrics */}
      <div className="flex items-start flex-1">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-ink text-xl md:text-2xl group-hover:text-amber transition-colors">
            {trip.trip_name}
          </h3>

          {/* Description */}
          {trip.description && (
            <p className="font-body text-xs text-dust leading-relaxed line-clamp-2 mt-2 max-w-xl group-hover:text-ink/80 transition-colors">
              {trip.description}
            </p>
          )}

          {/* Route with countries */}
          {countries.length > 0 && (
            <div className="flex items-start mt-3 text-xs text-ink font-body">
              <span className="text-2xs uppercase tracking-widest text-dust mr-2 shrink-0 pt-0.5 select-none">
                Country:
              </span>
              <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                {countries.map((country, idx) => (
                  <span key={country} className="inline-flex items-center text-xs text-ink font-body">
                    <span className="font-light">{country}</span>
                    {idx < countries.length - 1 && <span className="text-dust/40 mx-1.5">·</span>}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Distance and Companions */}
          {(trip.total_distance_km || (trip.companions && trip.companions.length > 0)) && (
            <div className="flex flex-wrap gap-4 mt-3 text-2xs text-dust font-body">
              {trip.total_distance_km && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-dust/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    <path d="M2 12h20" />
                  </svg>
                  {trip.total_distance_km.toLocaleString()} km
                </span>
              )}
              {trip.companions && trip.companions.length > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-dust/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  {trip.companions.join(", ")}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: date, posts, arrow */}
      <div className="flex items-center gap-6 md:gap-10 pl-14 md:pl-0 pt-1 shrink-0">
        {dateStr && (
          <span className="text-xs text-dust font-body tabular-nums">{dateStr}</span>
        )}
        <span className="font-display text-amber font-bold text-lg md:text-xl">
          {trip.post_count}
          <span className="text-dust text-xs font-body ml-1.5 font-normal">posts</span>
        </span>
        <span className="text-dust group-hover:text-amber transition-colors">
          <ArrowRight />
        </span>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────
// RECENT POSTS (JOURNAL STYLE)
// ─────────────────────────────────────────────────────────────

function RecentPostsSection({
  posts,
  media,
  recentTrip,
}: {
  posts: any[];
  media: any[];
  recentTrip: any;
}) {
  return (
    <section className="px-8 py-24 bg-cream/10 border-t border-ink/5">
      <div className="max-w-4xl mx-auto">
        {/* Section header */}
        <div className="flex flex-col items-center text-center mb-16">
          <span className="overline block mb-3">Latest Journal Entries</span>
          <h2 className="font-display text-ink text-4xl md:text-5xl">
            Recent Posts
          </h2>
          <div className="w-12 h-[1px] bg-amber/30 mt-6" />
        </div>

        {/* Full Posts Flow (Journal Style) */}
        {posts.length === 0 ? (
          <div className="text-center py-12 bg-cream/20 rounded-sm border border-cream border-dashed">
            <p className="font-body text-dust text-sm">No entries have been recorded yet.</p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-16">
            {posts.map((post: any, index: number) => {
              const pDate = new Date(post.post_date);
              const postCountry = post.country as any;

              return (
                <div key={post.post_id}>
                  <article className="space-y-6">
                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-dust font-body">
                      <time className="font-semibold text-ink tabular-nums">
                        {pDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </time>
                      <span className="text-dust/40">·</span>
                      <span>
                        {post.city && `${post.city}, `}
                        {postCountry?.name || post.country?.name}
                      </span>
                      {post.travel_mode && (
                        <>
                          <span className="text-dust/40">·</span>
                          <span className="uppercase tracking-widest text-[10px] bg-cream text-dust px-1.5 py-0.5 rounded-sm font-body">
                            {post.travel_mode}
                          </span>
                        </>
                      )}
                      {post.trip?.trip_name && (
                        <>
                          <span className="text-dust/40">·</span>
                          <a
                            href={`/trips/${post.trip.trip_id}`}
                            className="tag !bg-cream/40 hover:!bg-amber hover:!text-white transition-colors"
                          >
                            {post.trip.trip_name}
                          </a>
                        </>
                      )}
                    </div>

                    {/* Inline post title */}
                    {post.title && (
                      <h3 className="font-display font-black text-2xl md:text-3xl text-ink leading-tight">
                        {post.title}
                      </h3>
                    )}

                    {/* Weather/Mood bar */}
                    {(post.weather || post.mood) && (
                      <div className="flex flex-wrap gap-4 text-xs font-body text-dust py-2 border-y border-ink/5">
                        {post.weather && (
                          <div className="flex items-center">
                            <span className="overline text-[10px] text-dust/60 mr-1.5 select-none">Weather:</span>
                            <span className="text-ink font-medium">{post.weather}</span>
                          </div>
                        )}
                        {post.mood && (
                          <div className="flex items-center">
                            <span className="overline text-[10px] text-dust/60 mr-1.5 select-none">Mood:</span>
                            <span className="text-ink font-medium">{post.mood}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Content Blocks */}
                    <section className="font-body leading-relaxed text-ink space-y-8">
                      <ContentBlocksRenderer
                        blocks={post.content_blocks}
                        mediaList={media}
                        postId={post.post_id}
                        headingShift={true}
                      />
                    </section>
                  </article>

                  {/* Separator between posts */}
                  {index < posts.length - 1 && (
                    <div className="flex items-center justify-center my-16 select-none" aria-hidden="true">
                      <div className="w-16 h-[1px] bg-ink/10" />
                      <div className="w-1.5 h-1.5 rotate-45 bg-amber/75 mx-4" />
                      <div className="w-16 h-[1px] bg-ink/10" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Most Recent Trip Link */}
        {recentTrip && (
          <div className="flex justify-center mt-20 pt-8 border-t border-ink/10">
            <a
              href={`/trips/${recentTrip.trip_id}`}
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-ink hover:text-amber transition-colors font-body group border border-ink/20 px-8 py-3.5 rounded-full hover:border-amber bg-white shadow-sm duration-300"
            >
              <span>Read Full Trip: {recentTrip.trip_name}</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("en-GB", { month: "short", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (end) return `Until ${fmt(end)}`;
  if (start) return `From ${fmt(start)}`;
  return "";
}

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="10" viewBox="0 0 14 10" fill="none">
      <path d="M8 1L13 5L8 9M1 5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
