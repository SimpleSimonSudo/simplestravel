import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";

const VALID_REACTIONS = [
  "heart", "sparkles", "globe", "funny", "applause", "rocket", "camera",
  "like", "wow", "travel", "party", "fire", "sun", "sad", "angry",
  "hug", "dislike", "silly", "greenheart", "peace", "strong", "hearteyes"
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");

    if (!postId) {
      return NextResponse.json({ success: false, message: "Missing post_id." }, { status: 400 });
    }

    const currentVisitorId = request.cookies.get("visitor_profile")?.value;
    const adminClient = createAdminClient();

    const { data: post, error: fetchErr } = await adminClient
      .from("posts")
      .select("reactions")
      .eq("post_id", postId)
      .single();

    if (fetchErr || !post) {
      console.error("Error fetching post reactions:", fetchErr);
      return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
    }

    const reactionsDb = post.reactions || {};
    const formattedReactions: Record<string, number> = {};
    const userReacted: Record<string, boolean> = {};

    VALID_REACTIONS.forEach((type) => {
      const list = reactionsDb[type] || [];
      formattedReactions[type] = list.length;
      userReacted[type] = currentVisitorId ? list.includes(currentVisitorId) : false;
    });

    return NextResponse.json({
      success: true,
      reactions: formattedReactions,
      userReacted
    });
  } catch (error) {
    console.error("Error in posts reactions GET:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const visitorId = request.cookies.get("visitor_profile")?.value;
    if (!visitorId) {
      return NextResponse.json({ success: false, message: "Please verify your profile before reacting." }, { status: 401 });
    }

    const body = await request.json();
    const { post_id, reaction_type } = body;

    if (!post_id || !reaction_type) {
      return NextResponse.json({ success: false, message: "Missing post_id or reaction_type." }, { status: 400 });
    }

    if (!VALID_REACTIONS.includes(reaction_type)) {
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

    // Retrieve current reactions
    const { data: post, error: fetchErr } = await adminClient
      .from("posts")
      .select("reactions")
      .eq("post_id", post_id)
      .single();

    if (fetchErr || !post) {
      console.error("Error fetching post for reaction:", fetchErr);
      return NextResponse.json({ success: false, message: "Post not found." }, { status: 404 });
    }

    const reactionsDb = post.reactions || {};
    const visitorList = reactionsDb[reaction_type] || [];
    let updatedList: string[];
    let reacted = false;

    if (visitorList.includes(visitorId)) {
      // Toggle off
      updatedList = visitorList.filter((id: string) => id !== visitorId);
      reacted = false;
    } else {
      // Toggle on
      updatedList = [...visitorList, visitorId];
      reacted = true;
    }

    const updatedReactions = {
      ...reactionsDb,
      [reaction_type]: updatedList
    };

    const { error: updateErr } = await adminClient
      .from("posts")
      .update({ reactions: updatedReactions })
      .eq("post_id", post_id);

    if (updateErr) {
      console.error("Error updating post reactions:", updateErr);
      return NextResponse.json({ success: false, message: "Failed to update reaction." }, { status: 500 });
    }

    // Return updated totals
    const formattedReactions: Record<string, number> = {};
    const userReacted: Record<string, boolean> = {};

    VALID_REACTIONS.forEach((type) => {
      const list = updatedReactions[type] || [];
      formattedReactions[type] = list.length;
      userReacted[type] = list.includes(visitorId);
    });

    return NextResponse.json({
      success: true,
      reacted,
      reactions: formattedReactions,
      userReacted
    });
  } catch (error) {
    console.error("Error in posts reactions POST:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
