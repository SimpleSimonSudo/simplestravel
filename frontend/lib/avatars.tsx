import React from "react";

export const AVATARS = [
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

export function renderAvatarSvg(avatarId: string, className = "w-10 h-10") {
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
          <path d="M50,46 C32,46 32,62 50,62 C68,62 68,78 50,78 Q42,78 40,72" stroke="#66BB6A" strokeWidth="11" strokeLinecap="round" fill="none" />
          <circle cx="50" cy="36" r="11" fill="#66BB6A" />
          <circle cx="46" cy="34" r="2" fill="#1A202C" />
          <circle cx="54" cy="34" r="2" fill="#1A202C" />
          <path d="M50,47 L50,51 M50,51 L47,54 M50,51 L53,54" stroke="#EF5350" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="42" cy="37" r="2.5" fill="#FF8B94" opacity="0.6" />
          <circle cx="58" cy="37" r="2.5" fill="#FF8B94" opacity="0.6" />
        </svg>
      );
    case "avatar_15": // Beetle
      return (
        <svg viewBox="0 0 100 100" className={className}>
          <circle cx="50" cy="50" r="50" fill="#FFF1E6" />
          <line x1="28" y1="46" x2="16" y2="42" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="58" x2="14" y2="58" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="28" y1="70" x2="16" y2="74" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="46" x2="84" y2="42" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="58" x2="86" y2="58" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="72" y1="70" x2="84" y2="74" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="34" r="9" fill="#1F2937" />
          <circle cx="46" cy="32" r="1.5" fill="#ffffff" />
          <circle cx="54" cy="32" r="1.5" fill="#ffffff" />
          <path d="M46,26 Q42,16 36,18" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="36" cy="18" r="2" fill="#1F2937" />
          <path d="M54,26 Q58,16 64,18" stroke="#1F2937" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <circle cx="64" cy="18" r="2" fill="#1F2937" />
          <circle cx="50" cy="58" r="23" fill="#EF4444" />
          <line x1="50" y1="36" x2="50" y2="81" stroke="#1F2937" strokeWidth="2" strokeLinecap="round" />
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
