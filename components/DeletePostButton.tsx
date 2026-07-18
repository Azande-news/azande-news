"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function DeletePostButton({ postId }: { postId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await supabase.from("posts").delete().eq("id", postId);
    setLoading(false);
    router.push("/");
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="font-body text-sm text-clay hover:underline"
      >
        Delete this post
      </button>
    );
  }

  return (
    <div className="font-body text-sm">
      <p className="mb-2 text-ink/80">Delete this post permanently?</p>
      <div className="flex gap-3">
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-clay text-ivory px-4 py-2 rounded-sm hover:bg-forest transition-colors disabled:opacity-60"
        >
          {loading ? "Deleting…" : "Yes, delete"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-4 py-2 rounded-sm border border-forest/30 hover:bg-forest/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
