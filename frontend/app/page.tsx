import { getStats, getTripsWithCountries, getTimeline } from "@/lib/queries";
import type { TripWithCountries, TimelineRow } from "@/lib/types";

// Revalidate every 60s (server-side caching)
export const revalidate = 60;

export default async function HomePage() {
  // Alle Daten parallel laden
  const [stats, trips, recentPosts] = await Promise.all([
    getStats(),
    getTripsWithCountries(),
    getTimeline(0, 6),
  ]);

  return (
    <>
      <HeroSection stats={stats} />
      <TripsSection trips={trips} />
      <RecentPostsSection posts={recentPosts} />
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// HERO
// ─────────────────────────────────────────────────────────────

function HeroSection({ stats }: { stats: { posts: number; countries: number; trips: number } }) {
  return (
    <section className="relative min-h-screen flex flex-col justify-end px-8 pb-20 overflow-hidden">
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

      <div className="max-w-6xl mx-auto w-full text-center">
        {/* Eyebrow */}
        <p className="overline mb-6 animate-fade-up">
          Private Journal · 2018–2025
        </p>

        {/* Main headline */}
        <h1 className="font-display font-black text-ink leading-none mb-8 animate-fade-up delay-100"
          style={{ fontSize: "clamp(3.5rem, 10vw, 9rem)" }}>
          Traveling
          <br />
          <span className="italic text-amber">Planet</span>
          <br />
          Earth.
        </h1>

        {/* Stats row */}
        <div className="flex flex-wrap gap-12 animate-fade-up delay-200 justify-center">
          <StatItem value={stats.posts} label="Posts" />
          <StatItem value={stats.countries} label="Countries" />
          <StatItem value={stats.trips} label="Trips" />
          <StatItem value={7} label="Years" />
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-fade-up delay-500">
        <span className="text-2xs uppercase tracking-widest2 text-dust font-body">Scroll</span>
        <div className="w-px h-12 bg-gradient-to-b from-dust to-transparent" />
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
// TRIPS
// ─────────────────────────────────────────────────────────────

function TripsSection({ trips }: { trips: TripWithCountries[] }) {
  return (
    <section id="trips" className="px-8 py-24">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-14">
          <div>
            <span className="overline block mb-3">Adventures</span>
            <h2 className="font-display text-ink" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
              The Trips
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
  const countryCodes = trip.country_codes ?? [];
  const dateStr = formatDateRange(trip.start_date, trip.end_date);

  return (
    <a
      href={`/trips/${trip.trip_id}`}
      className="group flex flex-col md:flex-row md:items-start justify-between py-8 gap-6 hover:pl-3 transition-all duration-300"
    >
      {/* Left: number + name + description + route + metrics */}
      <div className="flex items-start gap-6 flex-1">
        <span className="font-display text-dust/40 text-sm w-8 shrink-0 pt-1">
          {String(index + 1).padStart(2, "0")}
        </span>
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

          {/* Route with flag emojis */}
          {countries.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center mt-3 text-xs text-ink font-body">
              <span className="text-2xs uppercase tracking-widest text-dust mr-1">Route:</span>
              {countries.map((country, idx) => (
                <span key={country} className="inline-flex items-center text-xs text-ink font-body">
                  {countryCodes[idx] && `${countryCodeToFlag(countryCodes[idx])} `}
                  <span className="font-light">{country}</span>
                  {idx < countries.length - 1 && <span className="text-dust/40 mx-1.5">·</span>}
                </span>
              ))}
            </div>
          )}

          {/* Distance and Companions */}
          {(trip.total_distance_km || (trip.companions && trip.companions.length > 0)) && (
            <div className="flex flex-wrap gap-4 mt-3 text-2xs text-dust font-body">
              {trip.total_distance_km && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-dust/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    <path d="M2 12h20"/>
                  </svg>
                  {trip.total_distance_km.toLocaleString()} km
                </span>
              )}
              {trip.companions && trip.companions.length > 0 && (
                <span className="flex items-center gap-1">
                  <svg className="w-3.5 h-3.5 text-dust/60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
// RECENT POSTS
// ─────────────────────────────────────────────────────────────

function RecentPostsSection({ posts }: { posts: TimelineRow[] }) {
  return (
    <section className="px-8 py-24 bg-cream/20">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="flex items-end justify-between mb-14">
          <div>
            <span className="overline block mb-3">Latest</span>
            <h2 className="font-display text-cream" style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}>
              Recent Posts
            </h2>
          </div>
          <a href="/journal" className="hidden md:flex items-center gap-3 text-xs uppercase tracking-widest text-dust hover:text-amber transition-colors font-body group">
            Full journal
            <ArrowRight className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Posts grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/5">
          {posts.map((post) => (
            <PostCard key={post.post_id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PostCard({ post }: { post: TimelineRow }) {
  const date = new Date(post.post_date);

  return (
    <a
      href={`/post/${post.post_id}`}
      className="group block bg-ink p-6 hover:bg-smoke transition-colors duration-200"
    >
      {/* Country + Trip */}
      <div className="flex items-center gap-2 mb-4">
        {post.country_code && (
          <span className="text-lg" title={post.country ?? ""}>
            {countryCodeToFlag(post.country_code)}
          </span>
        )}
        {post.trip_name && (
          <span className="tag">{post.trip_name}</span>
        )}
      </div>

      {/* Summary */}
      <p className="font-body text-cream/80 text-sm leading-relaxed line-clamp-3 mb-5 min-h-[4.5rem]">
        {post.summary ?? "—"}
      </p>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-dust text-xs font-body">
            {post.city && <span>{post.city} · </span>}
            {post.country}
          </p>
          <time className="text-dust/60 text-2xs font-body tabular-nums" dateTime={post.post_date}>
            {date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          </time>
        </div>
        {post.media_count > 0 && (
          <span className="flex items-center gap-1 text-dust text-xs font-body">
            <PhotoIcon />
            {post.media_count}
          </span>
        )}
      </div>
    </a>
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

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

function ArrowRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="14" height="10" viewBox="0 0 14 10" fill="none">
      <path d="M8 1L13 5L8 9M1 5H13" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

function PhotoIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1"/>
      <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1"/>
    </svg>
  );
}
