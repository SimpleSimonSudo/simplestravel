"use client";

import React, { useState, useEffect } from "react";
import { renderAvatarSvg } from "@/lib/avatars";

type PostFooterProps = {
  postId: string | number;
  tripId: number;
  hasCoords?: boolean;
};

const EMOJIS = [
  { type: "heart", char: "❤️" },
  { type: "sparkles", char: "✨" },
  { type: "globe", char: "🌍" },
  { type: "funny", char: "😂" },
  { type: "applause", char: "👏" },
  { type: "rocket", char: "🚀" },
  { type: "camera", char: "📸" },
  { type: "like", char: "👍" },
  { type: "wow", char: "😮" },
  { type: "travel", char: "🌴" },
  { type: "party", char: "🎉" },
  { type: "fire", char: "🔥" },
  { type: "sun", char: "☀️" },
  { type: "sad", char: "😢" },
  { type: "angry", char: "😠" },
  { type: "hug", char: "🤗" },
  { type: "dislike", char: "👎" },
  { type: "silly", char: "🤪" },
  { type: "greenheart", char: "💚" },
  { type: "peace", char: "☮️" },
  { type: "strong", char: "💪" },
  { type: "hearteyes", char: "😍" },
];

export default function PostFooter({ postId, tripId, hasCoords = false }: PostFooterProps) {
  // Reactions state
  const [reactions, setReactions] = useState<Record<string, number>>({});
  const [userReacted, setUserReacted] = useState<Record<string, boolean>>({});
  const [reactors, setReactors] = useState<Record<string, string[]>>({});
  const [activeReactorPopup, setActiveReactorPopup] = useState<string | null>(null);
  const [loadingReactions, setLoadingReactions] = useState(true);
  const [showPicker, setShowPicker] = useState(false);

  // Comments/Impulses state
  const [impulses, setImpulses] = useState<any[]>([]);
  const [loadingImpulses, setLoadingImpulses] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Visitor profile state
  const [isVerified, setIsVerified] = useState(false);
  const [visitor, setVisitor] = useState<any>(null);

  // Sync visitor profile and load data
  useEffect(() => {
    // 1. Check local visitor profile details
    const name = localStorage.getItem("travel_display_name");
    const vid = localStorage.getItem("travel_visitor_id");
    const avatar = localStorage.getItem("travel_avatar_id");
    if (name && vid) {
      setIsVerified(true);
      setVisitor({ visitor_id: vid, display_name: name, avatar_id: avatar || "avatar_1" });
    }

    // Call API to sync visitor profile
    fetch("/api/community/visitor")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsVerified(true);
          const currentVisitor = {
            visitor_id: data.visitorId,
            display_name: data.nickname,
            avatar_id: data.avatarId || "avatar_1",
          };
          setVisitor(currentVisitor);
          localStorage.setItem("travel_display_name", data.nickname);
          localStorage.setItem("travel_recovery_code", data.recoveryCode);
          localStorage.setItem("travel_avatar_id", data.avatarId || "avatar_1");
          localStorage.setItem("travel_visitor_id", data.visitorId);
        } else {
          setIsVerified(false);
          setVisitor(null);
        }
      })
      .catch((err) => console.error("Error fetching visitor:", err));

    // 2. Fetch existing impulses for this post
    fetchImpulses();

    // 3. Fetch reactions for this post
    fetchReactions();
  }, [postId]);

  const fetchImpulses = async () => {
    setLoadingImpulses(true);
    try {
      const res = await fetch(`/api/community/impulses?post_id=${postId}`);
      const data = await res.json();
      if (data.success) {
        setImpulses(data.impulses);
      }
    } catch (e) {
      console.error("Error loading impulses:", e);
    } finally {
      setLoadingImpulses(false);
    }
  };

  const fetchReactions = async () => {
    setLoadingReactions(true);
    try {
      const res = await fetch(`/api/posts/reactions?post_id=${postId}`);
      const data = await res.json();
      if (data.success) {
        setReactions(data.reactions);
        setUserReacted(data.userReacted);
        setReactors(data.reactors || {});
      }
    } catch (e) {
      console.error("Error loading reactions:", e);
    } finally {
      setLoadingReactions(false);
    }
  };

  const handleReact = async (type: string) => {
    if (!isVerified) {
      alert("Please verify your profile before reacting.");
      return;
    }

    // Optimistic UI update
    const alreadyReacted = userReacted[type];
    const currentVisitorName = visitor?.display_name || "Traveler";

    setUserReacted((prev) => ({ ...prev, [type]: !alreadyReacted }));
    setReactions((prev) => ({
      ...prev,
      [type]: (prev[type] || 0) + (alreadyReacted ? -1 : 1)
    }));
    setReactors((prev) => {
      const currentList = prev[type] || [];
      const updatedList = alreadyReacted
        ? currentList.filter((name) => name !== currentVisitorName)
        : [...currentList, currentVisitorName];
      return { ...prev, [type]: updatedList };
    });

    try {
      const res = await fetch("/api/posts/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: String(postId),
          reaction_type: type
        }),
      });

      const data = await res.json();
      if (data.success) {
        setReactions(data.reactions);
        setUserReacted(data.userReacted);
        setReactors(data.reactors || {});
      } else {
        // Rollback optimistic update
        setUserReacted((prev) => ({ ...prev, [type]: alreadyReacted }));
        setReactions((prev) => ({
          ...prev,
          [type]: (prev[type] || 0) + (alreadyReacted ? 1 : -1)
        }));
        setReactors((prev) => {
          const currentList = prev[type] || [];
          const updatedList = alreadyReacted
            ? [...currentList, currentVisitorName]
            : currentList.filter((name) => name !== currentVisitorName);
          return { ...prev, [type]: updatedList };
        });
        alert(data.message || "Failed to update reaction.");
      }
    } catch (err) {
      // Rollback optimistic update
      setUserReacted((prev) => ({ ...prev, [type]: alreadyReacted }));
      setReactions((prev) => ({
        ...prev,
        [type]: (prev[type] || 0) + (alreadyReacted ? 1 : -1)
      }));
      setReactors((prev) => {
        const currentList = prev[type] || [];
        const updatedList = alreadyReacted
          ? [...currentList, currentVisitorName]
          : currentList.filter((name) => name !== currentVisitorName);
        return { ...prev, [type]: updatedList };
      });
      alert("Connection error. Could not toggle reaction.");
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/community/impulses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: commentText.trim(),
          post_id: String(postId),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Failed to submit your impulse.");
      } else {
        setCommentText("");
        setImpulses((prev) => [data.impulse, ...prev]);
      }
    } catch (err) {
      setError("Connection error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get dynamic path for gates
  const gateRedirectUrl = typeof window !== "undefined" 
    ? `/gate?redirect=${encodeURIComponent(window.location.pathname + window.location.hash)}`
    : "/gate";

  return (
    <div className="mt-8 pt-4 border-t border-ink/5 flex flex-col gap-4 font-body">
      {/* Footer Bar */}
      <div className="flex items-center justify-between">
        {/* Left: Map Icon Link */}
        {hasCoords ? (
          <a
            href={`/map?trip=${tripId}&lines=true&post=${postId}`}
            className="text-dust hover:text-amber transition-all duration-300 flex items-center gap-1.5 text-2xs uppercase tracking-wider group font-semibold"
            title="Show on map"
          >
            <svg
              className="w-4 h-4 group-hover:scale-110 transition-transform duration-300"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-amber font-body">
              Show on Map
            </span>
          </a>
        ) : (
          <div />
        )}

        {/* Right: Emoji Reactions & Comments Trigger */}
        <div className="flex items-center gap-4">
          {/* Emojis list */}
          <div className="flex items-center gap-1 flex-wrap">
            {EMOJIS.filter((e) => (reactions[e.type] || 0) > 0 || userReacted[e.type]).map((react) => {
              const count = reactions[react.type] || 0;
              const active = userReacted[react.type];
              const reactList = reactors[react.type] || [];
              
              // Format reactor tooltip
              let tooltipText = "";
              if (reactList.length > 0) {
                if (reactList.length === 1) {
                  tooltipText = `Reacted by ${reactList[0]}`;
                } else if (reactList.length === 2) {
                  tooltipText = `${reactList[0]} and ${reactList[1]}`;
                } else if (reactList.length === 3) {
                  tooltipText = `${reactList[0]}, ${reactList[1]} and ${reactList[2]}`;
                } else {
                  tooltipText = `${reactList[0]}, ${reactList[1]} and ${reactList.length - 2} others`;
                }
              }

              return (
                <div key={react.type} className="relative group flex items-center">
                  <div className={`inline-flex items-center rounded-full border text-[10px] transition-all duration-200 select-none ${
                    active
                      ? "bg-amber/10 border-amber/30 text-amber"
                      : "bg-cream/10 border-ink/5 text-dust"
                  }`}>
                    {/* Emoji toggle trigger */}
                    <button
                      onClick={() => handleReact(react.type)}
                      className="pl-2 pr-1.5 py-0.5 rounded-l-full hover:bg-amber/5 transition-colors"
                      title={`React with ${react.type}`}
                    >
                      {react.char}
                    </button>
                    {/* Count trigger for details popup */}
                    {count > 0 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveReactorPopup(activeReactorPopup === react.type ? null : react.type);
                        }}
                        className={`pl-1.5 pr-2 py-0.5 border-l rounded-r-full hover:bg-amber/5 transition-colors font-semibold tabular-nums ${
                          active ? "border-amber/20" : "border-ink/5"
                        }`}
                        title="View who reacted"
                      >
                        {count}
                      </button>
                    )}
                  </div>

                  {/* Desktop Hover Tooltip */}
                  {reactList.length > 0 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden md:group-hover:block bg-ink text-cream text-[10px] py-1.5 px-2.5 rounded shadow-md whitespace-nowrap z-30 font-body">
                      {tooltipText}
                    </div>
                  )}

                  {/* Click Popover (Desktop & Mobile) */}
                  {activeReactorPopup === react.type && reactList.length > 0 && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setActiveReactorPopup(null)} />
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white border border-ink/10 rounded p-2.5 shadow-lg z-50 min-w-[120px] max-w-[200px] text-[10px] font-body text-ink animate-fade-in">
                        <div className="font-bold border-b border-ink/5 pb-1 mb-1 text-center uppercase tracking-wider text-dust text-[8px]">
                          Reacted by
                        </div>
                        <ul className="space-y-0.5 max-h-24 overflow-y-auto">
                          {reactList.map((name, idx) => (
                            <li key={idx} className="truncate text-center">{name}</li>
                          ))}
                        </ul>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            
            {/* Picker Trigger */}
            <div className="relative">
              <button
                onClick={() => setShowPicker(!showPicker)}
                className={`flex items-center justify-center w-6 h-6 rounded-full border border-ink/10 transition-all hover:bg-cream/50 text-dust hover:text-ink ${
                  showPicker ? "bg-cream/50 text-ink border-ink/30" : ""
                }`}
                title="Add reaction"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
              
              {/* Popover */}
              {showPicker && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowPicker(false)} />
                  <div className="absolute right-0 bottom-full mb-2 bg-white border border-ink/10 rounded-lg p-2.5 shadow-lg z-50 w-52 grid grid-cols-6 gap-0.5 animate-fade-in">
                    {EMOJIS.map((react) => {
                      const active = userReacted[react.type];
                      return (
                        <button
                          key={react.type}
                          onClick={() => {
                            handleReact(react.type);
                            setShowPicker(false);
                          }}
                          className={`flex items-center justify-center p-1 text-base rounded hover:bg-cream/60 transition-all hover:scale-125 select-none ${
                            active ? "bg-amber/15 scale-110" : ""
                          }`}
                          title={react.type}
                        >
                          {react.char}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Impulse Comment Trigger */}
          <button
            onClick={() => setShowCommentInput(!showCommentInput)}
            className={`text-2xs uppercase tracking-wider font-semibold px-3 py-1.5 rounded-full border transition-all duration-300 flex items-center gap-1.5 ${
              showCommentInput || impulses.length > 0
                ? "bg-ink border-ink text-white"
                : "bg-white border-ink/10 text-dust hover:text-ink hover:border-ink/30"
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Impulse{impulses.length > 0 ? ` (${impulses.length})` : ""}</span>
          </button>
        </div>
      </div>

      {/* Comments list and Input Field */}
      {showCommentInput && (
        <div className="bg-cream/25 rounded-md p-4 border border-ink/5 flex flex-col gap-3 animate-fade-in">
          {loadingImpulses ? (
            <div className="text-center py-4 text-xs text-dust">Loading impulses...</div>
          ) : impulses.length > 0 ? (
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
              {impulses.map((impulse) => (
                <div key={impulse.impulse_id} className="flex gap-2.5 items-start bg-white p-2.5 rounded border border-ink/5 text-xs animate-fade-in shadow-2xs">
                  <div className="w-6 h-6 rounded-full overflow-hidden shrink-0 bg-cream/30 flex items-center justify-center">
                    {renderAvatarSvg(impulse.visitor?.avatar_id || "avatar_1", "w-6 h-6")}
                  </div>
                  <div className="flex-1 flex flex-col gap-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-ink text-[10px]">
                        {impulse.visitor?.display_name || "Traveler"}
                      </span>
                      <span className="text-[9px] text-dust">
                        {new Date(impulse.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                    <p className="text-dust/90 leading-relaxed font-body whitespace-pre-wrap">{impulse.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-2 text-xs text-dust/60">No impulses shared yet. Be the first!</div>
          )}

          {isVerified ? (
            <form onSubmit={handleAddComment} className="flex flex-col gap-2 mt-1">
              {error && <div className="text-xs text-red-500 font-medium">{error}</div>}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Share an impulse..."
                  disabled={submitting}
                  className="flex-1 bg-white border border-ink/10 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-amber focus:ring-1 focus:ring-amber/30 text-ink placeholder-dust/50"
                />
                <button
                  type="submit"
                  disabled={submitting || !commentText.trim()}
                  className="bg-amber hover:bg-amber-dark text-white text-xs font-semibold px-4 py-1.5 rounded transition-colors disabled:opacity-50"
                >
                  {submitting ? "Sending..." : "Send"}
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-3 bg-white/50 border border-dashed border-ink/10 rounded-sm mt-1">
              <p className="text-xs text-dust mb-2">To share an impulse, please verify your profile first.</p>
              <a
                href={gateRedirectUrl}
                className="inline-flex items-center gap-1.5 py-1 px-3 bg-ink text-cream hover:bg-amber hover:text-white font-body text-3xs font-bold uppercase tracking-wider transition-all duration-300 rounded-sm shadow-sm"
              >
                Verify Profile
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
