import Link from "next/link";
import { PlusCircle, Edit } from "lucide-react";
import { createAdminClient } from "@/lib/supabase";

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
    dbQuery = dbQuery.ilike("title", `%${query}%`);
  }
  
  // Note: the timeline view has 'country' (name) and 'trip_name', not IDs. 
  // If we want to filter by ID we should query the posts table directly.
  // For simplicity here, we'll query the 'timeline' view which is very useful for lists.

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

      <div className="bg-white border border-ink/10 rounded-md p-4 flex gap-4 flex-wrap">
        {/* Simple Search Form - GET method to update URL params */}
        <form className="flex-1 flex gap-4 min-w-[300px]">
          <input
            type="text"
            name="query"
            defaultValue={query || ""}
            placeholder="Search by title..."
            className="flex-1 px-3 py-2 border border-ink/20 rounded focus:outline-none focus:border-amber"
          />
          <button type="submit" className="bg-cream text-ink px-4 py-2 rounded hover:bg-cream/70 transition-colors">
            Search
          </button>
        </form>
      </div>

      <div className="bg-white border border-ink/10 rounded-md shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-cream/30 text-dust text-sm uppercase tracking-wider">
              <th className="py-3 px-4 font-medium border-b border-ink/10">Date</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10">Title</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10 hidden md:table-cell">Location</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10 hidden lg:table-cell">Trip</th>
              <th className="py-3 px-4 font-medium border-b border-ink/10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/10">
            {posts?.map((post: any) => (
              <tr key={post.post_id} className="hover:bg-cream/10 transition-colors">
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
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/admin/posts/${post.post_id}`}
                    className="inline-flex items-center gap-1 text-sm text-amber hover:text-ink transition-colors"
                  >
                    <Edit size={14} />
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {(!posts || posts.length === 0) && (
              <tr>
                <td colSpan={5} className="py-6 px-4 text-center text-dust">
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
