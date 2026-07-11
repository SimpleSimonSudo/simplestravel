import { getPost } from "@/lib/queries";
import { notFound } from "next/navigation";
import Image from "next/image";
import ContentBlocksRenderer from "@/components/ContentBlocksRenderer";
import TripMiniMap from "@/components/TripMiniMap";
import PostFooter from "@/components/PostFooter";
import PostSeparator from "@/components/PostSeparators";
import PostDetailsDropdown from "@/components/PostDetailsDropdown";

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
  const date = new Date(post.actual_date || post.post_date);

  // Finde das Hero-Bild:
  // - Wenn der Blogpost Hochformat- und Querformat-Bilder enthält, wähle das querste Bild.
  // - Andernfalls wähle ein Bild zufällig (random) aus.
  const images = media.filter((m: any) => m.media_type === "image");
  let heroImage = null;
  if (images.length > 0) {
    const landscapeImages = images.filter((img: any) => img.width && img.height && img.width > 0 && img.height > 0 && img.width > img.height);
    const portraitImages = images.filter((img: any) => img.width && img.height && img.width > 0 && img.height > 0 && img.width <= img.height);

    if (landscapeImages.length > 0 && portraitImages.length > 0) {
      // Wenn sowohl Hoch- als auch Querformat existieren, nimm das querste Bild (höchstes width/height Verhältnis)
      heroImage = landscapeImages.reduce((prev: any, current: any) => {
        const prevRatio = prev.width / prev.height;
        const currentRatio = current.width / current.height;
        return currentRatio > prevRatio ? current : prev;
      }, landscapeImages[0]);
    } else if (landscapeImages.length > 0) {
      // Nur Querformat -> zufälliges Bild aus den Querformat-Bildern
      const randomIndex = Math.floor(Math.random() * landscapeImages.length);
      heroImage = landscapeImages[randomIndex];
    } else if (portraitImages.length > 0) {
      // Nur Hochformat -> nimm ein zufälliges
      const randomIndex = Math.floor(Math.random() * portraitImages.length);
      heroImage = portraitImages[randomIndex];
    } else {
      // Fallback: Keine Dimensionen vorhanden, wähle ein beliebiges Bild zufällig
      const randomIndex = Math.floor(Math.random() * images.length);
      heroImage = images[randomIndex];
    }
  }
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
          
          {post.trip && (
            <div className="absolute top-6 left-8 z-30">
              <a
                href={`/trips/${post.trip.trip_id}#post-${post.post_id}`}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-ink/40 text-white hover:bg-amber hover:text-white transition-all duration-200 group shadow-sm"
                title="Back to Trip"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </a>
            </div>
          )}
          
          <div className="relative z-20 max-w-4xl mx-auto w-full px-8 pb-12 text-white text-center md:text-left">
            <div className="flex flex-wrap items-center gap-3 mb-4 justify-center md:justify-start">
              {post.country && (
                <span className="tag bg-amber !text-white font-medium">
                  {post.country.name}
                </span>
              )}
              {post.trip && (
                <a
                  href={`/trips/${post.trip.trip_id}#post-${post.post_id}`}
                  className="tag bg-white/10 !text-white border border-white/20 hover:bg-white/20 hover:border-white/40 transition-colors"
                >
                  {post.trip.trip_name}
                </a>
              )}
            </div>
            <h1 className="font-display font-black text-4xl md:text-6xl mb-4 leading-tight">
              {post.title || date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </h1>
            <p className="text-cream/80 text-sm font-body tracking-wide font-light">
              {post.city && <span>{post.city} · </span>}
              {post.region && <span>{post.region} · </span>}
              {date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>
      ) : (
        <>
          {post.trip && (
            <div className="max-w-4xl mx-auto px-8 mb-4">
              <a
                href={`/trips/${post.trip.trip_id}#post-${post.post_id}`}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-cream text-ink hover:bg-amber hover:text-white transition-all duration-200 group shadow-sm"
                title="Back to Trip"
              >
                <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </a>
            </div>
          )}
          <header className="max-w-4xl mx-auto px-8 pt-12 pb-6 border-b border-ink/10 text-center">
            <div className="flex justify-center gap-3 mb-4">
              {post.country && (
                <span className="tag">
                  {post.country.name}
                </span>
              )}
              {post.trip && (
                <a
                  href={`/trips/${post.trip.trip_id}#post-${post.post_id}`}
                  className="tag bg-cream text-ink hover:bg-amber hover:text-white transition-colors"
                >
                  {post.trip.trip_name}
                </a>
              )}
            </div>
            <h1 className="font-display font-black text-4xl md:text-5xl mb-4 text-ink">
              {post.title || date.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </h1>
            <p className="text-dust text-sm font-body">
              {post.city && <span>{post.city} · </span>}
              {date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </header>
        </>
      )}

      {/* Decorative separator with subtle details dropdown */}
      <section className="max-w-2xl mx-auto px-8 mb-12 flex items-center justify-center relative">
        <PostSeparator postId={post.post_id} />
        {((post.weather) || (post.mood) || (post.travel_mode)) && (
          <div className="absolute right-8 top-1/2 -translate-y-1/2">
            <PostDetailsDropdown post={post} />
          </div>
        )}
      </section>

      {/* Content Blocks */}
      <section className="max-w-2xl mx-auto px-8 font-body leading-relaxed text-ink space-y-8">
        <ContentBlocksRenderer
          blocks={post.content_blocks}
          mediaList={media}
        />
      </section>

      {/* Interactive Post Footer (Map, Emojis, Impulse) */}
      {post.trip && (
        <section className="max-w-2xl mx-auto px-8">
          <PostFooter
            postId={post.post_id}
            tripId={post.trip.trip_id}
            hasCoords={post.latitude !== null && post.longitude !== null}
          />
        </section>
      )}

      {/* Post Location Map */}
      {post.latitude !== null && post.longitude !== null && (
        <section className="max-w-2xl mx-auto px-8 my-16 flex flex-col items-center">
          <span className="overline text-2xs mb-3 text-center block">Post Location</span>
          <TripMiniMap 
            posts={[{
              post_id: post.post_id,
              title: post.title,
              latitude: Number(post.latitude),
              longitude: Number(post.longitude),
              city: post.city
            }]} 
            tripId={post.trip?.trip_id} 
            defaultZoom={12}
            className="w-full h-[220px] md:h-[300px] border border-ink/10 rounded-sm bg-white overflow-hidden relative shadow-xs group transition-shadow duration-300 hover:shadow-md"
          />
        </section>
      )}

      {/* Footer Section */}
      {((post.tags && post.tags.length > 0) || post.trip) && (
        <footer className="max-w-2xl mx-auto px-8 mt-16 pt-8 border-t border-ink/10 space-y-8">
          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag: string) => (
                <span key={tag} className="text-xs text-dust font-body bg-cream/50 px-2 py-1 rounded-sm">
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          {post.trip && (
            <div className="flex justify-center pt-4">
              <a
                href={`/trips/${post.trip.trip_id}#post-${post.post_id}`}
                className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-dust hover:text-amber transition-colors font-body group"
              >
                <svg className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
                Back to Trip: {post.trip.trip_name}
              </a>
            </div>
          )}
        </footer>
      )}
    </article>
  );
}
