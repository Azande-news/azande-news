import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostCard from "@/components/PostCard";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { username: string };
}): Promise<Metadata> {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("username", params.username)
    .single();

  if (!profile) return { title: "Author not found" };

  return { title: profile.display_name };
}

export default async function AuthorPage({
  params,
}: {
  params: { username: string };
}) {
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, bio, created_at")
    .eq("username", params.username)
    .single();

  if (!profile) notFound();

  const { data: posts } = await supabase
    .from("posts")
    .select(
      "id, title, body, category, created_at, cover_image_url, profiles(display_name, username)"
    )
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`)
    .eq("author_id", profile.id)
    .order("created_at", { ascending: false });

  const authorPosts = (posts ?? []) as unknown as Array<
    Parameters<typeof PostCard>[0]["post"]
  >;

  const joined = new Date(profile.created_at).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
  });

  return (
    <div>
      <div className="max-w-2xl mb-12 pb-8 border-b border-border">
        <h1 className="font-display text-3xl font-bold text-ink mb-1">
          {profile.display_name}
        </h1>
        <div className="font-meta text-xs text-grey mb-4">
          @{profile.username} &middot; Member since {joined}
        </div>
        {profile.bio && (
          <p className="font-body text-grey-dark leading-relaxed">
            {profile.bio}
          </p>
        )}
      </div>

      <h2 className="font-display text-lg font-bold text-ink border-l-4 border-accent pl-3 mb-6">
        Posts by {profile.display_name} ({authorPosts.length})
      </h2>

      {authorPosts.length === 0 ? (
        <p className="font-body text-grey">No published posts yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-8">
          {authorPosts.map((post) => (
            <PostCard key={post.id} post={post} variant="grid" />
          ))}
        </div>
      )}
    </div>
  );
}


