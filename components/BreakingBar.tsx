import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function BreakingBar() {
  const supabase = createClient();

  const { data: latest } = await supabase
    .from("posts")
    .select("id, title, created_at")
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest) return null;

  const hoursOld =
    (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60);

  if (hoursOld > 48) return null;

  return (
    <div className="bg-accent text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2 flex items-center gap-3">
        <span className="font-meta text-[11px] font-bold tracking-wider uppercase shrink-0 border border-white/40 px-1.5 py-0.5">
          Breaking
        </span>
        <Link
          href={`/posts/${latest.id}`}
          className="text-sm font-medium hover:underline truncate"
        >
          {latest.title}
        </Link>
      </div>
    </div>
  );
}


