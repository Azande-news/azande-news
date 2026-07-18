"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  profiles: { display_name: string } | null;
};

export default function CommentSection({ postId }: { postId: string }) {
  const supabase = createClient();
  const router = useRouter();

  const [comments, setComments] = useState<Comment[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  async function loadComments() {
    const { data } = await supabase
      .from("comments")
      .select("id, body, created_at, author_id, profiles(display_name)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments((data ?? []) as unknown as Comment[]);
    setLoadingList(false);
  }

  useEffect(() => {
    loadComments();
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (body.trim().length < 1) return;

    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to log in to comment.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("comments").insert({
      post_id: postId,
      author_id: user.id,
      body: body.trim(),
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setBody("");
    loadComments();
  }

  async function handleDelete(commentId: string) {
    await supabase.from("comments").delete().eq("id", commentId);
    loadComments();
  }

  return (
    <div className="mt-14 pt-8 border-t border-forest/15">
      <h2 className="font-display text-2xl text-forest mb-6">
        {loadingList ? "Comments" : `Comments (${comments.length})`}
      </h2>

      <div className="space-y-5 mb-8">
        {comments.map((c) => (
          <div key={c.id} className="font-body">
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-medium text-forest">
                {c.profiles?.display_name ?? "Unknown"}
              </span>
              <span className="font-meta text-xs text-forest/50">
                {new Date(c.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-ink/85 mt-1 whitespace-pre-wrap">{c.body}</p>
            {userId === c.author_id && (
              <button
                onClick={() => handleDelete(c.id)}
                className="text-xs text-clay hover:underline mt-1"
              >
                Delete
              </button>
            )}
          </div>
        ))}
        {!loadingList && comments.length === 0 && (
          <p className="font-body text-ink/60 text-sm">
            No comments yet — be the first to respond.
          </p>
        )}
      </div>

      {userId ? (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Add a comment…"
            className="w-full border border-forest/30 rounded-sm px-3 py-2 font-body focus:outline-none focus:ring-2 focus:ring-ochre"
          />
          {error && <p className="text-clay font-body text-sm">{error}</p>}
          <button
            type="submit"
            disabled={submitting || body.trim().length === 0}
            className="bg-forest text-ivory px-5 py-2 rounded-sm hover:bg-forest-light transition-colors font-body text-sm disabled:opacity-60"
          >
            {submitting ? "Posting…" : "Post comment"}
          </button>
        </form>
      ) : (
        <p className="font-body text-sm text-ink/70">
          <Link href="/login" className="text-clay hover:underline">
            Log in
          </Link>{" "}
          to join the discussion.
        </p>
      )}
    </div>
  );
}
