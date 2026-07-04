import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();

    // 1. Fetch all countries and trips
    const [countriesRes, tripsRes] = await Promise.all([
      adminClient
        .from("countries")
        .select("country_id, name, name_de, iso_code")
        .order("name", { ascending: true }),
      adminClient
        .from("trips")
        .select("trip_id, trip_name, start_date, end_date, companions")
        .order("start_date", { ascending: false, nullsFirst: false }),
    ]);

    if (countriesRes.error) throw countriesRes.error;
    if (tripsRes.error) throw tripsRes.error;

    // 2. Fetch post metadata to compute unique values in memory
    const { data: postsData, error: postsError } = await adminClient
      .from("posts")
      .select("companions, travel_mode, weather, mood, highlights, tags")
      .range(0, 4000);

    if (postsError) throw postsError;

    // 3. Fetch media tags to compute unique media tags in memory
    const { data: mediaData, error: mediaError } = await adminClient
      .from("media")
      .select("tags")
      .not("tags", "is", null)
      .range(0, 4000);

    if (mediaError) throw mediaError;

    // 4. Extract unique values using Sets
    const companionsSet = new Set<string>();
    const travelModesSet = new Set<string>();
    const weatherSet = new Set<string>();
    const moodSet = new Set<string>();
    const highlightsSet = new Set<string>();
    const postTagsSet = new Set<string>();

    (postsData ?? []).forEach((post) => {
      if (post.companions && Array.isArray(post.companions)) {
        post.companions.forEach((c) => {
          if (c) {
            c.split(",").forEach((part: string) => {
              const trimmed = part.trim();
              if (trimmed) companionsSet.add(trimmed);
            });
          }
        });
      }
      if (post.travel_mode) {
        travelModesSet.add(post.travel_mode.trim());
      }
      if (post.weather) {
        weatherSet.add(post.weather.trim());
      }
      if (post.mood) {
        moodSet.add(post.mood.trim());
      }
      if (post.highlights && Array.isArray(post.highlights)) {
        post.highlights.forEach((h) => h && highlightsSet.add(h.trim()));
      }
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach((t) => t && postTagsSet.add(t.trim()));
      }
    });

    (tripsRes.data ?? []).forEach((trip) => {
      if (trip.companions && Array.isArray(trip.companions)) {
        trip.companions.forEach((c) => {
          if (c) {
            c.split(",").forEach((part: string) => {
              const trimmed = part.trim();
              if (trimmed) companionsSet.add(trimmed);
            });
          }
        });
      }
    });

    const mediaTagsSet = new Set<string>();
    (mediaData ?? []).forEach((m) => {
      if (m.tags && Array.isArray(m.tags)) {
        m.tags.forEach((t) => t && mediaTagsSet.add(t.trim()));
      }
    });

    return NextResponse.json({
      success: true,
      countries: countriesRes.data ?? [],
      trips: tripsRes.data ?? [],
      companions: Array.from(companionsSet).sort(),
      travelModes: Array.from(travelModesSet).sort(),
      weather: Array.from(weatherSet).sort(),
      moods: Array.from(moodSet).sort(),
      highlights: Array.from(highlightsSet).sort(),
      postTags: Array.from(postTagsSet).sort(),
      mediaTags: Array.from(mediaTagsSet).sort(),
    });
  } catch (error: any) {
    console.error("Error in options API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
