import React from "react";
import Image from "next/image";

type ContentBlocksRendererProps = {
  blocks: any[];
  mediaList: any[];
  postId?: number;
  headingShift?: boolean;
};

export default function ContentBlocksRenderer({
  blocks,
  mediaList,
  postId,
  headingShift = false,
}: ContentBlocksRendererProps) {
  if (!blocks) return null;

  const renderedElements: React.ReactNode[] = [];
  let i = 0;

  while (i < blocks.length) {
    const currentBlock = blocks[i];
    const isMedia = currentBlock.type === "image" || currentBlock.type === "video";

    if (isMedia) {
      // Find all consecutive media blocks that should be in the same group.
      const groupBlocks = [{ block: currentBlock, index: i }];
      let nextIndex = i + 1;

      while (nextIndex < blocks.length) {
        const nextBlock = blocks[nextIndex];
        const isNextMedia = nextBlock.type === "image" || nextBlock.type === "video";
        if (!isNextMedia) break;

        const prevBlock = groupBlocks[groupBlocks.length - 1].block;
        
        const sameRow = prevBlock.layout_row !== undefined && prevBlock.layout_row !== null &&
                        prevBlock.layout_row === nextBlock.layout_row;

        const isLeftRight = prevBlock.layout_position === 0 && nextBlock.layout_position === 1;

        if (sameRow || isLeftRight) {
          groupBlocks.push({ block: nextBlock, index: nextIndex });
          nextIndex++;
        } else {
          break;
        }
      }

      if (groupBlocks.length > 1) {
        // Render group
        const cols = groupBlocks.length;
        const gridClass = cols === 2 ? "grid-cols-1 md:grid-cols-2" : cols >= 3 ? "grid-cols-1 md:grid-cols-3" : "grid-cols-1";
        renderedElements.push(
          <div key={`group-${i}`} className={`my-10 grid gap-4 ${gridClass}`}>
            {groupBlocks.map(({ block, index }) => (
              <div key={index} className="w-full">
                {block.type === "image"
                  ? renderImageBlockWithoutOuterGrid(block, index, mediaList, postId)
                  : renderVideoBlockWithoutOuterGrid(block, index, mediaList, postId)}
              </div>
            ))}
          </div>
        );
        i = nextIndex;
      } else {
        // Render single media block
        if (currentBlock.type === "image") {
          renderedElements.push(renderImageBlock(currentBlock, i, mediaList, postId));
        } else {
          renderedElements.push(renderVideoBlock(currentBlock, i, mediaList, postId));
        }
        i++;
      }
    } else {
      // Text block
      if (currentBlock.type === "text") {
        renderedElements.push(renderTextBlock(currentBlock, i, headingShift));
      }
      i++;
    }
  }

  return <>{renderedElements}</>;
}

// ─────────────────────────────────────────────────────────────
// RENDER HELPERS
// ─────────────────────────────────────────────────────────────

// Textblock Renderer with optional heading shift
function renderTextBlock(block: any, index: number, headingShift: boolean) {
  const content = block.text || "";
  const subtype = block.subtype;

  if (subtype === "heading1") {
    return headingShift ? (
      <h3 key={index} className="font-display font-bold text-2xl mt-10 mb-4 text-ink">
        {content}
      </h3>
    ) : (
      <h2 key={index} className="font-display font-bold text-3xl mt-12 mb-4 text-ink">
        {content}
      </h2>
    );
  }
  if (subtype === "heading2") {
    return headingShift ? (
      <h4 key={index} className="font-display font-bold text-xl mt-8 mb-3 text-ink">
        {content}
      </h4>
    ) : (
      <h3 key={index} className="font-display font-bold text-2xl mt-8 mb-3 text-ink">
        {content}
      </h3>
    );
  }
  if (subtype === "heading3") {
    return headingShift ? (
      <h5 key={index} className="font-display font-bold text-lg mt-6 mb-2 text-ink">
        {content}
      </h5>
    ) : (
      <h4 key={index} className="font-display font-bold text-xl mt-6 mb-2 text-ink">
        {content}
      </h4>
    );
  }
  if (subtype === "quote") {
    return (
      <blockquote key={index} className="border-l-2 border-amber pl-6 my-6 italic text-dust font-display text-lg">
        {content}
      </blockquote>
    );
  }

  // Normaler Absatz
  return (
    <p key={index} className="text-base text-ink mb-6 font-light leading-relaxed">
      {content}
    </p>
  );
}

// Bildblock Renderer (Single Full-Width)
function renderImageBlock(block: any, blockIndex: number, mediaList: any[], postId?: number) {
  // Filtere alle Medien für diesen Block (und optional diesen Post)
  const blockMedia = mediaList.filter((m: any) => {
    const matchesBlock = m.block_index === blockIndex;
    const matchesPost = postId === undefined || m.post_id === postId;
    return matchesBlock && matchesPost;
  });

  if (blockMedia.length === 0) return null;

  return (
    <div key={blockIndex} className="my-10 space-y-6">
      <div className={`grid gap-4 ${blockMedia.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {blockMedia.map((media: any, i: number) => {
          const url = media.storage_path || media.original_url;
          const exif = media.exif_data;
          const hasMetadata = !!(
            media.camera_model ||
            media.camera_make ||
            media.lens ||
            media.aperture ||
            media.exposure_time ||
            media.iso ||
            media.focal_length
          );

          const aspect = media.width && media.height ? `${media.width} / ${media.height}` : "3/2";

          return (
            <div
              key={media.media_id || i}
              className="group relative overflow-hidden bg-cream border border-ink/5 rounded-sm shadow-sm transition-all duration-300 hover:shadow-md"
            >
              <div
                className="relative w-full"
                style={{ aspectRatio: aspect }}
              >
                <Image
                  src={url}
                  alt={media.alt_text || block.alt_text || "Travel Photo"}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>

              {/* EXIF Info Popover */}
              {exif && hasMetadata && (
                <details className="absolute bottom-2 right-2 z-20 group/details">
                  <summary className="list-none cursor-pointer p-1 rounded-full bg-ink/75 text-cream hover:bg-amber transition-colors flex items-center justify-center w-6 h-6 shadow-sm">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </summary>
                  <div className="absolute right-0 bottom-9 w-60 p-4 bg-ink/95 border border-white/10 rounded-sm shadow-lg text-cream/90 font-body text-2xs space-y-1.5 backdrop-blur-sm">
                    <p className="font-display font-semibold border-b border-white/10 pb-1 text-white text-xs">
                      EXIF Data
                    </p>
                    {media.camera_model && (
                      <p>
                        <span className="text-dust">Camera:</span> {media.camera_make} {media.camera_model}
                      </p>
                    )}
                    {media.lens && (
                      <p>
                        <span className="text-dust">Lens:</span> {media.lens}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      {media.aperture && (
                        <p>
                          <span className="text-dust">Aperture:</span> f/{media.aperture}
                        </p>
                      )}
                      {media.exposure_time && (
                        <p>
                          <span className="text-dust">Exposure:</span> {formatExposureTime(media.exposure_time)}s
                        </p>
                      )}
                      {media.iso && (
                        <p>
                          <span className="text-dust">ISO:</span> {media.iso}
                        </p>
                      )}
                      {media.focal_length && (
                        <p>
                          <span className="text-dust">Focal Length:</span> {media.focal_length}mm
                        </p>
                      )}
                    </div>
                  </div>
                </details>
              )}

              {/* Caption */}
              {(media.caption || block.caption) && (
                <div className="p-3 bg-white border-t border-ink/5">
                  <p className="text-xs text-dust font-body italic">{media.caption || block.caption}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Bildblock Renderer (Without Spacing & Container Grid for Row Layouts)
function renderImageBlockWithoutOuterGrid(block: any, blockIndex: number, mediaList: any[], postId?: number) {
  const blockMedia = mediaList.filter((m: any) => {
    const matchesBlock = m.block_index === blockIndex;
    const matchesPost = postId === undefined || m.post_id === postId;
    return matchesBlock && matchesPost;
  });

  if (blockMedia.length === 0) return null;

  return (
    <div key={blockIndex} className="space-y-4">
      {blockMedia.map((media: any, i: number) => {
        const url = media.storage_path || media.original_url;
        const exif = media.exif_data;
        const hasMetadata = !!(
          media.camera_model ||
          media.camera_make ||
          media.lens ||
          media.aperture ||
          media.exposure_time ||
          media.iso ||
          media.focal_length
        );

        const aspect = media.width && media.height ? `${media.width} / ${media.height}` : "3/2";

        return (
          <div
            key={media.media_id || i}
            className="group relative overflow-hidden bg-cream border border-ink/5 rounded-sm shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <div
              className="relative w-full"
              style={{ aspectRatio: aspect }}
            >
              <Image
                src={url}
                alt={media.alt_text || block.alt_text || "Travel Photo"}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              />
            </div>

            {/* EXIF Info Popover */}
            {exif && hasMetadata && (
              <details className="absolute bottom-2 right-2 z-20 group/details">
                <summary className="list-none cursor-pointer p-1 rounded-full bg-ink/75 text-cream hover:bg-amber transition-colors flex items-center justify-center w-6 h-6 shadow-sm">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                </summary>
                <div className="absolute right-0 bottom-9 w-60 p-4 bg-ink/95 border border-white/10 rounded-sm shadow-lg text-cream/90 font-body text-2xs space-y-1.5 backdrop-blur-sm">
                  <p className="font-display font-semibold border-b border-white/10 pb-1 text-white text-xs">
                    EXIF Data
                  </p>
                  {media.camera_model && (
                    <p>
                      <span className="text-dust">Camera:</span> {media.camera_make} {media.camera_model}
                    </p>
                  )}
                  {media.lens && (
                    <p>
                      <span className="text-dust">Lens:</span> {media.lens}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    {media.aperture && (
                      <p>
                        <span className="text-dust">Aperture:</span> f/{media.aperture}
                      </p>
                    )}
                    {media.exposure_time && (
                      <p>
                        <span className="text-dust">Exposure:</span> {formatExposureTime(media.exposure_time)}s
                      </p>
                    )}
                    {media.iso && (
                      <p>
                        <span className="text-dust">ISO:</span> {media.iso}
                      </p>
                    )}
                    {media.focal_length && (
                      <p>
                        <span className="text-dust">Focal Length:</span> {media.focal_length}mm
                      </p>
                    )}
                  </div>
                </div>
              </details>
            )}

            {/* Caption */}
            {(media.caption || block.caption) && (
              <div className="p-3 bg-white border-t border-ink/5">
                <p className="text-xs text-dust font-body italic">{media.caption || block.caption}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Format camera exposure time
function formatExposureTime(exposureTime: number): string {
  if (exposureTime >= 1) {
    return String(Math.round(exposureTime * 10) / 10);
  }
  const fraction = Math.round(1 / exposureTime);
  return `1/${fraction}`;
}

// Video-Block Renderer (Single Full-Width)
function renderVideoBlock(block: any, blockIndex: number, mediaList: any[], postId?: number) {
  const blockMedia = mediaList.filter((m: any) => {
    const matchesBlock = m.block_index === blockIndex;
    const matchesPost = postId === undefined || m.post_id === postId;
    return matchesBlock && matchesPost;
  });

  if (blockMedia.length === 0) return null;

  return (
    <div key={blockIndex} className="my-10">
      {blockMedia.map((media: any, i: number) => {
        const url = media.storage_path || media.original_url;
        return (
          <div key={media.media_id || i} className="group overflow-hidden border border-ink/5 rounded-sm shadow-sm">
            <video src={url} controls playsInline preload="metadata" className="w-full h-auto max-h-[70vh] bg-ink" />
            {(media.caption || block.caption) && (
              <div className="p-3 bg-white border-t border-ink/5">
                <p className="text-xs text-dust font-body italic">{media.caption || block.caption}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Video-Block Renderer (Without Spacing & Container Grid for Row Layouts)
function renderVideoBlockWithoutOuterGrid(block: any, blockIndex: number, mediaList: any[], postId?: number) {
  const blockMedia = mediaList.filter((m: any) => {
    const matchesBlock = m.block_index === blockIndex;
    const matchesPost = postId === undefined || m.post_id === postId;
    return matchesBlock && matchesPost;
  });

  if (blockMedia.length === 0) return null;

  return (
    <div key={blockIndex} className="space-y-4">
      {blockMedia.map((media: any, i: number) => {
        const url = media.storage_path || media.original_url;
        return (
          <div key={media.media_id || i} className="group overflow-hidden border border-ink/5 rounded-sm shadow-sm">
            <video src={url} controls playsInline preload="metadata" className="w-full h-auto max-h-[70vh] bg-ink" />
            {(media.caption || block.caption) && (
              <div className="p-3 bg-white border-t border-ink/5">
                <p className="text-xs text-dust font-body italic">{media.caption || block.caption}</p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
