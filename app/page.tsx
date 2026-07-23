import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import TrendingWidget from "@/components/TrendingWidget";
import Link from "next/link";

export const revalidate = 0;

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

  const allPosts = (posts ?? []) as unknown as Array<
    Parameters<typeof PostCard>[0]["post"]
  >;

  const [lead, ...rest] = allPosts;
  const sidebar = rest.slice(0, 4);
  const gridPosts = rest.slice(4);

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

      {/* Grid of remaining posts */}
      {gridPosts.length > 0 && (
        <div className="pt-8">
          <h2 className="font-display text-lg font-bold text-ink border-l-4 border-accent pl-3 mb-6">
            Latest
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
            {gridPosts.map((post) => (
              <PostCard key={post.id} post={post} variant="grid" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



