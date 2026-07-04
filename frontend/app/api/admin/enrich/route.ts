import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    const body = await request.json();

    const {
      post_id,
      country_id,
      trip_id,
      new_trip, // { name: string, start_date?: string, end_date?: string }
      actual_date,
      title,
      is_enriched,
      latitude,
      longitude,
      city,
      region,
      location_name,
      companions,
      travel_mode,
      weather,
      mood,
      highlights,
      tags,
      media_tags, // Array<{ media_id: number, tags: string[] }>
    } = body;

    if (!post_id) {
      return NextResponse.json(
        { success: false, error: "Missing post_id in request body." },
        { status: 400 }
      );
    }

    let finalTripId = trip_id;

    // 1. If a new trip is specified, create it dynamically
    if (!finalTripId && new_trip && new_trip.name) {
      const tripInsertData: any = {
        trip_name: new_trip.name.trim(),
      };
      if (new_trip.start_date) {
        tripInsertData.start_date = new_trip.start_date;
      }
      if (new_trip.end_date) {
        tripInsertData.end_date = new_trip.end_date;
      }
      if (companions && Array.isArray(companions)) {
        tripInsertData.companions = companions.map((c: string) => c.trim());
      }

      const { data: createdTrip, error: tripError } = await adminClient
        .from("trips")
        .insert(tripInsertData)
        .select("trip_id")
        .single();

      if (tripError) {
        console.error("Error creating new trip:", tripError);
        return NextResponse.json(
          { success: false, error: `Failed to create trip: ${tripError.message}` },
          { status: 500 }
        );
      }
      finalTripId = createdTrip.trip_id;
    }

    // 2. Prepare post update payload
    const postPayload: any = {
      title: title !== undefined ? (title ? title.trim() : null) : undefined,
      is_enriched: is_enriched !== undefined ? !!is_enriched : undefined,
      country_id: country_id ? parseInt(country_id, 10) : null,
      trip_id: finalTripId ? parseInt(finalTripId, 10) : null,
      actual_date: actual_date || new Date().toISOString(),
      latitude: latitude !== undefined && latitude !== null ? parseFloat(latitude) : null,
      longitude: longitude !== undefined && longitude !== null ? parseFloat(longitude) : null,
      city: city ? city.trim() : null,
      region: region ? region.trim() : null,
      location_name: location_name ? location_name.trim() : null,
      companions: companions && Array.isArray(companions) ? companions.map(c => c.trim()) : null,
      travel_mode: travel_mode ? travel_mode.trim() : null,
      weather: weather ? weather.trim() : null,
      mood: mood ? mood.trim() : null,
      highlights: highlights && Array.isArray(highlights) ? highlights.map(h => h.trim()) : null,
      tags: tags && Array.isArray(tags) ? tags.map(t => t.trim()) : null,
    };

    // Note: Database trigger 'posts_set_coordinates' will automatically populate 'coordinates' geography column from lat/lng

    // 3. Update the post
    const { error: postUpdateError } = await adminClient
      .from("posts")
      .update(postPayload)
      .eq("post_id", post_id);

    if (postUpdateError) {
      console.error("Error updating post:", postUpdateError);
      return NextResponse.json(
        { success: false, error: `Failed to update post: ${postUpdateError.message}` },
        { status: 500 }
      );
    }

    // 4. Update media tags
    if (media_tags && Array.isArray(media_tags) && media_tags.length > 0) {
      const mediaPromises = media_tags.map((item) => {
        return adminClient
          .from("media")
          .update({
            tags: item.tags && Array.isArray(item.tags) ? item.tags.map((t: string) => t.trim()) : null,
          })
          .eq("media_id", item.media_id)
          .eq("post_id", post_id); // Security scope
      });

      const mediaResults = await Promise.all(mediaPromises);
      const mediaError = mediaResults.find(res => res.error);
      if (mediaError) {
        console.error("Error updating media tags:", mediaError.error!);
        return NextResponse.json(
          { success: false, error: `Failed to update some media tags: ${mediaError.error!.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Post and media successfully enriched.",
      trip_id: finalTripId,
    });
  } catch (error: any) {
    console.error("Error in enrich API route:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
