"use client";

import React, { useState } from "react";
import Image from "next/image";
import ContentBlocksRenderer from "@/components/ContentBlocksRenderer";

type TripContentProps = {
  posts: any[];
  fullPosts: any[];
  media: any[];
};

export default function TripContent({ posts, fullPosts, media }: TripContentProps) {
  const [viewMode, setViewMode] = useState<"journal" | "timeline">("journal");

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
              const pDate = new Date(post.post_date);
              const postCountry = post.country as any;

              return (
                <div key={post.post_id} className="scroll-mt-32">
                  <article className="space-y-6">
                    {/* Metadata line */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-dust font-body">
                      <time className="font-semibold text-ink tabular-nums">
                        {pDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </time>
                      <span className="text-dust/40">·</span>
                      <span>
                        {post.city && `${post.city}, `}
                        {postCountry?.name || post.country?.name}
                      </span>
                      {post.travel_mode && (
                        <>
                          <span className="text-dust/40">·</span>
                          <span className="uppercase tracking-widest text-[10px] bg-cream text-dust px-1.5 py-0.5 rounded-sm font-body">
                            {post.travel_mode}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Inline post title */}
                    {post.title && (
                      <h2 className="font-display font-black text-2xl md:text-3xl text-ink leading-tight">
                        {post.title}
                      </h2>
                    )}

                    {/* Weather/Mood bar */}
                    {(post.weather || post.mood) && (
                      <div className="flex flex-wrap gap-4 text-xs font-body text-dust py-2 border-y border-ink/5">
                        {post.weather && (
                          <div className="flex items-center">
                            <span className="overline text-[10px] text-dust/60 mr-1.5 select-none">Weather:</span>
                            <span className="text-ink font-medium">{post.weather}</span>
                          </div>
                        )}
                        {post.mood && (
                          <div className="flex items-center">
                            <span className="overline text-[10px] text-dust/60 mr-1.5 select-none">Mood:</span>
                            <span className="text-ink font-medium">{post.mood}</span>
                          </div>
                        )}
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
                  </article>

                  {/* Minimalist graphical separator between posts */}
                  {index < fullPosts.length - 1 && (
                    <div className="flex items-center justify-center my-16 select-none" aria-hidden="true">
                      <div className="w-16 h-[1px] bg-ink/10" />
                      <div className="w-1.5 h-1.5 rotate-45 bg-amber/75 mx-4" />
                      <div className="w-16 h-[1px] bg-ink/10" />
                    </div>
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
              const pDate = new Date(post.post_date);
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
                    <div className="w-full md:w-44 shrink-0 md:pt-1">
                      <time className="block text-sm font-semibold text-ink font-body tabular-nums">
                        {pDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                      </time>
                      <span className="block text-2xs text-dust font-body mt-1">
                        {post.city && `${post.city}, `}
                        {postCountry?.name || post.country?.name}
                      </span>
                      {post.travel_mode && (
                        <span className="inline-block mt-2 text-3xs uppercase tracking-widest bg-cream text-dust px-1.5 py-0.5 rounded-sm font-body">
                          {post.travel_mode}
                        </span>
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
    </div>
  );
}
