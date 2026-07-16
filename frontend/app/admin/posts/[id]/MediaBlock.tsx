"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2, Image as ImageIcon } from "lucide-react";
import { useState } from "react";

function getMediaUrl(block: any) {
  if (!block) return null;
  if (block.url) return block.url;
  if (block.storage_path) {
    if (block.storage_path.startsWith("http://") || block.storage_path.startsWith("https://")) {
      return block.storage_path;
    }
    if (block.storage_path.startsWith("posts/")) {
      return `https://sgavinsdlmhiqleczbcx.supabase.co/storage/v1/object/public/media/${block.storage_path}`;
    }
    return `https://pub-b3a0e6a319434721bf2acd7052d64b6e.r2.dev/${block.storage_path}`;
  }
  return null;
}

export function MediaBlock({ 
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

  const [preview, setPreview] = useState<string | null>(getMediaUrl(block));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      onChange({ file, url }); // Store file for upload later
    }
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

      <div className="flex-1 space-y-3">
        {preview ? (
          <div className="relative aspect-video bg-cream rounded-md overflow-hidden">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed border-ink/20 rounded-md cursor-pointer hover:bg-cream/50 hover:border-amber transition-colors">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              <ImageIcon className="text-dust mb-2" size={32} />
              <p className="text-sm text-dust">Click to upload image/video</p>
            </div>
            <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileChange} />
          </label>
        )}

        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={block.caption || ""}
            onChange={(e) => onChange({ caption: e.target.value })}
            placeholder="Caption (optional)"
            className="flex-1 text-sm bg-cream text-ink rounded px-3 py-1.5 outline-none focus:ring-1 focus:ring-amber"
          />
          <select 
            value={block.layout_position === 0 ? "left" : block.layout_position === 1 ? "right" : "full"}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "full") {
                onChange({ layout_position: undefined, layout_row: undefined });
              } else if (val === "left") {
                onChange({ layout_position: 0 });
              } else if (val === "right") {
                onChange({ layout_position: 1 });
              }
            }}
            className="text-xs bg-cream text-dust rounded px-2 py-1.5 outline-none focus:text-ink"
          >
            <option value="full">Full Width</option>
            <option value="left">Half Left</option>
            <option value="right">Half Right</option>
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
