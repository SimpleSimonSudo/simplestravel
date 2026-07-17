import Link from "next/link";
import { getStats, getTripsWithCountries } from "@/lib/queries";
import type { TripWithCountries } from "@/lib/types";
import { createServerClient } from "@/lib/supabase";
import ContentBlocksRenderer from "@/components/ContentBlocksRenderer";
import TripsList from "@/components/TripsList";
import PostFooter from "@/components/PostFooter";
import PostSeparator from "@/components/PostSeparators";
import PostDetailsDropdown from "@/components/PostDetailsDropdown";

// Revalidate every 60s (server-side caching)
export const revalidate = 60;

export default async function HomePage() {
  const supabase = createServerClient();

  // Alle Daten parallel laden: Stats, Trips und die 3 neuesten Posts mit Content
  const [stats, trips, recentPostsRes] = await Promise.all([
    getStats(),
    getTripsWithCountries(),
    supabase
      .from("posts")
      .select(`
        post_id,
        post_date,
        actual_date,
        title,
        summary,
        city,
        travel_mode,
        weather,
        mood,
        latitude,
        longitude,
        content_blocks,
        country:countries(name, iso_code),
        trip:trips(trip_id, trip_name)
      `)
      .order("post_date", { ascending: false })
      .limit(3) as any,
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
        <TripsList trips={trips} />
      </div>
    </section>
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
              const pDate = new Date(post.actual_date || post.post_date);
              const postCountry = post.country as any;

              return (
                <div key={post.post_id}>
                  <article className="space-y-6">
                    {/* Metadata and details line */}
                    <div className="flex justify-between items-center w-full relative pb-2 border-b border-ink/5">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-dust font-body">
                        <time className="font-semibold text-ink tabular-nums">
                          {pDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </time>
                        <span className="text-dust/40">·</span>
                        <span>
                          {post.city && `${post.city}, `}
                          {postCountry?.name || post.country?.name}
                        </span>
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
                      {(post.travel_mode || post.weather || post.mood) && (
                        <PostDetailsDropdown post={post} />
                      )}
                    </div>

                    {/* Inline post title */}
                    {post.title && (
                      <div className="flex justify-center w-full py-1">
                        <h3 className="font-display font-bold text-lg md:text-xl text-center">
                          <Link
                            href={`/post/${post.post_id}`}
                            className="text-ink hover:text-amber transition-colors duration-300 relative group"
                          >
                            {post.title}
                            <span className="absolute left-0 right-0 bottom-0 h-[1px] bg-amber/0 group-hover:bg-amber/40 transition-colors duration-300" />
                          </Link>
                        </h3>
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

                    {/* Interactive Post Footer (Map, Emojis, Impulse) */}
                    <PostFooter
                      postId={post.post_id}
                      tripId={post.trip?.trip_id || post.trip_id || 0}
                      hasCoords={post.latitude !== null && post.longitude !== null}
                    />
                  </article>

                  {/* Graphical decorative flourish separator between posts */}
                  {index < posts.length - 1 && (
                    <PostSeparator postId={post.post_id} />
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


