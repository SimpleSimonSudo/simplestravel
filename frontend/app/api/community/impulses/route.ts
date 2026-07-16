import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getVerifiedSession } from "@/lib/session";

function getFirstImageUrl(mediaList: any[] | null): string | null {
  if (!mediaList || mediaList.length === 0) return null;
  const image = mediaList.find((m: any) => m.media_type === "image");
  if (!image) return null;
  return image.storage_path || image.original_url || null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get("board_id");
    const postId = searchParams.get("post_id");

    const adminClient = createAdminClient();
    const currentVisitorId = (await getVerifiedSession(request))?.vid;

    // Fetch impulses with relations
    let query = adminClient
      .from("community_impulses")
      .select(`
        *,
        community_visitors!inner (display_name, visitor_id, is_banned, avatar_id),
        posts (
          post_id,
          title,
          post_date,
          actual_date,
          city,
          summary,
          media (
            storage_path,
            original_url,
            media_type
          )
        ),
        countries (name, name_de, iso_code),
        community_replies (reply_id),
        community_reactions (
          reaction_type,
          visitor_id,
          community_visitors (
            display_name
          )
        )
      `);

    if (boardId) {
      query = query.eq("board_id", boardId);
    }
    if (postId) {
      query = query.eq("post_id", postId);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching impulses:", error);
      return NextResponse.json({ success: false, message: "Error loading impulses." }, { status: 500 });
    }

    // Filter out posts from banned visitors
    const activeImpulses = (data ?? []).filter(
      (impulse: any) => impulse.community_visitors && !impulse.community_visitors.is_banned
    );

    // Format output
    const formatted = activeImpulses.map((impulse: any) => {
      // Group reactions
      const reactionsCount: Record<string, number> = { heart: 0, sparkles: 0, globe: 0, funny: 0, applause: 0, rocket: 0, camera: 0 };
      const userReactions: string[] = [];
      const reactors: Record<string, string[]> = {
        heart: [], sparkles: [], globe: [], funny: [], applause: [], rocket: [], camera: []
      };

      (impulse.community_reactions || []).forEach((r: any) => {
        const type = r.reaction_type;
        const visitorName = r.community_visitors?.display_name || "Traveler";

        if (reactionsCount[type] !== undefined) {
          reactionsCount[type] += 1;
        }
        if (reactors[type] === undefined) {
          reactors[type] = [];
        }
        reactors[type].push(visitorName);
        if (currentVisitorId && r.visitor_id === currentVisitorId) {
          if (!userReactions.includes(type)) {
            userReactions.push(type);
          }
        }
      });

      return {
        impulse_id: impulse.impulse_id,
        board_id: impulse.board_id,
        content: impulse.content,
        created_at: impulse.created_at,
        visitor: {
          visitor_id: impulse.community_visitors.visitor_id,
          display_name: impulse.community_visitors.display_name,
          avatar_id: impulse.community_visitors.avatar_id || "avatar_1",
        },
        post: impulse.posts ? {
          post_id: impulse.post_id,
          title: impulse.posts.title,
          post_date: impulse.posts.post_date,
          actual_date: impulse.posts.actual_date,
          city: impulse.posts.city,
          summary: impulse.posts.summary,
          thumbnail_url: getFirstImageUrl(impulse.posts.media)
        } : null,
        country: impulse.countries ? { country_id: impulse.country_id, name: impulse.countries.name, iso_code: impulse.countries.iso_code } : null,
        reply_count: impulse.community_replies ? impulse.community_replies.length : 0,
        reactions: reactionsCount,
        user_reactions: userReactions,
        reactors: reactors,
        updated_at: impulse.updated_at || null,
      };
    });

    return NextResponse.json({ success: true, impulses: formatted });
  } catch (error) {
    console.error("Error in impulses GET endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Please verify your profile before posting." }, { status: 401 });
    }
    const visitorId = session.vid;

    const body = await request.json();
    const { content, post_id, country_id, board_id } = body;

    const trimmedContent = (content || "").trim();
    if (!trimmedContent || trimmedContent.length < 3 || trimmedContent.length > 3000) {
      return NextResponse.json({ success: false, message: "Impulse text must be between 3 and 3000 characters." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    let finalBoardId = board_id;

    if (!finalBoardId && post_id) {
      // Find post's trip_id
      const { data: postData, error: postErr } = await adminClient
        .from("posts")
        .select("trip_id")
        .eq("post_id", post_id)
        .single();

      if (postErr || !postData) {
        console.error("Error fetching post:", postErr);
        return NextResponse.json({ success: false, message: "Associated post not found." }, { status: 404 });
      }

      const tripId = postData.trip_id;
      if (!tripId) {
        return NextResponse.json({ success: false, message: "Post is not associated with a trip." }, { status: 400 });
      }

      // Find trip_name
      const { data: tripData, error: tripErr } = await adminClient
        .from("trips")
        .select("trip_name")
        .eq("trip_id", tripId)
        .single();

      if (tripErr || !tripData) {
        console.error("Error fetching trip details:", tripErr);
        return NextResponse.json({ success: false, message: "Associated trip not found." }, { status: 404 });
      }

      const tripName = tripData.trip_name;

      // Generate board name safely
      let boardName = `Trip: ${tripName.trim()}`;
      if (boardName.length > 50) {
        boardName = boardName.substring(0, 47) + "...";
      }
      if (boardName.length < 2) {
        boardName = `Trip ${tripId}`;
      }

      // Check if board exists
      const { data: existingBoard } = await adminClient
        .from("community_boards")
        .select("board_id")
        .eq("name", boardName)
        .maybeSingle();

      if (existingBoard) {
        finalBoardId = existingBoard.board_id;
      } else {
        // Create board automatically
        const { data: newBoard, error: createBoardErr } = await adminClient
          .from("community_boards")
          .insert({
            name: boardName,
            description: `Discussion and impulses for the trip: ${tripName.trim()}`,
            created_by: visitorId
          })
          .select()
          .single();

        if (createBoardErr || !newBoard) {
          console.error("Error creating trip board automatically:", createBoardErr);
          return NextResponse.json({ success: false, message: "Error creating trip board." }, { status: 500 });
        }

        finalBoardId = newBoard.board_id;
      }
    }

    if (!finalBoardId) {
      return NextResponse.json({ success: false, message: "Missing board_id parameter." }, { status: 400 });
    }

    // Verify visitor is not banned
    const { data: visitor, error: visitorErr } = await adminClient
      .from("community_visitors")
      .select("is_banned")
      .eq("visitor_id", visitorId)
      .single();

    if (visitorErr || !visitor) {
      return NextResponse.json({ success: false, message: "Profile not found." }, { status: 404 });
    }

    if (visitor.is_banned) {
      return NextResponse.json({ success: false, message: "Your profile has been suspended." }, { status: 403 });
    }

    // Rate limit check: max 50 impulses in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await adminClient
      .from("community_impulses")
      .select("impulse_id", { count: "exact", head: true })
      .eq("visitor_id", visitorId)
      .gt("created_at", oneDayAgo);

    if (countErr) {
      console.error("Error checking rate limits:", countErr);
      return NextResponse.json({ success: false, message: "Server error checking limits." }, { status: 500 });
    }

    if (count !== null && count >= 50) {
      return NextResponse.json({ success: false, message: "Daily rate limit reached (max 50 impulses per 24 hours)." }, { status: 429 });
    }

    // Verify board exists
    const { count: boardExists } = await adminClient
      .from("community_boards")
      .select("board_id", { count: "exact", head: true })
      .eq("board_id", finalBoardId);

    if (!boardExists || boardExists === 0) {
      return NextResponse.json({ success: false, message: "Selected board does not exist." }, { status: 404 });
    }

    // Insert impulse
    const { data: inserted, error: insertErr } = await adminClient
      .from("community_impulses")
      .insert({
        visitor_id: visitorId,
        board_id: finalBoardId,
        content: trimmedContent,
        post_id: post_id || null,
        country_id: country_id ? parseInt(country_id, 10) : null
      })
      .select(`
        *,
        community_visitors (display_name, visitor_id, avatar_id),
        posts (
          post_id,
          title,
          post_date,
          actual_date,
          city,
          summary,
          media (
            storage_path,
            original_url,
            media_type
          )
        ),
        countries (name, name_de, iso_code)
      `)
      .single();

    if (insertErr || !inserted) {
      console.error("Error inserting impulse:", insertErr);
      return NextResponse.json({ success: false, message: "Error saving your impulse. Please try again." }, { status: 500 });
    }

    const formatted = {
      impulse_id: inserted.impulse_id,
      board_id: inserted.board_id,
      content: inserted.content,
      created_at: inserted.created_at,
      visitor: {
        visitor_id: inserted.community_visitors.visitor_id,
        display_name: inserted.community_visitors.display_name,
        avatar_id: inserted.community_visitors.avatar_id || "avatar_1",
      },
      post: inserted.posts ? {
        post_id: inserted.post_id,
        title: inserted.posts.title,
        post_date: inserted.posts.post_date,
        actual_date: inserted.posts.actual_date,
        city: inserted.posts.city,
        summary: inserted.posts.summary,
        thumbnail_url: getFirstImageUrl(inserted.posts.media)
      } : null,
      country: inserted.countries ? { country_id: inserted.country_id, name: inserted.countries.name, iso_code: inserted.countries.iso_code } : null,
      reply_count: 0,
      reactions: { heart: 0, sparkles: 0, globe: 0, funny: 0, applause: 0, rocket: 0, camera: 0 },
      user_reactions: [],
      reactors: { heart: [], sparkles: [], globe: [], funny: [], applause: [], rocket: [], camera: [] },
      updated_at: inserted.updated_at || null,
    };

    return NextResponse.json({ success: true, impulse: formatted });
  } catch (error) {
    console.error("Error in impulses POST endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Please verify your profile first." }, { status: 401 });
    }
    const visitorId = session.vid;

    const body = await request.json();
    const { impulse_id, content } = body;

    if (!impulse_id) {
      return NextResponse.json({ success: false, message: "Missing impulse_id." }, { status: 400 });
    }

    const trimmedContent = (content || "").trim();
    if (!trimmedContent || trimmedContent.length < 3 || trimmedContent.length > 3000) {
      return NextResponse.json({ success: false, message: "Impulse text must be between 3 and 3000 characters." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Fetch the impulse to verify ownership
    const { data: impulse, error: fetchErr } = await adminClient
      .from("community_impulses")
      .select("visitor_id")
      .eq("impulse_id", impulse_id)
      .single();

    if (fetchErr || !impulse) {
      return NextResponse.json({ success: false, message: "Impulse not found." }, { status: 404 });
    }

    if (impulse.visitor_id !== visitorId) {
      return NextResponse.json({ success: false, message: "You are not authorized to edit this impulse." }, { status: 403 });
    }

    // Update impulse
    const { data: updated, error: updateErr } = await adminClient
      .from("community_impulses")
      .update({
        content: trimmedContent,
        updated_at: new Date().toISOString()
      })
      .eq("impulse_id", impulse_id)
      .select()
      .single();

    if (updateErr || !updated) {
      console.error("Error updating impulse:", updateErr);
      return NextResponse.json({ success: false, message: "Error updating your impulse. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, content: updated.content, updated_at: updated.updated_at });
  } catch (error) {
    console.error("Error in impulses PATCH endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Please verify your profile first." }, { status: 401 });
    }
    const visitorId = session.vid;

    const { searchParams } = new URL(request.url);
    const impulseId = searchParams.get("impulse_id");

    if (!impulseId) {
      return NextResponse.json({ success: false, message: "Missing impulse_id." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Fetch the impulse to verify ownership
    const { data: impulse, error: fetchErr } = await adminClient
      .from("community_impulses")
      .select("visitor_id")
      .eq("impulse_id", impulseId)
      .single();

    if (fetchErr || !impulse) {
      return NextResponse.json({ success: false, message: "Impulse not found." }, { status: 404 });
    }

    if (impulse.visitor_id !== visitorId) {
      return NextResponse.json({ success: false, message: "You are not authorized to delete this impulse." }, { status: 403 });
    }

    // Delete impulse
    const { error: deleteErr } = await adminClient
      .from("community_impulses")
      .delete()
      .eq("impulse_id", impulseId);

    if (deleteErr) {
      console.error("Error deleting impulse:", deleteErr);
      return NextResponse.json({ success: false, message: "Error deleting impulse. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in impulses DELETE endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
