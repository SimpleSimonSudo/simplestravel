"use client";

import React, { useEffect, useState, useRef } from "react";

interface Country {
  country_id: number;
  name: string;
  iso_code: string | null;
}

interface Post {
  post_id: string;
  title: string | null;
  post_date: string;
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

const AVATARS = [
  { id: "avatar_1", name: "Cute Fox" },
  { id: "avatar_2", name: "Cute Panda" },
  { id: "avatar_3", name: "Cute Koala" },
  { id: "avatar_4", name: "Cute Bunny" },
  { id: "avatar_5", name: "Cute Cat" },
  { id: "avatar_6", name: "Cute Frog" },
  { id: "avatar_7", name: "Cute Owl" },
  { id: "avatar_8", name: "Cute Bear" },
  { id: "avatar_9", name: "Cute Monkey" },
  { id: "avatar_10", name: "Cute Turtle" },
  { id: "avatar_11", name: "Cute Dolphin" },
  { id: "avatar_12", name: "Cute Bee" },
  { id: "avatar_13", name: "Cute Eagle" },
  { id: "avatar_14", name: "Cute Snake" },
  { id: "avatar_15", name: "Cute Beetle" },
];

function renderAvatarSvg(avatarId: string, className = "w-10 h-10") {
  const id = avatarId || "avatar_1";
  switch (id) {
    case "avatar_1": // Fox
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#f2a27a" />
          <path d="M25,35 L10,5 L35,20 Z" fill="#E67E22" />
          <path d="M75,35 L90,5 L65,20 Z" fill="#E67E22" />
          <path d="M23,32 L15,12 L30,22 Z" fill="#ffffff" />
          <path d="M77,32 L85,12 L70,22 Z" fill="#ffffff" />
          <path d="M20,50 Q20,80 50,85 Q80,80 80,50 C80,35 20,35 20,50 Z" fill="#E67E22" />
          <path d="M20,50 C20,68 35,75 50,75 C65,75 80,68 80,50 C70,55 30,55 20,50 Z" fill="#ffffff" />
          <circle cx="38" cy="48" r="4" fill="#2C3E50" />
          <circle cx="62" cy="48" r="4" fill="#2C3E50" />
          <polygon points="50,56 46,51 54,51" fill="#2C3E50" />
          <circle cx="30" cy="55" r="4.5" fill="#f19066" opacity="0.6" />
          <circle cx="70" cy="55" r="4.5" fill="#f19066" opacity="0.6" />
        </svg>
      );
    case "avatar_2": // Panda
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#9CA3AF" />
          <circle cx="28" cy="28" r="12" fill="#1F2937" />
          <circle cx="72" cy="28" r="12" fill="#1F2937" />
          <circle cx="50" cy="56" r="32" fill="#ffffff" />
          <ellipse cx="38" cy="54" rx="8" ry="10" transform="rotate(-15 38 54)" fill="#1F2937" />
          <ellipse cx="62" cy="54" rx="8" ry="10" transform="rotate(15 62 54)" fill="#1F2937" />
          <circle cx="38" cy="52" r="3" fill="#ffffff" />
          <circle cx="62" cy="52" r="3" fill="#ffffff" />
          <ellipse cx="50" cy="62" rx="4" ry="2.5" fill="#1F2937" />
          <circle cx="28" cy="60" r="4" fill="#F472B6" opacity="0.4" />
          <circle cx="72" cy="60" r="4" fill="#F472B6" opacity="0.4" />
        </svg>
      );
    case "avatar_3": // Koala
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#7DA2A9" />
          <circle cx="22" cy="42" r="15" fill="#B2BEC3" />
          <circle cx="78" cy="42" r="15" fill="#B2BEC3" />
          <circle cx="22" cy="42" r="10" fill="#FFEAA7" opacity="0.8" />
          <circle cx="78" cy="42" r="10" fill="#FFEAA7" opacity="0.8" />
          <circle cx="50" cy="54" r="28" fill="#B2BEC3" />
          <path d="M14,42 Q22,32 30,42" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M70,42 Q78,32 86,42" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="38" cy="50" r="3.5" fill="#2D3436" />
          <circle cx="62" cy="50" r="3.5" fill="#2D3436" />
          <ellipse cx="50" cy="58" rx="6" ry="10" fill="#2D3436" />
          <circle cx="29" cy="56" r="3.5" fill="#FF8B94" opacity="0.5" />
          <circle cx="71" cy="56" r="3.5" fill="#FF8B94" opacity="0.5" />
        </svg>
      );
    case "avatar_4": // Bunny
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#EDC7B7" />
          <path d="M30,38 C22,10 38,10 36,38 Z" fill="#ffffff" />
          <path d="M70,38 C78,10 62,10 64,38 Z" fill="#ffffff" />
          <path d="M31,34 C26,16 35,16 34,34 Z" fill="#FF8B94" opacity="0.6" />
          <path d="M69,34 C74,16 65,16 66,34 Z" fill="#FF8B94" opacity="0.6" />
          <circle cx="50" cy="58" r="26" fill="#ffffff" />
          <circle cx="40" cy="56" r="3" fill="#2D3748" />
          <circle cx="60" cy="56" r="3" fill="#2D3748" />
          <polygon points="50,62 48,59 52,59" fill="#FF8B94" />
          <path d="M48,65 Q50,67 50,65 Q50,67 52,65" stroke="#FF8B94" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="32" cy="62" r="3.5" fill="#FF8B94" opacity="0.5" />
          <circle cx="68" cy="62" r="3.5" fill="#FF8B94" opacity="0.5" />
        </svg>
      );
    case "avatar_5": // Cat
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#F7D070" />
          <polygon points="20,44 15,18 40,32" fill="#E67E22" />
          <polygon points="80,44 85,18 60,32" fill="#E67E22" />
          <polygon points="22,41 18,22 36,32" fill="#F19066" />
          <polygon points="78,41 82,22 64,32" fill="#F19066" />
          <circle cx="50" cy="54" r="28" fill="#E67E22" />
          <circle cx="38" cy="50" r="3.5" fill="#1A202C" />
          <circle cx="62" cy="50" r="3.5" fill="#1A202C" />
          <path d="M38,45 Q40,43 42,45" stroke="#1A202C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M62,45 Q60,43 58,45" stroke="#1A202C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <polygon points="50,56 47,53 53,53" fill="#F19066" />
          <path d="M47,60 Q50,62 50,60 Q50,62 53,60" stroke="#1A202C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <line x1="22" y1="56" x2="10" y2="54" stroke="#1A202C" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="22" y1="60" x2="12" y2="61" stroke="#1A202C" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="78" y1="56" x2="90" y2="54" stroke="#1A202C" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="78" y1="60" x2="88" y2="61" stroke="#1A202C" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "avatar_6": // Frog
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#84A98C" />
          <circle cx="36" cy="38" r="11" fill="#52796F" />
          <circle cx="64" cy="38" r="11" fill="#52796F" />
          <circle cx="36" cy="38" r="8" fill="#ffffff" />
          <circle cx="64" cy="38" r="8" fill="#ffffff" />
          <circle cx="36" cy="38" r="4.5" fill="#111827" />
          <circle cx="64" cy="38" r="4.5" fill="#111827" />
          <ellipse cx="50" cy="58" rx="28" ry="22" fill="#52796F" />
          <path d="M38,62 Q50,70 62,62" stroke="#111827" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="28" cy="58" r="4.5" fill="#FF8B94" opacity="0.6" />
          <circle cx="72" cy="58" r="4.5" fill="#FF8B94" opacity="0.6" />
        </svg>
      );
    case "avatar_7": // Owl
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#C0B9DD" />
          <polygon points="26,38 20,18 42,28" fill="#5F27CD" />
          <polygon points="74,38 80,18 58,28" fill="#5F27CD" />
          <circle cx="50" cy="54" r="28" fill="#5F27CD" />
          <circle cx="39" cy="48" r="9" fill="#ffffff" />
          <circle cx="61" cy="48" r="9" fill="#ffffff" />
          <circle cx="39" cy="48" r="4.5" fill="#1F2937" />
          <circle cx="61" cy="48" r="4.5" fill="#1F2937" />
          <polygon points="50,50 46,56 54,56" fill="#FFA801" />
          <path d="M36,68 C36,58 64,58 64,68" fill="#FFEAA7" opacity="0.9" />
        </svg>
      );
    case "avatar_8": // Bear
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#B08968" />
          <circle cx="28" cy="32" r="9" fill="#7F5539" />
          <circle cx="72" cy="32" r="9" fill="#7F5539" />
          <circle cx="28" cy="32" r="5" fill="#DDB892" />
          <circle cx="72" cy="32" r="5" fill="#DDB892" />
          <circle cx="50" cy="54" r="27" fill="#7F5539" />
          <circle cx="39" cy="48" r="3" fill="#1A202C" />
          <circle cx="61" cy="48" r="3" fill="#1A202C" />
          <circle cx="50" cy="58" r="7.5" fill="#DDB892" />
          <ellipse cx="50" cy="55" rx="3.5" ry="2" fill="#1A202C" />
          <path d="M50,57 L50,60 Q48,62 47,61.5 M50,60 Q52,62 53,61.5" stroke="#1A202C" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <circle cx="31" cy="53" r="3" fill="#FF8B94" opacity="0.4" />
          <circle cx="69" cy="53" r="3" fill="#FF8B94" opacity="0.4" />
        </svg>
      );
    case "avatar_9": // Monkey
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#E8C39E" />
          <circle cx="20" cy="50" r="11" fill="#8B5A2B" />
          <circle cx="80" cy="50" r="11" fill="#8B5A2B" />
          <circle cx="20" cy="50" r="6" fill="#FCD5B5" />
          <circle cx="80" cy="50" r="6" fill="#FCD5B5" />
          <circle cx="50" cy="50" r="26" fill="#8B5A2B" />
          <path d="M33,48 C33,38 48,38 50,46 C52,38 67,38 67,48 C67,58 50,68 50,68 C50,68 33,58 33,48 Z" fill="#FCD5B5" />
          <circle cx="43" cy="46" r="3" fill="#1A202C" />
          <circle cx="57" cy="46" r="3" fill="#1A202C" />
          <ellipse cx="50" cy="58" rx="7" ry="4" fill="#F7C19B" />
          <circle cx="48" cy="57" r="1" fill="#1A202C" />
          <circle cx="52" cy="57" r="1" fill="#1A202C" />
          <path d="M45,61 Q50,64 55,61" stroke="#8B5A2B" strokeWidth="1.2" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "avatar_10": // Turtle
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#CFE1B9" />
          <ellipse cx="26" cy="68" rx="8" ry="12" transform="rotate(-30 26 68)" fill="#52B788" />
          <ellipse cx="74" cy="68" rx="8" ry="12" transform="rotate(30 74 68)" fill="#52B788" />
          <ellipse cx="28" cy="38" rx="6" ry="12" transform="rotate(45 28 38)" fill="#52B788" />
          <ellipse cx="72" cy="38" rx="6" ry="12" transform="rotate(-45 72 38)" fill="#52B788" />
          <polygon points="50,76 46,84 54,84" fill="#52B788" />
          <circle cx="50" cy="56" r="24" fill="#3F5E3D" />
          <circle cx="50" cy="56" r="17" fill="none" stroke="#74C69D" strokeWidth="2" />
          <line x1="50" y1="32" x2="50" y2="39" stroke="#74C69D" strokeWidth="1.5" />
          <line x1="50" y1="73" x2="50" y2="80" stroke="#74C69D" strokeWidth="1.5" />
          <circle cx="50" cy="32" r="11" fill="#52B788" />
          <circle cx="46" cy="30" r="2" fill="#1A202C" />
          <circle cx="54" cy="30" r="2" fill="#1A202C" />
          <path d="M48,35 Q50,37 52,35" stroke="#1A202C" strokeWidth="1" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "avatar_11": // Dolphin
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#D0E1F9" />
          <path d="M36,36 Q20,24 28,14 Q38,20 42,30 Z" fill="#4A90E2" />
          <path d="M26,72 Q14,84 20,88 Q30,86 34,76 Z" fill="#4A90E2" />
          <ellipse cx="50" cy="54" rx="26" ry="22" transform="rotate(-15 50 54)" fill="#4A90E2" />
          <ellipse cx="48" cy="60" rx="20" ry="14" transform="rotate(-15 48 60)" fill="#ffffff" />
          <path d="M58,64 Q70,72 66,78 Q58,74 54,66 Z" fill="#4A90E2" />
          <circle cx="62" cy="46" r="3.5" fill="#1E3A8A" />
          <circle cx="63.5" cy="44.5" r="1" fill="#ffffff" />
          <path d="M64,52 Q70,55 72,50" stroke="#1E3A8A" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case "avatar_12": // Bee
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#FEF3C7" />
          <ellipse cx="38" cy="34" rx="7" ry="13" transform="rotate(-35 38 34)" fill="#ffffff" opacity="0.85" stroke="#E5E7EB" strokeWidth="1" />
          <ellipse cx="62" cy="34" rx="7" ry="13" transform="rotate(35 62 34)" fill="#ffffff" opacity="0.85" stroke="#E5E7EB" strokeWidth="1" />
          <polygon points="50,72 47,82 53,82" fill="#111827" />
          <circle cx="50" cy="54" r="24" fill="#F59E0B" />
          <path d="M30,46 Q50,50 70,46 L70,52 Q50,56 30,52 Z" fill="#1F2937" />
          <path d="M28,56 Q50,60 72,56 L72,62 Q50,66 28,62 Z" fill="#1F2937" />
          <path d="M43,33 Q40,23 35,25" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="35" cy="25" r="2.5" fill="#1F2937" />
          <path d="M57,33 Q60,23 65,25" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="65" cy="25" r="2.5" fill="#1F2937" />
          <circle cx="40" cy="44" r="3" fill="#1F2937" />
          <circle cx="60" cy="44" r="3" fill="#1F2937" />
          <path d="M47,49 Q50,52 53,49" stroke="#1F2937" strokeWidth="1.2" fill="none" strokeLinecap="round" />
          <circle cx="34" cy="47" r="2" fill="#F472B6" opacity="0.5" />
          <circle cx="66" cy="47" r="2" fill="#F472B6" opacity="0.5" />
        </svg>
      );
    case "avatar_13": // Eagle
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#E0F2FE" />
          <path d="M25,72 C25,58 75,58 75,72 Z" fill="#4E3629" />
          <circle cx="50" cy="46" r="22" fill="#ffffff" />
          <path d="M32,36 Q38,38 43,40" stroke="#B45309" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M68,36 Q62,38 57,40" stroke="#B45309" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="39" cy="44" r="3" fill="#111827" />
          <circle cx="61" cy="44" r="3" fill="#111827" />
          <path d="M50,44 Q58,46 50,58 Q42,46 50,44" fill="#FBBF24" />
          <path d="M50,50 L50,58 Q46,55 43,50" fill="#F59E0B" />
        </svg>
      );
    case "avatar_14": // Snake
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#FFE5D9" />
          {/* Winding Body */}
          <path d="M50,46 C32,46 32,62 50,62 C68,62 68,78 50,78 Q42,78 40,72" stroke="#66BB6A" strokeWidth="11" strokeLinecap="round" fill="none" />
          {/* Head */}
          <circle cx="50" cy="36" r="11" fill="#66BB6A" />
          {/* Eyes */}
          <circle cx="46" cy="34" r="2" fill="#1A202C" />
          <circle cx="54" cy="34" r="2" fill="#1A202C" />
          {/* Tongue */}
          <path d="M50,47 L50,51 M50,51 L47,54 M50,51 L53,54" stroke="#EF5350" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {/* Blush */}
          <circle cx="42" cy="37" r="2.5" fill="#FF8B94" opacity="0.6" />
          <circle cx="58" cy="37" r="2.5" fill="#FF8B94" opacity="0.6" />
        </svg>
      );
    case "avatar_15": // Beetle / Ladybug
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#FFF1E6" />
          {/* Legs */}
          <line x1="28" y1="46" x2="16" y2="42" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="58" x2="14" y2="58" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="70" x2="16" y2="74" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="46" x2="84" y2="42" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="58" x2="86" y2="58" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="70" x2="84" y2="74" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          {/* Head */}
          <circle cx="50" cy="34" r="9" fill="#1F2937" />
          <circle cx="46" cy="32" r="1.5" fill="#ffffff" />
          <circle cx="54" cy="32" r="1.5" fill="#ffffff" />
          {/* Antennae */}
          <path d="M46,26 Q42,16 36,18" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="18" r="2" fill="#1F2937" />
          <path d="M54,26 Q58,16 64,18" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="64" cy="18" r="2" fill="#1F2937" />
          {/* Body/Wings */}
          <circle cx="50" cy="58" r="23" fill="#EF4444" />
          {/* Line separator */}
          <line x1="50" y1="36" x2="50" y2="81" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
          {/* Dots */}
          <circle cx="38" cy="48" r="3" fill="#1F2937" />
          <circle cx="36" cy="62" r="3" fill="#1F2937" />
          <circle cx="44" cy="58" r="2.5" fill="#1F2937" />
          <circle cx="62" cy="48" r="3" fill="#1F2937" />
          <circle cx="64" cy="62" r="3" fill="#1F2937" />
          <circle cx="56" cy="58" r="2.5" fill="#1F2937" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#B08968" />
        </svg>
      );
  }
}

interface Impulse {
  impulse_id: string;
  board_id: string;
  content: string;
  created_at: string;
  updated_at?: string | null;
  visitor: Visitor;
  post: { post_id: string; title: string | null } | null;
  country: { country_id: number; name: string; iso_code: string | null } | null;
  reply_count: number;
  reactions: Record<string, number>;
  user_reactions: string[];
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
}

export default function CommunityClient({ initialBoards, countries, posts }: CommunityClientProps) {
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
  const [selectedPostId, setSelectedPostId] = useState("");
  const [submittingImpulse, setSubmittingImpulse] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Reply Thread States
  const [activeReplyId, setActiveReplyId] = useState<string | null>(null);
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [loadingReplies, setLoadingReplies] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

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
      alert("Please verify your profile first to react.");
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
      if (data.success) {
        setImpulses((prev) =>
          prev.map((item) => {
            if (item.impulse_id === impulseId) {
              const nextReactions = { ...item.reactions };
              let nextUserReactions = [...item.user_reactions];

              if (data.reacted) {
                nextReactions[type] = (nextReactions[type] || 0) + 1;
                nextUserReactions.push(type);
              } else {
                nextReactions[type] = Math.max(0, (nextReactions[type] || 1) - 1);
                nextUserReactions = nextUserReactions.filter((r) => r !== type);
              }

              return {
                ...item,
                reactions: nextReactions,
                user_reactions: nextUserReactions,
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
              className="inline-flex items-center gap-2 py-2 px-4 bg-ink text-cream hover:bg-amber hover:text-white font-body text-3xs font-bold uppercase tracking-wider transition-all duration-300 rounded-sm shadow-sm"
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

                  <div className="absolute right-0 mt-3 w-64 bg-white border border-ink/10 shadow-lg p-5 rounded-sm z-50 animate-fade-in text-left">
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
                          <span className="font-mono bg-cream/30 px-2 py-1 border border-ink/5 rounded-sm font-semibold tracking-wider text-ink select-all">
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
                          className="py-1 px-3 text-red-600 hover:text-red-800 hover:bg-red-50 text-3xs uppercase font-bold tracking-wider font-body border border-red-100 transition-colors rounded-sm"
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
          <div className="bg-white border border-ink/5 p-4 rounded-sm shadow-2xs">
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
                    className={`w-full text-left px-3 py-2 rounded-sm text-xs font-body transition-all flex items-center justify-between ${
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
            <div className="p-3 bg-cream/10 border border-ink/5 text-3xs text-dust/70 leading-relaxed font-body rounded-sm italic">
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
              className="bg-white border border-ink/5 rounded-sm shadow-xs transition-all duration-300"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-ink/5">
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
                        className="w-full bg-white border border-ink/10 rounded-sm px-2 py-1.5 text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors"
                      >
                        <option value="">-- No Country --</option>
                        {countries.map((c) => (
                          <option key={c.country_id} value={c.country_id}>
                            {c.name}
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
                        onChange={(e) => setSelectedPostId(e.target.value)}
                        disabled={submittingImpulse}
                        className="w-full bg-white border border-ink/10 rounded-sm px-2 py-1.5 text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors"
                      >
                        <option value="">-- No Post Link --</option>
                        {posts.map((p) => (
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
                        className="py-2 px-5 bg-ink text-cream hover:bg-amber hover:text-white disabled:bg-dust/20 disabled:text-cream/50 font-body text-2xs font-bold uppercase tracking-wider transition-all duration-300 rounded-sm shadow-sm"
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
                <div key={n} className="bg-white border border-ink/5 p-6 rounded-sm shadow-sm animate-pulse space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cream/40 rounded-full"></div>
                    <div className="space-y-2">
                      <div className="h-3.5 bg-cream/40 w-32 rounded-sm"></div>
                      <div className="h-2 bg-cream/40 w-16 rounded-sm"></div>
                    </div>
                  </div>
                  <div className="space-y-2 pt-2">
                    <div className="h-3 bg-cream/40 w-full rounded-sm"></div>
                    <div className="h-3 bg-cream/40 w-5/6 rounded-sm"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : impulses.length === 0 ? (
            <div className="bg-white border border-ink/5 py-16 px-6 text-center rounded-sm shadow-2xs">
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
                  className="bg-white border border-ink/5 p-6 rounded-sm shadow-sm hover:border-amber/20 transition-all duration-300"
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
                        <a
                          href={`/post/${impulse.post.post_id}`}
                          className="tag flex items-center gap-1 hover:bg-amber/10 hover:text-amber transition-colors font-body text-[9px] tracking-normal max-w-[120px] truncate"
                          title={impulse.post.title || ""}
                        >
                          📖 {impulse.post.title || "Post"}
                        </a>
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
                         className="w-full p-2 border border-ink/10 rounded-sm text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors resize-none bg-paper"
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
                            className="py-1 px-4 bg-ink text-cream hover:bg-amber hover:text-white disabled:bg-dust/20 disabled:text-cream/50 font-body text-3xs font-bold uppercase tracking-wider transition-colors rounded-sm shadow-sm"
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
                      ].map((react) => {
                        const count = impulse.reactions[react.type] || 0;
                        const hasReacted = impulse.user_reactions.includes(react.type);
                        return (
                          <button
                            key={react.type}
                            onClick={() => handleReact(impulse.impulse_id, react.type)}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-[10px] font-body transition-all duration-200 select-none ${
                              hasReacted
                                ? "bg-amber/10 border-amber/30 text-amber font-semibold shadow-2xs"
                                : "bg-cream/10 border-ink/5 text-dust hover:bg-cream/30 hover:text-ink"
                            }`}
                          >
                            <span>{react.icon}</span>
                            <span>{count}</span>
                          </button>
                        );
                      })}
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
                                <div className="flex-1 bg-cream/20 p-2.5 rounded-sm border border-ink/5">
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
                                        className="w-full px-2 py-1 border border-ink/10 rounded-sm text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors bg-white"
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
                                            className="bg-ink text-cream hover:bg-amber hover:text-white px-2 py-0.5 rounded-xs text-3xs font-bold uppercase transition-colors"
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
                            className="flex-1 px-3 py-1.5 bg-cream/10 border border-ink/10 rounded-sm text-xs font-body text-ink focus:outline-none focus:border-amber/40 transition-colors"
                          />
                          <button
                            type="submit"
                            disabled={submittingReply || !replyText.trim()}
                            className="py-1.5 px-4 bg-ink text-cream hover:bg-amber hover:text-white disabled:bg-dust/20 disabled:text-cream/50 font-body text-3xs font-bold uppercase tracking-wider transition-colors rounded-sm"
                          >
                            Send
                          </button>
                        </form>
                      ) : (
                        <p className="text-3xs text-dust font-body text-center pl-2 pt-2 border-t border-ink/5">
                          Please{" "}
                          <a href="/gate" className="text-amber hover:underline font-semibold">
                            verify your profile
                          </a>{" "}
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
          <div className="bg-white border border-ink/10 p-6 max-w-sm w-full rounded-sm shadow-md animate-fade-up">
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
