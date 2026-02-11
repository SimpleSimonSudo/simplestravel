import { createServerClient } from "./supabase";
import type { TripWithCountries, CountryWithStats, TimelineRow } from "./types";

// Alle Trips mit ihren Ländern (für Homepage)
export async function getTripsWithCountries(): Promise<TripWithCountries[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("trips_with_countries")
    .select("*")
    .order("start_date", { ascending: false, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as TripWithCountries[];
}

// Alle Länder mit Statistiken (für Weltkarte)
export async function getCountriesWithStats(): Promise<CountryWithStats[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("countries_with_stats")
    .select("*")
    .order("total_posts", { ascending: false });

  if (error) throw error;
  return (data ?? []) as CountryWithStats[];
}

// Timeline (paginated)
export async function getTimeline(
  page = 0,
  pageSize = 12
): Promise<TimelineRow[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("timeline")
    .select("*")
    .range(page * pageSize, (page + 1) * pageSize - 1);

  if (error) throw error;
  return (data ?? []) as TimelineRow[];
}

// Einzelner Post mit Media
export async function getPost(postId: string) {
  const supabase = createServerClient();

  const [postRes, mediaRes] = await Promise.all([
    supabase
      .from("posts_with_thumbnail")
      .select("*")
      .eq("post_id", postId)
      .single(),
    supabase
      .from("media")
      .select("*")
      .eq("post_id", postId)
      .eq("media_type", "image")
      .order("block_index")
      .order("display_order"),
  ]);

  if (postRes.error) throw postRes.error;
  return { post: postRes.data, media: mediaRes.data ?? [] };
}

// Posts eines Trips
export async function getTripPosts(tripId: number): Promise<TimelineRow[]> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("timeline")
    .select("*")
    .eq("trip_name", tripId)
    .order("post_date");

  if (error) throw error;
  return (data ?? []) as TimelineRow[];
}

// Homepage Stats
export async function getStats() {
  const supabase = createServerClient();

  const [postsRes, countriesRes, tripsRes] = await Promise.all([
    supabase.from("posts").select("post_id", { count: "exact", head: true }),
    supabase.from("countries").select("country_id", { count: "exact", head: true }),
    supabase.from("trips").select("trip_id", { count: "exact", head: true }),
  ]);

  return {
    posts: postsRes.count ?? 0,
    countries: countriesRes.count ?? 0,
    trips: tripsRes.count ?? 0,
  };
}
