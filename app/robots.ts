import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/posts/new"],
    },
    sitemap: "https://azande-news.vercel.app/sitemap.xml",
  };
}
