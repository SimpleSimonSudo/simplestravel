"use client";

import { useState, useEffect } from "react";

interface CreatableMultiSelectProps {
  label: string;
  selectedItems: string[];
  onChange: (items: string[]) => void;
  suggestions: string[];
  placeholder?: string;
}

export function CreatableMultiSelect({
  label,
  selectedItems,
  onChange,
  suggestions,
  placeholder
}: CreatableMultiSelectProps) {
  const [inputValue, setInputValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const isCompanions = label.toLowerCase().includes("companion") || label.toLowerCase().includes("begleiter");

  const baseSuggestions = isCompanions
    ? (suggestions.some(s => s.toLowerCase() === "family") ? suggestions : ["family", ...suggestions])
    : suggestions;

  const filteredSuggestions = baseSuggestions.filter(s =>
    s.toLowerCase().includes(inputValue.toLowerCase()) && !selectedItems.includes(s)
  );

  const showCreateOption = inputValue.trim() !== "" &&
    !baseSuggestions.some(s => s.toLowerCase() === inputValue.toLowerCase().trim()) &&
    !selectedItems.some(s => s.toLowerCase() === inputValue.toLowerCase().trim());

  const handleAdd = (item: string) => {
    const trimmed = item.trim();
    if (!trimmed) return;

    if (isCompanions && trimmed.toLowerCase() === "family") {
      const familyMembers = ["Andrea", "Martin", "Johannes", "Manuel", "Matthias"];
      const newItems = [...selectedItems];
      familyMembers.forEach(m => {
        if (!newItems.includes(m)) {
          newItems.push(m);
        }
      });
      onChange(newItems);
      setInputValue("");
      return;
    }

    if (!selectedItems.includes(trimmed)) {
      onChange([...selectedItems, trimmed]);
    }
    setInputValue("");
  };

  const handleRemove = (item: string) => {
    onChange(selectedItems.filter(i => i !== item));
  };

  return (
    <div className="relative font-body text-xs flex flex-col gap-1 w-full">
      <span className="text-sm font-medium text-ink">{label}</span>

      {/* Selected Items Tags */}
      {selectedItems.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {selectedItems.map((item) => (
            <span key={item} className="inline-flex items-center gap-1 bg-cream px-2 py-0.5 rounded-sm text-2xs text-ink font-light">
              {item}
              <button
                type="button"
                onClick={() => handleRemove(item)}
                className="text-dust hover:text-amber font-bold leading-none ml-0.5 text-[10px]"
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && inputValue.trim()) {
              e.preventDefault();
              handleAdd(inputValue);
            }
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
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
                onMouseDown={() => handleAdd(inputValue)}
                className="w-full text-left px-3 py-2 text-amber font-semibold bg-amber/5 hover:bg-amber/10 border-b border-ink/5"
              >
                Create &quot;{inputValue.trim()}&quot;
              </button>
            )}
            {filteredSuggestions.map((opt) => (
              <button
                key={opt}
                type="button"
                onMouseDown={() => handleAdd(opt)}
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
