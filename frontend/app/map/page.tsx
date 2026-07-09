import { createServerClient } from "@/lib/supabase";
import { getCountriesWithStats } from "@/lib/queries";
import MapClient from "./MapClient";

export const revalidate = 60;

export default async function MapPage() {
  const supabase = createServerClient();

  // Hole alle Posts mit Geodaten
  const { data: posts, error } = await supabase
    .from("posts")
    .select(`
      post_id,
      post_date,
      actual_date,
      title,
      summary,
      latitude,
      longitude,
      city,
      country:countries(name, iso_code),
      trip:trips(trip_id, trip_name),
      media:media(storage_path, original_url, media_type, width, height)
    `)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("post_date", { ascending: false });

  if (error) {
    console.error("Error loading map coordinates:", error);
  }

  // Hole alle Trips für das Filter-Menü
  const { data: tripsRes, error: tripsError } = await supabase
    .from("trips")
    .select("trip_id, trip_name")
    .order("trip_name");

  if (tripsError) {
    console.error("Error loading trips for filter:", tripsError);
  }
  const trips = tripsRes ?? [];

  let visitedCountries: any[] = [];
  try {
    visitedCountries = await getCountriesWithStats();
  } catch (err) {
    console.error("Error loading visited countries with stats:", err);
  }

  const mappedPosts = (posts ?? []).map((post: any) => ({
    post_id: post.post_id,
    post_date: post.post_date,
    actual_date: post.actual_date,
    title: post.title,
    summary: post.summary,
    latitude: Number(post.latitude),
    longitude: Number(post.longitude),
    city: post.city,
    country_name: post.country?.name || null,
    country_code: post.country?.iso_code || null,
    trip_id: post.trip?.trip_id || null,
    trip_name: post.trip?.trip_name || null,
    media: post.media || [],
  }));

  return (
    <div className="relative w-full h-screen starry-background overflow-hidden">
      {/* Dynamic Shooting Stars */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
        <div className="shooting-star"></div>
      </div>

      {/* Client Component für MapLibre */}
      <MapClient posts={mappedPosts} visitedCountries={visitedCountries} trips={trips} />
    </div>
  );
}
