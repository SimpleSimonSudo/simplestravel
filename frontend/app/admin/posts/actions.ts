"use server";

import { createAdminClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const PostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  post_date: z.string(),
  actual_date: z.string(),
  country_id: z.string().optional().nullable(),
  trip_id: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  travel_mode: z.string().optional().nullable(),
  weather: z.string().optional().nullable(),
  mood: z.string().optional().nullable(),
  companions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  content_blocks: z.array(z.any()),
});

export async function savePost(postId: string | "new", formData: any) {
  const supabase = createAdminClient();

  const validated = PostSchema.safeParse(formData);
  if (!validated.success) {
    return { error: validated.error.issues[0].message };
  }

  const data = validated.data;
  
  const postPayload = {
    title: data.title,
    post_date: data.post_date,
    actual_date: data.actual_date,
    country_id: data.country_id ? parseInt(data.country_id, 10) : null,
    trip_id: data.trip_id ? parseInt(data.trip_id, 10) : null,
    city: data.city || null,
    region: data.region || null,
    latitude: data.latitude,
    longitude: data.longitude,
    travel_mode: data.travel_mode || null,
    weather: data.weather || null,
    mood: data.mood || null,
    companions: data.companions || [],
    tags: data.tags || [],
    // For fast retrieval in some contexts, we store blocks as JSON in the post table
    content_blocks: data.content_blocks,
  };

  let currentPostId = postId;

  if (postId === "new") {
    // Generate an ID if needed, but our DB might use gen_random_uuid() or text.
    // For text post_id, we need a slug or timestamp format.
    // Tumblr imports used timestamp. We can use a combination of timestamp and random.
    currentPostId = Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6);
    
    const { error: insertError } = await supabase
      .from("posts")
      .insert({ ...postPayload, post_id: currentPostId });

    if (insertError) return { error: insertError.message };
  } else {
    const { error: updateError } = await supabase
      .from("posts")
      .update(postPayload)
      .eq("post_id", currentPostId);

    if (updateError) return { error: updateError.message };
  }

  // Now handle relational `content_blocks` and `media` tables
  // First clear existing blocks for this post
  await supabase.from("content_blocks").delete().eq("post_id", currentPostId);
  // Do NOT blindly delete media, as it deletes files. We only delete media if it was removed. 
  // Actually, media management is tricky. For now, we will upsert blocks.

  for (let i = 0; i < data.content_blocks.length; i++) {
    const block = data.content_blocks[i];
    
    let mediaId = null;

    if (block.type === "image" || block.type === "video") {
      // Upsert Media record
      const mediaPayload = {
        post_id: currentPostId,
        block_index: i,
        display_order: i,
        media_type: block.type,
        storage_path: block.storage_path,
        caption: block.caption,
      };

      const { data: mediaRecord, error: mediaError } = await supabase
        .from("media")
        .insert(mediaPayload)
        .select("media_id")
        .single();
        
      if (!mediaError && mediaRecord) {
        mediaId = mediaRecord.media_id;
      }
    }

    const blockPayload = {
      post_id: currentPostId,
      block_index: i,
      block_type: block.type,
      text_content: block.text_content || null,
      text_subtype: block.text_subtype || null,
      layout_row: block.layout_row || null,
      layout_position: block.layout_position || null,
      media_id: mediaId,
    };

    await supabase.from("content_blocks").insert(blockPayload);
  }

  revalidatePath("/admin/posts");
  return { success: true, post_id: currentPostId };
}
