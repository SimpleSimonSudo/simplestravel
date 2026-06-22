"use client";

import { useEffect, useRef, useState } from "react";

export default function GatePage() {
  // Flows: "select" (initial screen), "know_me" (personal quiz), "vibe_check" (respect quiz)
  const [flow, setFlow] = useState<"select" | "know_me" | "vibe_check">("select");

  // States for Personal Quiz
  const [personalAnswers, setPersonalAnswers] = useState({
    hometown: "",
    nickname: "",
    siblings: "",
  });

  // States for Vibe Check
  const [singleAnswers, setSingleAnswers] = useState<Record<string, number>>({});
  const [multiAnswers, setMultiAnswers] = useState<Record<string, number[]>>({
    q5: [],
    q6: [],
  });

  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const turnstileWidgetId = useRef<any>(null);

  // Render Turnstile Captcha
  const renderTurnstile = () => {
    const L = (window as any).turnstile;
    const siteKey = process.env.NODE_ENV === "development"
      ? "1x00000000000000000000AA"
      : (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "1x00000000000000000000AA");

    if (L && turnstileRef.current) {
      if (turnstileWidgetId.current !== null) {
        try {
          L.remove(turnstileWidgetId.current);
        } catch (e) {
          console.error("Error removing Turnstile widget:", e);
        }
        turnstileWidgetId.current = null;
        setTurnstileToken("");
      }

      try {
        turnstileWidgetId.current = L.render(turnstileRef.current, {
          sitekey: siteKey,
          theme: "light",
          callback: (token: string) => {
            setTurnstileToken(token);
            setError(null);
          },
          "expired-callback": () => {
            setTurnstileToken("");
            setError("Your session took a little break. Please refresh to continue");
            if (turnstileWidgetId.current !== null) {
              try {
                L.reset(turnstileWidgetId.current);
              } catch (e) {
                console.error("Error auto-resetting Turnstile on expiry:", e);
              }
            }
          },
          "timeout-callback": () => {
            setTurnstileToken("");
            setError("Your session took a little break. Please refresh to continue");
            if (turnstileWidgetId.current !== null) {
              try {
                L.reset(turnstileWidgetId.current);
              } catch (e) {
                console.error("Error auto-resetting Turnstile on timeout:", e);
              }
            }
          },
          "error-callback": () => {
            setError("Error verifying you are human. Try again.");
          }
        });
      } catch (err) {
        console.error("Error rendering Turnstile:", err);
      }
    }
  };

  useEffect(() => {
    // Turnstile script loading (only once on mount)
    const script = document.createElement("script");
    script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onloadTurnstileCallback";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    (window as any).onloadTurnstileCallback = () => {
      if (flow !== "select") {
        renderTurnstile();
      }
    };

    return () => {
      try {
        document.head.removeChild(script);
      } catch (e) { }
      delete (window as any).onloadTurnstileCallback;
    };
  }, []);

  // Render Turnstile whenever we switch flows to sub-forms
  useEffect(() => {
    if (flow !== "select" && (window as any).turnstile) {
      // Delay slightly to ensure ref is mounted
      const timer = setTimeout(renderTurnstile, 50);
      return () => clearTimeout(timer);
    }
  }, [flow]);

  const handlePersonalChange = (field: string, val: string) => {
    setPersonalAnswers((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleSingleChange = (questionId: string, optionIndex: number) => {
    setSingleAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex,
    }));
  };

  const handleMultiChange = (questionId: string, optionIndex: number, checked: boolean) => {
    setMultiAnswers((prev) => {
      const current = prev[questionId] || [];
      const updated = checked
        ? [...current, optionIndex]
        : current.filter((idx) => idx !== optionIndex);
      return {
        ...prev,
        [questionId]: updated,
      };
    });
  };

  const handleBack = () => {
    setFlow("select");
    setError(null);
    setPersonalAnswers({ hometown: "", nickname: "", siblings: "" });
    setSingleAnswers({});
    setMultiAnswers({ q5: [], q6: [] });
    setTurnstileToken("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    let payloadAnswers = {};

    if (flow === "know_me") {
      const { hometown, nickname, siblings } = personalAnswers;
      if (!hometown.trim() || !nickname.trim() || !siblings.trim()) {
        setError("Just a couple more answers to go");
        setLoading(false);
        return;
      }
      payloadAnswers = personalAnswers;
    } else {
      // Vibe Check
      const { q1, q2, q3, q4 } = singleAnswers;
      if (q1 === undefined || q2 === undefined || q3 === undefined || q4 === undefined) {
        setError("Just a couple more answers to go");
        setLoading(false);
        return;
      }
      if (multiAnswers.q5.length === 0 || multiAnswers.q6.length === 0) {
        setError("Just a couple more answers to go");
        setLoading(false);
        return;
      }
      payloadAnswers = {
        q1,
        q2,
        q3,
        q4,
        q5: multiAnswers.q5,
        q6: multiAnswers.q6,
      };
    }

    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flow,
          answers: payloadAnswers,
          turnstileToken,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Aww, something went wrong.");
        setLoading(false);

        if ((window as any).turnstile && turnstileWidgetId.current !== null) {
          (window as any).turnstile.reset(turnstileWidgetId.current);
          setTurnstileToken("");
        }
        return;
      }

      // Success: redirect to homepage
      window.location.href = "/";
    } catch (err) {
      console.error(err);
      setError("Connection faded a little — please retry");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col justify-between py-12 px-6">
      {/* Header */}
      <header className="text-center">
        <div className="font-display text-2xl tracking-wide text-ink select-none pointer-events-none">
          <span className="italic">traveling</span>
          <span className="text-dust mx-1.5">·</span>
          <span className="font-light text-dust text-base uppercase tracking-widest">planet earth</span>
        </div>
      </header>

      {/* Main card */}
      <main className="max-w-lg w-full mx-auto p-8 bg-white border border-ink/5 rounded-sm shadow-md my-8 animate-fade-up">
        {flow === "select" ? (
          <div className="text-center py-6">
            <span className="overline text-2xs mb-2">Safe Space Journal</span>
            <h1 className="font-display font-bold text-3xl text-ink mb-4">Welcome, glad you are here!</h1>
            <div className="amber-line mx-auto mt-3 mb-6"></div>
            <p className="text-sm text-dust leading-relaxed font-body max-w-sm mx-auto mb-10">
              Happy to open the doors to my memories. To keep this space meaningful and safe, I’d love to get to know you a little first.
            </p>

            <h2 className="font-display text-xl text-ink font-semibold mb-6">Do you know me?</h2>

            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-xs mx-auto">
              <button
                onClick={() => setFlow("know_me")}
                className="flex-1 py-3 px-6 bg-ink text-cream hover:bg-amber hover:text-white font-body text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-sm shadow-sm"
              >
                Oh sure!
              </button>
              <button
                onClick={() => setFlow("vibe_check")}
                className="flex-1 py-3 px-6 bg-cream text-ink hover:bg-amber hover:text-white font-body text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-sm shadow-sm"
              >
                Not so well
              </button>
            </div>
          </div>
        ) : (
          <div>
            {/* Back Button */}
            <button
              onClick={handleBack}
              disabled={loading}
              className="inline-flex items-center gap-1.5 text-3xs uppercase tracking-widest text-dust hover:text-amber transition-colors font-body mb-6"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Go Back
            </button>

            <div className="text-center mb-8">
              <span className="overline text-2xs mb-2">
                {flow === "know_me" ? "Personal Check" : "Respect & Vibe Check"}
              </span>
              <h1 className="font-display font-bold text-2xl text-ink">
                {flow === "know_me" ? "Family & Friends" : "Vibe Check"}
              </h1>
              <div className="amber-line mx-auto mt-3"></div>
            </div>

            {error && (
              <div className="p-3 mb-6 bg-red-50 border-l-2 border-red-500 text-xs text-red-700 font-body">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* FLOW 1: KNOW ME (Personal Riddle) */}
              {flow === "know_me" && (
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label htmlFor="hometown" className="block text-xs font-semibold text-ink font-body">
                      Do you remember my hometown?
                    </label>
                    <input
                      type="text"
                      id="hometown"
                      value={personalAnswers.hometown}
                      onChange={(e) => handlePersonalChange("hometown", e.target.value)}
                      autoComplete="off"
                      disabled={loading}
                      className="w-full px-4 py-2.5 bg-cream/20 border border-ink/10 rounded-sm text-sm font-body text-ink focus:outline-none focus:border-amber/50 transition-colors"
                      placeholder="Enter city..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="nickname" className="block text-xs font-semibold text-ink font-body">
                      What’s the nickname I use for my girlfriend?
                    </label>
                    <input
                      type="text"
                      id="nickname"
                      value={personalAnswers.nickname}
                      onChange={(e) => handlePersonalChange("nickname", e.target.value)}
                      autoComplete="off"
                      disabled={loading}
                      className="w-full px-4 py-2.5 bg-cream/20 border border-ink/10 rounded-sm text-sm font-body text-ink focus:outline-none focus:border-amber/50 transition-colors"
                      placeholder="Enter nickname..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="siblings" className="block text-xs font-semibold text-ink font-body">
                      How many siblings are part of my story?
                    </label>
                    <input
                      type="text"
                      id="siblings"
                      value={personalAnswers.siblings}
                      onChange={(e) => handlePersonalChange("siblings", e.target.value)}
                      autoComplete="off"
                      disabled={loading}
                      className="w-full px-4 py-2.5 bg-cream/20 border border-ink/10 rounded-sm text-sm font-body text-ink focus:outline-none focus:border-amber/50 transition-colors"
                      placeholder="Enter number or word..."
                    />
                  </div>
                </div>
              )}

              {/* FLOW 2: VIBE CHECK */}
              {flow === "vibe_check" && (
                <div className="space-y-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                  {/* Q1 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-ink font-body">
                      1. You hear an opinion you strongly disagree with.
                    </p>
                    <div className="space-y-1.5 font-body text-xs text-dust">
                      {[
                        "I try to understand it first.",
                        "I need to defend my view immediately.",
                        "I stop listening."
                      ].map((opt, i) => (
                        <label key={i} className="flex items-start gap-2.5 cursor-pointer hover:text-ink transition-colors">
                          <input
                            type="radio"
                            name="q1"
                            checked={singleAnswers.q1 === i}
                            onChange={() => handleSingleChange("q1", i)}
                            className="mt-0.5 accent-amber"
                            disabled={loading}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q2 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-ink font-body">
                      2. You visit a place where customs are very different.
                    </p>
                    <div className="space-y-1.5 font-body text-xs text-dust">
                      {[
                        "I'll do things my way.",
                        "I'm curious.",
                        "I think it's weird."
                      ].map((opt, i) => (
                        <label key={i} className="flex items-start gap-2.5 cursor-pointer hover:text-ink transition-colors">
                          <input
                            type="radio"
                            name="q2"
                            checked={singleAnswers.q2 === i}
                            onChange={() => handleSingleChange("q2", i)}
                            className="mt-0.5 accent-amber"
                            disabled={loading}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q3 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-ink font-body">
                      3. There's litter on a hiking trail.
                    </p>
                    <div className="space-y-1.5 font-body text-xs text-dust">
                      {[
                        "I haven't seen it.",
                        "Someone will clean it.",
                        "I pick it up."
                      ].map((opt, i) => (
                        <label key={i} className="flex items-start gap-2.5 cursor-pointer hover:text-ink transition-colors">
                          <input
                            type="radio"
                            name="q3"
                            checked={singleAnswers.q3 === i}
                            onChange={() => handleSingleChange("q3", i)}
                            className="mt-0.5 accent-amber"
                            disabled={loading}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q4 */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-ink font-body">
                      4. A colleague keeps getting interrupted during a conversation.
                    </p>
                    <div className="space-y-1.5 font-body text-xs text-dust">
                      {[
                        "I help bring the conversation back to them.",
                        "I stay out of it.",
                        "That's just how conversations are."
                      ].map((opt, i) => (
                        <label key={i} className="flex items-start gap-2.5 cursor-pointer hover:text-ink transition-colors">
                          <input
                            type="radio"
                            name="q4"
                            checked={singleAnswers.q4 === i}
                            onChange={() => handleSingleChange("q4", i)}
                            className="mt-0.5 accent-amber"
                            disabled={loading}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q5 - MULTICHOICE */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-ink font-body">
                      5. A friend can't afford an activity. (Select all that apply)
                    </p>
                    <div className="space-y-1.5 font-body text-xs text-dust">
                      {[
                        "We find something everyone can enjoy.",
                        "I still go without them.",
                        "That's their problem.",
                        "We'll split the cost between us"
                      ].map((opt, i) => (
                        <label key={i} className="flex items-start gap-2.5 cursor-pointer hover:text-ink transition-colors">
                          <input
                            type="checkbox"
                            name="q5"
                            checked={(multiAnswers.q5 || []).includes(i)}
                            onChange={(e) => handleMultiChange("q5", i, e.target.checked)}
                            className="mt-0.5 accent-amber"
                            disabled={loading}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Q6 - MULTICHOICE */}
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-ink font-body">
                      6. You realize you misunderstood a situation and reacted wrong. (Select all that apply)
                    </p>
                    <div className="space-y-1.5 font-body text-xs text-dust">
                      {[
                        "I admit it and correct myself.",
                        "I reflect on why it happened.",
                        "I feel embarrassed but move on.",
                        "I avoid bringing it up again.",
                        "I justify my reaction."
                      ].map((opt, i) => (
                        <label key={i} className="flex items-start gap-2.5 cursor-pointer hover:text-ink transition-colors">
                          <input
                            type="checkbox"
                            name="q6"
                            checked={(multiAnswers.q6 || []).includes(i)}
                            onChange={(e) => handleMultiChange("q6", i, e.target.checked)}
                            className="mt-0.5 accent-amber"
                            disabled={loading}
                          />
                          <span>{opt}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Turnstile Captcha Widget */}
              <div className="flex justify-center my-6">
                <div ref={turnstileRef} className="cf-turnstile"></div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !turnstileToken}
                className="w-full py-3 bg-ink text-cream hover:bg-amber hover:text-white disabled:bg-dust/40 disabled:text-cream font-body text-xs font-bold uppercase tracking-widest transition-all duration-300 rounded-sm shadow-sm"
              >
                {loading ? "Verifying..." : "Let Me In"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-dust/60 text-2xs font-body">
        <p>Private journal. Responsible visitors only.</p>
      </footer>
    </div>
  );
}
