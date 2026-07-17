import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { createAdminClient } from "@/lib/supabase";
import { AdminClickableRow } from "@/components/AdminClickableRow";

export const dynamic = "force-dynamic";

export default async function AdminPostsList({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; country?: string; trip?: string }>;
}) {
  const { query, country, trip } = await searchParams;
  const supabase = createAdminClient();
  
  let dbQuery = supabase
    .from("timeline") // Use timeline view for richer data or posts directly
    .select("*")
    .order("actual_date", { ascending: false });

  if (query) {
    const cleanQuery = query.startsWith("#") ? query.slice(1) : query;
    dbQuery = dbQuery.or(`title.ilike.%${query}%,tags.cs.{"${query}"},tags.cs.{"${cleanQuery}"}`);
  }
  
  // Fetch all posts to extract all unique tags dynamically
  const { data: allPostsTags } = await supabase
    .from("posts")
    .select("tags");

  const uniqueTags = Array.from(
    new Set(
      (allPostsTags || [])
        .flatMap((p: any) => p.tags || [])
        .map((t: string) => t.trim())
        .filter((t: string) => t !== "")
    )
  ).sort((a, b) => a.localeCompare(b));

  const { data: posts, error } = await dbQuery.limit(50); // Pagination in real app

  return (
    <div className="space-y-6 animate-fade-up">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl text-ink font-display">Posts</h1>
          <p className="text-dust mt-1">Manage your diary entries.</p>
        </div>
        <Link
          href="/admin/posts/new"
          className="flex items-center gap-2 bg-ink text-white px-4 py-2 rounded hover:bg-smoke transition-colors"
        >
          <PlusCircle size={18} />
          Create Post
        </Link>
      </header>

      <div className="bg-white border border-ink/10 rounded-md p-4 flex flex-col gap-4">
        {/* Simple Search Form - GET method to update URL params */}
        <form className="w-full flex gap-4">
          <input
            type="text"
            name="query"
            defaultValue={query || ""}
            placeholder="Search by title or tag (e.g. #japan)..."
            className="flex-1 px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber text-sm bg-white"
          />
          <button type="submit" className="bg-cream text-ink px-4 py-2 rounded hover:bg-cream/70 transition-colors text-sm font-semibold">
            Search
          </button>
        </form>

        {uniqueTags.length > 0 && (
          <div className="w-full border-t border-ink/5 pt-3">
            <p className="text-xs text-dust mb-2 font-medium">Filter by tag preview:</p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-2">
              {uniqueTags.map((tag: string) => {
                const displayTag = tag.startsWith("#") ? tag : `#${tag}`;
                const isSelected = query === tag || query === displayTag || (query && query.toLowerCase() === tag.toLowerCase());
                return (
                  <Link
                    key={tag}
                    href={`/admin/posts?query=${encodeURIComponent(tag)}`}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      isSelected
                        ? "bg-amber text-white font-semibold"
                        : "bg-cream text-ink hover:bg-cream/80"
                    }`}
                  >
                    {displayTag}
                  </Link>
                );
              })}
              {query && (
                <Link
                  href="/admin/posts"
                  className="text-xs px-2.5 py-1 rounded bg-red-50 text-red-600 hover:bg-red-100 transition-colors font-semibold"
                >
                  Clear filter ×
                </Link>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border border-ink/10 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream/30 text-dust text-sm uppercase tracking-wider">
              <th className="py-3 px-4 font-medium border-b border-ink/10">Date</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10">Title</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10 hidden md:table-cell">Location</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10 hidden lg:table-cell">Trip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {posts?.map((post: any) => (
              <AdminClickableRow key={post.post_id} href={`/admin/posts/${post.post_id}`}>
                <td className="py-3 px-4 text-dust text-sm whitespace-nowrap">
                  {new Date(post.actual_date).toLocaleDateString()}
                </td>
                <td className="py-3 px-4 font-medium text-ink max-w-[200px] truncate">
                  {post.title || "Untitled"}
                </td>
                <td className="py-3 px-4 text-dust hidden md:table-cell">
                  {post.city ? `${post.city}, ` : ""}{post.country}
                </td>
                <td className="py-3 px-4 text-dust hidden lg:table-cell">
                  {post.trip_name || "-"}
                </td>
              </AdminClickableRow>
            ))}
            {(!posts || posts.length === 0) && (
              <tr>
                <td colSpan={4} className="py-6 px-4 text-center text-dust">
                  No posts found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
