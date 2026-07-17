"use client";

import { useState, useEffect } from "react";
import { toggleMediaTitleTag } from "../actions";
import { Star, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

function getMediaUrl(m: any) {
  if (!m) return "";
  if (m.storage_path) {
    if (m.storage_path.startsWith("http://") || m.storage_path.startsWith("https://")) {
      return m.storage_path;
    }
    if (m.storage_path.startsWith("posts/")) {
      return `https://sgavinsdlmhiqleczbcx.supabase.co/storage/v1/object/public/media/${m.storage_path}`;
    }
    return `https://pub-b3a0e6a319434721bf2acd7052d64b6e.r2.dev/${m.storage_path}`;
  }
  if (m.original_url) return m.original_url;
  return "";
}

export function MediaGrid({ tripId }: { tripId: number }) {
  const [media, setMedia] = useState<any[]>([]);
  const [searchTag, setSearchTag] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [allTags, setAllTags] = useState<string[]>([]);

  const loadTags = async () => {
    try {
      const { data: postsData } = await supabase
        .from("posts")
        .select("post_id")
        .eq("trip_id", tripId);
        
      if (!postsData || postsData.length === 0) return;
      const postIds = postsData.map((p: any) => p.post_id);
      
      const { data: mediaData } = await supabase
        .from("media")
        .select("tags")
        .in("post_id", postIds);
        
      const unique = Array.from(
        new Set(
          (mediaData || [])
            .flatMap((m: any) => m.tags || [])
            .map((t: string) => t.trim())
            .filter((t: string) => t !== "")
        )
      ).sort((a, b) => a.localeCompare(b));
      setAllTags(unique);
    } catch (e) {
      console.error("Failed to load tags:", e);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const performSearch = async (tag: string) => {
    if (!tag.trim()) return;
    
    setIsSearching(true);
    try {
      const { data: postsData } = await supabase
        .from("posts")
        .select("post_id")
        .eq("trip_id", tripId);
        
      if (!postsData || postsData.length === 0) {
        setMedia([]);
        setIsSearching(false);
        return;
      }
      
      const postIds = postsData.map((p: any) => p.post_id);
      
      const { data: mediaData, error } = await supabase
        .from("media")
        .select("*")
        .in("post_id", postIds);
        
      if (error) {
        alert("Search error: " + error.message);
      } else {
        const queryLower = tag.trim().toLowerCase();
        const filtered = (mediaData || []).filter((item: any) => {
          if (!item.tags || !Array.isArray(item.tags)) return false;
          return item.tags.some((t: string) => {
            const lowerT = t.toLowerCase();
            return lowerT.includes(queryLower) || lowerT.startsWith(queryLower);
          });
        });
        setMedia(filtered);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(searchTag);
  };

  const handleTagClick = (tag: string) => {
    setSearchTag(tag);
    performSearch(tag);
  };

  const handleToggle = async (m: any) => {
    const hasTitle = m.tags?.some((t: string) => t.startsWith("#title"));
    const newHasTitle = !hasTitle;

    setMedia(prev => prev.map(item => {
      if (item.media_id === m.media_id) {
        const newTags = newHasTitle 
          ? [...(item.tags || []).filter((t: string) => !t.startsWith("#title")), "#title"]
          : (item.tags || []).filter((t: string) => !t.startsWith("#title"));
        return { ...item, tags: newTags };
      }
      return item;
    }));

    const res = await toggleMediaTitleTag(m.media_id, newHasTitle);
    if (res.error) {
      alert("Failed to update media tag: " + res.error);
    } else {
      loadTags(); // Reload tags dynamically in preview after edit
    }
  };

  return (
    <div className="mt-8 bg-white border border-ink/10 rounded-md p-6">
      <h3 className="text-lg font-medium text-ink mb-2">Trip Media (Title Images)</h3>
      <p className="text-sm text-dust mb-4">Search for media by tag (e.g. #landscape) to assign as trip title images.</p>
      
      <div className="flex flex-col gap-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <input 
            type="text" 
            placeholder="Search tag (e.g. #mountain)"
            value={searchTag}
            onChange={e => setSearchTag(e.target.value)}
            className="flex-1 px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm bg-white"
          />
          <button 
            type="submit" 
            disabled={isSearching}
            className="flex items-center gap-2 bg-cream text-ink px-4 py-2 rounded hover:bg-cream/80 transition-colors disabled:opacity-50 text-sm font-semibold"
          >
            <Search size={16} />
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>

        {allTags.length > 0 && (
          <div className="border-t border-ink/5 pt-3">
            <p className="text-xs text-dust mb-2 font-medium">Filter by tag preview:</p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-2">
              {allTags.map((tag: string) => {
                const displayTag = tag.startsWith("#") ? tag : `#${tag}`;
                const isSelected = searchTag === tag || searchTag === displayTag || (searchTag && searchTag.toLowerCase() === tag.toLowerCase());
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagClick(tag)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      isSelected
                        ? "bg-amber text-white font-semibold"
                        : "bg-cream text-ink hover:bg-cream/80"
                    }`}
                  >
                    {displayTag}
                  </button>
                );
              })}
              {searchTag && (
                <button
                  onClick={() => {
                    setSearchTag("");
                    setMedia([]);
                  }}
                  className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold"
                >
                  Clear filter ×
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {media.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((m: any) => {
            const isTitle = m.tags?.some((t: string) => t.startsWith("#title"));
            const imageUrl = getMediaUrl(m);
            return (
              <div 
                key={m.media_id} 
                className="relative aspect-square bg-cream rounded overflow-hidden group cursor-pointer border-2 transition-colors"
                style={{ borderColor: isTitle ? "var(--color-amber)" : "transparent" }}
                onClick={() => handleToggle(m)}
              >
                {imageUrl ? (
                   <img
                    src={imageUrl}
                    alt={m.alt_text || "Trip Media"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dust text-xs">No preview</div>
                )}
                
                <div className="absolute top-2 right-2 z-10">
                  <Star
                    size={20}
                    className={`drop-shadow-md transition-colors ${isTitle ? "fill-amber text-amber" : "text-white/70 group-hover:text-white"}`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-dust border border-dashed border-ink/10 rounded">
          No media found for this tag.
        </div>
      )}
    </div>
  );
}
