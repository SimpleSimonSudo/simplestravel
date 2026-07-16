import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createSessionToken, requireSessionSecret, sessionCookieOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adminKey, password } = body;

    // 1. Password verification
    const expectedPassword = process.env.ADMIN_PASSWORD;
    if (!expectedPassword || password !== expectedPassword) {
      return NextResponse.json(
        { success: false, message: "Invalid password." },
        { status: 401 }
      );
    }

    // 2. Admin key verification
    const code = (adminKey || "").trim();
    if (!code) {
      return NextResponse.json(
        { success: false, message: "Please enter an admin key." },
        { status: 400 }
      );
    }

    // Normalize input key (remove hyphens, spaces, etc.)
    const cleanCode = code.replace(/[^0-9a-zA-Z]/g, "");
    if (cleanCode.length !== 6) {
      return NextResponse.json(
        { success: false, message: "Admin key must be 6 alphanumeric characters." },
        { status: 400 }
      );
    }

    const queryCode = `${cleanCode.slice(0, 3)}-${cleanCode.slice(3)}`;

    // Verify against ADMIN_KEYS in env
    const adminKeysStr = process.env.ADMIN_KEYS || "";
    const adminKeys = adminKeysStr.split(",").map(k => k.trim()).filter(Boolean);
    const cleanCodeLower = cleanCode.toLowerCase();
    const isAdminCode = adminKeys.some(k => k.replace(/[^0-9a-zA-Z]/g, "").toLowerCase() === cleanCodeLower);

    if (!isAdminCode) {
      return NextResponse.json(
        { success: false, message: "Invalid admin key." },
        { status: 401 }
      );
    }

    // 3. Supabase visitor management (fetch or insert Admin profile)
    const adminClient = createAdminClient();
    let visitor = null;

    const { data: existingVisitor } = await adminClient
      .from("community_visitors")
      .select("*")
      .eq("recovery_code", queryCode)
      .single();

    if (existingVisitor) {
      visitor = existingVisitor;
    } else {
      // Create a new admin visitor profile
      const { data: newVisitor, error: insertErr } = await adminClient
        .from("community_visitors")
        .insert({
          display_name: "Simon (Admin)",
          recovery_code: queryCode,
          visit_count: 1,
          avatar_id: "avatar_1"
        })
        .select()
        .single();

      if (insertErr || !newVisitor) {
        console.error("Failed to insert admin visitor profile:", insertErr);
        visitor = {
          visitor_id: "00000000-0000-0000-0000-000000000000",
          display_name: "Simon (Admin)",
          recovery_code: queryCode,
          avatar_id: "avatar_1",
          visit_count: 1,
          is_banned: false
        };
      } else {
        visitor = newVisitor;
      }
    }

    // Update activity if it's a real database entry
    if (visitor.visitor_id !== "00000000-0000-0000-0000-000000000000") {
      await adminClient
        .from("community_visitors")
        .update({
          visit_count: (visitor.visit_count || 1) + 1,
          last_active_at: new Date().toISOString()
        })
        .eq("visitor_id", visitor.visitor_id);
    }

    // 4. Signiertes Session-Token ausstellen (ersetzt geteiltes Secret-Cookie).
    //    Der Admin-Claim steckt im Token selbst und lässt sich ohne SESSION_SECRET
    //    nicht fälschen — ein einziges Cookie statt drei separaten reicht damit aus.
    const sessionSecret = requireSessionSecret();
    const token = await createSessionToken({ vid: visitor.visitor_id, adm: true }, sessionSecret);

    const response = NextResponse.json({
      success: true,
      nickname: visitor.display_name,
      recoveryCode: visitor.recovery_code,
      avatarId: visitor.avatar_id || "avatar_1",
      visitorId: visitor.visitor_id
    });

    const isSecure = process.env.NODE_ENV === "production";
    response.cookies.set("travel_session", token, sessionCookieOptions(isSecure));

    return response;
  } catch (error) {
    console.error("Error in admin-login endpoint:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
