"use client";

import React, { useState, useEffect, useRef } from "react";

const SunIcon = () => (
  <svg className="w-3.5 h-3.5 text-dust shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const SmileIcon = () => (
  <svg className="w-3.5 h-3.5 text-dust shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M8 14s1.5 2 4 2 4-2 4-2" />
    <line x1="9" y1="9" x2="9.01" y2="9" />
    <line x1="15" y1="9" x2="15.01" y2="9" />
  </svg>
);

const CompassIcon = () => (
  <svg className="w-3.5 h-3.5 text-dust shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
  </svg>
);

interface PostDetailsDropdownProps {
  post: {
    travel_mode?: string;
    weather?: string;
    mood?: string;
  };
}

export default function PostDetailsDropdown({ post }: PostDetailsDropdownProps) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  return (
    <div 
      ref={dropdownRef} 
      className="relative shrink-0 select-none"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(!open)}
        className="text-dust/70 hover:text-ink p-1.5 rounded-full transition-colors flex items-center justify-center focus:outline-none bg-cream/35 hover:bg-cream/70"
        aria-label="Show post details"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <circle cx="12" cy="5" r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-32 bg-white/95 backdrop-blur-md border border-ink/10 rounded shadow-md p-2 z-30 flex flex-col gap-2 animate-fade-in text-left">
          {post.travel_mode && (
            <div className="flex items-center gap-2 text-xs font-body text-ink">
              <CompassIcon />
              <span className="font-medium text-ink/90 capitalize leading-none">{post.travel_mode}</span>
            </div>
          )}
          {post.weather && (
            <div className="flex items-center gap-2 text-xs font-body text-ink">
              <SunIcon />
              <span className="font-medium text-ink/90 leading-none">{post.weather}</span>
            </div>
          )}
          {post.mood && (
            <div className="flex items-center gap-2 text-xs font-body text-ink">
              <SmileIcon />
              <span className="font-medium text-ink/90 leading-none">{post.mood}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
