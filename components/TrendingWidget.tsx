import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function TrendingWidget() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, views")
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`)
    .order("views", { ascending: false })
    .limit(5);

  if (!posts || posts.length === 0) return null;

  return (
    <div className="mt-8 pt-6 block-rule">
      <h2 className="section-label mb-4">Most read</h2>
      <ol>
        {posts.map((post, i) => (
          <li key={post.id} className="flex gap-3 py-3 border-b border-rule last:border-b-0">
            <span className="font-meta text-canon font-bold text-border shrink-0 leading-none w-8">
              {i + 1}
            </span>
            <Link
              href={`/posts/${post.id}`}
              className="font-display text-pica font-medium text-ink hover:underline leading-snug"
            >
              {post.title}
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

