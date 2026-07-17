"use server";

import { createAdminClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { deleteObjectFromR2 } from "@/app/admin/actions/upload";
import { getAdminSessionOrNull } from "@/lib/session";

const PostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  post_date: z.string(),
  actual_date: z.string(),
  country_id: z.union([z.string(), z.number()]).optional().nullable(),
  trip_id: z.union([z.string(), z.number()]).optional().nullable(),
  city: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  latitude: z.union([z.string(), z.number()]).optional().nullable(),
  longitude: z.union([z.string(), z.number()]).optional().nullable(),
  travel_mode: z.string().optional().nullable(),
  weather: z.string().optional().nullable(),
  mood: z.string().optional().nullable(),
  companions: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  content_blocks: z.any().array(),
});

export async function savePost(postId: string | "new", formData: any) {
  const session = await getAdminSessionOrNull();
  if (!session) return { error: "Unauthorized." };

  const supabase = createAdminClient();

  const validated = PostSchema.safeParse(formData);
  if (!validated.success) {
    const errorDetails = validated.error.issues
      .map(issue => `Field '${issue.path.join(".")}' error: ${issue.message}`)
      .join("; ");
    return { error: `Validation error: ${errorDetails}` };
  }

  const data = validated.data;
  
  const postPayload = {
    title: data.title,
    post_date: data.post_date,
    actual_date: data.actual_date,
    country_id: data.country_id ? parseInt(data.country_id.toString(), 10) : null,
    trip_id: data.trip_id ? parseInt(data.trip_id.toString(), 10) : null,
    city: data.city || null,
    region: data.region || null,
    latitude: data.latitude ? parseFloat(data.latitude.toString()) : null,
    longitude: data.longitude ? parseFloat(data.longitude.toString()) : null,
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
  // 1. Fetch current media records for this post to check for removed files
  const { data: existingMedia } = await supabase
    .from("media")
    .select("media_id, storage_path")
    .eq("post_id", currentPostId);

  // 2. Identify new storage paths from incoming blocks
  const newStoragePaths = new Set<string>(
    data.content_blocks
      .filter((block: any) => (block.type === "image" || block.type === "video") && block.storage_path)
      .map((block: any) => block.storage_path)
  );

  // 3. Find media records that are being removed from this post
  const removedMedia = (existingMedia || []).filter(
    (m: any) => m.storage_path && !newStoragePaths.has(m.storage_path)
  );

  // 4. Clear existing content blocks and media records for this post
  await supabase.from("content_blocks").delete().eq("post_id", currentPostId);
  await supabase.from("media").delete().eq("post_id", currentPostId);

  // Map layout_row string/timestamp values to small integers for DB type compatibility
  const rowMap = new Map<string, number>();
  let nextRowInt = 1;

  // 5. Insert new media and content blocks
  for (let i = 0; i < data.content_blocks.length; i++) {
    const block = data.content_blocks[i];
    
    let mediaId = null;

    if (block.type === "image" || block.type === "video") {
      const originalUrl = block.original_url || block.storage_path || `https://pub-b3a0e6a319434721bf2acd7052d64b6e.r2.dev/fallback-${Date.now()}`;
      
      // Insert Media record
      const mediaPayload = {
        post_id: currentPostId,
        block_index: i,
        display_order: i,
        media_type: block.type,
        storage_path: block.storage_path || originalUrl,
        original_url: originalUrl,
        caption: block.caption,
      };

      const { data: mediaRecord, error: mediaError } = await supabase
        .from("media")
        .insert(mediaPayload)
        .select("media_id")
        .single();
        
      if (mediaError) {
        console.error("Error inserting media:", mediaError);
        return { error: `Failed to save media: ${mediaError.message} (${mediaError.details || ""})` };
      }

      if (mediaRecord) {
        mediaId = mediaRecord.media_id;
      }
    }

    let dbLayoutRow = null;
    if (block.layout_row !== undefined && block.layout_row !== null) {
      const rowKey = block.layout_row.toString();
      if (!rowMap.has(rowKey)) {
        rowMap.set(rowKey, nextRowInt++);
      }
      dbLayoutRow = rowMap.get(rowKey);
    }

    let dbLayoutPos = null;
    if (block.layout_position !== undefined && block.layout_position !== null) {
      dbLayoutPos = parseInt(block.layout_position.toString(), 10);
    }

    const blockPayload = {
      post_id: currentPostId,
      block_index: i,
      block_type: block.type,
      text_content: block.text || block.text_content || null,
      text_subtype: block.subtype || block.text_subtype || null,
      layout_row: dbLayoutRow,
      layout_position: dbLayoutPos,
      media_id: mediaId,
    };

    const { error: blockError } = await supabase.from("content_blocks").insert(blockPayload);
    if (blockError) {
      console.error("Error inserting block:", blockError);
      return { error: `Failed to save content block: ${blockError.message} (${blockError.details || ""})` };
    }
  }

  // 6. Clean up deleted media from R2 bucket asynchronously/post-DB-update
  // If the same file is still referenced in other posts, we keep the R2 object.
  const publicUrl = process.env.R2_PUBLIC_URL || "https://pub-b3a0e6a319434721bf2acd7052d64b6e.r2.dev";
  for (const media of removedMedia) {
    if (!media.storage_path) continue;
    try {
      // Check if another post references this file
      const { count } = await supabase
        .from("media")
        .select("media_id", { count: "exact", head: true })
        .eq("storage_path", media.storage_path);

      if (count === 0) {
        // Safe to delete from R2 as no other database record references it
        let key = media.storage_path;
        if (key.includes(publicUrl)) {
          key = key.substring(key.indexOf(publicUrl) + publicUrl.length).replace(/^\/+/, "");
        } else if (key.includes(".r2.dev/")) {
          key = key.substring(key.indexOf(".r2.dev/") + 8);
        }
        key = decodeURIComponent(key);

        console.log(`Deleting orphaned file from R2: ${key}`);
        await deleteObjectFromR2(key);
      }
    } catch (e) {
      console.error(`Failed to clean up R2 object for ${media.storage_path}:`, e);
    }
  }

  revalidatePath("/admin/posts");
  return { success: true, post_id: currentPostId };
}
