"use client";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ViewTracker({ postId }: { postId: string }) {
  useEffect(() => {
    const supabase = createClient();
    supabase.rpc("increment_post_views", { post_id: postId });
  }, [postId]);

  return null;
}
