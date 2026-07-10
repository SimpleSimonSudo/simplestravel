"use client";

import React, { useState, useEffect } from "react";
import type { TripWithCountries } from "@/lib/types";

interface TripsListProps {
  trips: TripWithCountries[];
}

export default function TripsList({ trips }: TripsListProps) {
  // Grouping consecutive trips with < 10 posts
  const items: Array<
    | { type: "single"; trip: TripWithCountries }
    | { type: "group"; trips: TripWithCountries[] }
  > = [];
  let currentGroup: TripWithCountries[] = [];

  for (const trip of trips) {
    if (trip.post_count < 10) {
      currentGroup.push(trip);
    } else {
      if (currentGroup.length > 0) {
        items.push({ type: "group", trips: currentGroup });
        currentGroup = [];
      }
      items.push({ type: "single", trip });
    }
  }
  if (currentGroup.length > 0) {
    items.push({ type: "group", trips: currentGroup });
  }

  return (
    <div className="space-y-8">
      {items.map((item, idx) => {
        if (item.type === "single") {
          return <TripRow key={item.trip.trip_id} trip={item.trip} index={idx} />;
        } else {
          // Unique key based on the first trip's ID in the group
          const groupKey = `group-${item.trips[0].trip_id}`;
          return <TinyJourneysGroup key={groupKey} trips={item.trips} />;
        }
      })}
    </div>
  );
}

function TripSlideshow({ images }: { images: string[] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!images || images.length <= 1) return;

    // Pick a random starting image so cards don't start with the exact same visual
    const startingIndex = Math.floor(Math.random() * images.length);
    setIndex(startingIndex);

    // Stagger the first transition with a random delay (between 2 and 10 seconds)
    const staggerDelay = 2000 + Math.random() * 8000;

    let intervalId: NodeJS.Timeout;

    const timeoutId = setTimeout(() => {
      setIndex((prev) => (prev + 1) % images.length);

      intervalId = setInterval(() => {
        setIndex((prev) => (prev + 1) % images.length);
      }, 10000); // Change image every 10 seconds
    }, staggerDelay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, [images]);

  if (!images || images.length === 0) {
    return (
      <div className="absolute inset-0 bg-gradient-to-br from-mist to-ink" />
    );
  }

  return (
    <div className="absolute inset-0 bg-ink overflow-hidden select-none pointer-events-none">
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes kenBurns {
          0% { transform: scale(1.02) translate(0, 0); }
          100% { transform: scale(1.10) translate(-1%, -0.5%); }
        }
        .animate-ken-burns {
          animation: kenBurns 24s ease-in-out infinite alternate;
        }
      `}} />
      {images.map((img, i) => (
        <div
          key={img}
          className="absolute inset-0 bg-cover bg-center animate-ken-burns"
          style={{
            backgroundImage: `url(${img})`,
            opacity: i === index ? 1 : 0,
            zIndex: i === index ? 1 : 0,
            transition: "opacity 3000ms cubic-bezier(0.4, 0, 0.2, 1)", // 3 seconds ultra-smooth transition
          }}
        />
      ))}
    </div>
  );
}

function TinyJourneysGroup({ trips }: { trips: TripWithCountries[] }) {
  const [isOpen, setIsOpen] = useState(false);

  const totalPosts = trips.reduce((sum, t) => sum + t.post_count, 0);
  const allCountries = Array.from(
    new Set(trips.flatMap((t) => t.countries ?? []))
  );

  return (
    <div className="relative w-full">
      {/* Header Dropdown Button - Styled without background image, clear dashed border, dark ink text */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative block w-full overflow-hidden rounded-md border-2 border-dashed border-amber/40 bg-cream/40 hover:bg-cream/60 transition-all duration-300 p-6 md:p-8 text-left focus:outline-none"
      >
        <div className="flex flex-col justify-between h-full min-h-[100px] md:min-h-[120px]">
          {/* Top Line: Badges */}
          <div className="flex items-center justify-between">
            <span className="font-body text-xs font-semibold bg-amber text-white uppercase tracking-wider px-3 py-1 rounded-full shadow-xs">
              Collection
            </span>
            <span className="text-dust bg-cream/80 px-2.5 py-1 rounded-full text-xs font-body select-none">
              {trips.length} {trips.length === 1 ? "journey" : "journeys"}
            </span>
          </div>

          {/* Bottom Line: Details */}
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-6">
            <div className="min-w-0 flex-1">
              <h3 className="font-display text-ink text-2xl md:text-3xl font-bold group-hover:text-amber transition-colors flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>Tiny Journeys</span>
              </h3>
              <p className="font-body text-xs text-dust leading-relaxed mt-2 max-w-xl">
                A collection of shorter trips and spontaneous getaways.
              </p>

              {allCountries.length > 0 && (
                <div className="flex items-start mt-3 text-2xs md:text-xs text-ink font-body">
                  <span className="text-2xs uppercase tracking-widest text-dust mr-2 shrink-0 pt-0.5 select-none font-semibold">
                    Countries:
                  </span>
                  <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                    {allCountries.map((country, idx) => (
                      <span key={country} className="inline-flex items-center text-ink font-body">
                        <span className="font-light">{country}</span>
                        {idx < allCountries.length - 1 && <span className="text-dust/45 mx-1.5">·</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Total posts + Chevron */}
            <div className="flex items-center gap-6 shrink-0 font-body text-ink">
              <span className="font-display text-amber font-bold text-lg md:text-xl bg-white px-3 py-1.5 rounded-md border border-ink/5 shadow-xs">
                {totalPosts}
                <span className="text-dust text-xs font-body ml-1.5 font-normal">posts</span>
              </span>
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-cream group-hover:bg-amber group-hover:text-white transition-all duration-300 text-ink shadow-xs">
                <ChevronRight className={`transform transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`} />
              </div>
            </div>
          </div>
        </div>
      </button>

      {/* Nested Expanded grid */}
      <div
        className={`transition-all duration-500 ease-in-out overflow-hidden ${isOpen ? "max-h-[4000px] opacity-100 mt-4" : "max-h-0 opacity-0 pointer-events-none"
          }`}
      >
        <div className="pl-6 md:pl-10 border-l-2 border-amber/35 space-y-4 py-2">
          {trips.map((trip, idx) => (
            <TripRow key={trip.trip_id} trip={trip} index={idx} isNested={true} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TripRow({
  trip,
  index,
  isNested = false,
}: {
  trip: TripWithCountries;
  index: number;
  isNested?: boolean;
}) {
  // Deduplicate countries list to avoid repetitions
  const countries = Array.from(new Set(trip.countries ?? []));
  const dateStr = formatDateRange(trip.start_date, trip.end_date);
  const images = trip.title_images ?? [];

  return (
    <a
      href={`/trips/${trip.trip_id}`}
      className={`group relative block w-full overflow-hidden rounded-md border border-ink/10 shadow-sm transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${isNested
        ? "h-[160px] sm:h-[200px] md:h-[260px] lg:h-[320px]"
        : "h-[240px] sm:h-[300px] md:h-[380px] lg:h-[450px]"
        }`}
    >
      {/* Background Slideshow */}
      <TripSlideshow images={images} />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-ink/95 via-ink/50 to-black/20 group-hover:via-ink/45 transition-all duration-500 z-10" />

      {/* Content container */}
      <div className="absolute inset-0 z-20 flex flex-col justify-between p-6 md:p-8">
        {/* Top line: dates & arrow */}
        <div className="flex items-center justify-between text-xs text-cream/90 font-body">
          <span className="tabular-nums bg-black/35 px-2.5 py-1 rounded-full backdrop-blur-xs select-none">
            {dateStr || "Adventure"}
          </span>
          <span className="text-white bg-amber px-2.5 py-1 rounded-full text-2xs uppercase tracking-wider font-bold shadow-sm">
            {trip.post_count} {trip.post_count === 1 ? "post" : "posts"}
          </span>
        </div>

        {/* Bottom content: title, description, route */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mt-auto">
          <div className="min-w-0 flex-1">
            <h3
              className={`font-display text-white group-hover:text-amber transition-colors ${isNested ? "text-xl md:text-2xl" : "text-2xl md:text-4xl"
                }`}
            >
              {trip.trip_name}
            </h3>

            {/* Description (hide on nested compact view to save space) */}
            {trip.description && !isNested && (
              <p className="font-body text-xs text-cream/70 leading-relaxed line-clamp-2 mt-2 max-w-xl group-hover:text-cream/90 transition-colors">
                {trip.description}
              </p>
            )}

            {/* Route with countries */}
            {countries.length > 0 && (
              <div className="flex items-start mt-3 text-2xs md:text-xs text-cream font-body">
                <span className="text-2xs uppercase tracking-widest text-cream/65 mr-2 shrink-0 pt-0.5 select-none">
                  Route:
                </span>
                <div className="flex flex-wrap gap-x-1.5 gap-y-1">
                  {countries.map((country, idx) => (
                    <span key={country} className="inline-flex items-center text-cream font-body">
                      <span className="font-light">{country}</span>
                      {idx < countries.length - 1 && <span className="text-cream/40 mx-1.5">·</span>}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action indicator */}
          <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-white/10 group-hover:bg-amber transition-all duration-300 text-white shadow-sm shrink-0">
            <ArrowRight className="transform group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────
// HELPERS & SVG ICONS
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

function ChevronRight({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
