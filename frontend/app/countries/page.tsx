import { getCountriesWithStats } from "@/lib/queries";
import { notFound } from "next/navigation";
import type { CountryWithStats } from "@/lib/types";

export const revalidate = 60;

export default async function CountriesPage() {
  let countries: CountryWithStats[] = [];
  try {
    countries = await getCountriesWithStats();
  } catch (error) {
    console.error("Error loading countries:", error);
    return notFound();
  }

  // Gruppiere Länder nach Kontinenten
  const grouped: Record<string, CountryWithStats[]> = {};
  countries.forEach((country) => {
    const continent = country.continent || "Other Continents";
    if (!grouped[continent]) {
      grouped[continent] = [];
    }
    grouped[continent].push(country);
  });

  // Sortiere Kontinente alphabetisch
  const sortedContinents = Object.keys(grouped).sort();
  const visitedPercentage = ((countries.length / 249) * 100).toFixed(1);

  return (
    <div className="min-h-screen bg-paper pb-24 pt-32 px-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-16 text-center md:text-left">
          <span className="overline block mb-3">World Map</span>
          <h1 className="font-display font-black text-5xl md:text-7xl text-ink mb-6">
            Visited Countries
          </h1>
          <div className="font-body text-dust text-sm md:text-base leading-relaxed space-y-4 max-w-none">
            <p>
              I don't believe borders define people, and I don't identify strongly with countries.
              They're simply the way people have chosen to divide and navigate this beautiful planet.
            </p>
            <p>
              My hope is that these stories and impressions help you feel each place beyond the lines on a map.
              At the same time, every country is far more diverse than any single journey can capture,
              and every traveler experiences its people, culture, and landscapes in their own unique way.
            </p>
            <p>
              A total of {countries.length} countries across {sortedContinents.length} continents have been visited so far.
              This represents {visitedPercentage}% of the 249 countries and territories in the world.
            </p>
          </div>
        </header>

        {/* Continents & Countries */}
        <div className="space-y-16">
          {sortedContinents.map((continent) => {
            const continentCountries = grouped[continent];

            return (
              <section key={continent} className="space-y-6">
                {/* Continent Title */}
                <div className="flex items-center gap-4">
                  <h2 className="font-display font-bold text-2xl md:text-3xl text-ink">
                    {continent}
                  </h2>
                  <div className="h-px bg-ink/10 flex-1" />
                  <span className="text-2xs font-body text-dust uppercase tracking-widest">
                    {continentCountries.length} {continentCountries.length === 1 ? "Country" : "Countries"}
                  </span>
                </div>

                {/* Countries list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {continentCountries.map((country) => {
                    const firstDate = country.first_post_date ? new Date(country.first_post_date) : null;
                    const lastDate = country.last_post_date ? new Date(country.last_post_date) : null;
                    const trips = country.trips ?? [];

                    return (
                      <a
                        href={`/countries/${country.iso_code?.toLowerCase()}`}
                        key={country.country_id}
                        className="group p-6 bg-white border border-ink/5 rounded-sm shadow-sm hover:border-amber/40 hover:shadow-md cursor-pointer transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          {/* Title & Badge */}
                          <div className="flex items-start justify-between gap-4 mb-4">
                            <h3 className="font-display font-bold text-xl text-ink flex items-center gap-2">
                              {country.iso_code && (
                                <span className="text-2xl" title={country.iso_code}>
                                  {countryCodeToFlag(country.iso_code)}
                                </span>
                              )}
                              <div>
                                <span>{country.name}</span>
                              </div>
                            </h3>
                            <span className="tag shrink-0 bg-cream text-ink font-semibold">
                              {country.total_posts} {country.total_posts === 1 ? "Post" : "Posts"}
                            </span>
                          </div>

                          {/* Visited Dates */}
                          {firstDate && (
                            <p className="text-2xs font-body text-dust mb-4 tabular-nums">
                              Visited: {firstDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                              {lastDate && firstDate.getTime() !== lastDate.getTime() && (
                                <> to {lastDate.toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</>
                              )}
                            </p>
                          )}
                        </div>

                        {/* Associated Trips */}
                        {trips.length > 0 && (
                          <div className="border-t border-ink/5 pt-4 mt-2">
                            <p className="text-3xs uppercase tracking-widest text-dust font-body mb-2">Trips:</p>
                            <div className="flex flex-col gap-1">
                              {trips.map((tripName) => (
                                <span
                                  key={tripName}
                                  className="text-2xs text-ink/80 font-body font-light line-clamp-1"
                                >
                                  {tripName}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </a>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
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
