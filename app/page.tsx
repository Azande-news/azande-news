import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import TrendingWidget from "@/components/TrendingWidget";
import Link from "next/link";
import Image from "next/image";
import { CATEGORY_LABELS } from "@/lib/categories";
import { stripHtml } from "@/lib/html";

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
const POSTS_PER_TOPIC_ROW = 3;
const FEATURES_MIN_WORDS = 600;
const MAX_FEATURES = 3;

type PostRow = Parameters<typeof PostCard>[0]["post"];

export default async function HomePage() {
  const supabase = createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      "id, title, body, category, created_at, cover_image_url, profiles(display_name, username)"
    )
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`)
    .order("created_at", { ascending: false })
    .limit(30);

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
      <div className="border border-dashed border-border p-10 text-center">
        <p className="font-display text-xl font-bold text-ink mb-3">
          No posts yet &mdash; be the first.
        </p>
        <p className="font-body text-grey mb-5">
          This space is waiting for its first story.
        </p>
        <Link
          href="/register"
          className="inline-block bg-accent text-paper px-5 py-2.5 rounded-sm hover:bg-accent-dark transition-colors font-body font-medium"
        >
          Join and write the first post
        </Link>
      </div>
    );
  }

  const [lead, ...rest] = allPosts;
  const sidebar = rest.slice(0, 4);

  const usedIds = new Set<string>(
    [lead?.id, ...sidebar.map((p) => p.id)].filter(Boolean) as string[]
  );

  const features = allPosts
    .filter((p) => {
      if (usedIds.has(p.id)) return false;
      const wordCount = stripHtml(p.body).split(/\s+/).filter(Boolean).length;
      return wordCount >= FEATURES_MIN_WORDS;
    })
    .slice(0, MAX_FEATURES);
  features.forEach((p) => usedIds.add(p.id));

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

  const leftoverPosts = allPosts.filter((p) => !usedIds.has(p.id));

  const featuresGridClass =
    features.length === 1
      ? "grid grid-cols-1 max-w-2xl"
      : features.length === 2
      ? "grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-8"
      : "grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-8";

  return (
    <div>
      {/* Lead + sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-8 border-b border-border">
        <div className="lg:col-span-2">
          {lead && <PostCard post={lead} variant="lead" />}
        </div>
        {sidebar.length > 0 && (
          <div className="lg:border-l lg:border-border lg:pl-6">
            <h2 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-1">
              More stories
            </h2>
            {sidebar.map((post) => (
              <PostCard key={post.id} post={post} variant="list" />
            ))}
            <TrendingWidget />
          </div>
        )}
      </div>

      {/* Features row: analysis/long-read posts, serif-styled */}
      {features.length > 0 && (
        <div className="pt-10 border-t border-border">
          <h2 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-6">
            Features &amp; Analysis
          </h2>
          <div className={featuresGridClass}>
            {features.map((post) => {
              const excerpt = stripHtml(post.body).slice(0, 140);
              return (
                <Link key={post.id} href={`/posts/${post.id}`} className="group block">
                  {post.cover_image_url && (
                    <div className="relative w-full h-40 overflow-hidden mb-3 bg-offwhite">
                      <Image
                        src={post.cover_image_url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 360px"
                      />
                    </div>
                  )}
                  <h3 className="font-serif text-xl font-bold text-ink mb-1.5 leading-snug group-hover:underline">
                    {post.title}
                  </h3>
                  <p className="font-serif italic text-sm text-grey-dark leading-relaxed line-clamp-2">
                    {excerpt}
                    {post.body.length > excerpt.length ? "…" : ""}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Topic rows, BBC-style */}
      {topicRows.map((row) => (
        <div key={row.value} className="pt-10">
          <div className="flex items-center justify-between mb-6 border-l-4 border-accent pl-3">
            <h2 className="font-display text-lg font-bold text-ink">
              {row.label}
            </h2>
            <Link
              href={`/category/${row.value}`}
              className="font-meta text-[11px] tracking-wider uppercase text-accent hover:underline shrink-0"
            >
              More {row.label} &rarr;
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
            {row.posts.map((post) => (
              <PostCard key={post.id} post={post} variant="grid" />
            ))}
          </div>
        </div>
      ))}

      {/* Catch-all for anything not surfaced above */}
      {leftoverPosts.length > 0 && (
        <div className="pt-10">
          <h2 className="font-display text-lg font-bold text-ink border-l-4 border-accent pl-3 mb-6">
            Latest
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
            {leftoverPosts.map((post) => (
              <PostCard key={post.id} post={post} variant="grid" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
