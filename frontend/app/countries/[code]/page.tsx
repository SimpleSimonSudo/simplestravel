import { createServerClient } from "@/lib/supabase";
import ContentBlocksRenderer from "@/components/ContentBlocksRenderer";
import { notFound } from "next/navigation";
import { Country } from "@/lib/types";

type Props = {
  params: Promise<{ code: string }>;
};

export const revalidate = 60; // Server cache for 60 seconds

function formatGDP(gdpValue: any): string {
  if (!gdpValue) return "N/A";
  const num = parseFloat(gdpValue);
  if (isNaN(num) || num <= 0) return gdpValue;
  if (num >= 1e12) {
    return `${(num / 1e12).toFixed(2)} Trillion USD`;
  }
  if (num >= 1e9) {
    return `${(num / 1e9).toFixed(2)} Billion USD`;
  }
  return num.toLocaleString("en-GB");
}

export default async function CountryDetailPage({ params }: Props) {
  const { code } = await params;
  const upperCode = code.toUpperCase();
  const supabase = createServerClient();

  // 1. Fetch country from Supabase
  const { data: countryData, error: countryError } = await supabase
    .from("countries")
    .select("*")
    .eq("iso_code", upperCode)
    .maybeSingle();

  if (countryError || !countryData) {
    return notFound();
  }

  const country = countryData as Country;

  // 2. Query REST Countries API matching by alpha_2 code to prevent mismatches
  let apiCountry: any = null;
  const apiKey = process.env.REST_COUNTRIES_API_KEY;

  if (apiKey) {
    try {
      const url = `https://api.restcountries.com/countries/v5?q=${encodeURIComponent(country.name)}&pretty=1`;
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        next: { revalidate: 3600 }, // Cache API results for 1 hour
      });

      if (res.ok) {
        const json = await res.json();
        const objects = json.data?.objects || [];
        apiCountry = objects.find(
          (obj: any) => obj.codes?.alpha_2?.toUpperCase() === upperCode
        ) || objects[0] || null;
      }
    } catch (e) {
      console.error("Failed to fetch REST Countries data:", e);
    }
  }

  // 3. Load database-backed experience data
  const experienceData = {
    experience: country.description,
    gdp: country.gdp ? formatGDP(country.gdp) : null,
    happiness_index: country.happiness_index ? `${country.happiness_index} / 10` : null,
    languages_share: country.languages_share,
    religions_share: country.religions_share,
  };

  // 4. Fetch posts associated with this country in ascending order (oldest first)
  const { data: posts, error: postsError } = await supabase
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
      content_blocks,
      country:countries(name, iso_code),
      trip:trips(trip_id, trip_name)
    `)
    .eq("country_id", country.country_id)
    .order("post_date", { ascending: true }) as any;

  if (postsError) {
    console.error("Error fetching country posts:", postsError);
  }

  const countryPosts = posts || [];

  // 5. Fetch media details for these posts
  const postIds = countryPosts.map((p: any) => p.post_id);
  const { data: media } = postIds.length > 0
    ? await supabase
      .from("media")
      .select("*")
      .in("post_id", postIds)
      .order("block_index")
      .order("display_order") as any
    : { data: [] };

  // Calculate visited dates and trip count
  let dateRangeStr = "";
  if (countryPosts.length > 0) {
    const firstDate = new Date(countryPosts[0].actual_date || countryPosts[0].post_date);
    const lastDate = new Date(countryPosts[countryPosts.length - 1].actual_date || countryPosts[countryPosts.length - 1].post_date);
    const fmt = (d: Date) => d.toLocaleDateString("en-GB", { month: "short", year: "numeric" });
    if (fmt(firstDate) === fmt(lastDate)) {
      dateRangeStr = fmt(firstDate);
    } else {
      dateRangeStr = `${fmt(firstDate)} – ${fmt(lastDate)}`;
    }
  }

  // Extract unique trip names
  const uniqueTrips = Array.from(
    new Set(countryPosts.map((p: any) => p.trip?.trip_name).filter(Boolean))
  );

  const flagEmoji = apiCountry?.flag?.emoji || countryCodeToFlag(country.iso_code || code);

  return (
    <div className="min-h-screen bg-paper pb-24 pt-32 px-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Back navigation */}
        <div className="mb-8">
          <a
            href="/countries"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-dust hover:text-amber transition-colors font-body group"
          >
            <svg
              className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Countries
          </a>
        </div>

        {/* Header */}
        <header className="mb-12 border-b border-ink/5 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-4 mb-3">
              {apiCountry?.flag?.url_svg ? (
                <div className="relative w-12 h-8 border border-ink/10 rounded-sm shadow-sm overflow-hidden flex-shrink-0">
                  <img
                    src={apiCountry.flag.url_svg}
                    alt={country.name}
                    className="object-cover w-full h-full"
                  />
                </div>
              ) : (
                <span className="text-3xl" aria-hidden="true">
                  {flagEmoji}
                </span>
              )}
              <span className="overline text-dust">Country Profile</span>
            </div>
            <h1 className="font-display font-black text-4xl md:text-6xl text-ink leading-tight">
              {country.name}
            </h1>
            <p className="font-body text-dust text-sm md:text-base mt-2">
              {countryPosts.length} {countryPosts.length === 1 ? "entry" : "entries"}
              {uniqueTrips.length > 0 && ` across ${uniqueTrips.length} trip${uniqueTrips.length === 1 ? "" : "s"}`}
              {dateRangeStr && ` · Visited: ${dateRangeStr}`}
            </p>
          </div>
        </header>

        {/* Personal Experience Section */}
        {experienceData?.experience && (
          <section className="mb-12 p-8 bg-cream/30 border border-cream rounded-sm max-w-none animate-fade-in">
            <span className="overline text-[10px] text-amber block mb-2 font-semibold">Quick Introduction</span>
            <p className="font-body text-ink/90 font-light leading-relaxed text-lg italic">
              {experienceData.experience}
            </p>
          </section>
        )}

        {/* Factsheet & Custom Distribution Grid */}
        <section className="mb-16 animate-fade-in">
          <Factsheet apiCountry={apiCountry} experienceData={experienceData} country={country} />
        </section>

        {/* Timeline Posts Section */}
        <section className="border-t border-ink/10 pt-16">
          <div className="flex flex-col items-center text-center mb-16">
            <span className="overline block mb-3">Travel Logbook</span>
            <h2 className="font-display text-ink text-3xl md:text-4xl">
              Journal Entries
            </h2>
            <div className="w-12 h-[1px] bg-amber/30 mt-6" />
          </div>

          {countryPosts.length === 0 ? (
            <div className="text-center py-12 bg-cream/10 rounded-sm border border-cream border-dashed max-w-2xl mx-auto">
              <p className="font-body text-dust text-sm">No entries recorded for this country yet.</p>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-20">
              {countryPosts.map((post: any, index: number) => {
                const pDate = new Date(post.actual_date || post.post_date);
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
                          {post.country?.name}
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
                              href={`/trips/${post.trip.trip_id}#post-${post.post_id}`}
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
                    {index < countryPosts.length - 1 && (
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
        </section>

        {/* Bottom Navigation */}
        <div className="border-t border-ink/10 pt-12 mt-20 flex justify-center">
          <a
            href="/countries"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-dust hover:text-amber transition-colors font-body group border border-ink/10 px-8 py-4 rounded-full bg-white hover:border-amber/40 shadow-sm transition-all duration-300"
          >
            <svg
              className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            Back to Countries Overview
          </a>
        </div>
      </div>
    </div>
  );
}

function PieChart({ data }: { data: Record<string, string> }) {
  const segments = Object.entries(data).map(([label, val]) => {
    const pct = parseFloat(val.replace("%", ""));
    return { label, pct };
  });

  const total = segments.reduce((sum, s) => sum + s.pct, 0);
  if (total <= 0) return null;

  // Elegant natural theme color palette
  const COLORS = [
    "#d97706", // amber
    "#2d2b2a", // soft ink
    "#878380", // dust
    "#7b8a6a", // sage green
    "#b38b6d", // terra cotta
    "#dda15e", // sand gold
    "#a3b18a", // pale olive
  ];

  let accumulated = 0;
  const gradientParts = segments.map((s, index) => {
    const color = COLORS[index % COLORS.length];
    const start = ((accumulated / total) * 100).toFixed(1);
    accumulated += s.pct;
    const end = ((accumulated / total) * 100).toFixed(1);
    return `${color} ${start}% ${end}%`;
  });

  const conicGradient = `conic-gradient(${gradientParts.join(", ")})`;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
      {/* Conic Gradient circle */}
      <div
        className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border border-ink/5 shadow-sm shrink-0 transition-transform duration-300 hover:scale-105"
        style={{ background: conicGradient }}
      />
      {/* Legend list */}
      <div className="flex-1 w-full space-y-1.5">
        {segments.map((s, index) => {
          const color = COLORS[index % COLORS.length];
          return (
            <div key={s.label} className="flex items-center justify-between text-2xs font-body">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-ink/80 font-light leading-none">{s.label}</span>
              </div>
              <span className="text-ink font-semibold tabular-nums leading-none">{data[s.label]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Factsheet({
  apiCountry,
  experienceData,
  country,
}: {
  apiCountry: any;
  experienceData: any;
  country: any;
}) {
  const facts = [
    { label: "Capital", value: country.capital || apiCountry?.capitals?.[0]?.name || "N/A" },
    {
      label: "Region",
      value: apiCountry?.region
        ? `${apiCountry.region}${apiCountry.subregion ? `, ${apiCountry.subregion}` : ""}`
        : "N/A",
    },
    {
      label: "Population",
      value: country.population
        ? country.population.toLocaleString("en-GB")
        : (apiCountry?.population ? apiCountry.population.toLocaleString("en-GB") : "N/A"),
    },
    {
      label: "Area",
      value: country.area
        ? `${country.area.toLocaleString("en-GB")} km²`
        : (apiCountry?.area?.kilometers
          ? `${apiCountry.area.kilometers.toLocaleString("en-GB")} km²`
          : "N/A"),
    },
    {
      label: "Currency",
      value: apiCountry?.currencies?.[0]
        ? `${apiCountry.currencies[0].name} (${apiCountry.currencies[0].symbol || ""})`
        : "N/A",
    },
    { label: "GDP", value: experienceData?.gdp || "N/A" },
    { label: "Happiness Index", value: experienceData?.happiness_index || "N/A" },
    { label: "Time Zone", value: country.time_zone || apiCountry?.timezones?.[0] || "N/A" },
    { label: "HDI", value: country.hdi ? String(country.hdi) : "N/A" },
    { label: "Gini Index", value: country.gini ? String(country.gini) : "N/A" },
    { label: "Minorities", value: country.minorities || "N/A" },
  ];

  const langShares = experienceData?.languages_share;
  const relShares = experienceData?.religions_share;
  const apiLanguages = apiCountry?.languages?.map((l: any) => l.name).join(", ");

  // Extract membership organisations
  const memberships = apiCountry?.memberships ? Object.entries(apiCountry.memberships)
    .filter(([_, isMember]) => isMember === true)
    .map(([org]) => {
      const mapping: Record<string, string> = {
        un: "UN",
        eu: "EU",
        eurozone: "Eurozone",
        schengen: "Schengen",
        g7: "G7",
        g20: "G20",
        nato: "NATO",
        oecd: "OECD",
        brics: "BRICS",
        commonwealth: "Commonwealth",
        asean: "ASEAN",
        arab_league: "Arab League",
        african_union: "African Union",
        opec: "OPEC",
      };
      return mapping[org] || org.replace(/_/g, ' ').toUpperCase();
    }) : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* General Facts Cards Grid */}
      <div className="lg:col-span-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
        {facts.map((fact) => (
          <div
            key={fact.label}
            className="p-3.5 bg-white border border-ink/5 rounded-sm shadow-sm flex flex-col justify-between hover:border-amber/20 transition-all duration-300"
          >
            <span className="text-[10px] uppercase tracking-widest text-dust font-body">
              {fact.label}
            </span>
            <span className="font-display font-bold text-sm text-ink mt-2">
              {fact.value}
            </span>
          </div>
        ))}
        {apiCountry?.links?.wikipedia && (
          <a
            href={apiCountry.links.wikipedia}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-cream/10 border border-ink/5 rounded-sm shadow-sm flex flex-col justify-between hover:border-amber/40 hover:bg-cream/20 transition-all duration-300 group"
          >
            <span className="text-[10px] uppercase tracking-widest text-dust font-body flex items-center justify-between">
              External Link
              <svg className="w-3 h-3 text-dust group-hover:text-amber transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </span>
            <span className="font-display font-bold text-sm text-ink mt-2 group-hover:text-amber transition-colors">
              Wikipedia Article →
            </span>
          </a>
        )}
      </div>

      {/* Languages & Religions Distributions */}
      <div className="bg-white border border-ink/5 p-6 rounded-sm shadow-sm space-y-8 hover:border-amber/20 transition-all duration-300 flex flex-col justify-between">
        {/* Languages section */}
        <div>
          <h4 className="text-[10px] uppercase tracking-widest text-dust font-body mb-4 border-b border-ink/5 pb-1">
            Languages
          </h4>
          {langShares ? (
            <PieChart data={langShares} />
          ) : (
            <span className="text-xs font-body text-ink font-light block line-clamp-2">
              {apiLanguages || "N/A"}
            </span>
          )}
        </div>

        {/* Religions section */}
        <div className="pt-6 border-t border-ink/5">
          <h4 className="text-[10px] uppercase tracking-widest text-dust font-body mb-4 border-b border-ink/5 pb-1">
            Religions
          </h4>
          {relShares ? (
            <PieChart data={relShares} />
          ) : (
            <span className="text-xs font-body text-dust italic block">
              No religious details recorded.
            </span>
          )}
        </div>

        {/* Memberships section */}
        {memberships.length > 0 && (
          <div className="pt-6 border-t border-ink/5">
            <h4 className="text-[10px] uppercase tracking-widest text-dust font-body mb-3 border-b border-ink/5 pb-1">
              Memberships
            </h4>
            <div className="flex flex-wrap gap-x-2 gap-y-1">
              {memberships.map((org, idx) => (
                <span
                  key={org}
                  className="text-3xs uppercase tracking-wider text-dust/70 font-light select-none flex items-center"
                >
                  {org}
                  {idx < memberships.length - 1 && (
                    <span className="text-dust/30 ml-2 select-none" aria-hidden="true">
                      ·
                    </span>
                  )}
                </span>
              ))}
            </div>
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
