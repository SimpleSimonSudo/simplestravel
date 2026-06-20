import { createServerClient } from "@/lib/supabase";
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
      title,
      summary,
      latitude,
      longitude,
      city,
      country:countries(name, iso_code)
    `)
    .not("latitude", "is", null)
    .not("longitude", "is", null)
    .order("post_date", { ascending: false });

  if (error) {
    console.error("Error loading map coordinates:", error);
  }

  const mappedPosts = (posts ?? []).map((post: any) => ({
    post_id: post.post_id,
    post_date: post.post_date,
    title: post.title,
    summary: post.summary,
    latitude: Number(post.latitude),
    longitude: Number(post.longitude),
    city: post.city,
    country_name: post.country?.name || null,
    country_code: post.country?.iso_code || null,
  }));

  return (
    <div className="relative w-full h-screen bg-cream overflow-hidden">
      {/* Client Component für Leaflet */}
      <MapClient posts={mappedPosts} />
    </div>
  );
}
