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
      <div className="max-w-shell mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-3">
        <span className="font-meta text-minion font-extrabold tracking-[0.75px] uppercase shrink-0">
          Breaking
        </span>
        <span className="w-px h-4 bg-white/40 shrink-0" />
        <Link
          href={`/posts/${latest.id}`}
          className="font-meta text-brevier font-semibold hover:underline truncate"
        >
          {latest.title}
        </Link>
      </div>
    </div>
  );
}
