"use client";

import { useState, useEffect } from "react";

export function CreatableSelect({
  label,
  value,
  onChange,
  suggestions,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  suggestions: string[];
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setInputValue(value || "");
  }, [value]);

  const filteredSuggestions = (inputValue === value || !inputValue)
    ? suggestions
    : suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase()));

  const showCreateOption = inputValue.trim() !== "" && !suggestions.some(s => s.toLowerCase() === inputValue.toLowerCase().trim());

  return (
    <div className="relative font-body text-xs flex flex-col gap-1 w-full">
      <span className="text-sm font-medium text-ink">{label}</span>
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delayed close to allow clicking suggestions
            setTimeout(() => setIsOpen(false), 200);
          }}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber bg-white text-sm"
        />
        {isOpen && (filteredSuggestions.length > 0 || showCreateOption) && (
          <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-ink/10 rounded shadow-lg z-50">
            {showCreateOption && (
              <button
                type="button"
                onMouseDown={() => {
                  onChange(inputValue.trim());
                  setInputValue(inputValue.trim());
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-amber font-semibold bg-amber/5 hover:bg-amber/10 border-b border-ink/5"
              >
                Create &quot;{inputValue.trim()}&quot;
              </button>
            )}
            {filteredSuggestions.map((opt) => (
              <button
                key={opt}
                type="button"
                onMouseDown={() => {
                  onChange(opt);
                  setInputValue(opt);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 hover:bg-cream text-ink transition-colors"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
