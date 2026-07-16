import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { getVerifiedSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "No profile cookie found." }, { status: 401 });
    }
    const visitorId = session.vid;

    const adminClient = createAdminClient();

    const { data: visitor, error: visitorErr } = await adminClient
      .from("community_visitors")
      .select("display_name, recovery_code, avatar_id, is_banned")
      .eq("visitor_id", visitorId)
      .single();

    if (visitorErr || !visitor) {
      return NextResponse.json({ success: false, message: "Profile not found." }, { status: 404 });
    }

    if (visitor.is_banned) {
      return NextResponse.json({ success: false, message: "Profile suspended." }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      visitorId: visitorId,
      nickname: visitor.display_name,
      recoveryCode: visitor.recovery_code,
      avatarId: visitor.avatar_id || "avatar_1"
    });
  } catch (error) {
    console.error("Error in visitor settings GET endpoint:", error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getVerifiedSession(request);
    if (!session) {
      return NextResponse.json({ success: false, message: "Please verify your profile first." }, { status: 401 });
    }
    const visitorId = session.vid;

    const body = await request.json();
    const { avatarId } = body;

    const validAvatars = [
      "avatar_1", "avatar_2", "avatar_3", "avatar_4", "avatar_5", 
      "avatar_6", "avatar_7", "avatar_8", "avatar_9", "avatar_10", 
      "avatar_11", "avatar_12", "avatar_13", "avatar_14", "avatar_15"
    ];
    if (!avatarId || !validAvatars.includes(avatarId)) {
      return NextResponse.json({ success: false, message: "Invalid avatar selection." }, { status: 400 });
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

    // Update avatar
    const { error: updateErr } = await adminClient
      .from("community_visitors")
      .update({ avatar_id: avatarId, last_active_at: new Date().toISOString() })
      .eq("visitor_id", visitorId);

    if (updateErr) {
      console.error("Error updating visitor avatar:", updateErr);
      return NextResponse.json({ success: false, message: "Error updating your avatar." }, { status: 500 });
    }

    return NextResponse.json({ success: true, avatarId });
  } catch (error) {
    console.error("Error in visitor settings endpoint:", error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred." }, { status: 500 });
  }
}
