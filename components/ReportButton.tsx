"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ReportButton({
  postId,
  postTitle,
}: {
  postId: string;
  postTitle: string;
}) {
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (reason.trim().length < 3) {
      setError("Please add a short reason.");
      return;
    }

    setSubmitting(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You need to log in to report a post.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("reports").insert({
      post_id: postId,
      reporter_id: user.id,
      reason: reason.trim(),
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    // Best-effort email alert — if this fails, the report is still filed.
    fetch("/api/notify-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId, postTitle, reason: reason.trim() }),
    }).catch(() => {});

    setDone(true);
  }

  if (done) {
    return (
      <p className="font-body text-sm text-forest/70">
        Thanks — an admin will review this.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="font-body text-sm text-forest/60 hover:text-clay hover:underline"
      >
        Report this post
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="font-body text-sm space-y-2 max-w-sm">
      <label className="block text-forest">
        Why are you reporting this post?
      </label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={2}
        maxLength={500}
        className="w-full border border-forest/30 rounded-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-ochre"
      />
      {error && <p className="text-clay">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="bg-clay text-ivory px-4 py-1.5 rounded-sm hover:bg-forest transition-colors disabled:opacity-60"
        >
          {submitting ? "Sending…" : "Submit report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-4 py-1.5 rounded-sm border border-forest/30 hover:bg-forest/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
