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
      <div className="pb-6 mb-8 border-b-4 border-ink">
        <h1 className="font-display text-canon sm:text-canon-lg font-medium text-ink">
          {label}
        </h1>
        {description && (
          <p className="font-body text-body-copy text-grey mt-2 max-w-read">
            {description}
          </p>
        )}
      </div>

      {allPosts.length === 0 && (
        <p className="font-body text-body-copy text-grey">
          No posts in this category yet.
        </p>
      )}

      {lead && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-8 pb-8">
          <div className="lg:col-span-8">
            <PostCard post={lead} variant="lead" />
          </div>
          {sidebar.length > 0 && (
            <div className="lg:col-span-4 lg:border-l lg:border-rule lg:pl-6">
              <h2 className="section-label mb-2">More in {label}</h2>
              {sidebar.map((post) => (
                <PostCard key={post.id} post={post} variant="list" />
              ))}
            </div>
          )}
        </div>
      )}

      {gridPosts.length > 0 && (
        <section className="pt-8 mt-4 block-rule">
          <h2 className="section-label mb-5">Latest</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            {gridPosts.map((post) => (
              <PostCard key={post.id} post={post} variant="grid" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
