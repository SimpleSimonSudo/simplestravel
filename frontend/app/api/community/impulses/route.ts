import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get("board_id");

    const adminClient = createAdminClient();
    const currentVisitorId = request.cookies.get("visitor_profile")?.value;

    // Fetch impulses with relations
    let query = adminClient
      .from("community_impulses")
      .select(`
        *,
        community_visitors!inner (display_name, visitor_id, is_banned, avatar_id),
        posts (title),
        countries (name, name_de, iso_code),
        community_replies (reply_id),
        community_reactions (reaction_type, visitor_id)
      `);

    if (boardId) {
      query = query.eq("board_id", boardId);
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

      (impulse.community_reactions || []).forEach((r: any) => {
        if (reactionsCount[r.reaction_type] !== undefined) {
          reactionsCount[r.reaction_type] += 1;
        }
        if (currentVisitorId && r.visitor_id === currentVisitorId) {
          if (!userReactions.includes(r.reaction_type)) {
            userReactions.push(r.reaction_type);
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
        post: impulse.posts ? { post_id: impulse.post_id, title: impulse.posts.title } : null,
        country: impulse.countries ? { country_id: impulse.country_id, name: impulse.countries.name, iso_code: impulse.countries.iso_code } : null,
        reply_count: impulse.community_replies ? impulse.community_replies.length : 0,
        reactions: reactionsCount,
        user_reactions: userReactions,
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
    const visitorId = request.cookies.get("visitor_profile")?.value;
    if (!visitorId) {
      return NextResponse.json({ success: false, message: "Please verify your profile before posting." }, { status: 401 });
    }

    const body = await request.json();
    const { content, post_id, country_id, board_id } = body;

    if (!board_id) {
      return NextResponse.json({ success: false, message: "Missing board_id parameter." }, { status: 400 });
    }

    const trimmedContent = (content || "").trim();
    if (!trimmedContent || trimmedContent.length < 3 || trimmedContent.length > 3000) {
      return NextResponse.json({ success: false, message: "Impulse text must be between 3 and 3000 characters." }, { status: 400 });
    }

    const adminClient = createAdminClient();

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
      .eq("board_id", board_id);

    if (!boardExists || boardExists === 0) {
      return NextResponse.json({ success: false, message: "Selected board does not exist." }, { status: 404 });
    }

    // Insert impulse
    const { data: inserted, error: insertErr } = await adminClient
      .from("community_impulses")
      .insert({
        visitor_id: visitorId,
        board_id: board_id,
        content: trimmedContent,
        post_id: post_id || null,
        country_id: country_id ? parseInt(country_id, 10) : null
      })
      .select(`
        *,
        community_visitors (display_name, visitor_id, avatar_id),
        posts (title),
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
      post: inserted.posts ? { post_id: inserted.post_id, title: inserted.posts.title } : null,
      country: inserted.countries ? { country_id: inserted.country_id, name: inserted.countries.name, iso_code: inserted.countries.iso_code } : null,
      reply_count: 0,
      reactions: { heart: 0, sparkles: 0, globe: 0, funny: 0, applause: 0, rocket: 0, camera: 0 },
      user_reactions: [],
    };

    return NextResponse.json({ success: true, impulse: formatted });
  } catch (error) {
    console.error("Error in impulses POST endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
