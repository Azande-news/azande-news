import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import { CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from "@/lib/categories";
import type { Metadata } from "next";

export const revalidate = 0;

type PostRow = Parameters<typeof PostCard>[0]["post"];

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const label = CATEGORY_LABELS[params.slug];
  if (!label) return {};
  return {
    title: label,
    description: CATEGORY_DESCRIPTIONS[params.slug],
  };
}

export default async function CategoryPage({
  params,
}: {
  params: { slug: string };
}) {
  const label = CATEGORY_LABELS[params.slug];
  if (!label) notFound();

  const description = CATEGORY_DESCRIPTIONS[params.slug];

  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id, title, body, category, created_at, cover_image_url, profiles(display_name, username)"
    )
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`)
    .eq("category", params.slug)
    .order("created_at", { ascending: false })
    .limit(50);

  const allPosts = (posts ?? []) as unknown as PostRow[];

  const [lead, ...rest] = allPosts;
  const sidebar = rest.slice(0, 4);
  const gridPosts = rest.slice(4);

  return (
    <div>
      <div className="font-meta text-[11px] tracking-widest uppercase text-accent mb-2">
        Category
      </div>
      <h1 className="font-display text-canon sm:text-canon-lg font-bold text-ink mb-2">{label}</h1>
      {description && (
        <p className="font-body text-grey text-base mb-8 max-w-2xl">
          {description}
        </p>
      )}

      {allPosts.length === 0 && (
        <p className="font-body text-grey">No posts in this category yet.</p>
      )}

      {lead && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-border">
          <div className="lg:col-span-2">
            <PostCard post={lead} variant="lead" />
          </div>
          {sidebar.length > 0 && (
            <div className="lg:border-l lg:border-border lg:pl-6">
              <h2 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-1">
                More in {label}
              </h2>
              {sidebar.map((post) => (
                <PostCard key={post.id} post={post} variant="list" />
              ))}
            </div>
          )}
        </div>
      )}

      {gridPosts.length > 0 && (
        <div className="pt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
          {gridPosts.map((post) => (
            <PostCard key={post.id} post={post} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}
