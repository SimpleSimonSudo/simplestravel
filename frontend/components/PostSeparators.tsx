"use client";

import React from "react";

type PostSeparatorProps = {
  postId: string | number;
};

// Stable hash function to map a post ID to a consistent index
function getStableIndex(postId: string | number, total: number): number {
  const str = String(postId);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % total;
}

export default function PostSeparator({ postId }: PostSeparatorProps) {
  const designs = [
    // Design 0: Classic Wavy Spiral Flourish
    (key: string) => (
      <svg key={key} className="w-64 h-12 text-ink/45" viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 10 20 C 25 10, 35 30, 50 20 C 65 10, 75 30, 90 20 C 95 20, 98 12, 100 12 C 103 12, 105 20, 100 20 C 97 20, 96 17, 98 16 C 100 15, 102 17, 101 19 C 100 21, 105 21, 110 20 C 125 20, 135 10, 150 20 C 165 30, 175 10, 190 20" />
      </svg>
    ),
    // Design 1: Center Heart with Calligraphy Curls
    (key: string) => (
      <svg key={key} className="w-64 h-12 text-ink/45" viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 15 15 C 8 15, 8 25, 15 25 C 22 25, 25 20, 35 20 L 85 20" />
        <path d="M 100 16 C 96 11, 91 14, 91 18 C 91 23, 98 27, 100 29 C 102 27, 109 23, 109 18 C 109 14, 104 11, 100 16 Z" fill="currentColor" opacity="0.85" stroke="none" />
        <path d="M 115 20 L 165 20 C 175 20, 178 25, 185 25 C 192 25, 192 15, 185 15" />
      </svg>
    ),
    // Design 2: Branching Leaves & Center Bud
    (key: string) => (
      <svg key={key} className="w-64 h-12 text-ink/45" viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 20 20 C 50 20, 70 12, 100 20 C 130 28, 150 20, 180 20" />
        <path d="M 55 18 C 60 11, 70 11, 75 17 C 70 23, 60 23, 55 18 Z" fill="currentColor" opacity="0.75" stroke="none" />
        <path d="M 145 22 C 140 29, 130 29, 125 23 C 130 17, 140 17, 145 22 Z" fill="currentColor" opacity="0.75" stroke="none" />
        <circle cx="100" cy="20" r="3" fill="currentColor" stroke="none" />
      </svg>
    ),
    // Design 3: Star and Diamond Arrows
    (key: string) => (
      <svg key={key} className="w-64 h-12 text-ink/45" viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 15 15 L 25 20 L 15 25 M 25 15 L 35 20 L 25 25" />
        <path d="M 35 20 L 85 20" />
        <polygon points="95,20 100,15 105,20 100,25" fill="currentColor" stroke="none" />
        <path d="M 115 20 L 165 20" />
        <path d="M 185 15 L 175 20 L 185 25 M 175 15 L 165 20 L 175 25" />
        <circle cx="90" cy="20" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="110" cy="20" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    // Design 4: Double Swirl with Center Cross
    (key: string) => (
      <svg key={key} className="w-64 h-12 text-ink/45" viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 20 25 C 20 15, 35 10, 45 20 C 55 30, 70 30, 85 20 L 92 20" />
        <path d="M 180 25 C 180 15, 165 10, 155 20 C 145 30, 130 30, 115 20 L 108 20" />
        <path d="M 100 13 L 100 27 M 93 20 L 107 20" strokeWidth="2" />
        <circle cx="50" cy="20" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="150" cy="20" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    // Design 5: Wavy Lines with Triple Drops
    (key: string) => (
      <svg key={key} className="w-64 h-12 text-ink/45" viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 15 20 Q 35 10, 55 20 T 85 20" />
        <path d="M 185 20 Q 165 10, 145 20 T 115 20" />
        <path d="M 100 11 C 98 15, 98 21, 100 24 C 102 21, 102 15, 100 11 Z M 94 15 C 92 18, 92 22, 94 24 C 96 22, 96 18, 94 15 Z M 106 15 C 108 18, 108 22, 106 24 C 104 22, 104 18, 106 15 Z" fill="currentColor" stroke="none" />
      </svg>
    ),
    // Design 6: Calligraphic Infinity Loop
    (key: string) => (
      <svg key={key} className="w-64 h-12 text-ink/45" viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 30 20 C 50 5, 70 35, 100 20 C 130 5, 150 35, 170 20" />
        <path d="M 30 20 C 50 35, 70 5, 100 20 C 130 35, 150 5, 170 20" opacity="0.35" strokeDasharray="3,3" />
        <circle cx="100" cy="20" r="2.5" fill="currentColor" stroke="none" />
      </svg>
    ),
    // Design 7: Curved Scroll with Center Spheres
    (key: string) => (
      <svg key={key} className="w-64 h-12 text-ink/45" viewBox="0 0 200 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 15 15 C 30 15, 30 25, 45 25 C 60 25, 70 15, 90 20 C 95 21, 95 25, 100 25 C 105 25, 105 21, 110 20 C 130 15, 140 25, 155 25 C 170 25, 170 15, 185 15" />
        <circle cx="100" cy="25" r="2" fill="currentColor" stroke="none" />
        <circle cx="94" cy="20" r="1.5" fill="currentColor" stroke="none" />
        <circle cx="106" cy="20" r="1.5" fill="currentColor" stroke="none" />
      </svg>
    ),
  ];

  const selectedIndex = getStableIndex(postId, designs.length);
  return (
    <div className="flex items-center justify-center my-24 select-none opacity-80 hover:opacity-100 transition-opacity duration-500 animate-fade-in" aria-hidden="true">
      {designs[selectedIndex](`separator-${postId}`)}
    </div>
  );
}
