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
  publish_at: string | null;
  views: number;
  ai_flagged?: boolean;
  ai_flag_reason?: string | null;
  profiles: { display_name: string; username: string } | null;
};

const STATUS_LABELS: Record<string, string> = {
  published: "Published",
  pending: "Pending review",
  draft: "Draft",
  scheduled: "Scheduled",
  removed: "Removed",
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

  async function publishNow(postId: string) {
    setBusyId(postId);
    await supabase.from("posts").update({ status: "published", publish_at: null }).eq("id", postId);
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
    return <p className="font-body text-grey text-sm">No posts yet.</p>;
  }

  return (
    <div className="divide-y divide-border">
      {posts.map((post) => (
        <div key={post.id} className="py-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href={`/posts/${post.id}`} className="font-body font-medium text-ink hover:text-accent">
              {post.title}
            </Link>
            <div className="font-meta text-xs text-grey mt-1">
              {CATEGORY_LABELS[post.category] ?? post.category} &middot; by{" "}
              {post.profiles?.display_name ?? "Unknown"} &middot;{" "}
              {new Date(post.created_at).toLocaleDateString()} &middot;{" "}
              {post.views} views &middot;{" "}
              <span className={post.status === "published" ? "text-ink" : "text-accent"}>
                {STATUS_LABELS[post.status] ?? post.status}
              </span>
              {post.status === "scheduled" && post.publish_at && (
                <> &middot; goes live {new Date(post.publish_at).toLocaleString()}</>
              )}
            </div>
            {post.ai_flagged && (
              <div className="font-meta text-xs text-accent mt-1">
                AI flagged: {post.ai_flag_reason || "no reason given"}
              </div>
            )}
          </div>
          <div className="flex gap-3 font-body text-sm">
            {(post.status === "draft" || post.status === "scheduled" || post.status === "pending") && (
              <button
                onClick={() => publishNow(post.id)}
                disabled={busyId === post.id}
                className="text-accent hover:underline disabled:opacity-50"
              >
                Publish now
              </button>
            )}
            <Link href={`/posts/${post.id}/edit`} className="text-ink hover:underline">
              Edit
            </Link>
            {(post.status === "published" || post.status === "removed") && (
              <button
                onClick={() => toggleStatus(post)}
                disabled={busyId === post.id}
                className="text-ink hover:underline disabled:opacity-50"
              >
                {post.status === "published" ? "Remove from site" : "Restore"}
              </button>
            )}
            <button
              onClick={() => hardDelete(post.id)}
              disabled={busyId === post.id}
              className="text-accent hover:underline disabled:opacity-50"
            >
              Delete permanently
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}



