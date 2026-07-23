import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TrendingWidget() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, views")
    .eq("status", "published")
    .order("views", { ascending: false })
    .limit(5);

  if (!posts || posts.length === 0) return null;

  return (
    <div className="mt-8 pt-6 border-t border-border">
      <h2 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-3">Trending</h2>
      <ol className="space-y-3">
        {posts.map((post, i) => (
          <li key={post.id} className="flex gap-3">
            <span className="font-display text-2xl font-bold text-border shrink-0 leading-none">{i + 1}</span>
            <Link href={`/posts/${post.id}`} className="font-body text-sm font-medium text-ink hover:text-accent leading-snug">
              {post.title}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
