import { CATEGORY_LABELS } from "@/lib/categories";

type Post = {
  id: string;
  title: string;
  status: string;
  category: string;
  views: number;
};

export default function AdminAnalytics({ posts }: { posts: Post[] }) {
  const totalViews = posts.reduce((sum, p) => sum + (p.views ?? 0), 0);

  const topPosts = [...posts]
    .filter((p) => p.status === "published")
    .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
    .slice(0, 5);

  const byStatus: Record<string, number> = {};
  for (const p of posts) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
  }

  const byCategory: Record<string, number> = {};
  for (const p of posts) {
    byCategory[p.category] = (byCategory[p.category] ?? 0) + 1;
  }

  const statCard = (label: string, value: number | string) => (
    <div className="border border-border rounded-sm p-4">
      <div className="font-meta text-[11px] tracking-wider uppercase text-grey mb-1">{label}</div>
      <div className="font-display text-2xl font-bold text-ink">{value}</div>
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {statCard("Total posts", posts.length)}
        {statCard("Total views", totalViews)}
        {statCard("Published", byStatus["published"] ?? 0)}
        {statCard("Drafts + scheduled", (byStatus["draft"] ?? 0) + (byStatus["scheduled"] ?? 0))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div>
          <h3 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-3">Top posts by views</h3>
          {topPosts.length === 0 ? (
            <p className="font-body text-sm text-grey">No published posts yet.</p>
          ) : (
            <ol className="space-y-2">
              {topPosts.map((p, i) => (
                <li key={p.id} className="flex justify-between gap-3 font-body text-sm">
                  <span className="text-ink truncate">{i + 1}. {p.title}</span>
                  <span className="text-grey shrink-0">{p.views} views</span>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div>
          <h3 className="font-meta text-[11px] tracking-wider uppercase text-grey mb-3">Posts by category</h3>
          <ul className="space-y-2">
            {Object.entries(byCategory).map(([cat, count]) => (
              <li key={cat} className="flex justify-between gap-3 font-body text-sm">
                <span className="text-ink">{CATEGORY_LABELS[cat] ?? cat}</span>
                <span className="text-grey">{count}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
