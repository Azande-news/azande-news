import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import TrendingWidget from "@/components/TrendingWidget";
import Link from "next/link";
import { CATEGORY_LABELS } from "@/lib/categories";

export const revalidate = 0;

const TOPIC_ROW_ORDER = [
  "general",
  "culture",
  "community",
  "diaspora",
  "history",
  "language",
  "announcements",
];
const MAX_TOPIC_ROWS = 4;
const POSTS_PER_TOPIC_ROW = 4;

type PostRow = Parameters<typeof PostCard>[0]["post"];

function SectionHeader({ label, href }: { label: string; href?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-5">
      <h2 className="section-label">{label}</h2>
      {href && (
        <Link
          href={href}
          className="font-meta text-brevier font-semibold text-ink hover:underline shrink-0"
        >
          More {label.toLowerCase()} &rarr;
        </Link>
      )}
    </div>
  );
}

export default async function HomePage() {
  const supabase = createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      "id, title, body, category, created_at, cover_image_url, profiles(display_name, username)"
    )
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`)
    .order("created_at", { ascending: false })
    .limit(40);

  const allPosts = (posts ?? []) as unknown as PostRow[];

  if (error) {
    return (
      <p className="font-body text-accent">
        Could not load posts. If you just set this project up, make sure
        you&apos;ve run the database schema in Supabase and added your
        environment variables.
      </p>
    );
  }

  if (allPosts.length === 0) {
    return (
      <div className="border border-border p-10 text-center">
        <p className="font-display text-trafalgar font-medium text-ink mb-3">
          No posts yet &mdash; be the first.
        </p>
        <p className="font-body text-body-copy text-grey mb-5">
          This space is waiting for its first story.
        </p>
        <Link
          href="/register"
          className="inline-block bg-ink text-paper px-5 py-2.5 font-meta text-brevier font-semibold"
        >
          Join and write the first post
        </Link>
      </div>
    );
  }

  const [lead, ...rest] = allPosts;
  const secondary = rest.slice(0, 2);
  const sidebar = rest.slice(2, 6);

  const usedIds = new Set<string>(
    [lead?.id, ...secondary.map((p) => p.id), ...sidebar.map((p) => p.id)].filter(
      Boolean
    ) as string[]
  );

  const topicRows: { value: string; label: string; posts: PostRow[] }[] = [];
  for (const value of TOPIC_ROW_ORDER) {
    if (topicRows.length >= MAX_TOPIC_ROWS) break;
    const categoryPosts = allPosts
      .filter((p) => p.category === value && !usedIds.has(p.id))
      .slice(0, POSTS_PER_TOPIC_ROW);
    if (categoryPosts.length === 0) continue;
    categoryPosts.forEach((p) => usedIds.add(p.id));
    topicRows.push({
      value,
      label: CATEGORY_LABELS[value] ?? value,
      posts: categoryPosts,
    });
  }

  const leftoverPosts = allPosts.filter((p) => !usedIds.has(p.id)).slice(0, 8);

  return (
    <div>
      <h1 className="sr-only">Azande News</h1>
      {/* Hero: lead + two secondary promos + sidebar rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-6 gap-y-8 pb-8">
        <div className="lg:col-span-6">
          {lead && <PostCard post={lead} variant="lead" />}
        </div>

        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-x-6 gap-y-8">
          {secondary.map((post) => (
            <PostCard key={post.id} post={post} variant="grid" />
          ))}
        </div>

        <div className="lg:col-span-3 lg:border-l lg:border-rule lg:pl-6">
          {sidebar.length > 0 && (
            <>
              <h2 className="section-label mb-2">More stories</h2>
              {sidebar.map((post) => (
                <PostCard key={post.id} post={post} variant="list" />
              ))}
            </>
          )}
          <TrendingWidget />
        </div>
      </div>

      {/* Section blocks */}
      {topicRows.map((row) => (
        <section key={row.value} className="pt-8 mt-4 block-rule">
          <SectionHeader label={row.label} href={`/category/${row.value}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            {row.posts.map((post) => (
              <PostCard key={post.id} post={post} variant="grid" />
            ))}
          </div>
        </section>
      ))}

      {leftoverPosts.length > 0 && (
        <section className="pt-8 mt-4 block-rule">
          <SectionHeader label="Latest" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8">
            {leftoverPosts.map((post) => (
              <PostCard key={post.id} post={post} variant="grid" />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

