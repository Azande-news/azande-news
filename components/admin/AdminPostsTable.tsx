"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CATEGORY_LABELS } from "@/lib/categories";

type Post = {
  id: string;
  title: string;
  status: string;
  category: string;
  created_at: string;
  profiles: { display_name: string; username: string } | null;
};

export default function AdminPostsTable({ posts }: { posts: Post[] }) {
  const supabase = createClient();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggleStatus(post: Post) {
    setBusyId(post.id);
    const nextStatus = post.status === "published" ? "removed" : "published";
    await supabase.from("posts").update({ status: nextStatus }).eq("id", post.id);
    setBusyId(null);
    router.refresh();
  }

  async function hardDelete(postId: string) {
    setBusyId(postId);
    await supabase.from("posts").delete().eq("id", postId);
    setBusyId(null);
    router.refresh();
  }

  if (posts.length === 0) {
    return <p className="font-body text-ink/60 text-sm">No posts yet.</p>;
  }

  return (
    <div className="divide-y divide-forest/10">
      {posts.map((post) => (
        <div
          key={post.id}
          className="py-4 flex flex-wrap items-center justify-between gap-3"
        >
          <div>
            <Link
              href={`/posts/${post.id}`}
              className="font-body font-medium text-forest hover:text-clay"
            >
              {post.title}
            </Link>
            <div className="font-meta text-xs text-forest/60 mt-1">
              {CATEGORY_LABELS[post.category] ?? post.category} &middot; by{" "}
              {post.profiles?.display_name ?? "Unknown"} &middot;{" "}
              {new Date(post.created_at).toLocaleDateString()} &middot;{" "}
              <span
                className={
                  post.status === "published" ? "text-forest" : "text-clay"
                }
              >
                {post.status}
              </span>
            </div>
          </div>
          <div className="flex gap-3 font-body text-sm">
            <button
              onClick={() => toggleStatus(post)}
              disabled={busyId === post.id}
              className="text-forest hover:underline disabled:opacity-50"
            >
              {post.status === "published" ? "Remove from site" : "Restore"}
            </button>
            <button
              onClick={() => hardDelete(post.id)}
              disabled={busyId === post.id}
              className="text-clay hover:underline disabled:opacity-50"
            >
              Delete permanently
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
