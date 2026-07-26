"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function StartMessageButton({
  otherUserId,
  currentUserId,
}: {
  otherUserId: string;
  currentUserId: string | null;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function start() {
    if (!currentUserId) {
      router.push(`/login?next=/author`);
      return;
    }
    if (currentUserId === otherUserId) return;

    setLoading(true);

    const userA = currentUserId < otherUserId ? currentUserId : otherUserId;
    const userB = currentUserId < otherUserId ? otherUserId : currentUserId;

    const { data: existing } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_a", userA)
      .eq("user_b", userB)
      .maybeSingle();

    if (existing) {
      router.push(`/messages/${existing.id}`);
      return;
    }

    const { data, error } = await supabase
      .from("conversations")
      .insert({
        user_a: userA,
        user_b: userB,
        requested_by: currentUserId,
        status: "pending",
      })
      .select("id")
      .single();

    setLoading(false);

    if (!error && data) {
      router.push(`/messages/${data.id}`);
    }
  }

  if (currentUserId === otherUserId) return null;

  return (
    <button
      onClick={start}
      disabled={loading}
      className="text-sm font-medium text-accent hover:underline disabled:opacity-60"
    >
      {loading ? "Starting..." : "Message"}
    </button>
  );
}
