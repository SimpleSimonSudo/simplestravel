import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase";
import { createSessionToken, requireSessionSecret, sessionCookieOptions } from "@/lib/session";
import { checkIpRateLimit } from "@/lib/rateLimit";

export async function POST(request: NextRequest) {
  try {
    // IP-based rate limit covers both the quiz flow (bots spinning up unlimited
    // visitor profiles to dodge the per-visitor limits) and the recovery-code
    // "restore" flow (which skips Turnstile entirely and would otherwise be
    // brute-forceable — community recovery codes are only 3-digit-3-digit).
    const withinLimit = await checkIpRateLimit({ prefix: "verify", limit: 8, windowSeconds: 60 }, request);
    if (!withinLimit) {
      return NextResponse.json(
        { success: false, message: "Too many attempts. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { flow, answers, turnstileToken } = body;

    // 1. Cloudflare Turnstile CAPTCHA verifizieren (falls Secret Key gesetzt ist)
    const turnstileSecret = process.env.NODE_ENV === "development"
      ? "1x0000000000000000000000000000000AA"
      : process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret && flow !== "restore") {
      if (!turnstileToken) {
        return NextResponse.json(
          { success: false, message: "Bot verification token is missing." },
          { status: 400 }
        );
      }

      const verifyRes = await fetch(
        "https://challenges.cloudflare.com/turnstile/v0/siteverify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `secret=${encodeURIComponent(turnstileSecret)}&response=${encodeURIComponent(turnstileToken)}`,
        }
      );

      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        console.error("Turnstile verification failed. Secret:", turnstileSecret ? "Present" : "Missing", "Response:", verifyData);
        const errorCodes = verifyData["error-codes"]?.join(", ") || "unknown-error";
        return NextResponse.json(
          { success: false, message: `Bot verification failed. Please try again. (Details: ${errorCodes})` },
          { status: 400 }
        );
      }
    }

    const adminClient = createAdminClient();
    let visitorId = "";
    let displayName = "";
    let recoveryCode = "";
    let avatarId = "";

    // 2. Profile Wiederherstellung (Restore Flow)
    if (flow === "restore") {
      const code = (answers.recoveryCode || "").trim();
      if (!code) {
        return NextResponse.json(
          { success: false, message: "Please enter a backup code." },
          { status: 400 }
        );
      }

      // Normalize code: remove hyphens, spaces, and formatting characters
      const cleanCode = code.replace(/[^0-9a-zA-Z]/g, "");

      // If code consists of exactly 6 characters, reconstruct the standard format (XXX-XXX)
      let queryCode = code;
      if (cleanCode.length === 6) {
        queryCode = `${cleanCode.slice(0, 3)}-${cleanCode.slice(3)}`;
      }

      // Check if it's an admin key
      const adminKeysStr = process.env.ADMIN_KEYS || "";
      const adminKeys = adminKeysStr.split(",").map(k => k.trim()).filter(Boolean);
      const cleanCodeLower = cleanCode.toLowerCase();
      const isAdminCode = adminKeys.some(k => k.replace(/[^0-9a-zA-Z]/g, "").toLowerCase() === cleanCodeLower);

      let visitor = null;

      if (isAdminCode) {
        // First try to find existing visitor
        const { data: existingVisitor } = await adminClient
          .from("community_visitors")
          .select("*")
          .eq("recovery_code", queryCode)
          .single();

        if (existingVisitor) {
          visitor = existingVisitor;
        } else {
          // Create the admin visitor profile
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

          if (insertErr) {
            console.error("Failed to insert admin visitor:", insertErr);
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
      } else {
        const { data: existingVisitor, error: visitorErr } = await adminClient
          .from("community_visitors")
          .select("*")
          .eq("recovery_code", queryCode)
          .single();

        if (!visitorErr && existingVisitor) {
          visitor = existingVisitor;
        }
      }

      if (!visitor) {
        return NextResponse.json(
          { success: false, message: "Oh, cant't remember you. Try again or just sign up again." },
          { status: 404 }
        );
      }

      if (visitor.is_banned) {
        return NextResponse.json(
          { success: false, message: "This profile has been suspended." },
          { status: 403 }
        );
      }

      // Aktualisiere Aktivität (only if it's a real visitor record in DB)
      if (visitor.visitor_id !== "00000000-0000-0000-0000-000000000000") {
        await adminClient
          .from("community_visitors")
          .update({
            visit_count: (visitor.visit_count || 1) + 1,
            last_active_at: new Date().toISOString()
          })
          .eq("visitor_id", visitor.visitor_id);
      }

      visitorId = visitor.visitor_id;
      displayName = visitor.display_name;
      recoveryCode = visitor.recovery_code;
      avatarId = visitor.avatar_id || "avatar_1";
    } else {
      // Normaler Quiz-Verifikations-Flow
      const nickname = (answers.nickname || "").trim();
      if (!nickname || nickname.length < 2 || nickname.length > 30) {
        return NextResponse.json(
          { success: false, message: "Please provide a nickname (2-30 characters)." },
          { status: 400 }
        );
      }

      if (flow === "know_me") {
        // Pfad A: Persönliche Fragen (Freunde & Familie)
        const hometown = (answers.hometown || "").trim().toLowerCase();
        const girlfriendNickname = (answers.nickname_gf || "").trim().toLowerCase(); // renamed from 'nickname' to avoid conflict with visitor nickname
        const siblings = (answers.siblings || "").trim().toLowerCase();

        // Erwartete Antworten (case-insensitiv)
        const isHometownCorrect = ["augsburg", "augsburgo", "stadtbergen", "86391"].includes(hometown);
        const isNicknameCorrect = ["johy", "joi", "joy", "pieps"].includes(girlfriendNickname);
        const isSiblingsCorrect = ["three", "3", "drei"].includes(siblings);

        if (!isHometownCorrect || !isNicknameCorrect || !isSiblingsCorrect) {
          return NextResponse.json(
            { success: false, message: "Aww, those answers don't seem right. Please try again!" },
            { status: 400 }
          );
        }
      } else if (flow === "vibe_check") {
        // Pfad B: Vibe Check (Respekt- & Verhaltens-Quiz)
        const q1 = answers.q1;
        const q2 = answers.q2;
        const q3 = answers.q3;
        const q4 = answers.q4;

        const q5: number[] = answers.q5 || [];
        const q6: number[] = answers.q6 || [];

        if (q1 !== 0 || q2 !== 1 || q3 !== 2 || q4 !== 0) {
          return NextResponse.json(
            { success: false, message: "Hmm, your vibes aren't quite matching our travel spirit. Let's try again!" },
            { status: 400 }
          );
        }

        const expectedQ5 = [0, 3];
        const errorsQ5 =
          expectedQ5.filter((x: number) => !q5.includes(x)).length +
          q5.filter((x: number) => !expectedQ5.includes(x)).length;

        const expectedQ6 = [0, 1];
        const errorsQ6 =
          expectedQ6.filter((x: number) => !q6.includes(x)).length +
          q6.filter((x: number) => !expectedQ6.includes(x)).length;

        const totalMultiErrors = errorsQ5 + errorsQ6;

        if (totalMultiErrors > 1) {
          return NextResponse.json(
            { success: false, message: "Hmm, your choices didn't quite capture the respect we value. Try again!" },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { success: false, message: "Invalid authorization flow." },
          { status: 400 }
        );
      }

      // Neues Profil erstellen
      displayName = nickname;

      // Eindeutigen Recovery Code generieren (Format: XXX-XXX)
      let codeExists = true;
      while (codeExists) {
        recoveryCode = `${Math.floor(100 + Math.random() * 900)}-${Math.floor(100 + Math.random() * 900)}`;
        const { count } = await adminClient
          .from("community_visitors")
          .select("visitor_id", { count: "exact", head: true })
          .eq("recovery_code", recoveryCode);
        if (count === 0) {
          codeExists = false;
        }
      }

      const randomAvatarId = `avatar_${Math.floor(1 + Math.random() * 15)}`;
      // Besucher eintragen
      const { data: newVisitor, error: insertErr } = await adminClient
        .from("community_visitors")
        .insert({
          display_name: displayName,
          recovery_code: recoveryCode,
          visit_count: 1,
          avatar_id: randomAvatarId
        })
        .select()
        .single();

      if (insertErr || !newVisitor) {
        console.error("Error creating visitor profile:", insertErr);
        return NextResponse.json(
          { success: false, message: "Error creating your profile. Please try again." },
          { status: 500 }
        );
      }

      visitorId = newVisitor.visitor_id;
      avatarId = newVisitor.avatar_id || "avatar_1";
    }

    // 3. Signiertes Session-Token ausstellen. Ein Cookie für Identität + Admin-Claim,
    //    statt drei separaten (teils unsignierten) Cookies wie zuvor.
    const sessionSecret = requireSessionSecret();

    const adminKeysStr = process.env.ADMIN_KEYS || "";
    const adminKeys = adminKeysStr.split(",").map(k => k.trim()).filter(Boolean);
    const cleanRecoveryCodeLower = recoveryCode.replace(/[^0-9a-zA-Z]/g, "").toLowerCase();
    const isAdmin = adminKeys.some(k => k.replace(/[^0-9a-zA-Z]/g, "").toLowerCase() === cleanRecoveryCodeLower);

    const token = await createSessionToken({ vid: visitorId, adm: isAdmin }, sessionSecret);

    const response = NextResponse.json({
      success: true,
      nickname: displayName,
      recoveryCode: recoveryCode,
      avatarId: avatarId,
      visitorId: visitorId
    });

    const isSecure = process.env.NODE_ENV === "production";
    response.cookies.set("travel_session", token, sessionCookieOptions(isSecure));

    return response;
  } catch (error) {
    console.error("Error in verify endpoint:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
