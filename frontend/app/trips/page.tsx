import { getTripsWithCountries } from "@/lib/queries";
import { notFound } from "next/navigation";

export const revalidate = 60;

export default async function TripsPage() {
  let trips = [];
  try {
    trips = await getTripsWithCountries();
  } catch (error) {
    console.error("Error loading trips:", error);
    return notFound();
  }

  return (
    <div className="min-h-screen bg-paper pb-24 pt-32 px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-16 text-center md:text-left">
          <span className="overline block mb-3">Reisetagebuch</span>
          <h1 className="font-display font-black text-5xl md:text-7xl text-ink mb-6">
            Die Abenteuer.
          </h1>
          <p className="font-body text-dust text-sm md:text-base max-w-xl leading-relaxed">
            Eine chronologische Übersicht aller größeren Reisen und Roadtrips. 
            Jedes Abenteuer erzählt eine eigene Geschichte durch verschiedene Länder und Orte.
          </p>
        </header>

        {/* Trips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {trips.map((trip, index) => {
            const dateStr = formatDateRange(trip.start_date, trip.end_date);
            const countries = trip.countries ?? [];
            const countryCodes = trip.country_codes ?? [];

            return (
              <a
                key={trip.trip_id}
                href={`/trips/${trip.trip_id}`}
                className="group flex flex-col justify-between p-8 bg-white border border-ink/5 rounded-sm shadow-sm hover:border-amber/40 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
              >
                <div>
                  {/* Top Stats & Date */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-2xs font-body tracking-wider text-dust tabular-nums">{dateStr}</span>
                    <span className="text-xs uppercase tracking-widest text-amber font-semibold font-body">
                      {trip.post_count} {trip.post_count === 1 ? "Post" : "Posts"}
                    </span>
                  </div>

                  {/* Trip Title */}
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-ink group-hover:text-amber transition-colors mb-3">
                    {trip.trip_name}
                  </h2>

                  {/* Description */}
                  {trip.description && (
                    <p className="font-body text-xs text-dust leading-relaxed line-clamp-3 mb-6">
                      {trip.description}
                    </p>
                  )}
                </div>

                {/* Footer Info */}
                <div className="border-t border-ink/5 pt-6 mt-6">
                  {/* Visited countries */}
                  {countries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-2xs uppercase tracking-widest text-dust font-body mr-1">Route:</span>
                      {countries.map((country, idx) => (
                        <span key={country} className="inline-flex items-center text-xs text-ink font-body">
                          {countryCodes[idx] && `${countryCodeToFlag(countryCodes[idx])} `}
                          <span className="font-light">{country}</span>
                          {idx < countries.length - 1 && <span className="text-dust/40 mx-1.5">·</span>}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Distance / Companions */}
                  <div className="flex flex-wrap gap-4 mt-4 text-2xs text-dust font-body">
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
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function formatDateRange(start: string | null, end: string | null): string {
  if (!start && !end) return "";
  const fmt = (d: string) =>
    new Date(d).toLocaleDateString("de-DE", { month: "short", year: "numeric" });
  if (start && end) return `${fmt(start)} – ${fmt(end)}`;
  if (end) return `Bis ${fmt(end)}`;
  if (start) return `Seit ${fmt(start)}`;
  return "";
}

function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}
