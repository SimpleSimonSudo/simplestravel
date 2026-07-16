"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

export function TextBlock({ 
  block, 
  onChange, 
  onRemove 
}: { 
  block: any; 
  onChange: (updates: any) => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`relative group bg-white border border-ink/10 rounded-md p-4 shadow-sm flex gap-3 ${isDragging ? "ring-2 ring-amber" : ""}`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className="mt-1 cursor-grab active:cursor-grabbing text-dust/50 hover:text-ink transition-colors"
      >
        <GripVertical size={20} />
      </div>

      <div className="flex-1 space-y-2">
        <textarea
          value={block.text || ""}
          onChange={(e) => onChange({ text: e.target.value })}
          placeholder="Write your thoughts here..."
          className="w-full min-h-[100px] resize-y p-2 outline-none border-none text-ink font-body placeholder:text-dust/50 bg-transparent"
        />
        
        {/* Simple formatting toggle just to show the data structure */}
        <div className="flex gap-2">
          <select 
            value={block.subtype || "paragraph"}
            onChange={(e) => onChange({ subtype: e.target.value })}
            className="text-xs bg-cream text-dust rounded px-2 py-1 outline-none focus:text-ink"
          >
            <option value="paragraph">Paragraph</option>
            <option value="heading2">Heading</option>
            <option value="quote">Quote</option>
          </select>
        </div>
      </div>

      <button 
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all self-start p-1"
        title="Remove block"
      >
        <Trash2 size={18} />
      </button>
    </div>
  );
}
