import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const visitorId = request.cookies.get("visitor_profile")?.value;
    if (!visitorId) {
      return NextResponse.json({ success: false, message: "Please verify your profile before reacting." }, { status: 401 });
    }

    const body = await request.json();
    const { impulse_id, reaction_type } = body;

    if (!impulse_id || !reaction_type) {
      return NextResponse.json({ success: false, message: "Missing impulse_id or reaction_type." }, { status: 400 });
    }

    const validReactions = ["heart", "sparkles", "globe", "funny", "applause", "rocket", "camera"];
    if (!validReactions.includes(reaction_type)) {
      return NextResponse.json({ success: false, message: "Invalid reaction type." }, { status: 400 });
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

    // Check if reaction already exists
    const { data: existing, error: findErr } = await adminClient
      .from("community_reactions")
      .select("reaction_id")
      .eq("impulse_id", impulse_id)
      .eq("visitor_id", visitorId)
      .eq("reaction_type", reaction_type)
      .maybeSingle();

    if (findErr) {
      console.error("Error finding existing reaction:", findErr);
      return NextResponse.json({ success: false, message: "Server error checking reactions." }, { status: 500 });
    }

    if (existing) {
      // Reaction exists -> Delete it (toggle off)
      const { error: deleteErr } = await adminClient
        .from("community_reactions")
        .delete()
        .eq("reaction_id", existing.reaction_id);

      if (deleteErr) {
        console.error("Error deleting reaction:", deleteErr);
        return NextResponse.json({ success: false, message: "Error updating reaction." }, { status: 500 });
      }

      return NextResponse.json({ success: true, reacted: false });
    } else {
      // Reaction doesn't exist -> Insert it (toggle on)
      // Rate limit check: max 100 reactions in last 24h
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const { count, error: countErr } = await adminClient
        .from("community_reactions")
        .select("reaction_id", { count: "exact", head: true })
        .eq("visitor_id", visitorId)
        .gt("created_at", oneDayAgo);

      if (countErr) {
        console.error("Error checking rate limits:", countErr);
        return NextResponse.json({ success: false, message: "Server error checking limits." }, { status: 500 });
      }

      if (count !== null && count >= 100) {
        return NextResponse.json({ success: false, message: "Daily rate limit reached (max 100 reactions per 24 hours)." }, { status: 429 });
      }

      const { error: insertErr } = await adminClient
        .from("community_reactions")
        .insert({
          impulse_id,
          visitor_id: visitorId,
          reaction_type
        });

      if (insertErr) {
        console.error("Error inserting reaction:", insertErr);
        return NextResponse.json({ success: false, message: "Error saving reaction." }, { status: 500 });
      }

      return NextResponse.json({ success: true, reacted: true });
    }
  } catch (error) {
    console.error("Error in reactions POST endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
