"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import ContentBlocksRenderer from "@/components/ContentBlocksRenderer";
import PostFooter from "@/components/PostFooter";
import PostSeparator from "@/components/PostSeparators";
import PostDetailsDropdown from "@/components/PostDetailsDropdown";

type TripContentProps = {
  posts: any[];
  fullPosts: any[];
  media: any[];
  tripId: number;
};





export default function TripContent({ posts, fullPosts, media, tripId }: TripContentProps) {
  const [viewMode, setViewMode] = useState<"journal" | "timeline">("journal");
  const [showNav, setShowNav] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Extract unique countries in chronological order of their first appearance
  const countriesInTrip: { name: string; postId: string; isoCode?: string }[] = [];
  const seenCountries = new Set<string>();

  fullPosts.forEach((post) => {
    const countryName = post.country?.name;
    if (countryName) {
      if (!seenCountries.has(countryName)) {
        seenCountries.add(countryName);
        countriesInTrip.push({
          name: countryName,
          postId: post.post_id,
          isoCode: post.country?.iso_code,
        });
      }
    }
  });

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowNav(true);
      } else {
        setShowNav(false);
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setIsOpen(false);
  };

  const scrollToPost = (postId: string) => {
    const element = document.getElementById(`post-${postId}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
    setIsOpen(false);
  };

  if (posts.length === 0) {
    return (
      <div className="text-center py-12 bg-cream/20 rounded-sm border border-cream border-dashed">
        <p className="font-body text-dust text-sm">No entries have been recorded for this trip yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Smooth Tab Switcher */}
      <div className="flex justify-center mb-10">
        <div className="relative flex p-0.5 bg-cream/50 rounded-full border border-ink/5 w-full max-w-[200px]">
          {/* Active pill background slider */}
          <div
            className="absolute top-0.5 bottom-0.5 rounded-full bg-white shadow-sm transition-all duration-300 ease-in-out"
            style={{
              width: "calc(50% - 2px)",
              left: viewMode === "journal" ? "2px" : "50%",
            }}
          />
          <button
            onClick={() => setViewMode("journal")}
            className={`relative z-10 flex-1 py-1 text-2xs uppercase tracking-widest font-body font-medium transition-colors duration-300 ${
              viewMode === "journal" ? "text-ink font-semibold" : "text-dust hover:text-ink"
            }`}
          >
            Journal
          </button>
          <button
            onClick={() => setViewMode("timeline")}
            className={`relative z-10 flex-1 py-1 text-2xs uppercase tracking-widest font-body font-medium transition-colors duration-300 ${
              viewMode === "timeline" ? "text-ink font-semibold" : "text-dust hover:text-ink"
            }`}
          >
            Timeline
          </button>
        </div>
      </div>

      {/* Dynamic View Sections */}
      <div className="relative">
        {/* JOURNAL VIEW (Default) */}
        {viewMode === "journal" && (
          <div key="journal-view" className="animate-fade-in max-w-2xl mx-auto space-y-16">
            {fullPosts.map((post: any, index: number) => {
              const pDate = new Date(post.actual_date || post.post_date);
              const postCountry = post.country as any;

              return (
                <div key={post.post_id} id={`post-${post.post_id}`} className="scroll-mt-32">
                  <article className="space-y-6">
                    {/* Metadata and details line */}
                    <div className="flex justify-between items-center w-full relative pb-2 border-b border-ink/5">
                      <div className="flex flex-wrap items-center gap-3 text-xs text-dust font-body">
                        <time className="font-semibold text-ink tabular-nums">
                          {pDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </time>
                        <span className="text-dust/40">·</span>
                        <span>
                          {post.city && `${post.city}, `}
                          {postCountry?.name || post.country?.name}
                        </span>
                      </div>
                      {(post.travel_mode || post.weather || post.mood) && (
                        <PostDetailsDropdown post={post} />
                      )}
                    </div>

                    {/* Inline post title */}
                    {post.title && (
                      <div className="flex justify-center w-full py-1">
                        <h2 className="font-display font-bold text-lg md:text-xl text-center">
                          <a 
                            href={`/post/${post.post_id}`} 
                            className="text-ink hover:text-amber transition-colors duration-300 relative group"
                          >
                            {post.title}
                            <span className="absolute left-0 right-0 bottom-0 h-[1px] bg-amber/0 group-hover:bg-amber/40 transition-colors duration-300" />
                          </a>
                        </h2>
                      </div>
                    )}

                    {/* Content Blocks */}
                    <section className="font-body leading-relaxed text-ink space-y-8">
                      <ContentBlocksRenderer
                        blocks={post.content_blocks}
                        mediaList={media}
                        postId={post.post_id}
                        headingShift={true}
                      />
                    </section>

                    {/* Interactive Post Footer (Map, Emojis, Impulse) */}
                    <PostFooter postId={post.post_id} tripId={tripId} />
                  </article>

                  {/* Graphical decorative flourish separator between posts */}
                  {index < fullPosts.length - 1 && (
                    <PostSeparator postId={post.post_id} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* TIMELINE VIEW (Current) */}
        {viewMode === "timeline" && (
          <div key="timeline-view" className="animate-fade-in relative border-l border-ink/10 pl-6 ml-4 space-y-12 py-4">
            {posts.map((post: any, index: number) => {
              const pDate = new Date(post.actual_date || post.post_date);
              const postCountry = post.country as any;

              return (
                <div key={post.post_id} id={`post-${post.post_id}`} className="relative group scroll-mt-32">
                  {/* Timeline bullet */}
                  <div className="absolute -left-[31px] top-1.5 w-4.5 h-4.5 rounded-full border border-ink/20 bg-paper flex items-center justify-center transition-colors group-hover:border-amber group-hover:bg-amber/10 duration-300">
                    <div className="w-1.5 h-1.5 rounded-full bg-dust group-hover:bg-amber transition-colors duration-300" />
                  </div>

                  {/* Post details */}
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Date/Location metadata */}
                    <div className="w-full md:w-44 shrink-0 md:pt-1 flex flex-col items-start gap-2">
                      <div>
                        <time className="block text-sm font-semibold text-ink font-body tabular-nums">
                          {pDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </time>
                        <span className="block text-2xs text-dust font-body mt-1">
                          {post.city && `${post.city}, `}
                          {postCountry?.name || post.country?.name}
                        </span>
                      </div>
                      {(post.travel_mode || post.weather || post.mood) && (
                        <PostDetailsDropdown post={post} />
                      )}
                    </div>

                    {/* Card container */}
                    <a
                      href={`/post/${post.post_id}`}
                      className="flex-1 w-full flex flex-col sm:flex-row bg-white border border-ink/5 rounded-sm overflow-hidden hover:border-amber/40 hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5"
                    >
                      {/* Post Thumbnail (if available) */}
                      {post.thumbnail_path && (
                        <div className="relative w-full sm:w-40 h-40 sm:h-auto shrink-0 bg-cream">
                          <Image
                            src={post.thumbnail_path}
                            alt={post.title || "Post thumbnail"}
                            fill
                            sizes="(max-width: 640px) 100vw, 160px"
                            className="object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                      )}

                      {/* Content block */}
                      <div className="p-6 flex flex-col justify-center flex-1">
                        <div>
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="font-display font-bold text-lg text-ink group-hover:text-amber transition-colors">
                              {post.title || `Memory ${index + 1}`}
                            </h3>
                            
                            {/* Media count inline with header */}
                            {post.media_count > 0 && (
                              <div className="flex items-center gap-1 text-dust text-[10px] uppercase tracking-wider font-body shrink-0 pt-1.5">
                                <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                                  <rect x="1" y="2" width="10" height="8" rx="1" stroke="currentColor" strokeWidth="1" />
                                  <circle cx="6" cy="6" r="1.5" stroke="currentColor" strokeWidth="1" />
                                </svg>
                                <span>{post.media_count}</span>
                              </div>
                            )}
                          </div>
                          
                          {post.summary && (
                            <p className="font-body text-sm text-dust leading-relaxed line-clamp-2 mt-2">
                              {post.summary}
                            </p>
                          )}
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Trip Navigation Helper */}
      {showNav && (
        <div ref={navRef} className="fixed bottom-6 right-6 z-40 font-body">
          {countriesInTrip.length > 1 ? (
            <div className="relative">
              {/* Dropdown Menu (Opens Upward) */}
              {isOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-48 bg-white/90 backdrop-blur-md border border-ink/10 rounded-lg shadow-xl z-50 animate-fade-in flex flex-col max-h-[60vh] md:max-h-[70vh]">
                  {/* Sticky Top: Start link */}
                  <div className="py-1 border-b border-ink/5 shrink-0 sticky top-0 rounded-t-lg z-10 bg-white/50 backdrop-blur-sm">
                    <button
                      onClick={scrollToTop}
                      className="w-full flex items-center gap-2 px-3 py-2 text-2xs uppercase tracking-wider text-left text-dust hover:text-amber hover:bg-cream/40 transition-colors rounded-t-lg"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <line x1="12" y1="19" x2="12" y2="5"></line>
                        <polyline points="5 12 12 5 19 12"></polyline>
                      </svg>
                      <span>Start</span>
                    </button>
                  </div>
                  
                  {/* Scrollable Area: Countries */}
                  <div className="py-1 overflow-y-auto flex-1">
                    <div className="px-3 py-1 text-[9px] uppercase tracking-widest text-dust/60 font-semibold sticky top-0 bg-white/90 backdrop-blur-sm z-10">
                      Countries
                    </div>
                    <div className="divide-y divide-ink/5">
                      {countriesInTrip.map((country) => (
                        <button
                          key={country.postId}
                          onClick={() => scrollToPost(country.postId)}
                          className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-left text-ink hover:text-amber hover:bg-cream/40 transition-colors"
                        >
                          <span className="truncate pr-2">{country.name}</span>
                          {country.isoCode && (
                            <span className="text-[10px] uppercase font-mono text-dust/60 bg-cream/30 px-1 rounded shrink-0">
                              {country.isoCode}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Main Trigger Pill */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/80 hover:bg-white border border-ink/10 shadow-md hover:shadow-lg backdrop-blur-md transition-all duration-300 group text-ink"
                aria-label="Toggle navigation menu"
              >
                <svg className="w-4 h-4 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" className="opacity-20" />
                  <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
                </svg>
                <span className="text-2xs uppercase tracking-widest font-semibold text-ink group-hover:text-amber transition-colors">
                  Trip
                </span>
                <svg
                  className={`w-3.5 h-3.5 text-dust transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
            </div>
          ) : (
            // Simple Back-to-Top Button
            <button
              onClick={scrollToTop}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-white/80 hover:bg-white border border-ink/10 shadow-md hover:shadow-lg backdrop-blur-md transition-all duration-300 group text-ink"
              aria-label="Scroll to top"
            >
              <svg className="w-4 h-4 text-amber group-hover:-translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="19" x2="12" y2="5"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
