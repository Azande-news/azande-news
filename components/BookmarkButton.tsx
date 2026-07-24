"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function BookmarkButton({ postId }: { postId: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function check() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from("bookmarks")
        .select("id")
        .eq("user_id", user.id)
        .eq("post_id", postId)
        .maybeSingle();
      setSaved(!!data);
      setLoading(false);
    }
    check();
  }, [postId]);

  async function toggle() {
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push(`/login?next=/posts/${postId}`);
      return;
    }

    if (saved) {
      await supabase.from("bookmarks").delete().eq("user_id", user.id).eq("post_id", postId);
      setSaved(false);
    } else {
      await supabase.from("bookmarks").insert({ user_id: user.id, post_id: postId });
      setSaved(true);
    }
    setBusy(false);
  }

  if (loading) return null;

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className="text-xs font-medium text-grey hover:text-ink border border-border rounded-sm px-2.5 py-1 transition-colors disabled:opacity-50"
    >
      {saved ? "Saved ✓" : "Save for later"}
    </button>
  );
}
