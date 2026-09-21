import { createClient } from "@/lib/supabase/server";
import { stripHtml, sanitizeHtml } from "@/lib/html";
import type { Metadata } from "next";

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Live",
  description: "Rolling live updates from Azande News.",
};

export default async function LivePage() {
  const supabase = createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, body, created_at, profiles(display_name, username)")
    .eq("category", "live")
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`)
    .order("created_at", { ascending: false })
    .limit(50);

  const entries = posts ?? [];

  if (entries.length === 0) {
    return (
      <div className="border border-border p-10 text-center">
        <p className="font-display text-trafalgar font-medium text-ink mb-2">
          Nothing live right now.
        </p>
        <p className="font-body text-body-copy text-grey">
          Check back when a story is developing.
        </p>
      </div>
    );
  }

  const latest = entries[0];
  const hoursSinceLatest =
    (Date.now() - new Date(latest.created_at).getTime()) / (1000 * 60 * 60);
  const isActive = hoursSinceLatest <= 6;

  return (
    <div className="max-w-read">
      <div className="flex items-center gap-2 mb-2">
        <span className="relative flex h-2.5 w-2.5">
          {isActive && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
          )}
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent" />
        </span>
        <span className="section-label section-label-accent">Live</span>
      </div>
      <h1 className="font-display text-canon font-medium text-ink mb-8">
        Latest updates
      </h1>

      <ol className="relative border-l-2 border-rule pl-6 space-y-10">
        {entries.map((entry) => {
          const author = entry.profiles as unknown as {
            display_name: string;
            username: string;
          } | null;
          const time = new Date(entry.created_at).toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
          });
          const date = new Date(entry.created_at).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          });

          return (
            <li key={entry.id} className="relative">
              <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-accent border-2 border-paper" />
              <div className="font-meta text-minion text-grey mb-1">
                <time dateTime={entry.created_at}>{time} &middot; {date}</time>
                {author?.display_name && <> &middot; {author.display_name}</>}
              </div>
              <h2 className="font-display text-trafalgar font-medium text-ink mb-2">
                {entry.title}
              </h2>
              <div
                className="prose-article font-serif text-read sm:text-read-lg text-ink"
                dangerouslySetInnerHTML={{ __html: sanitizeHtml(entry.body) }}
              />
            </li>
          );
        })}
      </ol>
    </div>
  );
}

