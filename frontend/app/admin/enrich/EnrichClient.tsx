"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import ContentBlocksRenderer from "@/components/ContentBlocksRenderer";
import EnrichMap from "./EnrichMap";

interface PostItem {
  post_id: string;
  post_date: string;
  actual_date: string;
  title: string | null;
  is_enriched?: boolean | null;
  media_count?: number | null;
  summary: string | null;
  country_id: number | null;
  trip_id: number | null;
  latitude: number | null;
  longitude: number | null;
  companions: string[] | null;
  travel_mode: string | null;
  weather: string | null;
  mood: string | null;
  highlights: string[] | null;
  tags: string[] | null;
}

interface EnrichClientProps {
  initialPosts: PostItem[];
}

export default function EnrichClient({ initialPosts }: EnrichClientProps) {
  // App state
  const [posts, setPosts] = useState<PostItem[]>(initialPosts);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(
    initialPosts.length > 0 ? initialPosts[0].post_id : null
  );

  // Selected post full content
  const [postDetails, setPostDetails] = useState<any | null>(null);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // Form options loaded from API
  const [options, setOptions] = useState<any>({
    countries: [],
    trips: [],
    companions: [],
    travelModes: [],
    weather: [],
    moods: [],
    highlights: [],
    postTags: [],
    mediaTags: [],
  });

  // Form state for current selected post
  const [title, setTitle] = useState("");
  const [isEnriched, setIsEnriched] = useState(false);
  const [actualDate, setActualDate] = useState("");
  const [countryId, setCountryId] = useState<string>("");
  const [tripId, setTripId] = useState<string>("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("");
  const [locationName, setLocationName] = useState("");
  const [companions, setCompanions] = useState<string[]>([]);
  const [travelMode, setTravelMode] = useState("");
  const [weather, setWeather] = useState("");
  const [mood, setMood] = useState("");
  const [highlights, setHighlights] = useState<string[]>([]);
  const [postTags, setPostTags] = useState<string[]>([]);
  const [mediaTags, setMediaTags] = useState<Record<number, string[]>>({});

  // Inline new trip fields
  const [isCreatingTrip, setIsCreatingTrip] = useState(false);
  const [newTripName, setNewTripName] = useState("");
  const [newTripStartDate, setNewTripStartDate] = useState("");
  const [newTripEndDate, setNewTripEndDate] = useState("");

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "missing_coords" | "missing_country" | "missing_trip" | "enriched">("all");
  const [selectedYear, setSelectedYear] = useState<string>("all");
  const [isSaving, setIsSaving] = useState(false);
  const [isRestoringMedia, setIsRestoringMedia] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Geocoding suggestion
  const [geoSuggestion, setGeoSuggestion] = useState<{
    city: string | null;
    region: string | null;
    country: string | null;
    countryCode: string | null;
  } | null>(null);

  // Load dropdown options on mount
  useEffect(() => {
    async function loadOptions() {
      try {
        const res = await fetch("/api/admin/options");
        const data = await res.json();
        if (data.success) {
          setOptions(data);
        }
      } catch (err) {
        console.error("Error loading form options:", err);
      }
    }
    loadOptions();
  }, []);

  // Compute selected post and surrounding index
  const selectedPostIndex = useMemo(() => {
    return posts.findIndex((p) => p.post_id === selectedPostId);
  }, [posts, selectedPostId]);

  const selectedPost = useMemo(() => {
    if (selectedPostIndex === -1) return null;
    return posts[selectedPostIndex];
  }, [posts, selectedPostIndex]);

  // Find previous post in chronological list that HAS coordinates (to pass as map reference)
  const prevCoordinates = useMemo(() => {
    if (selectedPostIndex <= 0) return { lat: null, lng: null };
    for (let i = selectedPostIndex - 1; i >= 0; i--) {
      if (posts[i].latitude !== null && posts[i].longitude !== null) {
        return { lat: posts[i].latitude, lng: posts[i].longitude };
      }
    }
    return { lat: null, lng: null };
  }, [posts, selectedPostIndex]);

  // Find previous post in chronological list that is enriched (to default companions from)
  const prevCompanions = useMemo(() => {
    if (selectedPostIndex <= 0) return null;
    for (let i = selectedPostIndex - 1; i >= 0; i--) {
      const isEnriched = posts[i].is_enriched || (posts[i].latitude !== null && posts[i].longitude !== null && posts[i].country_id !== null);
      if (isEnriched) {
        return posts[i].companions || [];
      }
    }
    return null;
  }, [posts, selectedPostIndex]);

  // Find previous post in chronological list that has a trip_id (to default trip from)
  const prevTripId = useMemo(() => {
    if (selectedPostIndex <= 0) return null;
    for (let i = selectedPostIndex - 1; i >= 0; i--) {
      if (posts[i].trip_id !== null && posts[i].trip_id !== undefined) {
        return posts[i].trip_id;
      }
    }
    return null;
  }, [posts, selectedPostIndex]);

  // Dynamically extract all unique years from posts
  const availableYears = useMemo(() => {
    const years = new Set<string>();
    posts.forEach((post) => {
      const dateStr = post.actual_date || post.post_date;
      if (dateStr) {
        const year = new Date(dateStr).getFullYear().toString();
        if (!isNaN(Number(year))) {
          years.add(year);
        }
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [posts]);

  const expectedMediaCount = selectedPost?.media_count ?? 0;

  // Find which media blocks are missing from the media table
  const missingBlocks = useMemo(() => {
    if (!postDetails || !postDetails.content_blocks) return [];
    const blocks = postDetails.content_blocks || [];
    const existingIndices = new Set(mediaList.map((m) => m.block_index));

    const missing: Array<{ index: number; type: string; url?: string; provider?: string }> = [];
    blocks.forEach((block: any, idx: number) => {
      const type = block.type;
      if (type === "image" || type === "video" || type === "audio") {
        if (!existingIndices.has(idx)) {
          let url = block.url || block.media?.url || "";
          if (!url && block.attribution?.url) {
            url = block.attribution.url;
          }
          missing.push({
            index: idx,
            type,
            url,
            provider: block.provider,
          });
        }
      }
    });
    return missing;
  }, [postDetails, mediaList]);

  // Fetch full post details (content blocks & media) from Supabase client when selected post changes
  useEffect(() => {
    if (!selectedPostId) {
      setPostDetails(null);
      setMediaList([]);
      return;
    }

    async function loadPostDetails() {
      const postId = selectedPostId as string;
      setIsLoadingDetails(true);
      setGeoSuggestion(null);
      setMessage(null);
      try {
        const [postRes, mediaRes] = await Promise.all([
          supabase.from("posts").select("*").eq("post_id", postId).single(),
          supabase.from("media").select("*").eq("post_id", postId).order("block_index").order("display_order"),
        ]);

        if (postRes.error) throw postRes.error;
        if (mediaRes.error) throw mediaRes.error;

        setPostDetails(postRes.data);
        setMediaList(mediaRes.data || []);

        // Initialize media tags state
        const mTags: Record<number, string[]> = {};
        (mediaRes.data || []).forEach((m: any) => {
          mTags[m.media_id] = m.tags || [];
        });
        setMediaTags(mTags);

        // Prepopulate form fields
        const post = postRes.data as any;
        setTitle(post.title || "");
        setIsEnriched(post.is_enriched || false);
        setActualDate(post.actual_date ? post.actual_date.substring(0, 10) : post.post_date.substring(0, 10));
        setCountryId(post.country_id ? String(post.country_id) : "");
        if (post.trip_id) {
          setTripId(String(post.trip_id));
        } else if (prevTripId) {
          setTripId(String(prevTripId));
        } else {
          setTripId("");
        }
        setLatitude(post.latitude);
        setLongitude(post.longitude);
        setCity(post.city || "");
        setRegion(post.region || "");
        setLocationName(post.location_name || "");
        setTravelMode(post.travel_mode || "");
        setWeather(post.weather || "");
        setMood(post.mood || "");
        setHighlights(post.highlights || []);
        setPostTags(post.tags || []);

        // Default companions from previous post if current post companion list is empty
        if (post.companions && post.companions.length > 0) {
          setCompanions(post.companions);
        } else if (prevCompanions) {
          setCompanions(prevCompanions);
        } else {
          setCompanions([]);
        }

        // Reset inline trip fields
        setIsCreatingTrip(false);
        setNewTripName("");
        setNewTripStartDate("");
        setNewTripEndDate("");
      } catch (err) {
        console.error("Error loading post content:", err);
      } finally {
        setIsLoadingDetails(false);
      }
    }

    loadPostDetails();
  }, [selectedPostId, posts, selectedPostIndex, prevCompanions, prevTripId]);

  // Handle location reverse geocoded by map
  const handleLocationFound = (
    foundCity: string | null,
    foundRegion: string | null,
    foundCountry: string | null,
    foundCountryCode: string | null
  ) => {
    setGeoSuggestion({
      city: foundCity,
      region: foundRegion,
      country: foundCountry,
      countryCode: foundCountryCode,
    });
  };

  // Apply reverse geocoding suggestions to form
  const applyGeoSuggestion = () => {
    if (!geoSuggestion) return;
    if (geoSuggestion.city) setCity(geoSuggestion.city);
    if (geoSuggestion.region) setRegion(geoSuggestion.region);

    // Auto-select country dropdown based on geocoded country details
    if (geoSuggestion.country || geoSuggestion.countryCode) {
      const match = options.countries.find(
        (c: any) =>
          (geoSuggestion.countryCode && c.iso_code?.toUpperCase() === geoSuggestion.countryCode.toUpperCase()) ||
          (geoSuggestion.country && c.name.toLowerCase() === geoSuggestion.country.toLowerCase())
      );
      if (match) {
        setCountryId(String(match.country_id));
      }
    }
    setGeoSuggestion(null);
  };

  const handleRestoreMedia = async () => {
    if (!selectedPostId || isRestoringMedia) return;
    setIsRestoringMedia(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/enrich/restore-media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: selectedPostId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to restore media.");
      }

      // Re-fetch media list
      const { data: updatedMedia, error: mediaError } = await supabase
        .from("media")
        .select("*")
        .eq("post_id", selectedPostId)
        .order("block_index", { ascending: true })
        .order("display_order", { ascending: true });

      if (mediaError) throw mediaError;
      setMediaList(updatedMedia || []);

      setMessage({
        text: data.message || "Successfully restored missing media!",
        type: "success",
      });
    } catch (err: any) {
      console.error("Error restoring media:", err);
      setMessage({
        text: err.message || "Error restoring media.",
        type: "error",
      });
    } finally {
      setIsRestoringMedia(false);
    }
  };

  // Submit and Save the data
  const handleSave = async (advance: boolean = false) => {
    if (!selectedPostId) return;

    setIsSaving(true);
    setMessage(null);

    // Prepare body payload
    const payload = {
      post_id: selectedPostId,
      country_id: countryId ? parseInt(countryId, 10) : null,
      trip_id: tripId ? parseInt(tripId, 10) : null,
      new_trip: isCreatingTrip && newTripName.trim() ? {
        name: newTripName.trim(),
        start_date: newTripStartDate || null,
        end_date: newTripEndDate || null,
      } : null,
      actual_date: actualDate ? `${actualDate}T12:00:00Z` : null, // mid-day timezone fallback
      title: title.trim() || null,
      is_enriched: isEnriched,
      latitude: latitude !== null ? latitude : null,
      longitude: longitude !== null ? longitude : null,
      city: city || null,
      region: region || null,
      location_name: locationName || null,
      companions: companions.length > 0 ? companions : null,
      travel_mode: travelMode || null,
      weather: weather || null,
      mood: mood || null,
      highlights: highlights.length > 0 ? highlights : null,
      tags: postTags.length > 0 ? postTags : null,
      media_tags: Object.entries(mediaTags).map(([id, t]) => ({
        media_id: parseInt(id, 10),
        tags: t,
      })),
    };

    try {
      const res = await fetch("/api/admin/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save post.");
      }

      // Update state in posts array so sidebar immediately reflects update
      const updatedTripId = data.trip_id || payload.trip_id;
      const updatedPosts = posts.map((p) => {
        if (p.post_id === selectedPostId) {
          return {
            ...p,
            country_id: payload.country_id,
            trip_id: updatedTripId,
            actual_date: payload.actual_date || p.actual_date,
            title: payload.title,
            is_enriched: payload.is_enriched,
            latitude: payload.latitude,
            longitude: payload.longitude,
            companions: payload.companions,
            travel_mode: payload.travel_mode,
            weather: payload.weather,
            mood: payload.mood,
            highlights: payload.highlights,
            tags: payload.tags,
          };
        }
        return p;
      });

      setPosts(updatedPosts);
      setMessage({ text: "Post successfully saved!", type: "success" });

      // Refresh option lists if a new trip was created
      if (data.trip_id && isCreatingTrip) {
        const optRes = await fetch("/api/admin/options");
        const optData = await optRes.json();
        if (optData.success) {
          setOptions(optData);
        }
      }

      // Auto-advance to next post if selected
      if (advance && selectedPostIndex < posts.length - 1) {
        // Find next post ID matching the current active filter
        const filtered = getFilteredPosts(updatedPosts);
        const currentFilteredIndex = filtered.findIndex(p => p.post_id === selectedPostId);
        if (currentFilteredIndex !== -1 && currentFilteredIndex < filtered.length - 1) {
          setSelectedPostId(filtered[currentFilteredIndex + 1].post_id);
        } else {
          // Fallback to absolute next post
          setSelectedPostId(posts[selectedPostIndex + 1].post_id);
        }
      }
    } catch (err: any) {
      console.error("Save error:", err);
      setMessage({ text: err.message || "Error occurred while saving.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  // Helper to filter posts based on query, tabs and year
  const getFilteredPosts = (postList: PostItem[]) => {
    return postList.filter((post) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = post.title?.toLowerCase().includes(query) || false;
        const matchesSummary = post.summary?.toLowerCase().includes(query) || false;
        const matchesId = post.post_id.includes(query);
        if (!matchesTitle && !matchesSummary && !matchesId) return false;
      }

      // 2. Tab Filter
      const isPostEnriched = post.is_enriched || (post.latitude !== null && post.longitude !== null && post.country_id !== null);
      const hasCoords = post.latitude !== null && post.longitude !== null;
      const hasCountry = post.country_id !== null;
      const hasTrip = post.trip_id !== null;

      if (filterMode === "missing_coords") {
        if (isPostEnriched || hasCoords) return false;
      } else if (filterMode === "missing_country") {
        if (isPostEnriched || hasCountry) return false;
      } else if (filterMode === "missing_trip") {
        if (isPostEnriched || hasTrip) return false;
      } else if (filterMode === "enriched") {
        if (!isPostEnriched) return false;
      }

      // 3. Year Filter
      if (selectedYear !== "all") {
        const dateStr = post.actual_date || post.post_date;
        if (dateStr) {
          const postYear = new Date(dateStr).getFullYear().toString();
          if (postYear !== selectedYear) return false;
        } else {
          return false;
        }
      }

      return true;
    });
  };

  const filteredPosts = useMemo(() => {
    return getFilteredPosts(posts);
  }, [posts, searchQuery, filterMode, selectedYear]);

  // Compute overall completion stats
  const stats = useMemo(() => {
    const total = posts.length;
    const hasCoords = posts.filter(p => p.latitude !== null && p.longitude !== null).length;
    const hasCountry = posts.filter(p => p.country_id !== null).length;
    const enriched = posts.filter(p => p.is_enriched || (p.latitude !== null && p.longitude !== null && p.country_id !== null)).length;

    return { total, hasCoords, hasCountry, enriched };
  }, [posts]);

  // Dynamic Combobox Helper components inside page context for clean state access
  const CreatableSelect = ({
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
  }) => {
    const [inputValue, setInputValue] = useState(value);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
      setInputValue(value);
    }, [value]);

    const filteredSuggestions = (inputValue === value || !inputValue)
      ? suggestions
      : suggestions.filter(s => s.toLowerCase().includes(inputValue.toLowerCase()));

    const showCreateOption = inputValue.trim() !== "" && !suggestions.some(s => s.toLowerCase() === inputValue.toLowerCase().trim());

    return (
      <div className="relative font-body text-xs flex flex-col gap-1 w-full">
        <span className="overline text-[10px] text-dust font-medium">{label}</span>
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
            className="w-full px-3 py-1.5 border border-cream rounded-xs text-ink focus:outline-none focus:border-amber bg-white font-light"
          />
          {isOpen && (filteredSuggestions.length > 0 || showCreateOption) && (
            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-cream rounded-xs shadow-lg z-50">
              {showCreateOption && (
                <button
                  type="button"
                  onMouseDown={() => {
                    onChange(inputValue.trim());
                    setInputValue(inputValue.trim());
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-2xs text-amber font-semibold bg-amber/5 hover:bg-amber/10 border-b border-cream"
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
                  className="w-full text-left px-3 py-1.5 hover:bg-cream/45 text-ink transition-colors font-light"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const CreatableMultiSelect = ({
    label,
    selectedItems,
    onChange,
    suggestions,
    placeholder
  }: {
    label: string;
    selectedItems: string[];
    onChange: (items: string[]) => void;
    suggestions: string[];
    placeholder?: string;
  }) => {
    const [inputValue, setInputValue] = useState("");
    const [isOpen, setIsOpen] = useState(false);

    const isCompanions = label.includes("Begleiter") || label.toLowerCase().includes("companions");

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
        <span className="overline text-[10px] text-dust font-medium">{label}</span>

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
            className="w-full px-3 py-1.5 border border-cream rounded-xs text-ink focus:outline-none focus:border-amber bg-white font-light"
          />
          {isOpen && (filteredSuggestions.length > 0 || showCreateOption) && (
            <div className="absolute left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-cream rounded-xs shadow-lg z-50">
              {showCreateOption && (
                <button
                  type="button"
                  onMouseDown={() => handleAdd(inputValue)}
                  className="w-full text-left px-3 py-2 text-2xs text-amber font-semibold bg-amber/5 hover:bg-amber/10 border-b border-cream"
                >
                  Create &quot;{inputValue.trim()}&quot;
                </button>
              )}
              {filteredSuggestions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onMouseDown={() => handleAdd(opt)}
                  className="w-full text-left px-3 py-1.5 hover:bg-cream/45 text-ink transition-colors font-light"
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-paper text-ink overflow-hidden">
      {/* Admin Header */}
      <header className="bg-white border-b border-ink/5 py-3 px-6 flex justify-between items-center shadow-xs flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <span className="overline tracking-widest text-[9px] bg-amber/10 px-2 py-0.5 text-amber rounded-sm font-semibold">Admin Panel</span>
          <h1 className="font-display font-black text-xl text-ink leading-none">Travel Diary Annotation Dashboard</h1>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-4 text-xs font-body">
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex gap-3 text-2xs text-dust font-medium">
              <span>Map coordinates: <strong className="text-ink">{stats.hasCoords}/{stats.total}</strong></span>
              <span>Country: <strong className="text-ink">{stats.hasCountry}/{stats.total}</strong></span>
            </div>
            <div className="text-xs text-ink font-semibold">
              Enriched: {stats.enriched} / {stats.total} posts ({Math.round((stats.enriched / stats.total) * 100)}%)
            </div>
          </div>
          <div className="w-32 bg-cream h-2.5 rounded-full overflow-hidden border border-ink/5 shadow-inner">
            <div
              className="bg-amber h-full transition-all duration-500 ease-out"
              style={{ width: `${(stats.enriched / stats.total) * 100}%` }}
            />
          </div>
          <a
            href="/"
            className="px-3.5 py-1.5 border border-ink/10 hover:border-amber text-xs font-semibold rounded-xs hover:text-amber transition-colors select-none font-body"
          >
            Exit Tagger
          </a>
        </div>
      </header>

      {/* Main Workspace Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 1. LEFT SIDEBAR: Chronological Post List */}
        <aside className="w-80 border-r border-ink/5 bg-white flex flex-col flex-shrink-0 min-h-0">
          {/* Sidebar Search and Filters */}
          <div className="p-4 border-b border-ink/5 flex flex-col gap-3">
            <input
              type="text"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-1.5 border border-cream rounded-xs text-xs font-body text-ink focus:outline-none focus:border-amber bg-paper/30 font-light"
            />

            {/* Year Filter */}
            <div className="flex items-center justify-between gap-2 text-2xs font-body border-t border-cream/30 pt-1.5">
              <span className="text-dust font-medium uppercase tracking-wider text-[9px]">Filter by Year</span>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-2 py-1 border border-cream rounded-xs text-ink focus:outline-none focus:border-amber bg-white font-light text-[11px] min-w-[100px]"
              >
                <option value="all">All Years</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Tabs */}
            <div className="grid grid-cols-2 gap-1.5 bg-paper/50 p-1 rounded-sm border border-ink/5">
              <button
                onClick={() => setFilterMode("all")}
                className={`py-1 rounded-xs text-[10px] font-bold uppercase transition-all ${filterMode === "all" ? "bg-amber text-white shadow-xs" : "text-dust hover:text-ink"
                  }`}
              >
                All ({posts.length})
              </button>
              <button
                onClick={() => setFilterMode("missing_coords")}
                className={`py-1 rounded-xs text-[10px] font-bold uppercase transition-all ${filterMode === "missing_coords" ? "bg-amber text-white shadow-xs" : "text-dust hover:text-ink"
                  }`}
              >
                Missing Pin
              </button>
              <button
                onClick={() => setFilterMode("missing_country")}
                className={`py-1 rounded-xs text-[10px] font-bold uppercase transition-all ${filterMode === "missing_country" ? "bg-amber text-white shadow-xs" : "text-dust hover:text-ink"
                  }`}
              >
                No Country
              </button>
              <button
                onClick={() => setFilterMode("enriched")}
                className={`py-1 rounded-xs text-[10px] font-bold uppercase transition-all ${filterMode === "enriched" ? "bg-amber text-white shadow-xs" : "text-dust hover:text-ink"
                  }`}
              >
                Enriched
              </button>
            </div>
          </div>

          {/* Scrollable Post List */}
          <div className="flex-1 overflow-y-auto divide-y divide-ink/5">
            {filteredPosts.length === 0 ? (
              <div className="p-8 text-center text-xs text-dust font-body italic">
                No matching posts.
              </div>
            ) : (
              filteredPosts.map((post, idx) => {
                const isSelected = post.post_id === selectedPostId;
                const isPostEnriched = post.is_enriched || (post.latitude !== null && post.longitude !== null && post.country_id !== null);
                const date = new Date(post.actual_date || post.post_date);
                const formattedDate = date.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "2-digit",
                });

                return (
                  <button
                    key={post.post_id}
                    onClick={() => setSelectedPostId(post.post_id)}
                    className={`w-full text-left p-3.5 flex flex-col gap-1 transition-all ${isSelected
                      ? "bg-amber/5 border-l-4 border-amber pl-2.5"
                      : "hover:bg-cream/15"
                      }`}
                  >
                    <div className="flex justify-between items-center gap-2">
                      <span className="text-[10px] font-mono text-dust tracking-wider uppercase font-semibold">
                        {formattedDate}
                      </span>
                      <span className={`text-[9px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-sm ${isPostEnriched
                        ? "bg-green-100 text-green-800"
                        : "bg-amber/10 text-amber"
                        }`}>
                        {isPostEnriched ? "Enriched" : "Draft"}
                      </span>
                    </div>
                    <h4 className="font-display font-bold text-xs text-ink line-clamp-1 leading-tight">
                      {post.title || "Untitled Moment"}
                    </h4>
                    {post.summary && (
                      <p className="text-[10px] text-dust font-body font-light line-clamp-1">
                        {post.summary}
                      </p>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </aside>

        {/* 2. CENTER PANEL: Selected Post Content Preview */}
        <section className="flex-1 flex flex-col min-w-0 border-r border-ink/5 bg-paper/30 overflow-y-auto">
          {isLoadingDetails ? (
            <div className="flex-1 flex items-center justify-center p-12">
              <div className="text-center font-body text-xs text-dust">
                <div className="w-6 h-6 border-2 border-amber border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                Loading post blocks...
              </div>
            </div>
          ) : selectedPost && postDetails ? (
            <div className="p-8 max-w-2xl mx-auto w-full space-y-6">
              {/* Post Heading */}
              <div className="border-b border-ink/10 pb-4">
                <span className="overline text-[10px]">
                  Post ID: {selectedPost.post_id}
                </span>
                <h2 className="font-display font-black text-2xl md:text-3xl text-ink mt-1 mb-2 leading-tight">
                  {selectedPost.title || "Untitled Moment"}
                </h2>
                <p className="text-dust text-xs font-body font-light flex items-center justify-between mt-1">
                  <span>Original Date: {new Date(selectedPost.post_date).toLocaleString("en-GB")}</span>
                  {expectedMediaCount !== null && expectedMediaCount !== undefined && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-xs font-semibold ${expectedMediaCount > mediaList.length
                      ? "bg-red-50 text-red-600 border border-red-100"
                      : "bg-green-50 text-green-700 border border-green-100"
                      }`}>
                      Media: {mediaList.length} / {expectedMediaCount} {expectedMediaCount > mediaList.length ? "⚠️ Missing" : "✅"}
                    </span>
                  )}
                </p>
              </div>

              {/* Missing Media Alert */}
              {expectedMediaCount > mediaList.length && (
                <div className="p-3.5 bg-red-50/50 border border-red-200/50 rounded-sm text-xs text-red-700 flex flex-col gap-3 shadow-2xs">
                  <div className="flex items-start gap-2.5">
                    <span className="text-sm select-none">⚠️</span>
                    <div className="flex-1">
                      <strong className="font-semibold">Missing Media Record Alert:</strong> This post has `media_count = {expectedMediaCount}` in its metadata, but only `{mediaList.length}` row{mediaList.length !== 1 ? "s exist" : " exists"} in the `media` table.
                      <p className="text-[10px] text-red-600/80 mt-1 font-light leading-normal">
                        The image/video file is not in R2 or the database record is missing.
                      </p>

                      {/* Display missing blocks details */}
                      {missingBlocks.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-red-200/40 pt-2.5 text-[11px]">
                          <span className="font-semibold text-red-800">Missing/External Media Details:</span>
                          <ul className="list-disc pl-4 space-y-1 text-[10px] text-red-700/90 font-light">
                            {missingBlocks.map((mb) => (
                              <li key={mb.index}>
                                {mb.type === "video" && mb.provider ? (
                                  <span>
                                    Block {mb.index}: External {mb.provider} Video —{" "}
                                    {mb.url ? (
                                      <a
                                        href={mb.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-red-800 hover:text-red-900 underline font-semibold"
                                      >
                                        Open YouTube/Video Link
                                      </a>
                                    ) : (
                                      "No URL found"
                                    )}
                                  </span>
                                ) : (
                                  <span>
                                    Block {mb.index}: {mb.type.charAt(0).toUpperCase() + mb.type.slice(1)} record is missing from the database.
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-end border-t border-red-200/30 pt-2.5">
                    <button
                      type="button"
                      disabled={isRestoringMedia}
                      onClick={handleRestoreMedia}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-xs text-[10px] font-bold uppercase tracking-wider hover:bg-red-700 active:bg-red-800 disabled:opacity-50 flex items-center gap-1.5 shadow-xs transition-all"
                    >
                      {isRestoringMedia ? (
                        <>
                          <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                          Restoring...
                        </>
                      ) : (
                        "Restore Media from Tumblr"
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Text / Image Rendering */}
              <div className="font-body leading-relaxed text-ink space-y-6 text-sm">
                <ContentBlocksRenderer
                  blocks={postDetails.content_blocks}
                  mediaList={mediaList}
                />
              </div>

              {/* Media Tagging Inputs */}
              {mediaList.filter(m => m.media_type === "image").length > 0 && (
                <div className="border-t border-ink/10 pt-6 mt-8">
                  <h3 className="font-display font-bold text-sm text-ink mb-4">
                    Media Hashtags (Tag specific photos)
                  </h3>
                  <div className="space-y-4">
                    {mediaList
                      .filter((m) => m.media_type === "image")
                      .map((media, index) => {
                        const url = media.storage_path || media.original_url;
                        return (
                          <div
                            key={media.media_id}
                            className="flex gap-4 p-3 bg-white border border-ink/5 rounded-sm shadow-xs hover:border-amber/25 transition-colors"
                          >
                            <div className="relative w-16 h-16 bg-cream border border-ink/5 rounded-xs overflow-hidden flex-shrink-0">
                              <img src={url} alt="tagging visual" className="object-cover w-full h-full" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <CreatableMultiSelect
                                label={`Image #${index + 1} Tags`}
                                selectedItems={mediaTags[media.media_id] || []}
                                onChange={(tags) => {
                                  setMediaTags({
                                    ...mediaTags,
                                    [media.media_id]: tags,
                                  });
                                }}
                                suggestions={options.mediaTags}
                                placeholder="Type tag (e.g. stamp, title) and press Enter..."
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center p-12 text-center text-xs text-dust italic font-body">
              Select a post from the list to start enrichment.
            </div>
          )}
        </section>

        {/* 3. RIGHT PANEL: Enrichment Form & Interactive Map */}
        <aside className="w-[26rem] flex flex-col flex-shrink-0 min-h-0 bg-white shadow-md z-10">
          {/* Top Half: Interactive Map */}
          <div className="h-64 border-b border-ink/5 flex-shrink-0 relative bg-cream">
            <EnrichMap
              latitude={latitude}
              longitude={longitude}
              prevLatitude={prevCoordinates.lat}
              prevLongitude={prevCoordinates.lng}
              onCoordinatesChange={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              onLocationFound={handleLocationFound}
            />
          </div>

          {/* Bottom Half: Input Form */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {selectedPost ? (
              <>
                {/* Lat/Lng Indicator and Reverse Geocode Suggested address */}
                <div className="p-3 bg-paper/40 border border-cream rounded-sm flex flex-col gap-2">
                  <div className="flex justify-between items-center text-3xs font-mono text-dust">
                    <span>LATITUDE: {latitude !== null ? latitude.toFixed(6) : "N/A"}</span>
                    <span>LONGITUDE: {longitude !== null ? longitude.toFixed(6) : "N/A"}</span>
                  </div>
                  {geoSuggestion ? (
                    <div className="flex flex-col gap-1.5 bg-amber/5 p-2 rounded-xs border border-amber/10">
                      <span className="text-[10px] text-amber font-semibold uppercase tracking-wider leading-none">Map Location Found</span>
                      <div className="text-xs text-ink leading-tight">
                        {[geoSuggestion.city, geoSuggestion.region, geoSuggestion.country].filter(Boolean).join(", ")}
                      </div>
                      <button
                        type="button"
                        onClick={applyGeoSuggestion}
                        className="text-left text-[10px] font-bold text-amber hover:underline mt-0.5"
                      >
                        Apply Location details & Country &rarr;
                      </button>
                    </div>
                  ) : (
                    <div className="text-3xs text-dust italic leading-normal">
                      .
                    </div>
                  )}
                </div>

                {/* Post Title & Enriched Toggle */}
                <div className="flex gap-4 items-end">
                  <div className="flex-1 flex flex-col gap-1 text-xs font-body">
                    <span className="overline text-[10px] text-dust font-medium">Post Title</span>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter post title (e.g. A beautiful sunset)..."
                      className="w-full px-3 py-1.5 border border-cream rounded-xs text-ink focus:outline-none focus:border-amber bg-white font-light"
                    />
                  </div>
                  <label className="flex items-center gap-2 pb-2 cursor-pointer text-xs font-body select-none">
                    <input
                      type="checkbox"
                      checked={isEnriched}
                      onChange={(e) => setIsEnriched(e.target.checked)}
                      className="w-4 h-4 rounded-xs border-cream text-amber focus:ring-amber focus:ring-opacity-25"
                    />
                    <span className="overline text-[10px] text-dust font-medium">Mark Enriched</span>
                  </label>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Travel Date */}
                  <div className="flex flex-col gap-1 text-xs font-body">
                    <span className="overline text-[10px] text-dust font-medium">Actual Date</span>
                    <input
                      type="date"
                      value={actualDate}
                      onChange={(e) => setActualDate(e.target.value)}
                      className="w-full px-3 py-1.5 border border-cream rounded-xs text-ink focus:outline-none focus:border-amber bg-white font-light"
                    />
                  </div>

                  {/* Country Selection */}
                  <div className="flex flex-col gap-1 text-xs font-body">
                    <span className="overline text-[10px] text-dust font-medium">Country (Land)</span>
                    <select
                      value={countryId}
                      onChange={(e) => setCountryId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-cream rounded-xs text-ink focus:outline-none focus:border-amber bg-white font-light"
                    >
                      <option value="">Select country...</option>
                      {options.countries.map((c: any) => (
                        <option key={c.country_id} value={c.country_id}>
                          {c.name} {c.name_de ? `(${c.name_de})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Location specific text boxes */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1 text-xs font-body col-span-1">
                    <span className="overline text-[10px] text-dust font-medium">City</span>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Rome"
                      className="w-full px-2 py-1.5 border border-cream rounded-xs text-ink focus:outline-none focus:border-amber bg-white font-light text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-body col-span-1">
                    <span className="overline text-[10px] text-dust font-medium">Region</span>
                    <input
                      type="text"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      placeholder="e.g. Lazio"
                      className="w-full px-2 py-1.5 border border-cream rounded-xs text-ink focus:outline-none focus:border-amber bg-white font-light text-xs"
                    />
                  </div>
                  <div className="flex flex-col gap-1 text-xs font-body col-span-1">
                    <span className="overline text-[10px] text-dust font-medium">Location Name</span>
                    <input
                      type="text"
                      value={locationName}
                      onChange={(e) => setLocationName(e.target.value)}
                      placeholder="e.g. Colosseum"
                      className="w-full px-2 py-1.5 border border-cream rounded-xs text-ink focus:outline-none focus:border-amber bg-white font-light text-xs"
                    />
                  </div>
                </div>

                {/* Trip Selector with inline create capabilities */}
                <div className="flex flex-col gap-1.5 text-xs font-body border-t border-ink/5 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="overline text-[10px] text-dust font-medium">Trip</span>
                    <button
                      type="button"
                      onClick={() => setIsCreatingTrip(!isCreatingTrip)}
                      className="text-[10px] font-bold text-amber hover:underline"
                    >
                      {isCreatingTrip ? "Select Existing Trip" : "+ Create New Trip"}
                    </button>
                  </div>

                  {!isCreatingTrip ? (
                    <select
                      value={tripId}
                      onChange={(e) => setTripId(e.target.value)}
                      className="w-full px-3 py-1.5 border border-cream rounded-xs text-ink focus:outline-none focus:border-amber bg-white font-light"
                    >
                      <option value="">No Trip Associated</option>
                      {options.trips.map((t: any) => (
                        <option key={t.trip_id} value={t.trip_id}>
                          {t.trip_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="p-3 bg-paper/50 border border-cream rounded-xs space-y-2">
                      <div className="flex flex-col gap-1">
                        <span className="text-[9px] text-dust uppercase font-bold">New Trip Name</span>
                        <input
                          type="text"
                          value={newTripName}
                          onChange={(e) => setNewTripName(e.target.value)}
                          placeholder="e.g. Balkan Bike Tour 2026"
                          className="w-full px-2 py-1 border border-cream rounded-xs text-xs font-light focus:outline-none focus:border-amber bg-white"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-dust uppercase font-bold">Start Date</span>
                          <input
                            type="date"
                            value={newTripStartDate}
                            onChange={(e) => setNewTripStartDate(e.target.value)}
                            className="w-full px-2 py-1 border border-cream rounded-xs text-2xs focus:outline-none focus:border-amber bg-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] text-dust uppercase font-bold">End Date</span>
                          <input
                            type="date"
                            value={newTripEndDate}
                            onChange={(e) => setNewTripEndDate(e.target.value)}
                            className="w-full px-2 py-1 border border-cream rounded-xs text-2xs focus:outline-none focus:border-amber bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Companions multi-select */}
                <div className="border-t border-ink/5 pt-3">
                  <CreatableMultiSelect
                    label="Companions (Begleiter)"
                    selectedItems={companions}
                    onChange={setCompanions}
                    suggestions={options.companions}
                    placeholder="Search or type companion name..."
                  />
                  {selectedPost.companions?.length === 0 && prevCompanions && prevCompanions.length > 0 && companions === prevCompanions && (
                    <p className="text-[9px] text-amber italic mt-1 font-light">
                      Prefilled automatically from previous post
                    </p>
                  )}
                </div>

                {/* Travel Mode, Weather, Mood */}
                <div className="border-t border-ink/5 pt-3 grid grid-cols-3 gap-2">
                  <CreatableSelect
                    label="Transport"
                    value={travelMode}
                    onChange={setTravelMode}
                    suggestions={Array.from(new Set([
                      ...options.travelModes,
                      "foot", "bike", "paraglide", "vespa/scooter", "car", "train", "bus", "ferry", "boat", "flight", "hitchhike", "tuk-tuk", "kayak", "cable car"
                    ])).sort()}
                    placeholder="e.g. bike"
                  />
                  <CreatableSelect
                    label="Weather"
                    value={weather}
                    onChange={setWeather}
                    suggestions={Array.from(new Set([
                      ...options.weather,
                      "sunny", "golden hour sun", "perfect breeze", "cloudy", "overcast", "foggy", "misty", "windy", "rainy", "tropical downpour", "stormy", "snowy", "cold", "hot", "humid"
                    ])).sort()}
                    placeholder="e.g. sunny"
                  />
                  <CreatableSelect
                    label="Mood"
                    value={mood}
                    onChange={setMood}
                    suggestions={Array.from(new Set([
                      ...options.moods,
                      "happy", "excited", "scared", "in love", "joyful", "thankful", "lost in awe", "adventurous", "curious", "peaceful", "relaxed", "thoughtful", "nostalgic", "tired", "exhausted but happy", "energetic", "melancholic", "stressed", "sad", "lonely", "sick", "angry"
                    ])).sort()}
                    placeholder="e.g. happy"
                  />
                </div>

                {/* Highlights and Post tags */}
                <div className="border-t border-ink/5 pt-3 space-y-3">
                  <CreatableMultiSelect
                    label="Daily Highlights"
                    selectedItems={highlights}
                    onChange={setHighlights}
                    suggestions={options.highlights}
                    placeholder="Add highlight (e.g. dolphins, flat tire)..."
                  />

                  <CreatableMultiSelect
                    label="Post Hashtags"
                    selectedItems={postTags}
                    onChange={setPostTags}
                    suggestions={options.postTags}
                    placeholder="Add tags..."
                  />
                </div>
              </>
            ) : (
              <div className="text-center text-xs text-dust italic font-body pt-8">
                No active form.
              </div>
            )}
          </div>

          {/* Footer Controls: Save actions */}
          <div className="p-4 border-t border-ink/5 flex-shrink-0 bg-white flex flex-col gap-2.5">
            {message && (
              <div className={`p-2.5 text-xs rounded-xs font-body font-medium leading-snug border ${message.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
                }`}>
                {message.text}
              </div>
            )}

            {selectedPost ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={isSaving}
                  className="flex-1 py-2 px-4 border border-ink/10 hover:border-amber text-ink hover:text-amber font-body font-semibold text-xs rounded-xs transition-colors shadow-xs hover:shadow-sm"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  disabled={isSaving}
                  className="flex-[2] py-2 px-4 bg-amber hover:bg-amber/95 text-white font-body font-semibold text-xs rounded-xs shadow-sm hover:shadow-md transition-all active:translate-y-0.5"
                >
                  {isSaving ? "Saving..." : "Save & Next →"}
                </button>
              </div>
            ) : null}

            {/* Navigation buttons */}
            {selectedPost ? (
              <div className="flex justify-between items-center text-2xs font-body text-dust px-1">
                <button
                  type="button"
                  disabled={selectedPostIndex <= 0}
                  onClick={() => setSelectedPostId(posts[selectedPostIndex - 1].post_id)}
                  className="hover:text-amber disabled:opacity-30 transition-colors font-semibold"
                >
                  &larr; Previous Post
                </button>
                <span>{selectedPostIndex + 1} of {posts.length}</span>
                <button
                  type="button"
                  disabled={selectedPostIndex >= posts.length - 1}
                  onClick={() => setSelectedPostId(posts[selectedPostIndex + 1].post_id)}
                  className="hover:text-amber disabled:opacity-30 transition-colors font-semibold"
                >
                  Next Post &rarr;
                </button>
              </div>
            ) : null}
          </div>
        </aside>
      </div>
    </div>
  );
}
