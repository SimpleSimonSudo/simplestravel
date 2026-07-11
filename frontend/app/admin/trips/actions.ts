"use server";

import { createAdminClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const TripSchema = z.object({
  trip_name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  total_distance_km: z.number().optional().nullable(),
  companions: z.array(z.string()).optional(),
});

export async function saveTrip(tripId: string | "new", formData: FormData) {
  const supabase = createAdminClient();
  
  const rawData = {
    trip_name: formData.get("trip_name") as string,
    description: formData.get("description") as string,
    start_date: formData.get("start_date") as string || null,
    end_date: formData.get("end_date") as string || null,
    total_distance_km: formData.get("total_distance_km") ? parseFloat(formData.get("total_distance_km") as string) : null,
    companions: (formData.get("companions") as string)?.split(",").map(s => s.trim()).filter(s => s !== "") || [],
  };

  const validated = TripSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const { data } = validated;

  if (tripId === "new") {
    const { error } = await supabase.from("trips").insert(data);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("trips")
      .update(data)
      .eq("trip_id", parseInt(tripId, 10));
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/trips");
  redirect("/admin/trips");
}

export async function updateTripCountries(tripId: number, countryConnections: any[]) {
  const supabase = createAdminClient();

  // First clear existing connections
  const { error: deleteError } = await supabase
    .from("trip_countries")
    .delete()
    .eq("trip_id", tripId);

  if (deleteError) return { error: deleteError.message };

  if (countryConnections.length > 0) {
    const payload = countryConnections.map((c: any, index: number) => ({
      trip_id: tripId,
      country_id: c.country_id,
      visit_order: index,
      entry_date: c.entry_date || null,
      exit_date: c.exit_date || null,
      days_spent: c.days_spent || null,
    }));

    const { error: insertError } = await supabase
      .from("trip_countries")
      .insert(payload);

    if (insertError) return { error: insertError.message };
  }

  revalidatePath("/admin/trips");
  return { success: true };
}

export async function toggleMediaTitleTag(mediaId: number, hasTitleTag: boolean) {
  const supabase = createAdminClient();
  
  // First, fetch current tags
  const { data: media, error: fetchError } = await supabase
    .from("media")
    .select("tags")
    .eq("media_id", mediaId)
    .single();

  if (fetchError) return { error: fetchError.message };

  let tags = media.tags || [];
  
  if (hasTitleTag) {
    // We want to add it
    if (!tags.includes("#title")) tags.push("#title");
  } else {
    // We want to remove it
    tags = tags.filter((t: string) => t !== "#title");
  }

  const { error: updateError } = await supabase
    .from("media")
    .update({ tags })
    .eq("media_id", mediaId);

  if (updateError) return { error: updateError.message };
  
  // No redirect, just return success so the client can refresh
  return { success: true };
}
