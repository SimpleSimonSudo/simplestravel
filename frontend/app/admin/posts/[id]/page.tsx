import { createAdminClient } from "@/lib/supabase";
import { PostEditor } from "./PostEditor";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "new";
  
  const supabase = createAdminClient();
  
  let post: any = null;
  
  if (!isNew) {
    const { data, error } = await supabase
      .from("posts")
      .select("*")
      .eq("post_id", id)
      .single();
      
    if (error) {
      return <div className="p-6 text-red-500">Error loading post: {error.message}</div>;
    }
    post = data;
  }

  // Pre-fetch reference data for dropdowns
  const { data: countries } = await supabase.from("countries").select("country_id, name").order("name");
  const { data: trips } = await supabase.from("trips").select("trip_id, trip_name").order("start_date", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-up max-w-5xl mx-auto pb-32">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/admin/posts" className="text-dust hover:text-ink transition-colors">
            <ArrowLeft size={24} />
          </Link>
          <div>
            <h1 className="text-3xl text-ink font-display">
              {isNew ? "Create New Entry" : "Edit Entry"}
            </h1>
            <p className="text-dust mt-1">
              Changes are saved locally until you publish.
            </p>
          </div>
        </div>
      </header>

      {/* The interactive editor client component */}
      <PostEditor 
        initialPost={post} 
        countries={countries || []} 
        trips={trips || []} 
      />
    </div>
  );
}
