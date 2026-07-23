import { createClient } from "@/lib/supabase/server";
import { CATEGORY_LABELS } from "@/lib/categories";

const BASE_URL = "https://azande-news.vercel.app";

function escapeXml(unsafe: string) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const supabase = createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, title, body, category, created_at")
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`)
    .order("created_at", { ascending: false })
    .limit(50);

  const items = (posts ?? [])
    .map((post) => {
      const description = post.body.replace(/\s+/g, " ").slice(0, 300);
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${BASE_URL}/posts/${post.id}</link>
      <guid isPermaLink="true">${BASE_URL}/posts/${post.id}</guid>
      <pubDate>${new Date(post.created_at).toUTCString()}</pubDate>
      <category>${escapeXml(CATEGORY_LABELS[post.category] ?? post.category)}</category>
      <description>${escapeXml(description)}</description>
    </item>`;
    })
    .join("");

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Azande News</title>
    <link>${BASE_URL}</link>
    <atom:link href="${BASE_URL}/feed.xml" rel="self" type="application/rss+xml" />
    <description>News, culture, and voices from the Azande people of Western Equatoria and the diaspora around the world.</description>
    <language>en-us</language>${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}


