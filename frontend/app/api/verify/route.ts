import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { flow, answers, turnstileToken } = body;

    // 1. Cloudflare Turnstile CAPTCHA verifizieren (falls Secret Key gesetzt ist)
    const turnstileSecret = process.env.NODE_ENV === "development"
      ? "1x000000000000000000000000000000000"
      : process.env.TURNSTILE_SECRET_KEY;
    if (turnstileSecret) {
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

    // 2. Antworten überprüfen basierend auf dem gewählten Pfad
    if (flow === "know_me") {
      // Pfad A: Persönliche Fragen (Freunde & Familie)
      const hometown = (answers.hometown || "").trim().toLowerCase();
      const nickname = (answers.nickname || "").trim().toLowerCase();
      const siblings = (answers.siblings || "").trim().toLowerCase();

      // Erwartete Antworten (case-insensitiv)
      const isHometownCorrect = ["augsburg", "augsburgo", "stadtbergen", "86391"].includes(hometown);
      const isNicknameCorrect = ["johy", "joi", "joy", "pieps"].includes(nickname);
      const isSiblingsCorrect = ["three", "3", "drei"].includes(siblings);

      if (!isHometownCorrect || !isNicknameCorrect || !isSiblingsCorrect) {
        return NextResponse.json(
          { success: false, message: "Aww, those answers don't seem right. Please try again!" },
          { status: 400 }
        );
      }
    } else if (flow === "vibe_check") {
      // Pfad B: Vibe Check (Respekt- & Verhaltens-Quiz)
      // Wir erwarten exakte Antworten für Q1-Q4 (Single Choice) und Q5-Q6 (Multi Choice)
      
      const q1 = answers.q1; // Erwartet: "I try to understand it first." (Index 0)
      const q2 = answers.q2; // Erwartet: "I'm curious." (Index 1)
      const q3 = answers.q3; // Erwartet: "I pick up." (Index 2)
      const q4 = answers.q4; // Erwartet: "I help bring the conversation back to them." (Index 0)
      
      const q5: number[] = answers.q5 || []; // Erwartet: [0, 3] ("We find something..." und "We'll split...")
      const q6: number[] = answers.q6 || []; // Erwartet: [0, 1] ("I admit it..." und "I reflect...")

      // Prüfe Q1-Q4
      if (q1 !== 0 || q2 !== 1 || q3 !== 2 || q4 !== 0) {
        return NextResponse.json(
          { success: false, message: "Hmm, your vibes aren't quite matching our travel spirit. Let's try again!" },
          { status: 400 }
        );
      }

      // Prüfe Q5 & Q6 (Multi-choice) mit maximal 1 Fehler Toleranz insgesamt
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

    // 3. Cookie setzen (Gültigkeit: 10 Jahre)
    const sessionSecret = process.env.SESSION_SECRET || "default_session_secret_key_123";
    const response = NextResponse.json({ success: true });
    
    response.cookies.set("travel_session", sessionSecret, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365 * 10, // 10 Jahre
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    return response;
  } catch (error) {
    console.error("Error in verify endpoint:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
