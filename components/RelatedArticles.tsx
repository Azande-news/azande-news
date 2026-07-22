import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";

export default async function RelatedArticles({
  category,
  excludeId,
}: {
  category: string;
  excludeId: string;
}) {
  const supabase = createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id, title, body, category, created_at, cover_image_url, profiles(display_name, username)"
    )
    .eq("status", "published")
    .eq("category", category)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(3);

  const related = (posts ?? []) as unknown as Array<
    Parameters<typeof PostCard>[0]["post"]
  >;

  if (related.length === 0) return null;

  return (
    <div className="mt-14 pt-8 border-t border-border">
      <h2 className="font-display text-lg font-bold text-ink border-l-4 border-accent pl-3 mb-6">
        More in this category
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-8">
        {related.map((post) => (
          <PostCard key={post.id} post={post} variant="grid" />
        ))}
      </div>
    </div>
  );
}
