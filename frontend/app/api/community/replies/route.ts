import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getVerifiedSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const impulseId = searchParams.get("impulse_id");

    if (!impulseId) {
      return NextResponse.json({ success: false, message: "Missing impulse_id parameter." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Fetch replies joined with visitor profile
    const { data, error } = await adminClient
      .from("community_replies")
      .select(`
        *,
        community_visitors!inner (display_name, visitor_id, is_banned, avatar_id)
      `)
      .eq("impulse_id", impulseId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching replies:", error);
      return NextResponse.json({ success: false, message: "Error loading replies." }, { status: 500 });
    }

    // Filter out replies from banned visitors
    const activeReplies = (data ?? []).filter(
      (reply: any) => reply.community_visitors && !reply.community_visitors.is_banned
    );

    const formatted = activeReplies.map((reply: any) => ({
      reply_id: reply.reply_id,
      impulse_id: reply.impulse_id,
      content: reply.content,
      created_at: reply.created_at,
      updated_at: reply.updated_at || null,
      visitor: {
        visitor_id: reply.community_visitors.visitor_id,
        display_name: reply.community_visitors.display_name,
        avatar_id: reply.community_visitors.avatar_id || "avatar_1",
      }
    }));

    return NextResponse.json({ success: true, replies: formatted });
  } catch (error) {
    console.error("Error in replies GET endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Please verify your profile before replying." }, { status: 401 });
    }
    const visitorId = session.vid;

    const body = await request.json();
    const { content, impulse_id } = body;

    if (!impulse_id) {
      return NextResponse.json({ success: false, message: "Missing impulse_id." }, { status: 400 });
    }

    const trimmedContent = (content || "").trim();
    if (!trimmedContent || trimmedContent.length < 1 || trimmedContent.length > 200) {
      return NextResponse.json({ success: false, message: "Reply text must be between 1 and 200 characters." }, { status: 400 });
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

    // Rate limit check: max 100 replies in last 24h
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count, error: countErr } = await adminClient
      .from("community_replies")
      .select("reply_id", { count: "exact", head: true })
      .eq("visitor_id", visitorId)
      .gt("created_at", oneDayAgo);

    if (countErr) {
      console.error("Error checking rate limits:", countErr);
      return NextResponse.json({ success: false, message: "Server error checking limits." }, { status: 500 });
    }

    if (count !== null && count >= 100) {
      return NextResponse.json({ success: false, message: "Daily rate limit reached (max 100 replies per 24 hours)." }, { status: 429 });
    }

    // Insert reply
    // Cast to `any`: embeds community_visitors — see the identical comment in
    // app/api/community/impulses/route.ts for why this isn't hand-modeled
    // through Database["Relationships"] instead.
    const { data: insertedRaw, error: insertErr } = await adminClient
      .from("community_replies")
      .insert({
        impulse_id,
        visitor_id: visitorId,
        content: trimmedContent
      })
      .select(`
        *,
        community_visitors (display_name, visitor_id, avatar_id)
      `)
      .single();
    const inserted = insertedRaw as any;

    if (insertErr || !inserted) {
      console.error("Error inserting reply:", insertErr);
      return NextResponse.json({ success: false, message: "Error saving reply. Please try again." }, { status: 500 });
    }

    const formatted = {
      reply_id: inserted.reply_id,
      impulse_id: inserted.impulse_id,
      content: inserted.content,
      created_at: inserted.created_at,
      updated_at: inserted.updated_at || null,
      visitor: {
        visitor_id: inserted.community_visitors.visitor_id,
        display_name: inserted.community_visitors.display_name,
        avatar_id: inserted.community_visitors.avatar_id || "avatar_1",
      }
    };

    return NextResponse.json({ success: true, reply: formatted });
  } catch (error) {
    console.error("Error in replies POST endpoint:", error);
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
    const { reply_id, content } = body;

    if (!reply_id) {
      return NextResponse.json({ success: false, message: "Missing reply_id." }, { status: 400 });
    }

    const trimmedContent = (content || "").trim();
    if (!trimmedContent || trimmedContent.length < 1 || trimmedContent.length > 200) {
      return NextResponse.json({ success: false, message: "Reply text must be between 1 and 200 characters." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Fetch the reply to verify ownership
    const { data: reply, error: fetchErr } = await adminClient
      .from("community_replies")
      .select("visitor_id")
      .eq("reply_id", reply_id)
      .single();

    if (fetchErr || !reply) {
      return NextResponse.json({ success: false, message: "Comment not found." }, { status: 404 });
    }

    if (reply.visitor_id !== visitorId) {
      return NextResponse.json({ success: false, message: "You are not authorized to edit this comment." }, { status: 403 });
    }

    // Update reply
    const { data: updated, error: updateErr } = await adminClient
      .from("community_replies")
      .update({
        content: trimmedContent,
        updated_at: new Date().toISOString()
      })
      .eq("reply_id", reply_id)
      .select()
      .single();

    if (updateErr || !updated) {
      console.error("Error updating reply:", updateErr);
      return NextResponse.json({ success: false, message: "Error updating your comment. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, content: updated.content, updated_at: updated.updated_at });
  } catch (error) {
    console.error("Error in replies PATCH endpoint:", error);
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
    const replyId = searchParams.get("reply_id");

    if (!replyId) {
      return NextResponse.json({ success: false, message: "Missing reply_id." }, { status: 400 });
    }

    const adminClient = createAdminClient();

    // Fetch the reply to verify ownership
    const { data: reply, error: fetchErr } = await adminClient
      .from("community_replies")
      .select("visitor_id")
      .eq("reply_id", replyId)
      .single();

    if (fetchErr || !reply) {
      return NextResponse.json({ success: false, message: "Comment not found." }, { status: 404 });
    }

    if (reply.visitor_id !== visitorId) {
      return NextResponse.json({ success: false, message: "You are not authorized to delete this comment." }, { status: 403 });
    }

    // Delete reply
    const { error: deleteErr } = await adminClient
      .from("community_replies")
      .delete()
      .eq("reply_id", replyId);

    if (deleteErr) {
      console.error("Error deleting reply:", deleteErr);
      return NextResponse.json({ success: false, message: "Error deleting comment. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in replies DELETE endpoint:", error);
    return NextResponse.json({ success: false, message: "Internal server error." }, { status: 500 });
  }
}
