import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";

type PostRow = Parameters<typeof PostCard>[0]["post"];

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
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`)
    .eq("category", category)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(3);

  const related = (posts ?? []) as unknown as PostRow[];

  if (related.length === 0) return null;

  return (
    <div className="mt-12 pt-6 block-rule">
      <h2 className="section-label mb-5">More in this category</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-8">
        {related.map((post) => (
          <PostCard key={post.id} post={post} variant="grid" />
        ))}
      </div>
    </div>
  );
}
