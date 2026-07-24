import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";

export const revalidate = 0;

export default async function BookmarksPage() {
  const supabase = createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/bookmarks");

  const { data: bookmarks } = await supabase
    .from("bookmarks")
    .select("post_id, posts(id, title, body, category, created_at, cover_image_url, profiles(display_name, username))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const posts = (bookmarks ?? [])
    .map((b: any) => b.posts)
    .filter(Boolean);

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-ink mb-2">Saved for later</h1>
      <p className="font-body text-grey mb-8">Posts you have bookmarked to read later.</p>

      {posts.length === 0 ? (
        <div className="border border-dashed border-border p-10 text-center">
          <p className="font-body text-grey">
            You have not saved anything yet. Look for &quot;Save for later&quot; on any article.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-border">
          {posts.map((post: any) => (
            <PostCard key={post.id} post={post} variant="list" />
          ))}
        </div>
      )}
    </div>
  );
}
