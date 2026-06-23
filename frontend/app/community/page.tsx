import { Metadata } from "next";
import { createServerClient } from "@/lib/supabase";
import CommunityClient from "./CommunityClient";

export const metadata: Metadata = {
  title: "Community",
  description: "Share your impulses, tips, and thoughts about traveling the planet earth.",
};

export default async function CommunityPage() {
  const supabase = createServerClient();

  // Fetch boards list
  const { data: boards } = await supabase
    .from("community_boards")
    .select("*")
    .order("created_at", { ascending: true });

  // Fetch countries list for tagging
  const { data: countries } = await supabase
    .from("countries")
    .select("country_id, name, iso_code")
    .order("name");

  // Fetch recent posts list for tagging
  const { data: posts } = await supabase
    .from("posts")
    .select("post_id, title, post_date")
    .order("post_date", { ascending: false });

  return (
    <div className="pt-24 min-h-screen bg-paper">
      <CommunityClient 
        initialBoards={boards || []}
        countries={countries || []} 
        posts={posts || []} 
      />
    </div>
  );
}
