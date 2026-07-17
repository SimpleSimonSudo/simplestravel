"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { AVATARS, renderAvatarSvg } from "@/lib/avatars";

interface Country {
  country_id: number;
  name: string;
  iso_code: string | null;
}

interface Post {
  post_id: string;
  title: string | null;
  post_date: string;
  country_id: number | null;
  trip_id: number | null;
}

interface Trip {
  trip_id: number;
  trip_name: string;
}

interface Board {
  board_id: string;
  name: string;
  description: string | null;
  created_by: string | null;
}

interface Visitor {
  visitor_id: string;
  display_name: string;
  avatar_id?: string;
}

interface Impulse {
  impulse_id: string;
  board_id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  visitor: Visitor;
  post: {
    post_id: string;
    title: string | null;
    post_date?: string;
    actual_date?: string | null;
    city?: string | null;
    summary?: string | null;
    thumbnail_url?: string | null;
  } | null;
  country: { country_id: number; name: string; iso_code: string | null } | null;
  reply_count: number;
  reactions: Record<string, number>;
  user_reactions: string[];
  reactors: Record<string, string[]>;
}

interface Reply {
  reply_id: string;
  impulse_id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  visitor: Visitor;
}

interface CommunityClientProps {
  initialBoards: Board[];
  countries: Country[];
  posts: Post[];
  trips: Trip[];
}

export default function CommunityClient({ initialBoards, countries, posts, trips }: CommunityClientProps) {
  const [mounted, setMounted] = useState(false);
  const publisherRef = useRef<HTMLDivElement>(null);

  // Verification & Profile States
  const [isVerified, setIsVerified] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [visitorId, setVisitorId] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [avatarId, setAvatarId] = useState("avatar_1");
  const [openSettings, setOpenSettings] = useState(false);

  // Edit & Delete States
  const [editingImpulseId, setEditingImpulseId] = useState<string | null>(null);
  const [editingImpulseText, setEditingImpulseText] = useState("");
  const [deletingImpulseId, setDeletingImpulseId] = useState<string | null>(null);

  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);
  const [editingReplyText, setEditingReplyText] = useState("");
  const [deletingReplyId, setDeletingReplyId] = useState<string | null>(null);

  // Boards States
  const [boards, setBoards] = useState<Board[]>(initialBoards);
  const [activeBoard, setActiveBoard] = useState<Board | null>(
    initialBoards.length > 0 ? initialBoards[0] : null
  );
  const [openCreateBoardModal, setOpenCreateBoardModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [newBoardDesc, setNewBoardDesc] = useState("");
  const [creatingBoard, setCreatingBoard] = useState(false);
  const [boardError, setBoardError] = useState<string | null>(null);

  // Impulses Feed States
  const [impulses, setImpulses] = useState<Impulse[]>([]);
  const [loadingImpulses, setLoadingImpulses] = useState(true);

  // Impulse Form States
  const [isPublisherExpanded, setIsPublisherExpanded] = useState(false);
  const [impulseText, setImpulseText] = useState("");
  const [selectedCountryId, setSelectedCountryId] = useState("");
  const [selectedTripFilterId, setSelectedTripFilterId] = useState("");
  const [selectedPostId, setSelectedPostId] = useState("");
  const [submittingImpulse, setSubmittingImpulse] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reply Thread States
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [activePickerImpulseId, setActivePickerImpulseId] = useState<string | null>(null);
  const [activeReactorPopup, setActiveReactorPopup] = useState<{ impulseId: string; type: string } | null>(null);

  // 1. Initial Load & Setup
  useEffect(() => {
    setMounted(true);

    const storedName = localStorage.getItem("travel_display_name");
    const storedCode = localStorage.getItem("travel_recovery_code");
    const storedAvatar = localStorage.getItem("travel_avatar_id");
    const storedVisitorId = localStorage.getItem("travel_visitor_id");

    if (storedName) {
      setIsVerified(true);
      setDisplayName(storedName);
      setRecoveryCode(storedCode || "");
      if (storedAvatar) {
        setAvatarId(storedAvatar);
      }
      if (storedVisitorId) {
        setVisitorId(storedVisitorId);
      }
    }

    // Fetch latest visitor details dynamically from backend
    fetch("/api/community/visitor")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setIsVerified(true);
          setDisplayName(data.nickname);
          setRecoveryCode(data.recoveryCode);
          setAvatarId(data.avatarId || "avatar_1");
          setVisitorId(data.visitorId || "");
          localStorage.setItem("travel_display_name", data.nickname);
          localStorage.setItem("travel_recovery_code", data.recoveryCode);
          localStorage.setItem("travel_avatar_id", data.avatarId || "avatar_1");
          if (data.visitorId) {
            localStorage.setItem("travel_visitor_id", data.visitorId);
          }
        }
      })
      .catch((err) => console.error("Error fetching visitor profile:", err));
  }, []);

  // 2. Fetch Impulses when active board changes
  useEffect(() => {
    if (activeBoard) {
      fetchImpulses(activeBoard.board_id);
    }
  }, [activeBoard]);

  // 3. Click outside listener to collapse the impulse publisher
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (publisherRef.current && !publisherRef.current.contains(event.target as Node)) {
        // Only collapse if textarea is empty, to prevent user from losing unsaved text accidentally
        if (!impulseText.trim()) {
          setIsPublisherExpanded(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [impulseText]);

  const fetchImpulses = async (boardId: string) => {
    setLoadingImpulses(true);
    try {
      const res = await fetch(`/api/community/impulses?board_id=${boardId}`);
      const data = await res.json();
      if (data.success) {
        setImpulses(data.impulses);
      }
    } catch (e) {
      console.error("Error fetching impulses:", e);
    } finally {
      setLoadingImpulses(false);
    }
  };

  const fetchReplies = async (impulseId: string) => {
    setLoadingReplies((prev) => ({ ...prev, [impulseId]: true }));
    try {
      const res = await fetch(`/api/community/replies?impulse_id=${impulseId}`);
      const data = await res.json();
      if (data.success) {
        setReplies((prev) => ({ ...prev, [impulseId]: data.replies }));
      }
    } catch (e) {
      console.error("Error fetching replies:", e);
    } finally {
      setLoadingReplies((prev) => ({ ...prev, [impulseId]: false }));
    }
  };

  const handlePostImpulse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!impulseText.trim() || !activeBoard) return;

    setSubmittingImpulse(true);
    setFormError(null);

    try {
      const res = await fetch("/api/community/impulses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: impulseText,
          board_id: activeBoard.board_id,
          post_id: selectedPostId || null,
          country_id: selectedCountryId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.message || "Failed to post impulse.");
      } else {
        setImpulseText("");
        setSelectedCountryId("");
        setSelectedTripFilterId("");
        setSelectedPostId("");
        setIsPublisherExpanded(false);
        // Prepend the new impulse
        setImpulses((prev) => [data.impulse, ...prev]);
      }
    } catch (err) {
      setFormError("Connection error. Please try again.");
    } finally {
      setSubmittingImpulse(false);
    }
  };

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    setCreatingBoard(true);
    setBoardError(null);

    try {
      const res = await fetch("/api/community/boards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newBoardName.trim(),
          description: newBoardDesc.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setBoardError(data.message || "Failed to create board.");
      } else {
        const createdBoard = data.board;
        setBoards((prev) => [...prev, createdBoard]);
        setNewBoardName("");
        setNewBoardDesc("");
        setOpenCreateBoardModal(false);
        // Select the newly created board
        setActiveBoard(createdBoard);
      }
    } catch (err) {
      setBoardError("Connection error. Please try again.");
    } finally {
      setCreatingBoard(false);
    }
  };

  const handlePostReply = async (e: React.FormEvent, impulseId: string) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    setSubmittingReply(true);

    try {
      const res = await fetch("/api/community/replies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: replyText,
          impulse_id: impulseId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to save reply.");
      } else {
        setReplyText("");
        setReplies((prev) => ({
          ...prev,
          [impulseId]: [...(prev[impulseId] || []), data.reply],
        }));
        setImpulses((prev) =>
          prev.map((item) =>
            item.impulse_id === impulseId
              ? { ...item, reply_count: item.reply_count + 1 }
              : item
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleReact = async (impulseId: string, type: string) => {
    if (!isVerified) {
      alert("Please verify your profile before reacting.");
      return;
    }

    try {
      const res = await fetch("/api/community/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          impulse_id: impulseId,
          reaction_type: type,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Failed to toggle reaction.");
      } else {
        const reacted = data.reacted;
        setImpulses((prev) =>
          prev.map((item) => {
            if (item.impulse_id === impulseId) {
              const nextReactions = { ...item.reactions };
              let nextUserReactions = [...item.user_reactions];
              const nextReactors = { ...item.reactors };

              if (reacted) {
                nextReactions[type] = (nextReactions[type] || 0) + 1;
                nextUserReactions.push(type);
                if (nextReactors[type]) {
                  if (!nextReactors[type].includes(displayName)) {
                    nextReactors[type] = [...nextReactors[type], displayName];
                  }
                } else {
                  nextReactors[type] = [displayName];
                }
              } else {
                nextReactions[type] = Math.max(0, (nextReactions[type] || 1) - 1);
                nextUserReactions = nextUserReactions.filter((r) => r !== type);
                if (nextReactors[type]) {
                  nextReactors[type] = nextReactors[type].filter((name) => name !== displayName);
                }
              }
              return {
                ...item,
                reactions: nextReactions,
                user_reactions: nextUserReactions,
                reactors: nextReactors,
              };
            }
            return item;
          })
        );
      }
    } catch (err) {
      console.error("Error toggling reaction:", err);
    }
  };

  const toggleReplyDrawer = (impulseId: string) => {
    if (activeReplyId === impulseId) {
      setActiveReplyId(null);
    } else {
      setActiveReplyId(impulseId);
      setReplyText("");
      if (!replies[impulseId]) {
        fetchReplies(impulseId);
      }
    }
  };

  const getAvatarStyle = (name: string) => {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return {
      backgroundColor: `hsl(${h}, 45%, 42%)`,
      color: "#ffffff",
    };
  };

  const handleUpdateAvatar = async (id: string) => {
    try {
      const res = await fetch("/api/community/visitor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarId: id }),
      });
      const data = await res.json();
      if (data.success) {
        setAvatarId(id);
        localStorage.setItem("travel_avatar_id", id);
      } else {
        alert(data.message || "Failed to update avatar.");
      }
    } catch (err) {
      console.error("Error updating avatar:", err);
    }
  };

  const handleEditImpulse = async (impulseId: string) => {
    const trimmed = editingImpulseText.trim();
    if (trimmed.length < 3 || trimmed.length > 3000) {
      alert("Impulse text must be between 3 and 3000 characters.");
      return;
    }
    try {
      const res = await fetch("/api/community/impulses", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ impulse_id: impulseId, content: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        setImpulses((prev) =>
          prev.map((imp) =>
            imp.impulse_id === impulseId
              ? { ...imp, content: data.content, updated_at: data.updated_at }
              : imp
          )
        );
        setEditingImpulseId(null);
        setEditingImpulseText("");
      } else {
        alert(data.message || "Failed to update impulse.");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error.");
    }
  };

  const handleDeleteImpulse = async (impulseId: string) => {
    try {
      const res = await fetch(`/api/community/impulses?impulse_id=${impulseId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setImpulses((prev) => prev.filter((imp) => imp.impulse_id !== impulseId));
        setDeletingImpulseId(null);
      } else {
        alert(data.message || "Failed to delete impulse.");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error.");
    }
  };

  const handleEditReply = async (replyId: string, impulseId: string) => {
    const trimmed = editingReplyText.trim();
    if (trimmed.length < 1 || trimmed.length > 200) {
      alert("Reply text must be between 1 and 200 characters.");
      return;
    }
    try {
      const res = await fetch("/api/community/replies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply_id: replyId, content: trimmed }),
      });
      const data = await res.json();
      if (data.success) {
        setReplies((prev) => {
          const list = prev[impulseId] || [];
          return {
            ...prev,
            [impulseId]: list.map((rep) =>
              rep.reply_id === replyId
                ? { ...rep, content: data.content, updated_at: data.updated_at }
                : rep
            ),
          };
        });
        setEditingReplyId(null);
        setEditingReplyText("");
      } else {
        alert(data.message || "Failed to update comment.");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error.");
    }
  };

  const handleDeleteReply = async (replyId: string, impulseId: string) => {
    try {
      const res = await fetch(`/api/community/replies?reply_id=${replyId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        setReplies((prev) => {
          const list = prev[impulseId] || [];
          return {
            ...prev,
            [impulseId]: list.filter((rep) => rep.reply_id !== replyId),
          };
        });
        setImpulses((prev) =>
          prev.map((imp) =>
            imp.impulse_id === impulseId
              ? { ...imp, reply_count: Math.max(0, imp.reply_count - 1) }
              : imp
          )
        );
        setDeletingReplyId(null);
      } else {
        alert(data.message || "Failed to delete comment.");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error.");
    }
  };

  const getInitials = (name: string) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const formatTimeAgo = (dateString: string) => {
    if (!mounted) return dateString.split("T")[0];
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);

    if (diffSec < 60) return "just now";
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const filteredPostsForTag = posts.filter((p) => {
    if (selectedCountryId && p.country_id !== Number(selectedCountryId)) {
      return false;
    }
    if (selectedTripFilterId && p.trip_id !== Number(selectedTripFilterId)) {
      return false;
    }
    return true;
  });

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 animate-fade-up">
      {/* Top Header Row with Title and Floating Settings Avatar */}
      <div className="flex items-center justify-between border-b border-ink/10 pb-6 mb-10">
        <div>
          <span className="overline text-2xs block">Wanderlust Hub</span>
          <h1 className="font-display font-bold text-3xl text-ink md:text-4xl">Community Board</h1>
        </div>

        {/* Floating User Profile Dropdown */}
        <div className="relative">
          {!isVerified ? (
            <a
              href="/gate"
              className="inline-flex items-center gap-2 py-2 px-4 bg-ink text-cream hover:bg-amber hover:text-white font-body text-3xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg shadow-sm"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              Verify Profile
            </a>
          ) : (
            <div>
              <button
                onClick={() => setOpenSettings(!openSettings)}
                className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center select-none shadow-md border-2 border-white hover:border-amber/50 transition-all duration-300 cursor-pointer bg-cream/10"
              >
                {renderAvatarSvg(avatarId, "w-10 h-10")}
              </button>

              {/* Profile Dropdown Dialog */}
              {openSettings && (
                <>
                  {/* Backdrop clicking dismisses Settings */}
                  <div
                    className="fixed inset-0 z-40 bg-transparent"
                    onClick={() => setOpenSettings(false)}
                  ></div>

                  <div className="absolute right-0 mt-3 w-64 bg-white border border-ink/10 shadow-lg p-5 rounded-xl z-50 animate-fade-in text-left">
                    <span className="text-3xs uppercase tracking-widest text-dust font-body block mb-1">
                      Logged in as
                    </span>
                    <h4 className="font-display font-bold text-base text-ink mb-4 pb-2 border-b border-ink/5">
                      {displayName}
                    </h4>

                    <div className="space-y-4 font-body text-xs text-dust">
                      {/* Avatar Selection Grid */}
                      <div>
                        <span className="block text-3xs uppercase font-semibold text-ink/60 mb-2">
                          Choose Avatar
                        </span>
                        <div className="grid grid-cols-5 gap-2">
                          {AVATARS.map((av) => {
                            const isSelected = avatarId === av.id;
                            return (
                              <button
                                key={av.id}
                                onClick={() => handleUpdateAvatar(av.id)}
                                className={`p-1 rounded-full border-2 transition-all hover:scale-105 ${
                                  isSelected
                                    ? "border-amber bg-cream/35 scale-105"
                                    : "border-transparent hover:border-dust/40"
                                }`}
                                title={av.name}
                              >
                                {renderAvatarSvg(av.id, "w-8 h-8")}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div>
                        <span className="block text-3xs uppercase font-semibold text-ink/60">
                          Backup Recovery Code
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="font-mono bg-cream/30 px-2 py-1 border border-ink/5 rounded-md font-semibold tracking-wider text-ink select-all">
                            {recoveryCode}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(recoveryCode);
                              alert("Backup code copied to clipboard!");
                            }}
                            className="p-1 text-dust hover:text-amber transition-colors"
                            title="Copy Code"
                          >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                          </button>
                        </div>
                      </div>

                      <p className="text-[10px] text-dust/70 leading-normal">
                        Keep this code safe! You can use it at the Gate in other browsers to sync your nickname.
                      </p>

                      <div className="pt-2 border-t border-ink/5 flex items-center justify-between gap-4">
                        <button
                          onClick={() => setOpenSettings(false)}
                          className="text-3xs uppercase font-bold tracking-wider text-dust hover:text-ink transition-colors font-body"
                        >
                          Close settings
                        </button>
                        <button
                          onClick={() => {
                            localStorage.clear();
                            window.location.reload();
                          }}
                          className="py-1 px-3 text-red-600 hover:text-red-800 hover:bg-red-50 text-3xs uppercase font-bold tracking-wider font-body border border-red-100 transition-colors rounded-lg"
                        >
                          Logout
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Sidebar with Boards List Navigation */}
        <div className="md:col-span-3 space-y-4">
          <div className="bg-white border border-ink/5 p-4 rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-ink/5">
              <span className="font-display font-semibold text-sm text-ink uppercase tracking-wide">
                Channels
              </span>
              <button
                onClick={() => {
                  if (!isVerified) {
                    alert("Please verify your profile first to create a board.");
                    return;
                  }
                  setOpenCreateBoardModal(true);
                }}
                className="w-5 h-5 flex items-center justify-center bg-cream/50 text-dust hover:bg-amber hover:text-white rounded-full transition-all text-xs font-bold"
                title="Create Board"
              >
                +
              </button>
            </div>

            <div className="space-y-1">
              {boards.map((b) => {
                const isActive = activeBoard?.board_id === b.board_id;
                return (
                  <button
                    key={b.board_id}
                    onClick={() => {
                      setActiveBoard(b);
                      setIsPublisherExpanded(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-body transition-all flex items-center justify-between ${
                      isActive
                        ? "bg-ink text-cream font-semibold shadow-xs"
                        : "text-dust hover:bg-cream/40 hover:text-ink"
                    }`}
                  >
                    <span className="truncate"># {b.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {activeBoard?.description && (
            <div className="p-3 bg-cream/10 border border-ink/5 text-3xs text-dust/70 leading-relaxed font-body rounded-lg italic">
              {activeBoard.description}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Motivating dynamic publisher and Impulses feed */}
        <div className="md:col-span-9 space-y-6">
          
          {/* DYNAMIC AUTO-COLLAPSING PUBLISHER BOX */}
          {isVerified && activeBoard && (
            <div
              ref={publisherRef}
              className="bg-white border border-ink/5 rounded-xl shadow-sm transition-all duration-300"
              style={{
                borderColor: isPublisherExpanded ? "var(--color-amber)" : "rgba(0, 0, 0, 0.05)",
                boxShadow: isPublisherExpanded ? "0 4px 12px rgba(200, 134, 58, 0.08)" : "0 1px 3px rgba(0, 0, 0, 0.02)",
              }}
            >
              {!isPublisherExpanded ? (
                /* Collapsed state */
                <button
                  onClick={() => setIsPublisherExpanded(true)}
                  className="w-full text-left px-5 py-4 text-xs font-body text-dust/60 hover:text-ink transition-colors flex items-center gap-2.5 cursor-text select-none"
                >
                  <span>Share an impulse on #{activeBoard.name}...</span>
                </button>
              ) : (
                /* Expanded state */
                <form onSubmit={handlePostImpulse} className="p-5 space-y-4 animate-fade-in">
                  {formError && (
                    <div className="p-2.5 bg-red-50 border-l-2 border-red-500 text-3xs text-red-700 font-body">
                      {formError}
                    </div>
                  )}

                  <div className="space-y-1">
                    <textarea
                      value={impulseText}
                      onChange={(e) => setImpulseText(e.target.value.slice(0, 3000))}
                      placeholder={`Post a new reflection in #${activeBoard.name}...`}
                      rows={5}
                      autoFocus
                      disabled={submittingImpulse}
                      className="w-full px-0 py-1 bg-transparent border-0 rounded-none text-sm font-body text-ink focus:outline-none focus:ring-0 resize-none placeholder:text-dust/40"
                    />
                    <div className="flex justify-end text-3xs text-dust/50">
                      {impulseText.length}/3000
                    </div>
                  </div>

                  {/* Dynamic Fields Section (Fade in inside expanded publisher) */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-ink/5">
                    {/* Country Tag */}
                    <div className="space-y-1">
                      <label htmlFor="countryTag" className="block text-[10px] uppercase font-bold tracking-wider text-dust/70 font-body">
                        Tag a Country (Optional)
                      </label>
                      <select
                        id="countryTag"
                        value={selectedCountryId}
                        onChange={(e) => setSelectedCountryId(e.target.value)}
                        disabled={submittingImpulse}
                        className="w-full bg-white border border-ink/10 rounded-lg px-2 py-1.5 text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors cursor-pointer"
                      >
                        <option value="">-- No Country --</option>
                        {countries.map((c) => (
                          <option key={c.country_id} value={c.country_id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Trip Filter */}
                    <div className="space-y-1">
                      <label htmlFor="tripFilter" className="block text-[10px] uppercase font-bold tracking-wider text-dust/70 font-body">
                        Filter by Trip (Optional)
                      </label>
                      <select
                        id="tripFilter"
                        value={selectedTripFilterId}
                        onChange={(e) => setSelectedTripFilterId(e.target.value)}
                        disabled={submittingImpulse}
                        className="w-full bg-white border border-ink/10 rounded-lg px-2 py-1.5 text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors cursor-pointer"
                      >
                        <option value="">-- No Trip Filter --</option>
                        {trips.map((t) => (
                          <option key={t.trip_id} value={t.trip_id}>
                            {t.trip_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Post Tag */}
                    <div className="space-y-1">
                      <label htmlFor="postTag" className="block text-[10px] uppercase font-bold tracking-wider text-dust/70 font-body">
                        Link to a Blog Post (Optional)
                      </label>
                      <select
                        id="postTag"
                        value={selectedPostId}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedPostId(val);
                          if (val) {
                            const post = posts.find((p) => p.post_id === val);
                            if (post) {
                              if (post.country_id) {
                                setSelectedCountryId(String(post.country_id));
                              }
                              if (post.trip_id) {
                                setSelectedTripFilterId(String(post.trip_id));
                              }
                            }
                          }
                        }}
                        disabled={submittingImpulse}
                        className="w-full bg-white border border-ink/10 rounded-lg px-2 py-1.5 text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors cursor-pointer"
                      >
                        <option value="">-- No Post Link --</option>
                        {filteredPostsForTag.map((p) => (
                          <option key={p.post_id} value={p.post_id}>
                            {p.title || `Journal Entry #${p.post_id}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Submission Row */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setImpulseText("");
                        setSelectedCountryId("");
                        setSelectedTripFilterId("");
                        setSelectedPostId("");
                        setIsPublisherExpanded(false);
                      }}
                      className="text-3xs uppercase font-bold tracking-wider text-dust hover:text-ink transition-colors font-body"
                    >
                      Cancel
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={submittingImpulse || !impulseText.trim()}
                        className="py-2 px-5 bg-ink text-cream hover:bg-amber hover:text-white disabled:bg-dust/20 disabled:text-cream/50 font-body text-2xs font-bold uppercase tracking-wider transition-all duration-300 rounded-lg shadow-sm"
                      >
                        {submittingImpulse ? "Sharing..." : "Post Impulse"}
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* IMPULSES FEED */}
          {loadingImpulses ? (
            /* Skeleton Loading */
            <div className="space-y-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white border border-ink/5 p-6 rounded-xl shadow-md animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cream/40 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-3.5 bg-cream/40 w-32 rounded-md"></div>
                      <div className="h-2 bg-cream/40 w-16 rounded-md"></div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="h-3 bg-cream/40 w-full rounded-md"></div>
                    <div className="h-3 bg-cream/40 w-5/6 rounded-md"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : impulses.length === 0 ? (
            <div className="bg-white border border-ink/5 py-16 px-6 text-center rounded-xl shadow-xs">
              <div className="w-12 h-12 bg-cream/35 text-dust flex items-center justify-center rounded-full mx-auto mb-4 border border-ink/5">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
              </div>
              <h3 className="font-display font-semibold text-lg text-ink mb-1">No Impulses Here</h3>
              <p className="text-xs text-dust font-body max-w-xs mx-auto">
                No impulses have been posted to this channel yet. Make the first step!
              </p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {impulses.map((impulse) => (
                <div
                  key={impulse.impulse_id}
                  className="bg-white border border-ink/5 p-6 rounded-xl shadow-md hover:shadow-lg hover:border-amber/10 transition-all duration-300"
                >
                  {/* Header info */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center select-none shadow-sm bg-cream/10">
                        {renderAvatarSvg(impulse.visitor.avatar_id || "avatar_1", "w-10 h-10")}
                      </div>
                      <div>
                        <span className="font-body text-sm font-bold text-ink block animate-fade-in">
                          {impulse.visitor.display_name}
                        </span>
                        <span className="text-3xs text-dust/70 block flex items-center gap-1.5 mt-0.5 select-none">
                          {formatTimeAgo(impulse.created_at)}
                          {impulse.updated_at && <span className="italic text-dust/40">(edited)</span>}
                          {isVerified && impulse.visitor.visitor_id === visitorId && (
                            <>
                              <span className="text-dust/30 select-none">·</span>
                              <button
                                onClick={() => {
                                  setEditingImpulseId(impulse.impulse_id);
                                  setEditingImpulseText(impulse.content);
                                }}
                                className="text-dust hover:text-amber transition-colors cursor-pointer font-semibold text-[9px]"
                              >
                                Edit
                              </button>
                              <span className="text-dust/30 select-none">·</span>
                              {deletingImpulseId === impulse.impulse_id ? (
                                <span className="inline-flex items-center gap-1 text-[9px]">
                                  <span className="text-red-500 font-semibold">Sure?</span>
                                  <button
                                    onClick={() => handleDeleteImpulse(impulse.impulse_id)}
                                    className="text-red-600 hover:text-red-800 transition-colors font-bold px-0.5"
                                  >
                                    Yes
                                  </button>
                                  <span className="text-dust/40">/</span>
                                  <button
                                    onClick={() => setDeletingImpulseId(null)}
                                    className="text-dust hover:text-ink transition-colors font-bold px-0.5"
                                  >
                                    No
                                  </button>
                                </span>
                              ) : (
                                <button
                                  onClick={() => setDeletingImpulseId(impulse.impulse_id)}
                                  className="text-dust hover:text-red-500 transition-colors cursor-pointer font-semibold text-[9px]"
                                >
                                  Delete
                                </button>
                              )}
                            </>
                          )}
                        </span>
                      </div>
                    </div>

                    {/* Metadata tags */}
                    <div className="flex flex-wrap gap-2 items-center justify-end">
                      {impulse.country && (
                        <a
                          href={`/countries/${impulse.country.iso_code?.toLowerCase()}`}
                          className="tag flex items-center gap-1 hover:bg-amber/10 hover:text-amber transition-colors font-body text-[9px] tracking-normal"
                        >
                          🌍 {impulse.country.name}
                        </a>
                      )}
                      {impulse.post && (
                        <div className="relative group/post">
                          <a
                            href={`/post/${impulse.post.post_id}`}
                            className="flex items-center gap-1 px-2.5 py-0.5 bg-amber/10 hover:bg-amber text-amber hover:text-white rounded-full transition-all duration-300 font-body text-[9px] font-semibold tracking-wider uppercase border border-amber/20 shrink-0"
                          >
                            <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            <span>Linked Entry</span>
                          </a>

                          {/* Post Hover Card Preview */}
                          <div className="absolute right-0 top-full mt-2 hidden group-hover/post:block bg-white border border-ink/10 rounded-xl shadow-xl z-50 min-w-[260px] max-w-[300px] overflow-hidden text-ink animate-fade-in pointer-events-none">
                            {impulse.post.thumbnail_url && (
                              <div className="relative w-full h-32 bg-cream/10">
                                <img
                                  src={impulse.post.thumbnail_url}
                                  alt={impulse.post.title || "Preview"}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="p-4 text-left">
                              <div className="flex items-center gap-1.5 mb-1.5 text-[9px] text-dust font-bold uppercase tracking-wider font-body">
                                {impulse.post.actual_date || impulse.post.post_date ? (
                                  <span>
                                    {new Date((impulse.post.actual_date || impulse.post.post_date)!).toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric"
                                    })}
                                  </span>
                                ) : null}
                                {impulse.post.city && (
                                  <>
                                    <span>·</span>
                                    <span>{impulse.post.city}</span>
                                  </>
                                )}
                              </div>
                              <h4 className="font-display font-bold text-xs text-ink mb-2 leading-snug line-clamp-2">
                                {impulse.post.title || "Diary Entry"}
                              </h4>
                              {impulse.post.summary && (
                                <p className="text-dust line-clamp-2 leading-relaxed text-[10px] font-light bg-cream/10 p-2 border-l-2 border-amber/40 rounded-r-md">
                                  {impulse.post.summary}
                                </p>
                              )}
                              <div className="mt-3 text-right text-[9px] uppercase font-bold text-amber tracking-wide">
                                Read Post &rarr;
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content body */}
                  {editingImpulseId === impulse.impulse_id ? (
                    <div className="mt-4 space-y-2">
                      <textarea
                         value={editingImpulseText}
                         onChange={(e) => setEditingImpulseText(e.target.value.slice(0, 3000))}
                         rows={4}
                         className="w-full p-2 border border-ink/10 rounded-lg text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors resize-none bg-paper"
                      />
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-dust/50 font-body">
                          {editingImpulseText.length}/3000
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setEditingImpulseId(null);
                              setEditingImpulseText("");
                            }}
                            className="text-3xs uppercase font-bold tracking-wider text-dust hover:text-ink transition-colors font-body py-1 px-3"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleEditImpulse(impulse.impulse_id)}
                            disabled={!editingImpulseText.trim()}
                            className="py-1 px-4 bg-ink text-cream hover:bg-amber hover:text-white disabled:bg-dust/20 disabled:text-cream/50 font-body text-3xs font-bold uppercase tracking-wider transition-colors rounded-lg shadow-sm"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-ink leading-relaxed font-body mt-4 whitespace-pre-wrap">
                      {impulse.content}
                    </p>
                  )}

                  {/* Actions & Reactions */}
                  <div className="mt-6 pt-4 border-t border-ink/5 flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { type: "heart", icon: "❤️" },
                        { type: "sparkles", icon: "✨" },
                        { type: "globe", icon: "🌍" },
                        { type: "funny", icon: "😂" },
                        { type: "applause", icon: "👏" },
                        { type: "rocket", icon: "🚀" },
                        { type: "camera", icon: "📸" },
                        { type: "like", icon: "👍" },
                        { type: "wow", icon: "😮" },
                        { type: "travel", icon: "🌴" },
                        { type: "party", icon: "🎉" },
                        { type: "fire", icon: "🔥" },
                        { type: "sun", icon: "☀️" },
                        { type: "sad", icon: "😢" },
                        { type: "angry", icon: "😠" },
                        { type: "hug", icon: "🤗" },
                        { type: "dislike", icon: "👎" },
                        { type: "silly", icon: "🤪" },
                        { type: "greenheart", icon: "💚" },
                        { type: "peace", icon: "☮️" },
                        { type: "strong", icon: "💪" },
                        { type: "hearteyes", icon: "😍" },
                      ].filter((react) => (impulse.reactions[react.type] || 0) > 0 || impulse.user_reactions.includes(react.type)).map((react) => {
                        const count = impulse.reactions[react.type] || 0;
                        const hasReacted = impulse.user_reactions.includes(react.type);
                        const reactList = impulse.reactors?.[react.type] || [];
                        
                        // Format tooltip text
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

                        const isPopupOpen = activeReactorPopup?.impulseId === impulse.impulse_id && activeReactorPopup?.type === react.type;

                        return (
                          <div key={react.type} className="relative group flex items-center">
                            <div className={`inline-flex items-center rounded-full border text-[10px] font-body transition-all duration-200 select-none ${
                              hasReacted
                                ? "bg-amber/10 border-amber/30 text-amber"
                                : "bg-cream/10 border-ink/5 text-dust"
                            }`}>
                              {/* Emoji toggle trigger */}
                              <button
                                onClick={() => handleReact(impulse.impulse_id, react.type)}
                                className="pl-2 pr-1.5 py-0.5 rounded-l-full hover:bg-amber/5 transition-colors"
                                title={`React with ${react.type}`}
                              >
                                {react.icon}
                              </button>
                              {/* Count trigger for details popup */}
                              {count > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveReactorPopup(
                                      isPopupOpen ? null : { impulseId: impulse.impulse_id, type: react.type }
                                    );
                                  }}
                                  className={`pl-1.5 pr-2 py-0.5 border-l rounded-r-full hover:bg-amber/5 transition-colors font-semibold tabular-nums ${
                                    hasReacted ? "border-amber/20" : "border-ink/5"
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
                            {isPopupOpen && reactList.length > 0 && (
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
                          onClick={() => setActivePickerImpulseId(activePickerImpulseId === impulse.impulse_id ? null : impulse.impulse_id)}
                          className={`flex items-center justify-center w-6 h-6 rounded-full border border-ink/10 transition-all hover:bg-cream/50 text-dust hover:text-ink ${
                            activePickerImpulseId === impulse.impulse_id ? "bg-cream/50 text-ink border-ink/30" : ""
                          }`}
                          title="Add reaction"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                          </svg>
                        </button>
                        
                        {/* Popover */}
                        {activePickerImpulseId === impulse.impulse_id && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setActivePickerImpulseId(null)} />
                            <div className="absolute left-0 bottom-full mb-2 bg-white border border-ink/10 rounded-lg p-2.5 shadow-lg z-50 w-52 grid grid-cols-6 gap-0.5 animate-fade-in">
                              {[
                                { type: "heart", icon: "❤️" },
                                { type: "sparkles", icon: "✨" },
                                { type: "globe", icon: "🌍" },
                                { type: "funny", icon: "😂" },
                                { type: "applause", icon: "👏" },
                                { type: "rocket", icon: "🚀" },
                                { type: "camera", icon: "📸" },
                                { type: "like", icon: "👍" },
                                { type: "wow", icon: "😮" },
                                { type: "travel", icon: "🌴" },
                                { type: "party", icon: "🎉" },
                                { type: "fire", icon: "🔥" },
                                { type: "sun", icon: "☀️" },
                                { type: "sad", icon: "😢" },
                                { type: "angry", icon: "😠" },
                                { type: "hug", icon: "🤗" },
                                { type: "dislike", icon: "👎" },
                                { type: "silly", icon: "🤪" },
                                { type: "greenheart", icon: "💚" },
                                { type: "peace", icon: "☮️" },
                                { type: "strong", icon: "💪" },
                                { type: "hearteyes", icon: "😍" },
                              ].map((react) => {
                                const hasReacted = impulse.user_reactions.includes(react.type);
                                return (
                                  <button
                                    key={react.type}
                                    onClick={() => {
                                      handleReact(impulse.impulse_id, react.type);
                                      setActivePickerImpulseId(null);
                                    }}
                                    className={`flex items-center justify-center p-1 text-base rounded hover:bg-cream/60 transition-all hover:scale-125 select-none ${
                                      hasReacted ? "bg-amber/15 scale-110" : ""
                                    }`}
                                    title={react.type}
                                  >
                                    {react.icon}
                                  </button>
                                );
                              })}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleReplyDrawer(impulse.impulse_id)}
                      className={`font-body text-2xs font-semibold px-3 py-1.5 rounded-full border transition-all ${
                        activeReplyId === impulse.impulse_id
                          ? "bg-ink text-cream border-ink"
                          : "bg-cream/20 border-ink/5 text-dust hover:bg-cream/40 hover:text-ink"
                      }`}
                    >
                      💬 {impulse.reply_count} {impulse.reply_count === 1 ? "Reply" : "Replies"}
                    </button>
                  </div>

                  {/* Collapsible replies thread */}
                  {activeReplyId === impulse.impulse_id && (
                    <div className="mt-4 pt-4 border-t border-ink/5 space-y-4 animate-fade-in">
                      {loadingReplies[impulse.impulse_id] && !replies[impulse.impulse_id] ? (
                        <div className="text-center py-4 text-3xs text-dust/60 font-body uppercase tracking-wider">
                          Loading comments...
                        </div>
                      ) : (
                        <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                          {(replies[impulse.impulse_id] || []).length === 0 ? (
                            <p className="text-3xs text-dust/60 font-body italic text-center py-2">
                              No comments on this impulse yet.
                            </p>
                          ) : (
                            (replies[impulse.impulse_id] || []).map((reply) => (
                              <div key={reply.reply_id} className="flex gap-2 items-start pl-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden flex items-center justify-center select-none mt-0.5 shadow-xs bg-cream/10">
                                  {renderAvatarSvg(reply.visitor.avatar_id || "avatar_1", "w-6 h-6")}
                                </div>
                                <div className="flex-1 bg-cream/20 p-2.5 rounded-lg border border-ink/5">
                                  <div className="flex justify-between items-baseline mb-1">
                                    <span className="font-body text-2xs font-bold text-ink">
                                      {reply.visitor.display_name}
                                    </span>
                                    <span className="text-[9px] text-dust/50 flex items-center gap-1.5 select-none">
                                      {formatTimeAgo(reply.created_at)}
                                      {reply.updated_at && <span className="italic text-dust/40">(edited)</span>}
                                      {isVerified && reply.visitor.visitor_id === visitorId && (
                                        <>
                                          <span className="text-dust/30 select-none">·</span>
                                          <button
                                            onClick={() => {
                                              setEditingReplyId(reply.reply_id);
                                              setEditingReplyText(reply.content);
                                            }}
                                            className="text-dust hover:text-amber transition-colors cursor-pointer text-[8px]"
                                          >
                                            Edit
                                          </button>
                                          <span className="text-dust/30 select-none">·</span>
                                          {deletingReplyId === reply.reply_id ? (
                                            <span className="inline-flex items-center gap-1 text-[8px]">
                                              <span className="text-red-500">Sure?</span>
                                              <button
                                                onClick={() => handleDeleteReply(reply.reply_id, impulse.impulse_id)}
                                                className="text-red-600 hover:text-red-800 transition-colors font-bold"
                                              >
                                                Yes
                                              </button>
                                              <span className="text-dust/40">/</span>
                                              <button
                                                onClick={() => setDeletingReplyId(null)}
                                                className="text-dust hover:text-ink transition-colors font-bold"
                                              >
                                                No
                                              </button>
                                            </span>
                                          ) : (
                                            <button
                                              onClick={() => setDeletingReplyId(reply.reply_id)}
                                              className="text-dust hover:text-red-500 transition-colors cursor-pointer text-[8px]"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </>
                                      )}
                                    </span>
                                  </div>
                                  {editingReplyId === reply.reply_id ? (
                                    <div className="mt-1.5 space-y-2">
                                      <input
                                        type="text"
                                        value={editingReplyText}
                                        onChange={(e) => setEditingReplyText(e.target.value.slice(0, 200))}
                                        className="w-full px-2 py-1 border border-ink/10 rounded-lg text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors bg-white"
                                      />
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-3xs text-dust/50 font-body">
                                          {editingReplyText.length}/200
                                        </span>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={() => {
                                              setEditingReplyId(null);
                                              setEditingReplyText("");
                                            }}
                                            className="text-3xs uppercase font-bold tracking-wider text-dust hover:text-ink transition-colors font-body px-1 py-0.5"
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            onClick={() => handleEditReply(reply.reply_id, impulse.impulse_id)}
                                            disabled={!editingReplyText.trim()}
                                            className="bg-ink text-cream hover:bg-amber hover:text-white px-2 py-0.5 rounded-lg text-3xs font-bold uppercase transition-colors"
                                          >
                                            Save
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <p className="text-xs text-ink leading-relaxed font-body whitespace-pre-wrap">
                                      {reply.content}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}

                      {/* Add reply */}
                      {isVerified ? (
                        <form
                          onSubmit={(e) => handlePostReply(e, impulse.impulse_id)}
                          className="flex gap-2 items-center pt-2 pl-2"
                        >
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value.slice(0, 200))}
                            placeholder="Add a comment..."
                            disabled={submittingReply}
                            className="flex-1 px-3 py-1.5 bg-cream/10 border border-ink/10 rounded-lg text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={submittingReply || !replyText.trim()}
                            className="py-1.5 px-4 bg-ink text-cream hover:bg-amber hover:text-white disabled:bg-dust/20 disabled:text-cream/50 font-body text-3xs font-bold uppercase tracking-wider transition-colors rounded-lg"
                          >
                            Send
                          </button>
                        </form>
                      ) : (
                        <p className="text-3xs text-dust font-body text-center pl-2 pt-2 border-t border-ink/5">
                          Please{" "}
                          <Link href="/gate" className="text-amber hover:underline font-semibold">
                            verify your profile
                          </Link>{" "}
                          to comment.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW BOARD MODAL OVERLAY */}
      {openCreateBoardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-xs animate-fade-in">
          <div className="bg-white border border-ink/10 p-6 max-w-sm w-full rounded-xl shadow-xl animate-fade-up">
            <h3 className="font-display font-bold text-lg text-ink mb-2">Create New Channel</h3>
            <div className="amber-line mt-1 mb-4"></div>

            {boardError && (
              <div className="p-2 bg-red-50 border-l-2 border-red-500 text-3xs text-red-700 font-body mb-4">
                {boardError}
              </div>
            )}

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="boardName" className="block text-3xs uppercase font-bold tracking-wider text-dust font-body">
                  Channel Name
                </label>
                <input
                  type="text"
                  id="boardName"
                  value={newBoardName}
                  onChange={(e) => setNewBoardName(e.target.value.slice(0, 50))}
                  placeholder="e.g. Hiking Tips"
                  required
                  disabled={creatingBoard}
                  className="w-full px-3 py-2 bg-cream/10 border border-ink/10 rounded-sm text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="boardDesc" className="block text-3xs uppercase font-bold tracking-wider text-dust font-body">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  id="boardDesc"
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value.slice(0, 150))}
                  placeholder="What is this channel about?"
                  disabled={creatingBoard}
                  className="w-full px-3 py-2 bg-cream/10 border border-ink/10 rounded-sm text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setNewBoardName("");
                    setNewBoardDesc("");
                    setOpenCreateBoardModal(false);
                  }}
                  className="text-3xs uppercase font-bold tracking-wider text-dust hover:text-ink transition-colors font-body"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingBoard || !newBoardName.trim()}
                  className="py-1.5 px-4 bg-ink text-cream hover:bg-amber hover:text-white disabled:bg-dust/20 disabled:text-cream/50 font-body text-3xs font-bold uppercase tracking-wider transition-colors rounded-sm"
                >
                  {creatingBoard ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
