"use client";

import { useState, useEffect } from "react";
import { Save, ImagePlus, Type, MapPin } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { TextBlock } from "./TextBlock";
import { MediaBlock } from "./MediaBlock";
import { CreatableSelect } from "@/components/CreatableSelect";
import LocationMap from "@/components/LocationMap";
import { getPresignedUploadUrl } from "../../actions/upload";
import { savePost } from "../actions";

function normalizeLayoutRows(blocks: any[]) {
  return blocks.map((block, idx) => {
    if (block.type === "image" || block.type === "video") {
      // If this block is Left
      if (block.layout_position === 0) {
        // Check if next block is Right
        const nextBlock = blocks[idx + 1];
        const isNextPartner = nextBlock && 
          (nextBlock.type === "image" || nextBlock.type === "video") && 
          nextBlock.layout_position === 1;

        if (isNextPartner) {
          const rowId = block.layout_row || block.id || Date.now().toString();
          return { ...block, layout_row: rowId };
        } else {
          // Left block without a Right partner -> clear layout_row but keep layout_position
          return { ...block, layout_row: undefined };
        }
      }
      // If this block is Right
      if (block.layout_position === 1) {
        // Check if previous block is Left
        const prevBlock = blocks[idx - 1];
        const isPrevPartner = prevBlock && 
          (prevBlock.type === "image" || prevBlock.type === "video") && 
          prevBlock.layout_position === 0;

        if (isPrevPartner) {
          const rowId = prevBlock.layout_row || prevBlock.id || Date.now().toString();
          return { ...block, layout_row: rowId };
        } else {
          // Right block without a Left partner -> clear layout_row but keep layout_position
          return { ...block, layout_row: undefined };
        }
      }
    }
    return block;
  });
}

export function PostEditor({
  initialPost,
  initialMedia = [],
  countries,
  trips,
}: {
  initialPost: any;
  initialMedia?: any[];
  countries: any[];
  trips: any[];
}) {
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState(() => {
    if (initialPost) {
      const normalizedBlocks = (initialPost.content_blocks || []).map((block: any, index: number) => {
        if (block.type === "text") {
          return {
            ...block,
            text: block.text || block.text_content || "",
            subtype: block.subtype || block.text_subtype || "paragraph",
          };
        }
        if (block.type === "image") {
          const matchingMedia = (initialMedia || []).find((m: any) => m.block_index === index);
          return {
            ...block,
            storage_path: block.storage_path || matchingMedia?.storage_path || matchingMedia?.original_url || null,
            caption: block.caption || matchingMedia?.caption || "",
          };
        }
        return block;
      });
      return {
        ...initialPost,
        companions: initialPost.companions || [],
        tags: initialPost.tags || [],
        content_blocks: normalizeLayoutRows(normalizedBlocks),
      };
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("travel_diary_draft");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.content_blocks) {
            parsed.content_blocks = parsed.content_blocks.map((block: any) => {
              if (block.type === "text") {
                return {
                  ...block,
                  text: block.text || block.text_content || "",
                  subtype: block.subtype || block.text_subtype || "paragraph",
                };
              }
              return block;
            });
          }
          return parsed;
        } catch (e) {
          console.error("Failed to parse draft from localStorage:", e);
        }
      }
    }
    const today = new Date().toISOString().split('T')[0];
    return {
      title: "",
      post_date: new Date().toISOString(), // Fixed order date
      actual_date: today, // Editable event date
      country_id: "",
      trip_id: "",
      city: "",
      region: "",
      latitude: null,
      longitude: null,
      travel_mode: "",
      weather: "",
      mood: "",
      companions: [],
      tags: [],
      content_blocks: []
    };
  });

  useEffect(() => {
    if (!initialPost) {
      localStorage.setItem("travel_diary_draft", JSON.stringify(draft));
    }
  }, [draft, initialPost]);

  const handleChange = (field: string, value: any) => {
    setDraft((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleBlockChange = (id: string, updates: any) => {
    setDraft((prev: any) => {
      const updatedBlocks = prev.content_blocks.map((b: any) => 
        b.id === id ? { ...b, ...updates } : b
      );
      return {
        ...prev,
        content_blocks: normalizeLayoutRows(updatedBlocks),
      };
    });
  };

  const handleBlockRemove = (id: string) => {
    setDraft((prev: any) => {
      const updatedBlocks = prev.content_blocks.filter((b: any) => b.id !== id);
      return {
        ...prev,
        content_blocks: normalizeLayoutRows(updatedBlocks),
      };
    });
  };

  const handleArrayChange = (field: string, commaString: string) => {
    const arr = commaString.split(",").map(s => s.trim()).filter(s => s !== "");
    handleChange(field, arr);
  };

  const handleLocationFound = (city: string | null, region: string | null, country: string | null, countryCode: string | null) => {
    if (city) handleChange("city", city);
    if (region) handleChange("region", region);
    
    // Try to auto-select country by matching code or name
    if (countryCode || country) {
      const foundCountry = countries.find(c => 
        (countryCode && c.iso_code?.toLowerCase() === countryCode.toLowerCase()) || 
        (country && c.name?.toLowerCase() === country?.toLowerCase())
      );
      if (foundCountry) {
        handleChange("country_id", foundCountry.country_id);
      }
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Phase 1: Upload Media to R2
      const updatedBlocks = [...draft.content_blocks];
      for (let i = 0; i < updatedBlocks.length; i++) {
        const block = updatedBlocks[i];
        if ((block.type === "image" || block.type === "video") && block.file) {
          console.log(`Generating presigned URL for ${block.file.name}...`);
          const urlRes = await getPresignedUploadUrl(block.file.name, block.file.type);
          
          if (!urlRes.success || !urlRes.url) {
            throw new Error(`Failed to get presigned URL: ${urlRes.error}`);
          }

          console.log(`Uploading ${block.file.name} to R2...`);
          const uploadRes = await fetch(urlRes.url, {
            method: "PUT",
            body: block.file,
            headers: {
              "Content-Type": block.file.type,
            },
          });

          if (!uploadRes.ok) {
            throw new Error(`Failed to upload ${block.file.name} to R2`);
          }

          // Update block with storage path and clean up file object before saving to DB
          block.storage_path = `https://pub-b3a0e6a319434721bf2acd7052d64b6e.r2.dev/${urlRes.key}`;
          delete block.file;
          delete block.url;
        }
      }

      // Phase 2: Save metadata and blocks to Supabase
      const finalDraft = { ...draft, content_blocks: updatedBlocks };
      const saveRes = await savePost(initialPost ? initialPost.post_id : "new", finalDraft);

      if (saveRes.error) {
        throw new Error(saveRes.error);
      }

      alert("Post saved successfully!");
      setDraft(finalDraft);
      
      if (!initialPost) {
        localStorage.removeItem("travel_diary_draft");
        window.location.href = `/admin/posts/${saveRes.post_id}`;
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Failed to save post.");
    } finally {
      setIsSaving(false);
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setDraft((prev: any) => {
        const oldIndex = prev.content_blocks.findIndex((b: any) => b.id === active.id);
        const newIndex = prev.content_blocks.findIndex((b: any) => b.id === over.id);
        const reordered = arrayMove(prev.content_blocks, oldIndex, newIndex);
        return {
          ...prev,
          content_blocks: normalizeLayoutRows(reordered)
        };
      });
    }
  };

  const travelModes = ["foot", "bike", "car", "train", "bus", "flight", "boat", "ferry"];
  const weathers = ["sunny", "cloudy", "rainy", "stormy", "snowy", "windy", "hot", "cold"];
  const moods = ["happy", "tired", "excited", "relaxed", "adventurous", "nostalgic"];

  const renderEditorBlocks = (blocks: any[]) => {
    const rendered: React.ReactNode[] = [];
    let i = 0;
    while (i < blocks.length) {
      const block = blocks[i];
      
      const isLeft = (block.type === "image" || block.type === "video") && block.layout_position === 0;
      const nextBlock = blocks[i + 1];
      const isNextRight = nextBlock && (nextBlock.type === "image" || nextBlock.type === "video") && nextBlock.layout_position === 1 && nextBlock.layout_row === block.layout_row;

      if (isLeft && isNextRight) {
        rendered.push(
          <div key={`group-${block.id}`} className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-dashed border-amber/30 p-2 rounded-md bg-cream/10">
            <MediaBlock 
              block={block} 
              onChange={(updates) => handleBlockChange(block.id, updates)} 
              onRemove={() => handleBlockRemove(block.id)} 
            />
            <MediaBlock 
              block={nextBlock} 
              onChange={(updates) => handleBlockChange(nextBlock.id, updates)} 
              onRemove={() => handleBlockRemove(nextBlock.id)} 
            />
          </div>
        );
        i += 2;
      } else {
        const blockProps = {
          key: block.id,
          block,
          onChange: (updates: any) => handleBlockChange(block.id, updates),
          onRemove: () => handleBlockRemove(block.id),
        };
        if (block.type === "text") {
          rendered.push(<TextBlock {...blockProps} />);
        } else if (block.type === "image" || block.type === "video") {
          rendered.push(<MediaBlock {...blockProps} />);
        } else {
          rendered.push(<div key={block.id}>Unknown block type</div>);
        }
        i++;
      }
    }
    return rendered;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Main Content Area */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white border border-ink/10 rounded-md p-6">
          <input
            type="text"
            placeholder="Post Title..."
            value={draft.title}
            onChange={(e) => handleChange("title", e.target.value)}
            className="w-full text-4xl font-display text-ink focus:outline-none placeholder:text-dust/50"
          />
        </div>

        {/* Blocks Editor */}
        <div className="space-y-4">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={draft.content_blocks.map((b: any) => b.id) || []} strategy={verticalListSortingStrategy}>
              {renderEditorBlocks(draft.content_blocks)}
            </SortableContext>
          </DndContext>

          {draft.content_blocks.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-ink/10 rounded-md text-dust">
              Start adding content below.
            </div>
          )}

          <div className="flex items-center gap-2 justify-center py-4">
            <button
              onClick={() => handleChange("content_blocks", [...draft.content_blocks, { id: Date.now().toString(), type: "text", text: "" }])}
              className="flex items-center gap-2 px-4 py-2 bg-cream text-ink rounded hover:bg-cream/80 transition-colors"
            >
              <Type size={16} /> Add Text
            </button>
            <button
              onClick={() => handleChange("content_blocks", [...draft.content_blocks, { id: Date.now().toString(), type: "image", file: null }])}
              className="flex items-center gap-2 px-4 py-2 bg-cream text-ink rounded hover:bg-cream/80 transition-colors"
            >
              <ImagePlus size={16} /> Add Media
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar Metadata */}
      <div className="space-y-6">
        <div className="bg-white border border-ink/10 rounded-md p-6 space-y-4">
          
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-ink uppercase tracking-wider text-sm">Metadata</h3>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-amber text-white px-4 py-1.5 rounded hover:bg-amber/90 transition-colors text-sm disabled:opacity-50"
            >
              <Save size={16} />
              {isSaving ? "Saving..." : "Save Draft"}
            </button>
          </div>
          <hr className="border-ink/10" />

          {/* Location Map */}
          <div>
            <label className="block text-sm text-dust mb-1">Pin Location</label>
            <div className="h-48 border border-ink/10 rounded overflow-hidden relative">
              <LocationMap 
                latitude={draft.latitude} 
                longitude={draft.longitude} 
                prevLatitude={null} 
                prevLongitude={null} 
                onCoordinatesChange={(lat, lng) => {
                  handleChange("latitude", lat);
                  handleChange("longitude", lng);
                }}
                onLocationFound={handleLocationFound}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dust mb-1">Actual Date</label>
              <input
                type="date"
                value={draft.actual_date ? draft.actual_date.substring(0, 10) : ""}
                onChange={(e) => handleChange("actual_date", e.target.value)}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm"
              />
            </div>
            {initialPost && (
              <div>
                <label className="block text-sm text-dust mb-1" title="Determines timeline order">Post Date (Fixed)</label>
                <input
                  type="date"
                  value={draft.post_date ? draft.post_date.substring(0, 10) : ""}
                  disabled
                  className="w-full px-3 py-2 border border-ink/10 bg-cream/50 rounded text-sm text-dust cursor-not-allowed"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm text-dust mb-1">Country</label>
            <select
              value={draft.country_id}
              onChange={(e) => handleChange("country_id", e.target.value)}
              className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm bg-white"
            >
              <option value="">Select a country...</option>
              {countries.map(c => (
                <option key={c.country_id} value={c.country_id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-dust mb-1">Trip</label>
            <select
              value={draft.trip_id}
              onChange={(e) => handleChange("trip_id", e.target.value)}
              className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm bg-white"
            >
              <option value="">Select a trip...</option>
              {trips.map(t => (
                <option key={t.trip_id} value={t.trip_id}>{t.trip_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-dust mb-1">City</label>
              <input
                type="text"
                value={draft.city || ""}
                onChange={(e) => handleChange("city", e.target.value)}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-dust mb-1">Region</label>
              <input
                type="text"
                value={draft.region || ""}
                onChange={(e) => handleChange("region", e.target.value)}
                className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm"
              />
            </div>
          </div>

          <CreatableSelect 
            label="Travel Mode" 
            value={draft.travel_mode || ""} 
            onChange={(val) => handleChange("travel_mode", val)} 
            suggestions={travelModes} 
          />
          <CreatableSelect 
            label="Weather" 
            value={draft.weather || ""} 
            onChange={(val) => handleChange("weather", val)} 
            suggestions={weathers} 
          />
          <CreatableSelect 
            label="Mood" 
            value={draft.mood || ""} 
            onChange={(val) => handleChange("mood", val)} 
            suggestions={moods} 
          />

          <div>
            <label className="block text-sm text-dust mb-1">Companions (comma separated)</label>
            <input
              type="text"
              value={draft.companions?.join(", ") || ""}
              onChange={(e) => handleArrayChange("companions", e.target.value)}
              className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm"
            />
          </div>

          <div>
            <label className="block text-sm text-dust mb-1">Tags (comma separated)</label>
            <input
              type="text"
              value={draft.tags?.join(", ") || ""}
              onChange={(e) => handleArrayChange("tags", e.target.value)}
              className="w-full px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm"
            />
          </div>
          
        </div>
      </div>
    </div>
  );
}
