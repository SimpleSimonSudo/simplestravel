"use client";

import { useEffect, useState } from "react";

export default function RecoveryToast() {
  const [isOpen, setIsOpen] = useState(false);
  const [code, setCode] = useState("");

  useEffect(() => {
    // Check if we should show the recovery key toast
    const shouldShow = localStorage.getItem("show_recovery_toast") === "true";
    const savedCode = localStorage.getItem("travel_recovery_code");

    if (shouldShow && savedCode) {
      setCode(savedCode);
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.removeItem("show_recovery_toast");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:right-auto sm:left-6 sm:bottom-6 z-50 max-w-md sm:max-w-xs sm:w-72 bg-white/95 backdrop-blur-md border border-ink/10 rounded-sm shadow-lg p-5 animate-fade-up select-none">
      {/* Close Button */}
      <button
        onClick={handleClose}
        className="absolute top-3.5 right-3.5 text-dust/50 hover:text-ink transition-colors duration-200"
        aria-label="Close recovery key notification"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="flex flex-col pr-4">
        {/* Header */}
        <span className="font-display italic text-amber text-sm font-semibold mb-1">
          Here&apos;s your little key.
        </span>

        {/* Recovery Code */}
        <span className="font-mono text-2xl font-bold tracking-widest text-ink my-1.5 select-all">
          {code}
        </span>

        {/* Footer info */}
        <span className="font-body text-2xs uppercase tracking-wider text-dust mt-0.5">
          Keep it for your next visit.
        </span>
      </div>
    </div>
  );
}
