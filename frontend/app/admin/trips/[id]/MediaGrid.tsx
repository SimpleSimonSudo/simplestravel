"use client";

import { useState } from "react";
import { toggleMediaTitleTag } from "../actions";
import { Star, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function MediaGrid({ tripId }: { tripId: number }) {
  const [media, setMedia] = useState<any[]>([]);
  const [searchTag, setSearchTag] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTag.trim()) return;
    
    setIsSearching(true);
    // Note: tags is a postgres array. We can use contains operator 'cs' in supabase js
    // We also need to join posts to ensure it belongs to the trip.
    // In Supabase js, doing a join filter is tricky. We might just fetch all posts for the trip first.
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
        .in("post_id", postIds)
        .contains("tags", [searchTag.trim()]);
        
      if (error) {
        alert("Search error: " + error.message);
      } else {
        setMedia(mediaData || []);
      }
    } catch (err: any) {
      alert("Error: " + err.message);
    } finally {
      setIsSearching(false);
    }
  };

  const handleToggle = async (m: any) => {
    const hasTitle = m.tags?.includes("#title");
    const newHasTitle = !hasTitle;

    setMedia(prev => prev.map(item => {
      if (item.media_id === m.media_id) {
        const newTags = newHasTitle 
          ? [...(item.tags || []), "#title"]
          : (item.tags || []).filter((t: string) => t !== "#title");
        return { ...item, tags: newTags };
      }
      return item;
    }));

    const res = await toggleMediaTitleTag(m.media_id, newHasTitle);
    if (res.error) {
      alert("Failed to update media tag: " + res.error);
    }
  };

  return (
    <div className="mt-8 bg-white border border-ink/10 rounded-md p-6">
      <h3 className="text-lg font-medium text-ink mb-2">Trip Media (Title Images)</h3>
      <p className="text-sm text-dust mb-4">Search for media by tag (e.g. #landscape) to assign as trip title images.</p>
      
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input 
          type="text" 
          placeholder="Search tag (e.g. #mountain)"
          value={searchTag}
          onChange={e => setSearchTag(e.target.value)}
          className="flex-1 px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm"
        />
        <button 
          type="submit" 
          disabled={isSearching}
          className="flex items-center gap-2 bg-cream text-ink px-4 py-2 rounded hover:bg-cream/80 transition-colors disabled:opacity-50"
        >
          <Search size={16} />
          {isSearching ? "Searching..." : "Search"}
        </button>
      </form>

      {media.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {media.map((m: any) => {
            const isTitle = m.tags?.includes("#title");
            return (
              <div 
                key={m.media_id} 
                className="relative aspect-square bg-cream rounded overflow-hidden group cursor-pointer border-2 transition-colors"
                style={{ borderColor: isTitle ? "var(--color-amber)" : "transparent" }}
                onClick={() => handleToggle(m)}
              >
                {m.storage_path ? (
                   <img
                    src={`https://sgavinsdlmhiqleczbcx.supabase.co/storage/v1/object/public/media/${m.storage_path}`}
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
