import { getPost } from "@/lib/queries";
import { notFound } from "next/navigation";
import Image from "next/image";

// Dynamic routing parameter
type Props = {
  params: Promise<{ id: string }>;
};

export const revalidate = 60;

export default async function PostDetailPage({ params }: Props) {
  const { id } = await params;
  
  let postData;
  try {
    postData = await getPost(id);
  } catch (error) {
    console.error("Error loading post:", error);
    return notFound();
  }

  if (!postData || !postData.post) {
    return notFound();
  }

  const { post, media } = postData as any;
  const date = new Date(post.post_date);

  // Finde das erste Bild als Hero-Bild
  const heroImage = media.find((m: any) => m.media_type === "image");
  const heroUrl = heroImage?.storage_path || heroImage?.original_url;

  return (
    <article className="min-h-screen bg-paper pb-24 pt-20 animate-fade-in">
      {/* Hero Banner oder Header */}
      {heroUrl ? (
        <div className="relative w-full h-[60vh] md:h-[75vh] mb-12 overflow-hidden flex items-end">
          <div className="absolute inset-0 z-0">
            <Image
              src={heroUrl}
              alt={post.title || post.summary || "Hero Image"}
              fill
              priority
              className="object-cover object-center filter brightness-[0.85] transition-all duration-1000 ease-out scale-105"
            />
            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/20 to-transparent z-10" />
          </div>
          
          <div className="relative z-20 max-w-4xl mx-auto w-full px-8 pb-12 text-white text-center md:text-left">
            <div className="flex flex-wrap items-center gap-3 mb-4 justify-center md:justify-start">
              {post.country && (
                <span className="tag bg-amber text-white font-medium">
                  {post.country.iso_code && `${countryCodeToFlag(post.country.iso_code)} `}
                  {post.country.name}
                </span>
              )}
              {post.trip && (
                <span className="tag bg-white/10 text-white border border-white/20">
                  {post.trip.trip_name}
                </span>
              )}
            </div>
            <h1 className="font-display font-black text-4xl md:text-6xl mb-4 leading-tight">
              {post.title || date.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
            </h1>
            <p className="text-cream/80 text-sm font-body tracking-wide font-light">
              {post.city && <span>{post.city} · </span>}
              {post.region && <span>{post.region} · </span>}
              {date.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      ) : (
        <header className="max-w-4xl mx-auto px-8 pt-12 pb-6 border-b border-ink/10 text-center">
          <div className="flex justify-center gap-3 mb-4">
            {post.country && (
              <span className="tag">
                {post.country.iso_code && `${countryCodeToFlag(post.country.iso_code)} `}
                {post.country.name}
              </span>
            )}
            {post.trip && (
              <span className="tag bg-cream text-ink">
                {post.trip.trip_name}
              </span>
            )}
          </div>
          <h1 className="font-display font-black text-4xl md:text-5xl mb-4 text-ink">
            {post.title || date.toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" })}
          </h1>
          <p className="text-dust text-sm font-body">
            {post.city && <span>{post.city} · </span>}
            {date.toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </header>
      )}

      {/* Meta Grid (Wetter, Stimmung, Begleiter, etc.) */}
      <section className="max-w-3xl mx-auto px-8 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-cream/30 border border-cream rounded-sm font-body text-xs text-dust">
          {post.weather && (
            <div className="flex flex-col gap-1">
              <span className="overline">Wetter</span>
              <span className="text-ink font-medium">{post.weather}</span>
            </div>
          )}
          {post.mood && (
            <div className="flex flex-col gap-1">
              <span className="overline">Stimmung</span>
              <span className="text-ink font-medium">{post.mood}</span>
            </div>
          )}
          {post.travel_mode && (
            <div className="flex flex-col gap-1">
              <span className="overline">Transport</span>
              <span className="text-ink font-medium uppercase tracking-wide">{post.travel_mode}</span>
            </div>
          )}
          {post.companions && post.companions.length > 0 && (
            <div className="flex flex-col gap-1">
              <span className="overline">Begleiter</span>
              <span className="text-ink font-medium">{post.companions.join(", ")}</span>
            </div>
          )}
        </div>
      </section>

      {/* Content Blocks */}
      <section className="max-w-2xl mx-auto px-8 font-body leading-relaxed text-ink space-y-8">
        {post.content_blocks && post.content_blocks.map((block: any, index: number) => {
          switch (block.type) {
            case "text":
              return renderTextBlock(block, index);
            case "image":
              return renderImageBlock(block, index, media);
            case "video":
              return renderVideoBlock(block, index, media);
            default:
              return null;
          }
        })}
      </section>

      {/* Footer Tags */}
      {post.tags && post.tags.length > 0 && (
        <footer className="max-w-2xl mx-auto px-8 mt-16 pt-8 border-t border-ink/10">
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag: string) => (
              <span key={tag} className="text-xs text-dust font-body bg-cream/50 px-2 py-1 rounded-sm">
                #{tag}
              </span>
            ))}
          </div>
        </footer>
      )}
    </article>
  );
}

// Helper: Emojis für Länder
function countryCodeToFlag(code: string): string {
  return code
    .toUpperCase()
    .split("")
    .map((c) => String.fromCodePoint(127397 + c.charCodeAt(0)))
    .join("");
}

// Textblock Renderer
function renderTextBlock(block: any, index: number) {
  const content = block.text || "";
  const subtype = block.subtype;

  if (subtype === "heading1") {
    return <h2 key={index} className="font-display font-bold text-3xl mt-12 mb-4 text-ink">{content}</h2>;
  }
  if (subtype === "heading2") {
    return <h3 key={index} className="font-display font-bold text-2xl mt-8 mb-3 text-ink">{content}</h3>;
  }
  if (subtype === "heading3") {
    return <h4 key={index} className="font-display font-bold text-xl mt-6 mb-2 text-ink">{content}</h4>;
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

// Bildblock Renderer mit Support für R2 & EXIF Daten
function renderImageBlock(block: any, blockIndex: number, mediaList: any[]) {
  // Filtere alle Medien für diesen Block
  const blockMedia = mediaList.filter((m: any) => m.block_index === blockIndex);

  if (blockMedia.length === 0) return null;

  return (
    <div key={blockIndex} className="my-10 space-y-6">
      <div className={`grid gap-4 ${blockMedia.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1"}`}>
        {blockMedia.map((media: any, i: number) => {
          const url = media.storage_path || media.original_url;
          const exif = media.exif_data;
          
          return (
            <div key={media.media_id || i} className="group relative overflow-hidden bg-cream border border-ink/5 rounded-sm shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="relative aspect-[3/2] w-full">
                <Image
                  src={url}
                  alt={media.alt_text || block.alt_text || "Travel Photo"}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                />
              </div>

              {/* EXIF Info Popover / Overlay (Details toggle) */}
              {exif && (
                <details className="absolute bottom-2 right-2 z-20 group/details">
                  <summary className="list-none cursor-pointer p-1.5 rounded-full bg-ink/75 text-cream hover:bg-amber transition-colors flex items-center justify-center w-7 h-7 shadow-sm">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <line x1="12" y1="16" x2="12" y2="12"></line>
                      <line x1="12" y1="8" x2="12.01" y2="8"></line>
                    </svg>
                  </summary>
                  <div className="absolute right-0 bottom-9 w-60 p-4 bg-ink/95 border border-white/10 rounded-sm shadow-lg text-cream/90 font-body text-2xs space-y-1.5 backdrop-blur-sm">
                    <p className="font-display font-semibold border-b border-white/10 pb-1 text-white text-xs">EXIF Daten</p>
                    {media.camera_model && <p><span className="text-dust">Kamera:</span> {media.camera_make} {media.camera_model}</p>}
                    {media.lens && <p><span className="text-dust">Objektiv:</span> {media.lens}</p>}
                    <div className="grid grid-cols-2 gap-1 pt-1">
                      {media.aperture && <p><span className="text-dust">Blende:</span> f/{media.aperture}</p>}
                      {media.exposure_time && <p><span className="text-dust">Belichtung:</span> {formatExposureTime(media.exposure_time)}s</p>}
                      {media.iso && <p><span className="text-dust">ISO:</span> {media.iso}</p>}
                      {media.focal_length && <p><span className="text-dust">Brennweite:</span> {media.focal_length}mm</p>}
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

// Belichtungszeit Formatierung (z.B. 0.004 -> 1/250)
function formatExposureTime(exposureTime: number): string {
  if (exposureTime >= 1) {
    return String(Math.round(exposureTime * 10) / 10);
  }
  const fraction = Math.round(1 / exposureTime);
  return `1/${fraction}`;
}

// Video-Block Renderer
function renderVideoBlock(block: any, blockIndex: number, mediaList: any[]) {
  const blockMedia = mediaList.filter((m: any) => m.block_index === blockIndex);
  if (blockMedia.length === 0) return null;

  return (
    <div key={blockIndex} className="my-10">
      {blockMedia.map((media: any, i: number) => {
        const url = media.storage_path || media.original_url;
        return (
          <div key={media.media_id || i} className="group overflow-hidden border border-ink/5 rounded-sm shadow-sm">
            <video
              src={url}
              controls
              playsInline
              preload="metadata"
              className="w-full h-auto max-h-[70vh] bg-ink"
            />
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
