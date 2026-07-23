import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { CATEGORIES } from "@/lib/categories";

const BASE_URL = "https://azande-news.vercel.app";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("id, updated_at")
    .or(`status.eq.published,and(status.eq.scheduled,publish_at.lte.${new Date().toISOString()})`);

  const postEntries: MetadataRoute.Sitemap = (posts ?? []).map((post) => ({
    url: `${BASE_URL}/posts/${post.id}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = CATEGORIES.map((c) => ({
    url: `${BASE_URL}/category/${c.value}`,
    changeFrequency: "daily",
    priority: 0.6,
  }));

  const staticEntries: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE_URL}/about`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${BASE_URL}/contact`, changeFrequency: "monthly", priority: 0.5 },
  ];

  return [...staticEntries, ...categoryEntries, ...postEntries];
}


