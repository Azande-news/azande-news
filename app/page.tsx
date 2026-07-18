import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import Link from "next/link";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = createClient();

  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      "id, title, body, category, created_at, cover_image_url, profiles(display_name, username)"
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(30);

  const allPosts = (posts ?? []) as unknown as Array<
    Parameters<typeof PostCard>[0]["post"]
  >;
  const [featured, ...rest] = allPosts;

  return (
    <div>
      <div className="mb-12 max-w-2xl">
        <h1 className="font-display text-2xl text-forest/80">
          News, culture, and voices from the Azande people of Western
          Equatoria &mdash; and the diaspora around the world.
        </h1>
      </div>

      {error && (
        <p className="text-clay font-body">
          Could not load posts. If you just set this project up, make sure
          you've run the database schema in Supabase and added your
          environment variables.
        </p>
      )}

      {!error && posts && posts.length === 0 && (
        <div className="border border-dashed border-forest/30 rounded-sm p-10 text-center">
          <p className="font-display text-xl text-forest mb-3">
            No posts yet &mdash; be the first.
          </p>
          <p className="font-body text-ink/70 mb-5">
            This space is waiting for its first story.
          </p>
          <Link
            href="/register"
            className="inline-block bg-clay text-ivory px-5 py-2.5 rounded-sm hover:bg-forest transition-colors font-body"
          >
            Join and write the first post
          </Link>
        </div>
      )}

      {featured && <PostCard post={featured} featured />}

      <div className="mt-4">
        {rest.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
