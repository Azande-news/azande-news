import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import { CATEGORY_LABELS } from "@/lib/categories";

export const revalidate = 0;

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const label = CATEGORY_LABELS[params.slug];
  if (!label) notFound();

  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id, title, body, category, created_at, cover_image_url, profiles(display_name, username)"
    )
    .eq("status", "published")
    .eq("category", params.slug)
    .order("created_at", { ascending: false })
    .limit(50);

  const allPosts = (posts ?? []) as unknown as Array<
    Parameters<typeof PostCard>[0]["post"]
  >;

  return (
    <div>
      <div className="font-meta text-[11px] tracking-widest uppercase text-accent mb-2">
        Category
      </div>
      <h1 className="font-display text-4xl font-bold text-ink mb-10">{label}</h1>

      {allPosts.length === 0 && (
        <p className="font-body text-grey">No posts in this category yet.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
        {allPosts.map((post) => (
          <PostCard key={post.id} post={post} variant="grid" />
        ))}
      </div>
    </div>
  );
}
