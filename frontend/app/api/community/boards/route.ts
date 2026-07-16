import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getVerifiedSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient();
    
    const { data: boards, error } = await adminClient
      .from("community_boards")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching boards:", error);
      return NextResponse.json({ success: false, message: "Error loading boards." }, { status: 500 });
    }

    return NextResponse.json({ success: true, boards });
  } catch (error) {
    console.error("Error in boards GET endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Please verify your profile before creating a board." }, { status: 401 });
    }
    const visitorId = session.vid;

    const body = await request.json();
    const { name, description } = body;

    const trimmedName = (name || "").trim();
    if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 50) {
      return NextResponse.json({ success: false, message: "Board name must be between 2 and 50 characters." }, { status: 400 });
    }

    const trimmedDesc = (description || "").trim();
    if (trimmedDesc.length > 150) {
      return NextResponse.json({ success: false, message: "Board description must be maximum 150 characters." }, { status: 400 });
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

    // Rate limit check: max 5 boards in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await adminClient
      .from("community_boards")
      .select("board_id", { count: "exact", head: true })
      .eq("created_by", visitorId)
      .gt("created_at", oneDayAgo);

    if (countErr) {
      console.error("Error checking rate limits:", countErr);
      return NextResponse.json({ success: false, message: "Server error checking limits." }, { status: 500 });
    }

    if (count !== null && count >= 5) {
      return NextResponse.json({ success: false, message: "Daily rate limit reached (max 5 boards per 24 hours)." }, { status: 429 });
    }

    // Check uniqueness of board name (case insensitive)
    const { count: existsCount } = await adminClient
      .from("community_boards")
      .select("board_id", { count: "exact", head: true })
      .ilike("name", trimmedName);

    if (existsCount && existsCount > 0) {
      return NextResponse.json({ success: false, message: "A board with this name already exists. Please choose another name." }, { status: 409 });
    }

    // Insert board
    const { data: inserted, error: insertErr } = await adminClient
      .from("community_boards")
      .insert({
        name: trimmedName,
        description: trimmedDesc || null,
        created_by: visitorId
      })
      .select()
      .single();

    if (insertErr || !inserted) {
      console.error("Error inserting board:", insertErr);
      return NextResponse.json({ success: false, message: "Error saving board. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, board: inserted });
  } catch (error) {
    console.error("Error in boards POST endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
